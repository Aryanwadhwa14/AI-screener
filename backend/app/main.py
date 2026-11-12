import os
from uuid import UUID
from fastapi import FastAPI, HTTPException, Depends
from fastapi.responses import FileResponse, RedirectResponse
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.schemas.health import HealthResponse
from app.services.database import get_repository
from app.services.storage import get_storage_service
from app.services.storage.base import StorageService
from app.services.storage.local import LocalStorageService
from app.api.resumes import router as resumes_router
from app.api.evaluations import router as evaluations_router
from app.api.candidates import router as candidates_router

app = FastAPI(
    title=settings.app_name,
    version="0.1.0",
    description="Backend service for AI-assisted resume screening and candidate ranking",
)

# CORS configuration
is_wildcard = "*" in settings.cors_origins_list
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"] if is_wildcard else settings.cors_origins_list,
    allow_credentials=not is_wildcard,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register API routers
app.include_router(resumes_router)
app.include_router(evaluations_router)
app.include_router(candidates_router)


@app.get("/api/health", response_model=HealthResponse)
def health_check():
    repo = get_repository()
    db_health = repo.check_health()

    return HealthResponse(
        status="healthy" if db_health.get("status") == "connected" else "degraded",
        version="0.1.0",
        environment=settings.environment,
        details={
            "app_name": settings.app_name,
            "llm_provider": settings.llm_provider,
            "database": db_health,
            "storage_bucket": settings.storage_bucket_name,
        },
    )


@app.get("/api/documents/preview/{token}", summary="Stream document for local storage preview")
def preview_local_document(token: str, storage: StorageService = Depends(get_storage_service)):
    if not isinstance(storage, LocalStorageService):
        raise HTTPException(status_code=400, detail="Preview route is only for local storage mode.")
    try:
        rel_path = storage.verify_token(token)
        full_path = storage._full_path(rel_path)
        if not os.path.exists(full_path):
            raise HTTPException(status_code=404, detail="Document file not found on disk.")
        filename = os.path.basename(full_path)
        media_type = "application/octet-stream"
        if filename.lower().endswith(".pdf"):
            media_type = "application/pdf"
        elif filename.lower().endswith(".docx"):
            media_type = "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        elif filename.lower().endswith(".txt"):
            media_type = "text/plain"
        return FileResponse(
            full_path,
            filename=filename,
            media_type=media_type,
            headers={"Content-Disposition": f'inline; filename="{filename}"'},
        )
    except ValueError as e:
        raise HTTPException(status_code=403, detail=str(e))


@app.get("/api/candidates/{candidate_id}/resume", summary="Download or view candidate source resume document")
def download_candidate_resume(
    candidate_id: UUID,
    repo=Depends(get_repository),
    storage: StorageService = Depends(get_storage_service),
):
    doc = repo.get_document_by_candidate_id(candidate_id)
    if not doc:
        raise HTTPException(status_code=404, detail="No resume document found for candidate.")
    if isinstance(storage, LocalStorageService):
        full_path = storage._full_path(doc.storage_path)
        if not os.path.exists(full_path):
            raise HTTPException(status_code=404, detail="Physical resume file not found on disk.")
        filename = doc.original_filename or os.path.basename(full_path)
        media_type = doc.mime_type or "application/octet-stream"
        if not media_type or media_type == "application/octet-stream":
            if filename.lower().endswith(".pdf"):
                media_type = "application/pdf"
            elif filename.lower().endswith(".docx"):
                media_type = "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            elif filename.lower().endswith(".txt"):
                media_type = "text/plain"
        return FileResponse(
            full_path,
            filename=filename,
            media_type=media_type,
            headers={"Content-Disposition": f'inline; filename="{filename}"'},
        )
    else:
        signed_url = storage.get_signed_url(doc.storage_path, expires_in_seconds=600)
        return RedirectResponse(signed_url)
