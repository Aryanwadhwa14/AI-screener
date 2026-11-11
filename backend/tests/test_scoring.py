import os
import pytest
from uuid import uuid4
from fastapi.testclient import TestClient
from app.main import app
from app.models.entities import Candidate, ResumeDocument
from app.schemas.profile import (
    CandidateProfile,
    WorkExperienceItem,
    EducationItem,
    EvidenceSnippet,
    ProjectItem,
)
from app.services.database.sqlite import SQLiteRepository
from app.services.database import reset_repository_for_testing
from app.services.storage.local import LocalStorageService
from app.services.scoring.lca_scorer import LCARoleScorer
from app.services.scoring.uiux_scorer import UIUXRoleScorer
from app.services.scoring.evaluator import CandidateEvaluator
from app.services.scoring.service import EvaluationService

client = TestClient(app)


@pytest.fixture(autouse=True)
def setup_test_db(tmp_path):
    db_file = tmp_path / "test_scoring.db"
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


def test_failed_extraction_produces_null_score_not_zero():
    """Methodology Rule 1: Failed extraction must NOT be zero; it must be None/null."""
    lca_scorer = LCARoleScorer()
    uiux_scorer = UIUXRoleScorer()

    empty_profile = CandidateProfile(
        candidate_code="CAND-FAILED",
        extraction_confidence=0.0,
        extraction_warnings=["Empty or unreadable document: structured extraction skipped."],
    )

    lca_eval = lca_scorer.evaluate(empty_profile, is_extraction_failed=True)
    uiux_eval = uiux_scorer.evaluate(empty_profile, is_extraction_failed=True)

    assert lca_eval.score is None
    assert lca_eval.qualification_status == "MANUAL_REVIEW_REQUIRED"
    assert lca_eval.is_qualified is False

    assert uiux_eval.score is None
    assert uiux_eval.qualification_status == "MANUAL_REVIEW_REQUIRED"
    assert uiux_eval.is_qualified is False

    evaluator = CandidateEvaluator()
    res = evaluator.evaluate_candidate(uuid4(), empty_profile, is_extraction_failed=True)
    assert res.classification == "NEITHER_OR_UNCERTAIN"


def test_missing_relocation_is_neutral_not_false():
    """Methodology Rule 2: Missing relocation willingness is UNKNOWN and treated non-punitively."""
    lca_scorer = LCARoleScorer()
    profile = CandidateProfile(
        candidate_code="CAND-UNKNOWN-RELOC",
        relocation_willingness="UNKNOWN",
    )
    eval_res = lca_scorer.evaluate(profile)
    loc_crit = eval_res.breakdown["lca_location"]
    assert loc_crit.score == 2.0  # neutral credit
    assert "UNKNOWN" in loc_crit.notes


def test_scoring_determinism():
    """Given identical profiles, scores and breakdowns must be 100% identical."""
    lca_scorer = LCARoleScorer()
    profile = CandidateProfile(
        candidate_code="CAND-DET",
        skills=["Life Cycle Assessment", "Carbon Accounting"],
        tools=["GaBi", "SimaPro"],
        lca_tools=["GaBi", "SimaPro"],
        standards=["ISO 14040", "ISO 14044", "EPD"],
        total_experience_months=36,
        education=[EducationItem(degree="M.Tech in Environmental Engineering", is_environmental_domain=True)],
        work_experience=[
            WorkExperienceItem(
                role_title="LCA Specialist",
                organization="EcoTech",
                estimated_months=36,
                responsibilities=["Conducted full LCA projects using GaBi and SimaPro"],
            )
        ],
        evidence_items=[
            EvidenceSnippet(field_key="lca_tools", evidence_snippet="GaBi and SimaPro", is_verified=True),
            EvidenceSnippet(field_key="standards", evidence_snippet="ISO 14040", is_verified=True),
        ],
        relocation_willingness="YES",
    )

    eval1 = lca_scorer.evaluate(profile)
    eval2 = lca_scorer.evaluate(profile)

    assert eval1.score == eval2.score
    assert eval1.is_qualified == eval2.is_qualified
    assert eval1.breakdown.keys() == eval2.breakdown.keys()
    for k in eval1.breakdown:
        assert eval1.breakdown[k].score == eval2.breakdown[k].score


