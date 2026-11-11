import uuid
from typing import Optional
from app.models.entities import Candidate, ResumeDocument, ProcessingJob
from app.schemas.upload import ResumeUploadResponse
from app.services.database.base import Repository
from app.services.storage.base import StorageService
from app.services.ingestion.validator import validate_file, FileValidationError


class DuplicateResumeError(Exception):
    def __init__(self, message: str, existing_candidate_code: str, file_hash: str):
        self.message = message
        self.existing_candidate_code = existing_candidate_code
        self.file_hash = file_hash
        super().__init__(self.message)


class IngestionService:
    def __init__(self, repository: Repository, storage_service: StorageService):
        self.repo = repository
        self.storage = storage_service

    def _generate_candidate_code(self) -> str:
        count = self.repo.get_candidate_count()
        # Find next available code to avoid collision
        next_num = count + 1
        while True:
            code = f"CAND-{next_num:03d}"
            if not self.repo.get_candidate_by_code(code):
                return code
            next_num += 1

    def ingest_resume(
        self,
        content: bytes,
        original_filename: str,
        max_size_bytes: int = 10 * 1024 * 1024,
    ) -> ResumeUploadResponse:
        """
        Executes file validation, duplicate check, storage upload, and atomic database creation.
        Guarantees cleanup on failure.
        """
        # 1. Validate file format, signature, size, and compute hash
        ext, mime_type, file_hash, file_size = validate_file(
            content, original_filename, max_size_bytes
        )

        # 2. Duplicate detection
        existing_doc = self.repo.get_document_by_hash(file_hash)
        if existing_doc:
            existing_candidate = self.repo.get_candidate_by_id(existing_doc.candidate_id)
            code = existing_candidate.candidate_code if existing_candidate else "UNKNOWN"
            raise DuplicateResumeError(
                f"Resume is a duplicate of existing candidate {code}.",
                existing_candidate_code=code,
                file_hash=file_hash,
            )

        candidate_id = uuid.uuid4()
        candidate_code = self._generate_candidate_code()
        storage_path = f"raw/{candidate_id}/{file_hash}{ext}"

        uploaded_to_storage = False
        created_candidate = False

        try:
            # 3. Upload to private storage
            self.storage.upload_file(storage_path, content, mime_type)
            uploaded_to_storage = True

            # 4. Database creation: Candidate
            candidate = Candidate(
                id=candidate_id,
                candidate_code=candidate_code,
                classification="NEITHER_OR_UNCERTAIN",
                processing_status="PENDING",
            )
            self.repo.create_candidate(candidate)
            created_candidate = True

            # 5. Database creation: Document
            document = ResumeDocument(
                candidate_id=candidate_id,
                original_filename=original_filename,
                storage_path=storage_path,
                mime_type=mime_type,
                file_size=file_size,
                file_hash=file_hash,
            )
            self.repo.create_resume_document(document)

            # 6. Database creation: Processing Job
            job = ProcessingJob(
                candidate_id=candidate_id,
                status="PENDING",
                stage="INGESTION_COMPLETED",
                attempt_count=1,
            )
            self.repo.create_processing_job(job)

            return ResumeUploadResponse(
                candidate_id=candidate_id,
                candidate_code=candidate_code,
                original_filename=original_filename,
                file_hash=file_hash,
                processing_status=candidate.processing_status,
                job_id=job.id,
                message="Resume uploaded and registered successfully.",
            )

        except Exception as e:
            # Transactional cleanup on failure: avoid orphaned storage or database records
            if uploaded_to_storage:
                self.storage.delete_file(storage_path)
            if created_candidate:
                self.repo.delete_candidate(candidate_id)
            raise e

