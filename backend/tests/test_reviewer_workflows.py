import os
import io
import pytest
from uuid import uuid4
from fastapi.testclient import TestClient
from app.main import app
from app.models.entities import Candidate, ResumeDocument
from app.schemas.profile import CandidateProfile, WorkExperienceItem, EducationItem, EvidenceSnippet
from app.services.database.sqlite import SQLiteRepository
from app.services.database import reset_repository_for_testing
from app.services.storage.local import LocalStorageService

client = TestClient(app)


@pytest.fixture(autouse=True)
def setup_test_db(tmp_path):
    db_file = tmp_path / "test_reviewer.db"
    storage_dir = tmp_path / "storage"
    storage_dir.mkdir()
    os.environ["DATABASE_ENGINE"] = "sqlite"
    os.environ["SQLITE_DB_PATH"] = str(db_file)
    os.environ["STORAGE_ENGINE"] = "local"
    os.environ["LOCAL_STORAGE_DIR"] = str(storage_dir)
    os.environ["LLM_PROVIDER"] = "mock"

    repo = SQLiteRepository(str(db_file))
    reset_repository_for_testing(repo)
    return repo, LocalStorageService(str(storage_dir))


def test_methodology_endpoint():
    """GET /api/methodology returns structured metadata and criteria for HR reviewers."""
    res = client.get("/api/methodology")
    assert res.status_code == 200
    data = res.json()

    assert data["app_name"] == "GFI AI Resume Screener"
    assert "LCA" in data["roles"]
    assert "UI_UX" in data["roles"]
    assert data["roles"]["LCA"]["qualification_threshold"] == 55.0
    assert data["roles"]["UI_UX"]["qualification_threshold"] == 50.0
    assert any("UNKNOWN" in rule for rule in data["methodological_rules"])
    assert any("null" in rule.lower() for rule in data["methodological_rules"])


def test_candidate_list_and_filters(setup_test_db):
    """GET /api/candidates returns paginated summary items and respects filters."""
    repo, storage = setup_test_db

    # Create candidates with different classifications and scores
    c1 = repo.create_candidate(Candidate(candidate_code="CAND-001", classification="LCA", processing_status="PROFILED", lca_score=75.0, uiux_score=10.0))
    doc1 = ResumeDocument(
        candidate_id=c1.id,
        original_filename="c1_lca.docx",
        storage_path="c1_lca.docx",
        mime_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        file_size=1024,
        file_hash="hash_c1",
    )
    repo.create_resume_document(doc1)

    c2 = repo.create_candidate(Candidate(candidate_code="CAND-002", classification="UI_UX", processing_status="PROFILED", lca_score=5.0, uiux_score=85.0))
    doc2 = ResumeDocument(
        candidate_id=c2.id,
        original_filename="c2_uiux.docx",
        storage_path="c2_uiux.docx",
        mime_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        file_size=2048,
        file_hash="hash_c2",
    )
    repo.create_resume_document(doc2)

    # 1. Unfiltered list
    res = client.get("/api/candidates?page=1&page_size=10")
    assert res.status_code == 200
    data = res.json()
    assert data["total"] == 2
    assert len(data["candidates"]) == 2

    # 2. Filter by classification = LCA
    res_lca = client.get("/api/candidates?classification=LCA")
    assert res_lca.status_code == 200
    data_lca = res_lca.json()
    assert data_lca["total"] == 1
    assert data_lca["candidates"][0]["candidate_code"] == "CAND-001"

    # 3. Filter by min_score = 80.0
    res_score = client.get("/api/candidates?min_score=80.0")
    assert res_score.status_code == 200
    data_score = res_score.json()
    assert data_score["total"] == 1
    assert data_score["candidates"][0]["candidate_code"] == "CAND-002"

    # 4. Search query
    res_search = client.get("/api/candidates?search=c2_uiux")
    assert res_search.status_code == 200
    data_search = res_search.json()
    assert data_search["total"] == 1
    assert data_search["candidates"][0]["candidate_code"] == "CAND-002"


