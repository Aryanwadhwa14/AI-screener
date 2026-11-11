from typing import Optional
from supabase import create_client, Client
from app.services.storage.base import StorageService


class SupabaseStorageService(StorageService):
    """
    Supabase Storage provider for production deployment.
    Interacts with the private 'resumes' bucket using the service-role client.
    """

    def __init__(self, supabase_url: str, service_role_key: str, bucket_name: str = "resumes"):
        self.supabase_url = supabase_url
        self.bucket_name = bucket_name
        self.client: Client = create_client(supabase_url, service_role_key)

    def upload_file(self, storage_path: str, content: bytes, content_type: str) -> str:
        # Sanitize path
        clean_path = storage_path.replace("..", "").lstrip("/\\")
        # Upsert file into private bucket
        res = self.client.storage.from_(self.bucket_name).upload(
            path=clean_path,
            file=content,
            file_options={"content-type": content_type, "upsert": "true"},
        )
        return clean_path

    def get_signed_url(self, storage_path: str, expires_in_seconds: int = 300) -> str:
        clean_path = storage_path.replace("..", "").lstrip("/\\")
        res = self.client.storage.from_(self.bucket_name).create_signed_url(
            clean_path, expires_in_seconds
        )
        if isinstance(res, dict) and "signedURL" in res:
            return res["signedURL"]
        elif hasattr(res, "signed_url"):
            return res.signed_url
        elif isinstance(res, str):
            return res
        return str(res)

    def delete_file(self, storage_path: str) -> bool:
        clean_path = storage_path.replace("..", "").lstrip("/\\")
        try:
            self.client.storage.from_(self.bucket_name).remove([clean_path])
            return True
        except Exception:
            return False

    def file_exists(self, storage_path: str) -> bool:
        clean_path = storage_path.replace("..", "").lstrip("/\\")
        try:
            folder, fname = clean_path.rsplit("/", 1) if "/" in clean_path else ("", clean_path)
            files = self.client.storage.from_(self.bucket_name).list(folder)
            return any(f.get("name") == fname for f in files)
        except Exception:
            return False

