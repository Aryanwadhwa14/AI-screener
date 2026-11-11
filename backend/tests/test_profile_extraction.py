import os
import pytest
from uuid import uuid4
from fastapi.testclient import TestClient
from app.main import app
from app.services.database.sqlite import SQLiteRepository
from app.services.database import reset_repository_for_testing
from app.services.storage.local import LocalStorageService
from app.models.entities import Candidate, ResumeDocument
from app.schemas.profile import CandidateProfile, EvidenceSnippet, WorkExperienceItem
from app.services.evidence.verifier import EvidenceVerifier
from app.services.llm.mock_provider import MockLLMProvider
from app.services.extraction.profile_service import ProfileExtractionService

client = TestClient(app)


@pytest.fixture(autouse=True)
def setup_test_db(tmp_path):
    db_file = tmp_path / "test_profiles.db"
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


def test_profile_schema_default_relocation():
    """Methodology Rule: Relocation willingness MUST default to UNKNOWN, never False."""
    profile = CandidateProfile(candidate_code="CAND-TEST")
    assert profile.relocation_willingness == "UNKNOWN"
    assert profile.extraction_confidence == 1.0


def test_evidence_verifier_matching_and_hallucination():
    """Evidence snippets present in text must be verified; fabricated snippets must be flagged unverified."""
    verifier = EvidenceVerifier()
    raw_text = "Experienced LCA Analyst skilled in GaBi and SimaPro. Graduated from Anna University."
    normalized_text = verifier.normalize(raw_text)

    profile = CandidateProfile(
        candidate_code="CAND-001",
        skills=["LCA Analyst"],
        tools=["GaBi", "SimaPro"],
        evidence_items=[
            EvidenceSnippet(field_key="tools.GaBi", evidence_snippet="skilled in GaBi and SimaPro"),
            EvidenceSnippet(field_key="tools.Figma", evidence_snippet="10 years Figma experience in Tokyo"),  # Hallucinated
        ],
    )

    verified_profile = verifier.verify_profile_evidence(profile, raw_text, normalized_text)
    ev_map = {item.field_key: item.is_verified for item in verified_profile.evidence_items}

    assert ev_map["tools.GaBi"] is True
    assert ev_map["tools.Figma"] is False
    # Confidence should be penalized for hallucination
    assert verified_profile.extraction_confidence < 1.0
    assert any("not located in resume" in w or "not found in resume" in w for w in verified_profile.extraction_warnings)


def test_empty_resume_handling(setup_test_db):
    """Empty document must not invoke LLM, confidence is 0.0, status set to FAILED."""
    repo, storage = setup_test_db
    cand = repo.create_candidate(Candidate(candidate_code="CAND-EMPTY", processing_status="PENDING"))
    
    # Create empty document record
    doc = ResumeDocument(
        candidate_id=cand.id,
        original_filename="empty.docx",
        storage_path="empty.docx",
        mime_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        file_size=0,
        file_hash="hash_empty",
        raw_text="",
        normalized_text="",
        extraction_status="FAILED",
    )
    repo.create_resume_document(doc)

    service = ProfileExtractionService(repo, storage, llm_provider=MockLLMProvider())
    profile = service.extract_and_validate_profile(cand.id)

    assert profile.extraction_confidence == 0.0
    assert len(profile.skills) == 0
    assert profile.relocation_willingness == "UNKNOWN"
    assert any("Empty or unreadable" in w for w in profile.extraction_warnings)

    # Candidate status in DB must be FAILED with NEITHER_OR_UNCERTAIN
    updated_cand = repo.get_candidate_by_id(cand.id)
    assert updated_cand.processing_status == "FAILED"
    assert updated_cand.classification == "NEITHER_OR_UNCERTAIN"


