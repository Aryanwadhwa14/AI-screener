from datetime import datetime, timezone
from typing import Optional, Dict, Any
from uuid import UUID, uuid4
from pydantic import BaseModel, Field


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


class Candidate(BaseModel):
    id: UUID = Field(default_factory=uuid4)
    candidate_code: str
    classification: str = "NEITHER_OR_UNCERTAIN"
    processing_status: str = "PENDING"
    lca_score: Optional[float] = None
    uiux_score: Optional[float] = None
    created_at: datetime = Field(default_factory=utc_now)
    updated_at: datetime = Field(default_factory=utc_now)


class ResumeDocument(BaseModel):
    id: UUID = Field(default_factory=uuid4)
    candidate_id: UUID
    original_filename: str
    storage_path: str
    mime_type: str
    file_size: int
    file_hash: str
    page_count: Optional[int] = None
    raw_text: Optional[str] = None
    normalized_text: Optional[str] = None
    parser_name: Optional[str] = None
    parser_version: Optional[str] = None
    extraction_status: str = "PENDING"  # 'PENDING', 'COMPLETED', 'PARTIAL', 'FAILED'
    extraction_warnings: list[str] = Field(default_factory=list)
    extracted_at: Optional[datetime] = None
    created_at: datetime = Field(default_factory=utc_now)


class JobDescription(BaseModel):
    id: UUID = Field(default_factory=uuid4)
    role_key: str  # 'LCA' or 'UI_UX'
    title: str
    source_text: str
    requirements: Dict[str, Any] = Field(default_factory=dict)
    version: str = "1.0"
    created_at: datetime = Field(default_factory=utc_now)
    updated_at: datetime = Field(default_factory=utc_now)


class ProcessingJob(BaseModel):
    id: UUID = Field(default_factory=uuid4)
    candidate_id: UUID
    status: str = "PENDING"  # 'PENDING', 'PROCESSING', 'COMPLETED', 'PARTIAL', 'FAILED'
    stage: str = "INGESTION"
    attempt_count: int = 1
    error_code: Optional[str] = None
    error_message_safe: Optional[str] = None
    started_at: datetime = Field(default_factory=utc_now)
    completed_at: Optional[datetime] = None


class CandidateProfileEntity(BaseModel):
    id: UUID = Field(default_factory=uuid4)
    candidate_id: UUID
    profile_json: Dict[str, Any]
    schema_version: str = "1.0"
    model_provider: str
    model_name: str
    prompt_version: str = "1.0"
    extraction_confidence: float = 1.0
    validation_status: str = "VALIDATED"
    created_at: datetime = Field(default_factory=utc_now)


class EvidenceItemEntity(BaseModel):
    id: UUID = Field(default_factory=uuid4)
    candidate_id: UUID
    field_key: str
    evidence_text: str
    page_number: Optional[int] = None
    is_verified: bool = True
    validation_status: str = "VERIFIED"
    created_at: datetime = Field(default_factory=utc_now)


class CandidateEvaluationEntity(BaseModel):
    id: UUID = Field(default_factory=uuid4)
    candidate_id: UUID
    role_key: str  # 'LCA' or 'UI_UX'
    score: Optional[float] = None  # None/null for failed/unavailable extraction
    scoring_version: str = "1.0"
    breakdown: Dict[str, Any] = Field(default_factory=dict)
    is_qualified: bool = False
    qualification_status: str = "UNQUALIFIED"  # 'QUALIFIED', 'UNQUALIFIED', 'MANUAL_REVIEW_REQUIRED'
    summary: Optional[str] = None
    created_at: datetime = Field(default_factory=utc_now)
    updated_at: datetime = Field(default_factory=utc_now)


