from datetime import datetime
from typing import List, Optional, Dict, Any
from uuid import UUID
from pydantic import BaseModel, Field
from app.schemas.profile import CandidateProfile
from app.schemas.evaluation import RoleEvaluation


class CandidateSummaryItem(BaseModel):
    id: UUID
    candidate_code: str
    classification: str  # 'LCA', 'UI_UX', 'BOTH', 'NEITHER_OR_UNCERTAIN'
    processing_status: str  # 'PENDING', 'PROCESSED', 'FAILED', etc.
    lca_score: Optional[float] = None
    uiux_score: Optional[float] = None
    original_filename: str
    file_size: int
    extraction_confidence: float = 1.0
    created_at: datetime


class CandidateListResponse(BaseModel):
    total: int
    page: int
    page_size: int
    total_pages: int
    candidates: List[CandidateSummaryItem]


class DocumentMeta(BaseModel):
    original_filename: str
    file_size: int
    mime_type: str
    page_count: Optional[int] = None
    access_url: Optional[str] = None


class TextSnippetMeta(BaseModel):
    raw_text: str
    normalized_text: str
    parser_name: Optional[str] = None
    extraction_status: str = "PENDING"
    warnings: List[str] = Field(default_factory=list)


class CandidateDetailResponse(BaseModel):
    id: UUID
    candidate_code: str
    classification: str
    processing_status: str
    lca_score: Optional[float] = None
    uiux_score: Optional[float] = None
    document: DocumentMeta
    extracted_text: TextSnippetMeta
    profile: Optional[CandidateProfile] = None
    evidence_items: List[Dict[str, Any]] = Field(default_factory=list)
    lca_evaluation: Optional[RoleEvaluation] = None
    uiux_evaluation: Optional[RoleEvaluation] = None
    warnings: List[str] = Field(default_factory=list)


class ProcessingStatusResponse(BaseModel):
    candidate_id: UUID
    candidate_code: str
    status: str
    stage: str
    attempt_count: int
    error_code: Optional[str] = None
    error_message: Optional[str] = None
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None


class MethodologyResponse(BaseModel):
    app_name: str
    version: str
    scoring_version: str
    roles: Dict[str, Any]
    methodological_rules: List[str]
    tie_breaking_protocol: List[str]

