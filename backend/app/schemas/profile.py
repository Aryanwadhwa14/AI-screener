from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field


class EvidenceSnippet(BaseModel):
    field_key: str
    evidence_snippet: str
    source_section: Optional[str] = None
    is_verified: bool = True


class WorkExperienceItem(BaseModel):
    role_title: str
    organization: Optional[str] = None
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    is_current: bool = False
    estimated_months: Optional[int] = None
    responsibilities: List[str] = Field(default_factory=list)
    evidence_snippet: Optional[str] = None
    is_verified: bool = True


class EducationItem(BaseModel):
    degree: str
    institution: Optional[str] = None
    field_of_study: Optional[str] = None
    graduation_year: Optional[int] = None
    is_environmental_domain: bool = False
    evidence_snippet: Optional[str] = None
    is_verified: bool = True


class ProjectItem(BaseModel):
    title: str
    description: Optional[str] = None
    tools_used: List[str] = Field(default_factory=list)
    role_type: str = "OTHER"  # 'LCA', 'UI_UX', 'OTHER'
    evidence_snippet: Optional[str] = None
    is_verified: bool = True


class CandidateProfile(BaseModel):
    candidate_code: str
    skills: List[str] = Field(default_factory=list)
    tools: List[str] = Field(default_factory=list)
    lca_tools: List[str] = Field(default_factory=list)  # GaBi, SimaPro, openLCA, etc.
    uiux_tools: List[str] = Field(default_factory=list)  # Figma, Canva, Adobe XD, etc.
    standards: List[str] = Field(default_factory=list)  # ISO 14040, ISO 14044, EPD, etc.
    work_experience: List[WorkExperienceItem] = Field(default_factory=list)
    total_experience_months: Optional[int] = None
    education: List[EducationItem] = Field(default_factory=list)
    projects: List[ProjectItem] = Field(default_factory=list)
    portfolio_urls: List[str] = Field(default_factory=list)
    # Mandatory Methodology Rule: strictly defaults to UNKNOWN. Never infer False from silence.
    relocation_willingness: str = "UNKNOWN"  # 'YES', 'NO', 'UNKNOWN'
    evidence_items: List[EvidenceSnippet] = Field(default_factory=list)
    extraction_confidence: float = 1.0  # 0.0 to 1.0
    extraction_warnings: List[str] = Field(default_factory=list)

