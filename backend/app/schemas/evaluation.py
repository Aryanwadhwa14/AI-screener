from typing import List, Optional, Dict, Any
from uuid import UUID
from pydantic import BaseModel, Field


class CriterionEvaluation(BaseModel):
    criterion_key: str
    criterion_name: str
    weight: float
    score: float
    evidence: List[str] = Field(default_factory=list)
    notes: str = ""


class RoleEvaluation(BaseModel):
    role_key: str  # 'LCA' or 'UI_UX'
    score: Optional[float] = None  # None for unavailable/failed extractions
    scoring_version: str = "1.0"
    is_qualified: bool = False
    qualification_status: str = "UNQUALIFIED"  # 'QUALIFIED', 'UNQUALIFIED', 'MANUAL_REVIEW_REQUIRED'
    summary: str = ""
    breakdown: Dict[str, CriterionEvaluation] = Field(default_factory=dict)


class CandidateEvaluationResult(BaseModel):
    candidate_id: UUID
    candidate_code: str
    classification: str  # 'LCA', 'UI_UX', 'BOTH', 'NEITHER_OR_UNCERTAIN'
    lca_evaluation: RoleEvaluation
    uiux_evaluation: RoleEvaluation
    extraction_confidence: float = 1.0


class CandidateRankingItem(BaseModel):
    rank: int
    candidate_id: UUID
    candidate_code: str
    score: Optional[float] = None
    is_qualified: bool = False
    qualification_status: str = "UNQUALIFIED"
    classification: str = "NEITHER_OR_UNCERTAIN"
    extraction_confidence: float = 1.0
    key_strengths: List[str] = Field(default_factory=list)
    summary: Optional[str] = None


class RoleRankingResponse(BaseModel):
    role_key: str
    role_title: str
    total_candidates: int
    qualified_count: int
    unqualified_count: int
    unavailable_count: int
    rankings: List[CandidateRankingItem]


class BatchEvaluationResponse(BaseModel):
    total_evaluated: int
    lca_qualified: int
    uiux_qualified: int
    both_qualified: int
    neither_or_uncertain: int
    evaluations: List[CandidateEvaluationResult]