def test_single_candidate_profile_api(setup_test_db):
    """POST /api/resumes/{candidate_id}/profile extracts profile, persists, and GET retrieves it."""
    repo, storage = setup_test_db
    cand = repo.create_candidate(Candidate(candidate_code="CAND-LCA", processing_status="UPLOADED"))

    lca_text = """
    Jane Doe
    Sustainability Consultant with 3 years of experience.
    Skills: Life Cycle Assessment, Carbon Footprinting, GHG Protocol, ISO 14040, ISO 14044.
    Tools: GaBi, SimaPro, openLCA.
    Experience:
    LCA Specialist at EcoCorp (2021 - Present, 36 months). Conducted cradle-to-grave LCAs.
    Education:
    B.Tech in Environmental Engineering from National Institute of Technology (2020).
    """
    doc = ResumeDocument(
        candidate_id=cand.id,
        original_filename="jane_lca.docx",
        storage_path="jane_lca.docx",
        mime_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        file_size=len(lca_text),
        file_hash="hash_jane_lca",
        raw_text=lca_text,
        normalized_text=lca_text.lower(),
        extraction_status="COMPLETED",
    )
    repo.create_resume_document(doc)

    # POST /api/resumes/{candidate_id}/profile
    response = client.post(f"/api/resumes/{cand.id}/profile")
    assert response.status_code == 200
    data = response.json()

    assert data["candidate_code"] == "CAND-LCA"
    assert "GaBi" in data["lca_tools"] or "gabi" in [t.lower() for t in data["lca_tools"]]
    assert "ISO 14040" in data["standards"] or any("14040" in s for s in data["standards"])
    assert data["relocation_willingness"] == "UNKNOWN"
    assert data["extraction_confidence"] >= 0.7

    # GET /api/resumes/{candidate_id}/profile
    get_res = client.get(f"/api/resumes/{cand.id}/profile")
    assert get_res.status_code == 200
    saved_data = get_res.json()
    assert saved_data["candidate_code"] == "CAND-LCA"
    assert len(saved_data["work_experience"]) > 0


def test_uiux_candidate_profile_extraction(setup_test_db):
    """Verifies that UI/UX candidate profile extracts Figma, wireframing, and portfolio URLs."""
    repo, storage = setup_test_db
    cand = repo.create_candidate(Candidate(candidate_code="CAND-UIUX", processing_status="UPLOADED"))

    uiux_text = """
    Alex Rivera - Product Designer
    Portfolio: https://behance.net/alexrivera | https://alexdesigns.io
    Skills: User Research, Wireframing, Prototyping, Usability Testing, Design Systems.
    Tools: Figma, Adobe XD, Miro, Notion.
    Experience:
    UI/UX Design Intern at StartupStudio (2023 - 2024, 6 months).
    Designed end-to-end mobile design system and user flows in Figma.
    Education:
    B.Des in Interaction Design from National Institute of Design (2023).
    """
    doc = ResumeDocument(
        candidate_id=cand.id,
        original_filename="alex_uiux.docx",
        storage_path="alex_uiux.docx",
        mime_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        file_size=len(uiux_text),
        file_hash="hash_alex_uiux",
        raw_text=uiux_text,
        normalized_text=uiux_text.lower(),
        extraction_status="COMPLETED",
    )
    repo.create_resume_document(doc)

    response = client.post(f"/api/resumes/{cand.id}/profile")
    assert response.status_code == 200
    data = response.json()

    assert "Figma" in data["uiux_tools"] or "figma" in [t.lower() for t in data["uiux_tools"]]
    assert len(data["portfolio_urls"]) >= 1
    assert any("behance" in u or "alexdesigns" in u for u in data["portfolio_urls"])
    assert data["relocation_willingness"] == "UNKNOWN"


def test_batch_profile_endpoint(setup_test_db):
    """POST /api/resumes/batch-profile must process all candidates and return structured summary."""
    repo, storage = setup_test_db

    # Candidate 1: valid
    c1 = repo.create_candidate(Candidate(candidate_code="CAND-B1", processing_status="UPLOADED"))
    t1 = "Senior LCA Specialist with GaBi and SimaPro expertise. ISO 14044 certified."
    repo.create_resume_document(ResumeDocument(
        candidate_id=c1.id,
        original_filename="c1.docx",
        storage_path="c1.docx",
        mime_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        file_size=len(t1),
        file_hash="hash_c1",
        raw_text=t1,
        normalized_text=t1.lower(),
        extraction_status="COMPLETED",
    ))

    # Candidate 2: empty
    c2 = repo.create_candidate(Candidate(candidate_code="CAND-B2", processing_status="UPLOADED"))
    repo.create_resume_document(ResumeDocument(
        candidate_id=c2.id,
        original_filename="empty.docx",
        storage_path="empty.docx",
        mime_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        file_size=0,
        file_hash="hash_c2",
        raw_text="",
        normalized_text="",
        extraction_status="FAILED",
    ))

    response = client.post("/api/resumes/batch-profile")
    assert response.status_code == 200
    data = response.json()

    assert data["total_candidates"] == 2
    assert data["profiled"] == 1
    assert data["failed"] == 1
    assert len(data["profiles"]) == 2
