import os
import glob
from uuid import UUID
from fastapi import APIRouter, UploadFile, File, HTTPException, status, Depends
from app.schemas.upload import (
    ResumeUploadResponse,
    BatchUploadResponse,
    DocumentAccessResponse,
    ExtractionResponse,
    BatchExtractionResponse,
    ExtractedTextDetail,
    BatchProfileResponse,
)
from app.schemas.profile import CandidateProfile
from app.services.database import get_repository
from app.services.database.base import Repository
from app.services.storage import get_storage_service
from app.services.storage.base import StorageService
from app.services.ingestion.ingest import IngestionService, DuplicateResumeError
from app.services.ingestion.validator import FileValidationError
from app.services.extraction.pipeline import ExtractionPipelineService
from app.services.extraction.profile_service import ProfileExtractionService

router = APIRouter(prefix="/api/resumes", tags=["resumes"])


def get_ingestion_service(
    repo: Repository = Depends(get_repository),
    storage: StorageService = Depends(get_storage_service),
) -> IngestionService:
    return IngestionService(repository=repo, storage_service=storage)


def get_extraction_pipeline_service(
    repo: Repository = Depends(get_repository),
    storage: StorageService = Depends(get_storage_service),
) -> ExtractionPipelineService:
    return ExtractionPipelineService(repository=repo, storage_service=storage)


def get_profile_extraction_service(
    repo: Repository = Depends(get_repository),
    storage: StorageService = Depends(get_storage_service),
) -> ProfileExtractionService:
    return ProfileExtractionService(repository=repo, storage_service=storage)


from app.services.scoring.service import EvaluationService


@router.post(
    "",
    response_model=ResumeUploadResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Upload a single candidate resume (PDF or DOCX)",
)
async def upload_resume(
    file: UploadFile = File(...),
    auto_process: bool = True,
    service: IngestionService = Depends(get_ingestion_service),
):
    try:
        content = await file.read()
        res = service.ingest_resume(
            content=content,
            original_filename=file.filename or "unknown_resume.docx",
        )
        if auto_process:
            try:
                eval_svc = EvaluationService(repository=service.repo, storage_service=service.storage)
                eval_svc.evaluate_candidate(res.candidate_id)
                res.message = "Resume uploaded, extracted, and evaluated successfully."
            except Exception as eval_err:
                # Still return upload success if evaluation encounters an issue
                pass
        return res
    except FileValidationError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"error_code": e.code, "message": e.message},
        )
    except DuplicateResumeError as e:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail={
                "error_code": "DUPLICATE_RESUME",
                "message": e.message,
                "existing_candidate_code": e.existing_candidate_code,
                "file_hash": e.file_hash,
            },
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={"error_code": "INTERNAL_INGESTION_ERROR", "message": "Failed to ingest resume."},
        )


@router.post(
    "/batch-import-local",
    response_model=BatchUploadResponse,
    summary="Import supplied local dataset from data/ directory",
)
def batch_import_local_dataset(
    directory: str = "data",
    service: IngestionService = Depends(get_ingestion_service),
):
    """
    Imports all candidate resumes present in the local directory using the exact same validation,
    deduplication, and transactional storage pipeline.
    """
    docx_files = sorted(glob.glob(os.path.join(directory, "*.docx")))
    pdf_files = sorted(glob.glob(os.path.join(directory, "*.pdf")))
    all_files = docx_files + pdf_files

    total_processed = 0
    total_imported = 0
    total_duplicates_skipped = 0
    errors = []
    candidates = []

    for file_path in all_files:
        fname = os.path.basename(file_path)
        total_processed += 1
        try:
            with open(file_path, "rb") as f:
                content = f.read()
            res = service.ingest_resume(content=content, original_filename=fname)
            candidates.append(res)
            total_imported += 1
        except DuplicateResumeError:
            total_duplicates_skipped += 1
        except FileValidationError as e:
            errors.append(f"{fname}: {e.message}")
        except Exception as e:
            errors.append(f"{fname}: {str(e)}")

    return BatchUploadResponse(
        total_processed=total_processed,
        total_imported=total_imported,
        total_duplicates_skipped=total_duplicates_skipped,
        errors=errors,
        candidates=candidates,
    )


@router.get(
    "/{candidate_id}/document-url",
    response_model=DocumentAccessResponse,
    summary="Generate a time-limited signed URL to access the original resume document",
)
def get_document_url(
    candidate_id: UUID,
    expires_in_seconds: int = 300,
    repo: Repository = Depends(get_repository),
    storage: StorageService = Depends(get_storage_service),
):
    doc = repo.get_document_by_candidate_id(candidate_id)
    if not doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"error_code": "DOCUMENT_NOT_FOUND", "message": "No resume document found for candidate."},
        )

    signed_url = storage.get_signed_url(doc.storage_path, expires_in_seconds=expires_in_seconds)
    return DocumentAccessResponse(
        candidate_id=candidate_id,
        original_filename=doc.original_filename,
        access_url=signed_url,
        expires_in_seconds=expires_in_seconds,
    )


