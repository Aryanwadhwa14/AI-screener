from app.core.config import settings
from app.services.llm.base import LLMProvider
from app.services.llm.mock_provider import MockLLMProvider


def get_llm_provider() -> LLMProvider:
    if settings.llm_provider == "gemini" and settings.gemini_api_key:
        from app.services.llm.gemini_provider import GeminiProvider

        return GeminiProvider(api_key=settings.gemini_api_key)

    # Deterministic mock provider for tests and environments without live API keys
    return MockLLMProvider()

