from uuid import UUID
from typing import Tuple, List, Optional
from app.services.extraction.models import ExtractionResult
from app.services.extraction.pdf_extractor import extract_text_from_pdf
from app.services.extraction.docx_extractor import extract_text_from_docx
from app.services.extraction.ocr_adapter import get_ocr_adapter
from app.services.normalization.normalizer import normalize_text
from app.services.database.base import Repository
from app.services.storage.base import StorageService
from app.services.storage.local import LocalStorageService


class ExtractionPipelineService:
    def __init__(self, repository: Repository, storage_service: StorageService):
        self.repo = repository
        self.storage = storage_service
        self.ocr_adapter = get_ocr_adapter()

    def extract_document(self, content: bytes, filename: str) -> Tuple[ExtractionResult, str]:
        """
        Routes document to correct parser (.pdf or .docx), executes extraction,
        evaluates OCR needs, and applies conservative normalization.
        Returns: (ExtractionResult, normalized_text)
        """
        ext = "." + filename.rsplit(".", 1)[-1].lower() if "." in filename else ""

        if ext == ".pdf":
            result = extract_text_from_pdf(content)
        elif ext == ".docx":
            result = extract_text_from_docx(content)
        else:
            result = ExtractionResult(
                raw_text="",
                pages=[],
                char_count=0,
                word_count=0,
                page_count=0,
                parser_name="unknown",
                parser_version="unknown",
                is_empty=True,
                warnings=[f"Unsupported file format '{ext}' for text extraction."],
                status="FAILED",
            )

        # Handle scanned documents: attempt OCR if configured
        if result.is_scanned:
            if self.ocr_adapter.is_available():
                # If OCR available, adapter would extract text and update result
                pass
            else:
                result.warnings.append(
                    "OCR adapter is unavailable. Document marked as partial for human review."
                )

        # Apply conservative normalization
        normalized_text = normalize_text(result.raw_text)

        return result, normalized_text

    def process_candidate_document(self, candidate_id: UUID) -> ExtractionResult:
        """
        Loads document for candidate from storage, executes extraction and normalization,
        persists raw and normalized text, and updates processing status.
        """
        doc = self.repo.get_document_by_candidate_id(candidate_id)
        if not doc:
            raise ValueError(f"No resume document found for candidate {candidate_id}")

        # Fetch bytes from storage
        if isinstance(self.storage, LocalStorageService):
            full_path = self.storage._full_path(doc.storage_path)
            with open(full_path, "rb") as f:
                content = f.read()
        else:
            # If using Supabase Storage client
            clean_path = doc.storage_path.replace("..", "").lstrip("/\\")
            content = self.storage.client.storage.from_(self.storage.bucket_name).download(clean_path)

        result, normalized_text = self.extract_document(content, doc.original_filename)

        # Persist extracted results in database
        self.repo.update_resume_document_extraction(
            doc_id=doc.id,
            raw_text=result.raw_text,
            normalized_text=normalized_text,
            parser_name=result.parser_name,
            parser_version=result.parser_version,
            page_count=result.page_count,
            status=result.status,
            warnings=result.warnings,
        )

        # Update candidate processing status
        new_status = "TEXT_EXTRACTED"
        new_classification = None

        if result.status == "FAILED" or result.is_empty:
            new_status = "FAILED"
            new_classification = "NEITHER_OR_UNCERTAIN"
        elif result.status == "PARTIAL" or result.is_scanned or result.is_low_text:
            new_status = "PARTIAL"

        self.repo.update_candidate_status(
            candidate_id=candidate_id,
            processing_status=new_status,
            classification=new_classification,
        )

        # Update processing job
        job = self.repo.get_latest_job_for_candidate(candidate_id)
        if job:
            job.stage = "EXTRACTION_COMPLETED"
            job.status = result.status
            if result.warnings:
                job.error_message_safe = "; ".join(result.warnings[:3])
            self.repo.update_processing_job(job)

        return result