@router.post(
    "/{candidate_id}/extract",
    response_model=ExtractionResponse,
    summary="Extract and normalize text from a candidate's resume document",
)
def extract_single_resume(
    candidate_id: UUID,
    service: ExtractionPipelineService = Depends(get_extraction_pipeline_service),
):
    try:
        result = service.process_candidate_document(candidate_id)
        doc = service.repo.get_document_by_candidate_id(candidate_id)
        norm_snippet = (doc.normalized_text or "")[:300] if doc else ""
        raw_snippet = result.raw_text[:300]

        return ExtractionResponse(
            candidate_id=candidate_id,
            status=result.status,
            parser_name=result.parser_name,
            char_count=result.char_count,
            word_count=result.word_count,
            page_count=result.page_count,
            warnings=result.warnings,
            raw_text_snippet=raw_snippet,
            normalized_text_snippet=norm_snippet,
        )
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Extraction failure: {str(e)}",
        )


@router.post(
    "/batch-extract",
    response_model=BatchExtractionResponse,
    summary="Extract and normalize text for all candidates in the repository",
)
def batch_extract_all_resumes(
    service: ExtractionPipelineService = Depends(get_extraction_pipeline_service),
):
    candidates = service.repo.list_candidates(limit=500, offset=0)
    results: List[ExtractionResponse] = []
    completed_count = 0
    partial_count = 0
    failed_count = 0

    for cand in candidates:
        try:
            res = service.process_candidate_document(cand.id)
            doc = service.repo.get_document_by_candidate_id(cand.id)
            norm_snippet = (doc.normalized_text or "")[:300] if doc else ""
            raw_snippet = res.raw_text[:300]

            if res.status == "COMPLETED":
                completed_count += 1
            elif res.status == "PARTIAL":
                partial_count += 1
            else:
                failed_count += 1

            results.append(
                ExtractionResponse(
                    candidate_id=cand.id,
                    status=res.status,
                    parser_name=res.parser_name,
                    char_count=res.char_count,
                    word_count=res.word_count,
                    page_count=res.page_count,
                    warnings=res.warnings,
                    raw_text_snippet=raw_snippet,
                    normalized_text_snippet=norm_snippet,
                )
            )
        except Exception as e:
            failed_count += 1
            results.append(
                ExtractionResponse(
                    candidate_id=cand.id,
                    status="FAILED",
                    parser_name="error",
                    char_count=0,
                    word_count=0,
                    page_count=0,
                    warnings=[str(e)],
                    raw_text_snippet="",
                    normalized_text_snippet="",
                )
            )

    return BatchExtractionResponse(
        total_candidates=len(candidates),
        completed=completed_count,
        partial=partial_count,
        failed=failed_count,
        results=results,
    )


@router.get(
    "/{candidate_id}/extracted-text",
    response_model=ExtractedTextDetail,
    summary="Retrieve raw and normalized extracted text for human review",
)
def get_extracted_text(
    candidate_id: UUID,
    repo: Repository = Depends(get_repository),
):
    doc = repo.get_document_by_candidate_id(candidate_id)
    if not doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found for candidate.",
        )

    return ExtractedTextDetail(
        candidate_id=candidate_id,
        original_filename=doc.original_filename,
        raw_text=doc.raw_text or "",
        normalized_text=doc.normalized_text or "",
        parser_name=doc.parser_name,
        parser_version=doc.parser_version,
        page_count=doc.page_count,
        extraction_status=doc.extraction_status,
        warnings=doc.extraction_warnings,
    )


@router.post(
    "/{candidate_id}/profile",
    response_model=CandidateProfile,
    summary="Extract structured profile and link verified evidence for a candidate",
)
def extract_candidate_profile(
    candidate_id: UUID,
    service: ProfileExtractionService = Depends(get_profile_extraction_service),
):
    try:
        profile = service.extract_and_validate_profile(candidate_id)
        return profile
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Profile extraction failure: {str(e)}",
        )


@router.post(
    "/batch-profile",
    response_model=BatchProfileResponse,
    summary="Extract structured profiles and link verified evidence for all candidates",
)
def batch_profile_all_resumes(
    service: ProfileExtractionService = Depends(get_profile_extraction_service),
):
    candidates = service.repo.list_candidates(limit=500, offset=0)
    profiles: List[CandidateProfile] = []
    profiled_count = 0
    failed_count = 0
    high_conf_count = 0
    low_conf_count = 0

    for cand in candidates:
        try:
            p = service.extract_and_validate_profile(cand.id)
            profiles.append(p)
            if p.extraction_confidence == 0.0:
                failed_count += 1
            else:
                profiled_count += 1
                if p.extraction_confidence >= 0.7:
                    high_conf_count += 1
                else:
                    low_conf_count += 1
        except Exception as e:
            failed_count += 1
            profiles.append(
                CandidateProfile(
                    candidate_code=cand.candidate_code,
                    relocation_willingness="UNKNOWN",
                    extraction_confidence=0.0,
                    extraction_warnings=[f"Batch profiling failure: {str(e)}"],
                )
            )

    return BatchProfileResponse(
        total_candidates=len(candidates),
        profiled=profiled_count,
        failed=failed_count,
        high_confidence=high_conf_count,
        low_confidence=low_conf_count,
        profiles=profiles,
    )


@router.get(
    "/{candidate_id}/profile",
    response_model=CandidateProfile,
    summary="Retrieve stored structured profile and verified evidence for a candidate",
)
def get_candidate_profile(
    candidate_id: UUID,
    repo: Repository = Depends(get_repository),
):
    candidate = repo.get_candidate_by_id(candidate_id)
    if not candidate:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Candidate not found.")

    prof_entity = repo.get_candidate_profile(candidate_id)
    if not prof_entity:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No profile extracted yet for this candidate.",
        )

    profile_data = prof_entity.profile_json
    return CandidateProfile(**profile_data)


