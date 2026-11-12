from typing import Optional
from app.core.config import settings
from app.services.storage.base import StorageService
from app.services.storage.local import LocalStorageService

_storage_instance: Optional[StorageService] = None


def get_storage_service() -> StorageService:
    global _storage_instance
    if _storage_instance is not None:
        return _storage_instance

    # If Supabase URL and service role key are configured, use SupabaseStorageService
    if (
        settings.supabase_url
        and settings.supabase_service_role_key
        and not settings.supabase_url.startswith("https://your-project")
    ):
        try:
            from app.services.storage.supabase import SupabaseStorageService

            _storage_instance = SupabaseStorageService(
                supabase_url=settings.supabase_url,
                service_role_key=settings.supabase_service_role_key,
                bucket_name=settings.storage_bucket_name,
            )
            return _storage_instance
        except Exception:
            # Fall back safely to local storage if network/auth fails
            _storage_instance = LocalStorageService()
            return _storage_instance

    _storage_instance = LocalStorageService()
    return _storage_instance


def reset_storage_for_testing(storage: Optional[StorageService] = None):
    global _storage_instance
    _storage_instance = storage

