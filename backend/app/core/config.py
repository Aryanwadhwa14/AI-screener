from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import List


class Settings(BaseSettings):
    app_name: str = "GFI AI Resume Screener API"
    environment: str = "development"
    log_level: str = "INFO"
    backend_host: str = "0.0.0.0"
    backend_port: int = 8000
    cors_origins: str = "http://localhost:3000,http://127.0.0.1:3000"

    supabase_url: str = ""
    supabase_service_role_key: str = ""
    storage_bucket_name: str = "resumes"

    llm_provider: str = "gemini"
    gemini_api_key: str = ""
    openai_api_key: str = ""

    model_config = SettingsConfigDict(
        env_file=(".env", "backend/.env", "../.env"),
        env_file_encoding="utf-8",
        extra="ignore",
    )

    @property
    def cors_origins_list(self) -> List[str]:
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]


settings = Settings()