def test_strong_lca_profile_scores_above_threshold():
    """Candidate meeting all LCA requirements must score above 55.0 and be QUALIFIED."""
    lca_scorer = LCARoleScorer()
    profile = CandidateProfile(
        candidate_code="CAND-LCA-STRONG",
        skills=["Life Cycle Assessment", "GHG Accounting", "Carbon Footprint"],
        tools=["GaBi", "SimaPro"],
        lca_tools=["GaBi", "SimaPro"],
        standards=["ISO 14040", "ISO 14044", "EPD"],
        total_experience_months=36,
        education=[EducationItem(degree="M.Tech in Environmental Engineering", is_environmental_domain=True)],
        work_experience=[
            WorkExperienceItem(
                role_title="Senior LCA Consultant",
                organization="Sustainability Global",
                estimated_months=36,
                responsibilities=["Led 4 LCA projects according to ISO 14040/14044"],
            )
        ],
        evidence_items=[
            EvidenceSnippet(field_key="tools", evidence_snippet="GaBi, SimaPro", is_verified=True),
            EvidenceSnippet(field_key="standards", evidence_snippet="ISO 14040 and ISO 14044", is_verified=True),
        ],
        relocation_willingness="YES",
    )

    eval_res = lca_scorer.evaluate(profile)
    assert eval_res.score >= 80.0
    assert eval_res.is_qualified is True
    assert eval_res.qualification_status == "QUALIFIED"


def test_strong_uiux_profile_scores_above_threshold():
    """Candidate meeting all UI/UX requirements must score above 50.0 and be QUALIFIED."""
    uiux_scorer = UIUXRoleScorer()
    profile = CandidateProfile(
        candidate_code="CAND-UIUX-STRONG",
        skills=["Wireframing", "Prototyping", "Design Systems", "User Research", "User Psychology"],
        tools=["Figma", "Framer", "Miro"],
        uiux_tools=["Figma", "Framer"],
        portfolio_urls=["https://behance.net/designportfolio"],
        total_experience_months=8,
        education=[EducationItem(degree="Bachelor of Design", is_environmental_domain=False)],
        work_experience=[
            WorkExperienceItem(
                role_title="UI/UX Design Intern",
                organization="Creative Studio",
                estimated_months=8,
                responsibilities=["Conducted user research and designed Figma design systems"],
            )
        ],
        evidence_items=[
            EvidenceSnippet(field_key="tools", evidence_snippet="Figma and Framer", is_verified=True),
            EvidenceSnippet(field_key="psychology", evidence_snippet="user psychology research", is_verified=True),
        ],
    )

    eval_res = uiux_scorer.evaluate(profile)
    assert eval_res.score >= 80.0
    assert eval_res.is_qualified is True
    assert eval_res.qualification_status == "QUALIFIED"


def test_orthogonal_classification():
    """Verify distinct classification labels: LCA, UI_UX, BOTH, and NEITHER_OR_UNCERTAIN."""
    evaluator = CandidateEvaluator()

    # 1. Pure LCA Candidate
    lca_prof = CandidateProfile(
        candidate_code="CAND-LCA",
        skills=["Life Cycle Assessment"],
        lca_tools=["GaBi"],
        standards=["ISO 14040"],
        total_experience_months=36,
        education=[EducationItem(degree="Environmental Science", is_environmental_domain=True)],
        work_experience=[WorkExperienceItem(role_title="LCA Specialist", estimated_months=36)],
        relocation_willingness="YES",
    )
    res_lca = evaluator.evaluate_candidate(uuid4(), lca_prof)
    assert res_lca.classification == "LCA"

    # 2. Pure UI/UX Candidate
    ui_prof = CandidateProfile(
        candidate_code="CAND-UI",
        skills=["Wireframing", "Prototyping", "User Research"],
        uiux_tools=["Figma", "Framer"],
        portfolio_urls=["https://behance.net/portfolio"],
        total_experience_months=6,
        work_experience=[WorkExperienceItem(role_title="UI/UX Intern", estimated_months=6)],
    )
    res_ui = evaluator.evaluate_candidate(uuid4(), ui_prof)
    assert res_ui.classification == "UI_UX"

    # 3. Out of domain candidate (e.g. Accountant)
    other_prof = CandidateProfile(
        candidate_code="CAND-OTHER",
        skills=["Financial Auditing", "Tax Compliance"],
        total_experience_months=60,
    )
    res_other = evaluator.evaluate_candidate(uuid4(), other_prof)
    assert res_other.classification == "NEITHER_OR_UNCERTAIN"