def test_candidate_detail_drawer(setup_test_db):
    """GET /api/candidates/{id} returns comprehensive detail view with signed source URL."""
    repo, storage = setup_test_db

    cand = repo.create_candidate(Candidate(candidate_code="CAND-DETAIL", classification="LCA", processing_status="COMPLETED"))
    doc = ResumeDocument(
        candidate_id=cand.id,
        original_filename="resume_detail.docx",
        storage_path="resume_detail.docx",
        mime_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        file_size=5000,
        file_hash="hash_detail",
        raw_text="Jane Doe LCA Specialist",
        normalized_text="jane doe lca specialist",
        extraction_status="COMPLETED",
    )
    repo.create_resume_document(doc)

    prof = CandidateProfile(
        candidate_code="CAND-DETAIL",
        skills=["Life Cycle Assessment"],
        lca_tools=["GaBi"],
        standards=["ISO 14040"],
        relocation_willingness="UNKNOWN",
    )
    from app.models.entities import CandidateProfileEntity
    repo.save_candidate_profile(CandidateProfileEntity(candidate_id=cand.id, profile_json=prof.model_dump(), model_provider="mock", model_name="mock"))

    # Also evaluate
    from app.services.scoring.service import EvaluationService
    eval_svc = EvaluationService(repo, storage)
    eval_svc.evaluate_candidate(cand.id)

    res = client.get(f"/api/candidates/{cand.id}")
    assert res.status_code == 200
    detail = res.json()

    assert detail["candidate_code"] == "CAND-DETAIL"
    assert detail["document"]["original_filename"] == "resume_detail.docx"
    assert "access_url" in detail["document"]
    assert detail["profile"]["relocation_willingness"] == "UNKNOWN"
    assert detail["lca_evaluation"] is not None
    assert detail["uiux_evaluation"] is not None
    assert "lca_experience" in detail["lca_evaluation"]["breakdown"]


def test_candidate_processing_status(setup_test_db):
    """GET /api/candidates/{id}/status returns job status and attempt count."""
    repo, storage = setup_test_db
    cand = repo.create_candidate(Candidate(candidate_code="CAND-STATUS", processing_status="UPLOADED"))

    res = client.get(f"/api/candidates/{cand.id}/status")
    assert res.status_code == 200
    data = res.json()
    assert data["candidate_code"] == "CAND-STATUS"
    assert data["attempt_count"] >= 1


def test_end_to_end_upload_auto_process(setup_test_db):
    """POST /api/resumes with auto_process=True executes ingestion, extraction, and evaluation atomically."""
    repo, storage = setup_test_db

    # Create dummy docx bytes
    import docx
    doc_obj = docx.Document()
    doc_obj.add_paragraph("Alex Taylor - UI/UX Designer with Figma experience and user research skills.")
    doc_io = io.BytesIO()
    doc_obj.save(doc_io)
    docx_bytes = doc_io.getvalue()

    response = client.post(
        "/api/resumes?auto_process=true",
        files={"file": ("alex_designer.docx", docx_bytes, "application/vnd.openxmlformats-officedocument.wordprocessingml.document")},
    )
    assert response.status_code == 201
    upload_res = response.json()
    candidate_id = upload_res["candidate_id"]

    # Candidate should now be in database with evaluations generated!
    cand = repo.get_candidate_by_id(candidate_id)
    assert cand is not None
    evals = repo.get_candidate_evaluations(cand.id)
    assert len(evals) == 2  # LCA and UI_UX evaluations generated automatically


def test_filtered_rankings_endpoint(setup_test_db):
    """GET /api/rankings/{role_key} supports qualification_status, min_score, and search filters."""
    repo, storage = setup_test_db

    # Create 2 candidates: 1 qualified for UI/UX, 1 unqualified
    c1 = repo.create_candidate(Candidate(candidate_code="CAND-QUAL", classification="UI_UX", lca_score=0.0, uiux_score=85.0))
    repo.create_resume_document(ResumeDocument(candidate_id=c1.id, original_filename="qual.docx", storage_path="qual.docx", mime_type="application/docx", file_size=100, file_hash="h1"))
    from app.models.entities import CandidateEvaluationEntity
    repo.save_candidate_evaluation(CandidateEvaluationEntity(
        candidate_id=c1.id, role_key="UI_UX", score=85.0, is_qualified=True, qualification_status="QUALIFIED"
    ))

    c2 = repo.create_candidate(Candidate(candidate_code="CAND-UNQUAL", classification="NEITHER_OR_UNCERTAIN", lca_score=0.0, uiux_score=20.0))
    repo.create_resume_document(ResumeDocument(candidate_id=c2.id, original_filename="unqual.docx", storage_path="unqual.docx", mime_type="application/docx", file_size=100, file_hash="h2"))
    repo.save_candidate_evaluation(CandidateEvaluationEntity(
        candidate_id=c2.id, role_key="UI_UX", score=20.0, is_qualified=False, qualification_status="UNQUALIFIED"
    ))

    # 1. All rankings
    r_all = client.get("/api/rankings/UI_UX")
    assert r_all.status_code == 200
    assert len(r_all.json()["rankings"]) == 2

    # 2. Filter qualification_status = QUALIFIED
    r_qual = client.get("/api/rankings/UI_UX?qualification_status=QUALIFIED")
    assert r_qual.status_code == 200
    assert len(r_qual.json()["rankings"]) == 1
    assert r_qual.json()["rankings"][0]["candidate_code"] == "CAND-QUAL"

    # 3. Filter min_score = 50.0
    r_score = client.get("/api/rankings/UI_UX?min_score=50.0")
    assert r_score.status_code == 200
    assert len(r_score.json()["rankings"]) == 1
    assert r_score.json()["rankings"][0]["candidate_code"] == "CAND-QUAL"

