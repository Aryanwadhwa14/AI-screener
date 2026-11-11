from abc import ABC, abstractmethod
from app.schemas.profile import CandidateProfile
from app.schemas.evaluation import RoleEvaluation


class RoleScorer(ABC):
    """Abstract base class for deterministic, versioned role scoring engines."""

    @property
    @abstractmethod
    def role_key(self) -> str:
        """'LCA' or 'UI_UX'"""
        pass

    @property
    @abstractmethod
    def version(self) -> str:
        """Scoring algorithm version."""
        pass

    @abstractmethod
    def evaluate(
        self, profile: CandidateProfile, is_extraction_failed: bool = False
    ) -> RoleEvaluation:
        """
        Calculates deterministic criterion scores, total score (0-100 or None),
        qualification status, and explainability breakdown.
        """
        pass