def test_deterministic_tie_breaking():
    """When scores are tied, higher confidence, primary criterion, and code order breaks tie."""
    evaluator = CandidateEvaluator()

    # Candidate A: 70 pts, higher confidence 1.0
    prof_a = CandidateProfile(
        candidate_code="CAND-A",
        skills=["Life Cycle Assessment"],
        lca_tools=["GaBi"],
        standards=["ISO 14040"],
        total_experience_months=36,
        extraction_confidence=1.0,
        education=[EducationItem(degree="Environmental Engineering", is_environmental_domain=True)],
        work_experience=[WorkExperienceItem(role_title="LCA Engineer", estimated_months=36)],
        relocation_willingness="YES",
    )
    eval_a = evaluator.lca_scorer.evaluate(prof_a)

    # Candidate B: same score, lower confidence 0.8
    prof_b = CandidateProfile(
        candidate_code="CAND-B",
        skills=["Life Cycle Assessment"],
        lca_tools=["GaBi"],
        standards=["ISO 14040"],
        total_experience_months=36,
        extraction_confidence=0.8,
        education=[EducationItem(degree="Environmental Engineering", is_environmental_domain=True)],
        work_experience=[WorkExperienceItem(role_title="LCA Engineer", estimated_months=36)],
        relocation_willingness="YES",
    )
    eval_b = evaluator.lca_scorer.evaluate(prof_b)

    assert eval_a.score == eval_b.score

    rankings = evaluator.generate_ranking(
        [(uuid4(), prof_b, eval_b, "LCA"), (uuid4(), prof_a, eval_a, "LCA")],
        role_key="LCA",
    )

    # Candidate A must rank 1st due to higher confidence
    assert rankings[0].candidate_code == "CAND-A"
    assert rankings[1].candidate_code == "CAND-B"


def test_evaluations_api_endpoints(setup_test_db):
    """Test POST /api/evaluations/{id}, GET /api/rankings/{role}, and batch evaluations."""
    repo, storage = setup_test_db

    # Create candidate and profile in database
    cand = repo.create_candidate(Candidate(candidate_code="CAND-API-01", processing_status="UPLOADED"))
    prof = CandidateProfile(
        candidate_code="CAND-API-01",
        skills=["Wireframing", "Prototyping", "UI Design"],
        uiux_tools=["Figma"],
        portfolio_urls=["https://dribbble.com/cand01"],
        total_experience_months=6,
        work_experience=[WorkExperienceItem(role_title="Design Intern", estimated_months=6)],
    )
    # Save profile entity
    from app.models.entities import CandidateProfileEntity
    repo.save_candidate_profile(
        CandidateProfileEntity(
            candidate_id=cand.id,
            profile_json=prof.model_dump(),
            model_provider="mock",
            model_name="mock",
        )
    )

    # 1. POST /api/evaluations/{candidate_id}
    res = client.post(f"/api/evaluations/{cand.id}")
    assert res.status_code == 200
    data = res.json()
    assert data["candidate_code"] == "CAND-API-01"
    assert data["classification"] == "UI_UX"
    assert data["uiux_evaluation"]["is_qualified"] is True
    assert data["lca_evaluation"]["is_qualified"] is False

    # 2. GET /api/evaluations/{candidate_id}
    get_res = client.get(f"/api/evaluations/{cand.id}")
    assert get_res.status_code == 200
    eval_list = get_res.json()
    assert len(eval_list) == 2

    # 3. GET /api/rankings/UI_UX
    rank_res = client.get("/api/rankings/UI_UX")
    assert rank_res.status_code == 200
    rank_data = rank_res.json()
    assert rank_data["role_key"] == "UI_UX"
    assert rank_data["qualified_count"] >= 1
    assert len(rank_data["rankings"]) >= 1
    assert rank_data["rankings"][0]["candidate_code"] == "CAND-API-01"

    # 4. POST /api/evaluations/batch
    batch_res = client.post("/api/evaluations/batch")
    assert batch_res.status_code == 200
    batch_data = batch_res.json()
    assert batch_data["total_evaluated"] >= 1
    assert batch_data["uiux_qualified"] >= 1

