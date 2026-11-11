import os
import secrets
import time
from typing import Dict
from app.services.storage.base import StorageService


class LocalStorageService(StorageService):
    """
    Local file storage provider for standalone development and offline testing.
    Stores files in a designated local directory and provides time-limited mock access tokens.
    """

    def __init__(self, base_dir: str = "data/storage/resumes"):
        self.base_dir = base_dir
        os.makedirs(self.base_dir, exist_ok=True)
        self._tokens: Dict[str, Dict] = {}

    def _full_path(self, storage_path: str) -> str:
        # Prevent directory traversal
        sanitized = storage_path.replace("..", "").lstrip("/\\")
        return os.path.join(self.base_dir, sanitized)

    def upload_file(self, storage_path: str, content: bytes, content_type: str) -> str:
        full_path = self._full_path(storage_path)
        os.makedirs(os.path.dirname(full_path), exist_ok=True)
        with open(full_path, "wb") as f:
            f.write(content)
        return storage_path

    def get_signed_url(self, storage_path: str, expires_in_seconds: int = 300) -> str:
        token = secrets.token_urlsafe(24)
        expires_at = time.time() + expires_in_seconds
        self._tokens[token] = {
            "storage_path": storage_path,
            "expires_at": expires_at,
        }
        return f"/api/documents/preview/{token}"

    def delete_file(self, storage_path: str) -> bool:
        full_path = self._full_path(storage_path)
        if os.path.exists(full_path):
            try:
                os.remove(full_path)
                return True
            except OSError:
                return False
        return False

    def file_exists(self, storage_path: str) -> bool:
        full_path = self._full_path(storage_path)
        return os.path.isfile(full_path)

    def verify_token(self, token: str) -> str:
        entry = self._tokens.get(token)
        if not entry:
            raise ValueError("Invalid or expired document access token.")
        if time.time() > entry["expires_at"]:
            del self._tokens[token]
            raise ValueError("Document access token has expired.")
        return entry["storage_path"]

