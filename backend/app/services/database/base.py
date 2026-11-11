from abc import ABC, abstractmethod
from typing import Optional, List, Dict, Any
from uuid import UUID
from app.models.entities import (
    Candidate,
    ResumeDocument,
    JobDescription,
    ProcessingJob,
    CandidateProfileEntity,
    EvidenceItemEntity,
    CandidateEvaluationEntity,
)


class Repository(ABC):
    @abstractmethod
    def create_candidate(self, candidate: Candidate) -> Candidate:
        pass

    @abstractmethod
    def get_candidate_by_id(self, candidate_id: UUID) -> Optional[Candidate]:
        pass

    @abstractmethod
    def get_candidate_by_code(self, candidate_code: str) -> Optional[Candidate]:
        pass

    @abstractmethod
    def get_candidate_count(self) -> int:
        pass

    @abstractmethod
    def list_candidates(self, limit: int = 100, offset: int = 0) -> List[Candidate]:
        pass

    @abstractmethod
    def create_resume_document(self, document: ResumeDocument) -> ResumeDocument:
        pass

    @abstractmethod
    def update_resume_document_extraction(
        self,
        doc_id: UUID,
        raw_text: str,
        normalized_text: str,
        parser_name: str,
        parser_version: str,
        page_count: Optional[int],
        status: str,
        warnings: List[str],
    ) -> bool:
        pass

    @abstractmethod
    def update_candidate_status(
        self,
        candidate_id: UUID,
        processing_status: str,
        classification: Optional[str] = None,
    ) -> bool:
        pass

    @abstractmethod
    def get_document_by_hash(self, file_hash: str) -> Optional[ResumeDocument]:
        pass

    @abstractmethod
    def get_document_by_candidate_id(self, candidate_id: UUID) -> Optional[ResumeDocument]:
        pass

    @abstractmethod
    def create_processing_job(self, job: ProcessingJob) -> ProcessingJob:
        pass

    @abstractmethod
    def get_latest_job_for_candidate(self, candidate_id: UUID) -> Optional[ProcessingJob]:
        pass

    @abstractmethod
    def update_processing_job(self, job: ProcessingJob) -> ProcessingJob:
        pass

    @abstractmethod
    def upsert_job_description(self, jd: JobDescription) -> JobDescription:
        pass

    @abstractmethod
    def get_job_description_by_role(self, role_key: str) -> Optional[JobDescription]:
        pass

    @abstractmethod
    def save_candidate_profile(
        self, profile_entity: "CandidateProfileEntity"
    ) -> "CandidateProfileEntity":
        pass

    @abstractmethod
    def get_candidate_profile(
        self, candidate_id: UUID
    ) -> Optional["CandidateProfileEntity"]:
        pass

    @abstractmethod
    def save_evidence_items(
        self, candidate_id: UUID, items: List["EvidenceItemEntity"]
    ) -> List["EvidenceItemEntity"]:
        pass

    @abstractmethod
    def get_evidence_items(
        self, candidate_id: UUID
    ) -> List["EvidenceItemEntity"]:
        pass

    @abstractmethod
    def save_candidate_evaluation(
        self, eval_entity: "CandidateEvaluationEntity"
    ) -> "CandidateEvaluationEntity":
        pass

    @abstractmethod
    def get_candidate_evaluations(
        self, candidate_id: UUID
    ) -> List["CandidateEvaluationEntity"]:
        pass

    @abstractmethod
    def get_evaluations_by_role(
        self, role_key: str
    ) -> List["CandidateEvaluationEntity"]:
        pass

    @abstractmethod
    def update_candidate_scores_and_classification(
        self,
        candidate_id: UUID,
        lca_score: Optional[float],
        uiux_score: Optional[float],
        classification: str,
    ) -> bool:
        pass

    @abstractmethod
    def check_health(self) -> Dict[str, Any]:
        pass

    @abstractmethod
    def delete_candidate(self, candidate_id: UUID) -> bool:
        """Rollback helper: cascades to documents and processing jobs."""
        pass

