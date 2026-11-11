from uuid import UUID
from typing import List, Optional
from pydantic import BaseModel


class ResumeUploadResponse(BaseModel):
    candidate_id: UUID
    candidate_code: str
    original_filename: str
    file_hash: str
    processing_status: str
    job_id: UUID
    message: str


class BatchUploadResponse(BaseModel):
    total_processed: int
    total_imported: int
    total_duplicates_skipped: int
    errors: List[str]
    candidates: List[ResumeUploadResponse]


class DocumentAccessResponse(BaseModel):
    candidate_id: UUID
    original_filename: str
    access_url: str
    expires_in_seconds: int


class ExtractionResponse(BaseModel):
    candidate_id: UUID
    status: str
    parser_name: str
    char_count: int
    word_count: int
    page_count: int
    warnings: List[str]
    raw_text_snippet: str
    normalized_text_snippet: str


class BatchExtractionResponse(BaseModel):
    total_candidates: int
    completed: int
    partial: int
    failed: int
    results: List[ExtractionResponse]


from app.schemas.profile import CandidateProfile


class BatchProfileResponse(BaseModel):
    total_candidates: int
    profiled: int
    failed: int
    high_confidence: int
    low_confidence: int
    profiles: List[CandidateProfile]


class ExtractedTextDetail(BaseModel):
    candidate_id: UUID
    original_filename: str
    raw_text: str
    normalized_text: str
    parser_name: Optional[str]
    parser_version: Optional[str]
    page_count: Optional[int]
    extraction_status: str
    warnings: List[str]

