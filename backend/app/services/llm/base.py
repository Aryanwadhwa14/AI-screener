from abc import ABC, abstractmethod
from app.schemas.profile import CandidateProfile


class LLMProvider(ABC):
    @property
    @abstractmethod
    def provider_name(self) -> str:
        pass

    @property
    @abstractmethod
    def model_name(self) -> str:
        pass

    @abstractmethod
    def extract_profile(self, normalized_text: str, candidate_code: str) -> CandidateProfile:
        """Extracts a structured CandidateProfile from normalized resume text."""
        pass

