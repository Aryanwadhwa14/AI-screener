from abc import ABC, abstractmethod
from typing import Optional


class StorageService(ABC):
    @abstractmethod
    def upload_file(self, storage_path: str, content: bytes, content_type: str) -> str:
        """Uploads file content to storage. Returns the stored relative path."""
        pass

    @abstractmethod
    def get_signed_url(self, storage_path: str, expires_in_seconds: int = 300) -> str:
        """Generates a secure, short-lived signed URL to access the private document."""
        pass

    @abstractmethod
    def delete_file(self, storage_path: str) -> bool:
        """Deletes a file from storage. Useful for transactional rollback."""
        pass

    @abstractmethod
    def file_exists(self, storage_path: str) -> bool:
        """Checks if a file exists at the given storage path."""
        pass

