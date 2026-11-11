from typing import List, Optional
from uuid import UUID
from fastapi import APIRouter, HTTPException, status, Depends
from app.schemas.evaluation import (
    CandidateEvaluationResult,
    BatchEvaluationResponse,
    RoleRankingResponse,
    RoleEvaluation,
)
from app.services.database import get_repository
from app.services.database.base import Repository
from app.services.storage import get_storage_service
from app.services.storage.base import StorageService
from app.services.scoring.service import EvaluationService

router = APIRouter(tags=["evaluations"])


def get_evaluation_service(
    repo: Repository = Depends(get_repository),
    storage: StorageService = Depends(get_storage_service),
) -> EvaluationService:
    return EvaluationService(repository=repo, storage_service=storage)


@router.post(
    "/api/evaluations/batch",
    response_model=BatchEvaluationResponse,
    summary="Deterministically evaluate all candidates in the repository",
)
def batch_evaluate_candidates(
    service: EvaluationService = Depends(get_evaluation_service),
):
    try:
        return service.evaluate_all_candidates()
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Batch evaluation failed: {str(e)}",
        )


@router.post(
    "/api/evaluations/{candidate_id}",
    response_model=CandidateEvaluationResult,
    summary="Deterministically evaluate candidate against both LCA and UI/UX roles",
)
def evaluate_candidate(
    candidate_id: UUID,
    service: EvaluationService = Depends(get_evaluation_service),
):
    try:
        return service.evaluate_candidate(candidate_id)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Evaluation failed: {str(e)}",
        )


@router.get(
    "/api/evaluations/{candidate_id}",
    response_model=List[RoleEvaluation],
    summary="Retrieve stored evaluations and criterion breakdowns for a candidate",
)
def get_candidate_evaluations(
    candidate_id: UUID,
    repo: Repository = Depends(get_repository),
):
    candidate = repo.get_candidate_by_id(candidate_id)
    if not candidate:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Candidate not found.")

    eval_entities = repo.get_candidate_evaluations(candidate_id)
    if not eval_entities:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No evaluations generated yet for this candidate.",
        )

    from app.schemas.evaluation import CriterionEvaluation
    results = []
    for ent in eval_entities:
        breakdown_dict = {k: CriterionEvaluation(**v) for k, v in ent.breakdown.items()}
        results.append(
            RoleEvaluation(
                role_key=ent.role_key,
                score=ent.score,
                scoring_version=ent.scoring_version,
                is_qualified=ent.is_qualified,
                qualification_status=ent.qualification_status,
                summary=ent.summary or "",
                breakdown=breakdown_dict,
            )
        )
    return results


@router.get(
    "/api/rankings/{role_key}",
    response_model=RoleRankingResponse,
    summary="Retrieve explainable, deterministic candidate rankings for a role",
)
def get_role_rankings(
    role_key: str,
    qualification_status: Optional[str] = None,
    min_score: Optional[float] = None,
    max_score: Optional[float] = None,
    search: Optional[str] = None,
    service: EvaluationService = Depends(get_evaluation_service),
):
    try:
        res = service.get_role_rankings(role_key)
        filtered_rankings = res.rankings

        if qualification_status and qualification_status.upper() != "ALL":
            filtered_rankings = [
                r for r in filtered_rankings
                if r.qualification_status.upper() == qualification_status.upper()
            ]

        if min_score is not None:
            filtered_rankings = [
                r for r in filtered_rankings
                if r.score is not None and r.score >= min_score
            ]

        if max_score is not None:
            filtered_rankings = [
                r for r in filtered_rankings
                if r.score is not None and r.score <= max_score
            ]

        if search:
            q = search.lower()
            filtered_rankings = [
                r for r in filtered_rankings
                if q in r.candidate_code.lower() or any(q in s.lower() for s in r.key_strengths)
            ]

        # Re-index ranks for filtered view
        for i, item in enumerate(filtered_rankings, start=1):
            item.rank = i

        res.rankings = filtered_rankings
        return res
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate rankings: {str(e)}",
        )
