from typing import List, Optional, Tuple
from uuid import UUID
from app.models.entities import CandidateEvaluationEntity
from app.schemas.profile import CandidateProfile
from app.schemas.evaluation import (
    CandidateEvaluationResult,
    RoleEvaluation,
    RoleRankingResponse,
    CandidateRankingItem,
    BatchEvaluationResponse,
)
from app.services.database.base import Repository
from app.services.storage.base import StorageService
from app.services.extraction.profile_service import ProfileExtractionService
from app.services.scoring.evaluator import CandidateEvaluator


class EvaluationService:
    """
    Orchestrates deterministic candidate scoring, persistence of evaluations,
    classification updates, and ranking generation.
    """

    def __init__(self, repository: Repository, storage_service: StorageService):
        self.repo = repository
        self.storage = storage_service
        self.evaluator = CandidateEvaluator()
        self.profile_service = ProfileExtractionService(repository, storage_service)

    def evaluate_candidate(self, candidate_id: UUID) -> CandidateEvaluationResult:
        candidate = self.repo.get_candidate_by_id(candidate_id)
        if not candidate:
            raise ValueError(f"Candidate {candidate_id} not found.")

        # Ensure profile exists; if not, extract it
        profile_entity = self.repo.get_candidate_profile(candidate_id)
        if not profile_entity:
            profile = self.profile_service.extract_and_validate_profile(candidate_id)
        else:
            profile = CandidateProfile(**profile_entity.profile_json)

        is_failed = candidate.processing_status == "FAILED" or profile.extraction_confidence == 0.0

        # Execute deterministic dual-role scoring and orthogonal classification
        eval_result = self.evaluator.evaluate_candidate(
            candidate_id=candidate_id,
            profile=profile,
            is_extraction_failed=is_failed,
        )

        # Persist LCA evaluation
        lca_eval = eval_result.lca_evaluation
        lca_entity = CandidateEvaluationEntity(
            candidate_id=candidate_id,
            role_key="LCA",
            score=lca_eval.score,
            scoring_version=lca_eval.scoring_version,
            breakdown={k: v.model_dump() for k, v in lca_eval.breakdown.items()},
            is_qualified=lca_eval.is_qualified,
            qualification_status=lca_eval.qualification_status,
            summary=lca_eval.summary,
        )
        self.repo.save_candidate_evaluation(lca_entity)

        # Persist UI/UX evaluation
        uiux_eval = eval_result.uiux_evaluation
        uiux_entity = CandidateEvaluationEntity(
            candidate_id=candidate_id,
            role_key="UI_UX",
            score=uiux_eval.score,
            scoring_version=uiux_eval.scoring_version,
            breakdown={k: v.model_dump() for k, v in uiux_eval.breakdown.items()},
            is_qualified=uiux_eval.is_qualified,
            qualification_status=uiux_eval.qualification_status,
            summary=uiux_eval.summary,
        )
        self.repo.save_candidate_evaluation(uiux_entity)

        # Update candidate classification and score caches
        self.repo.update_candidate_scores_and_classification(
            candidate_id=candidate_id,
            lca_score=lca_eval.score,
            uiux_score=uiux_eval.score,
            classification=eval_result.classification,
        )

        return eval_result

    def evaluate_all_candidates(self) -> BatchEvaluationResponse:
        candidates = self.repo.list_candidates(limit=500, offset=0)
        evaluations: List[CandidateEvaluationResult] = []
        lca_qual = 0
        uiux_qual = 0
        both_qual = 0
        neither_qual = 0

        for cand in candidates:
            try:
                res = self.evaluate_candidate(cand.id)
                evaluations.append(res)
                if res.classification == "LCA":
                    lca_qual += 1
                elif res.classification == "UI_UX":
                    uiux_qual += 1
                elif res.classification == "BOTH":
                    both_qual += 1
                else:
                    neither_qual += 1
            except Exception as e:
                neither_qual += 1

        return BatchEvaluationResponse(
            total_evaluated=len(evaluations),
            lca_qualified=lca_qual,
            uiux_qualified=uiux_qual,
            both_qualified=both_qual,
            neither_or_uncertain=neither_qual,
            evaluations=evaluations,
        )

    def get_role_rankings(self, role_key: str) -> RoleRankingResponse:
        role_key_upper = role_key.upper()
        if role_key_upper not in ["LCA", "UI_UX"]:
            raise ValueError(f"Invalid role key '{role_key}'. Must be 'LCA' or 'UI_UX'.")

        candidates = self.repo.list_candidates(limit=500, offset=0)
        ranking_inputs: List[Tuple[UUID, CandidateProfile, RoleEvaluation, str]] = []

        qualified_count = 0
        unqualified_count = 0
        unavailable_count = 0

        for cand in candidates:
            # Get evaluations for candidate
            evals = self.repo.get_candidate_evaluations(cand.id)
            target_eval = next((e for e in evals if e.role_key == role_key_upper), None)
            
            # If not yet evaluated, evaluate now
            if not target_eval:
                res = self.evaluate_candidate(cand.id)
                cand = self.repo.get_candidate_by_id(cand.id)  # refreshed
                r_eval = res.lca_evaluation if role_key_upper == "LCA" else res.uiux_evaluation
            else:
                from app.schemas.evaluation import CriterionEvaluation
                breakdown_dict = {}
                for k, v in target_eval.breakdown.items():
                    breakdown_dict[k] = CriterionEvaluation(**v)
                r_eval = RoleEvaluation(
                    role_key=target_eval.role_key,
                    score=target_eval.score,
                    scoring_version=target_eval.scoring_version,
                    is_qualified=target_eval.is_qualified,
                    qualification_status=target_eval.qualification_status,
                    summary=target_eval.summary or "",
                    breakdown=breakdown_dict,
                )

            # Retrieve profile
            prof_entity = self.repo.get_candidate_profile(cand.id)
            if prof_entity:
                profile = CandidateProfile(**prof_entity.profile_json)
            else:
                profile = CandidateProfile(candidate_code=cand.candidate_code)

            if r_eval.score is None:
                unavailable_count += 1
            elif r_eval.is_qualified:
                qualified_count += 1
            else:
                unqualified_count += 1

            ranking_inputs.append((cand.id, profile, r_eval, cand.classification))

        # Generate deterministic ranked order
        rankings = self.evaluator.generate_ranking(ranking_inputs, role_key=role_key_upper)

        role_title = (
            "Life Cycle Assessment (LCA) Consultant"
            if role_key_upper == "LCA"
            else "UI/UX Designer Intern"
        )

        return RoleRankingResponse(
            role_key=role_key_upper,
            role_title=role_title,
            total_candidates=len(candidates),
            qualified_count=qualified_count,
            unqualified_count=unqualified_count,
            unavailable_count=unavailable_count,
            rankings=rankings,
        )

