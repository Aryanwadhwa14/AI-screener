from typing import Optional
from uuid import UUID
from fastapi import APIRouter, HTTPException, status, Depends, Query
from app.schemas.reviewer import (
    CandidateListResponse,
    CandidateDetailResponse,
    ProcessingStatusResponse,
    MethodologyResponse,
)
from app.services.database import get_repository
from app.services.database.base import Repository
from app.services.storage import get_storage_service
from app.services.storage.base import StorageService
from app.services.reviewer.service import ReviewerService

router = APIRouter(tags=["candidates"])


def get_reviewer_service(
    repo: Repository = Depends(get_repository),
    storage: StorageService = Depends(get_storage_service),
) -> ReviewerService:
    return ReviewerService(repository=repo, storage_service=storage)


@router.get(
    "/api/candidates",
    response_model=CandidateListResponse,
    summary="List candidates with pagination, classification/status filtering, and search",
)
def list_candidates(
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(20, ge=1, le=100, description="Items per page"),
    classification: Optional[str] = Query(None, description="Filter by classification (LCA, UI_UX, BOTH, NEITHER_OR_UNCERTAIN, ALL)"),
    status: Optional[str] = Query(None, description="Filter by processing status"),
    min_score: Optional[float] = Query(None, ge=0.0, le=100.0, description="Minimum role score"),
    max_score: Optional[float] = Query(None, ge=0.0, le=100.0, description="Maximum role score"),
    search: Optional[str] = Query(None, description="Search candidate code, filename, or skills"),
    service: ReviewerService = Depends(get_reviewer_service),
):
    try:
        return service.list_candidates(
            page=page,
            page_size=page_size,
            classification=classification,
            processing_status=status,
            min_score=min_score,
            max_score=max_score,
            search=search,
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to list candidates: {str(e)}",
        )


@router.get(
    "/api/candidates/{candidate_id}",
    response_model=CandidateDetailResponse,
    summary="Retrieve full candidate detail, drawer data, verified evidence, and score breakdown",
)
def get_candidate_detail(
    candidate_id: UUID,
    service: ReviewerService = Depends(get_reviewer_service),
):
    try:
        return service.get_candidate_detail(candidate_id)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve candidate detail: {str(e)}",
        )


@router.post(
    "/api/candidates/{candidate_id}/retry",
    response_model=CandidateDetailResponse,
    summary="Retry transient extraction or evaluation failure for a candidate",
)
def retry_candidate_processing(
    candidate_id: UUID,
    service: ReviewerService = Depends(get_reviewer_service),
):
    try:
        return service.retry_candidate_processing(candidate_id)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Reprocessing retry failed: {str(e)}",
        )


@router.get(
    "/api/candidates/{candidate_id}/status",
    response_model=ProcessingStatusResponse,
    summary="Retrieve processing job status and attempt count for a candidate",
)
def get_candidate_processing_status(
    candidate_id: UUID,
    service: ReviewerService = Depends(get_reviewer_service),
):
    try:
        return service.get_candidate_status(candidate_id)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve candidate status: {str(e)}",
        )


@router.get(
    "/api/methodology",
    response_model=MethodologyResponse,
    summary="Retrieve scoring methodology, criteria weights, thresholds, and governance rules",
)
def get_methodology(
    service: ReviewerService = Depends(get_reviewer_service),
):
    try:
        return service.get_methodology()
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve methodology: {str(e)}",
        )

