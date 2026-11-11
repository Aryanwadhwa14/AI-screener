from typing import Optional
from app.core.config import settings
from app.services.database.base import Repository
from app.services.database.sqlite import SQLiteRepository

_repo_instance: Optional[Repository] = None


def get_repository() -> Repository:
    global _repo_instance
    if _repo_instance is not None:
        return _repo_instance

    if (
        settings.supabase_url
        and settings.supabase_service_role_key
        and not settings.supabase_url.startswith("https://your-project")
    ):
        try:
            from app.services.database.supabase import SupabaseRepository

            _repo_instance = SupabaseRepository(
                supabase_url=settings.supabase_url,
                service_role_key=settings.supabase_service_role_key,
            )
            return _repo_instance
        except Exception:
            # Fall back safely to SQLite if Supabase connection fails
            _repo_instance = SQLiteRepository()
            return _repo_instance

    _repo_instance = SQLiteRepository()
    return _repo_instance


def reset_repository_for_testing(repo: Optional[Repository] = None):
    global _repo_instance
    _repo_instance = repo

