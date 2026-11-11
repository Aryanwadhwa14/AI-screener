import hashlib
from typing import Tuple, Optional


PDF_MAGIC = b"%PDF"
DOCX_MAGIC = b"PK\x03\x04"

ALLOWED_EXTENSIONS = {".pdf", ".docx"}
ALLOWED_MIME_TYPES = {
    "application/pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/x-zip-compressed",
    "application/zip",
    "application/octet-stream",  # Often sent by browsers for docx
}


class FileValidationError(Exception):
    def __init__(self, message: str, code: str = "INVALID_FILE"):
        self.message = message
        self.code = code
        super().__init__(self.message)


def compute_sha256(content: bytes) -> str:
    return hashlib.sha256(content).hexdigest()


def detect_file_type_and_signature(content: bytes, filename: str) -> Tuple[str, str]:
    """
    Validates file extension, magic bytes, and returns normalized extension and mime type.
    """
    if not content:
        raise FileValidationError("Uploaded file is empty (0 bytes).", code="EMPTY_FILE")

    ext = "." + filename.rsplit(".", 1)[-1].lower() if "." in filename else ""
    if ext not in ALLOWED_EXTENSIONS:
        raise FileValidationError(
            f"Unsupported file extension '{ext}'. Only .pdf and .docx are supported.",
            code="UNSUPPORTED_EXTENSION",
        )

    # Check magic bytes
    if ext == ".pdf":
        if not content.startswith(PDF_MAGIC):
            raise FileValidationError(
                "File has a .pdf extension but lacks a valid PDF header signature.",
                code="INVALID_SIGNATURE",
            )
        return ".pdf", "application/pdf"
    elif ext == ".docx":
        if not content.startswith(DOCX_MAGIC):
            raise FileValidationError(
                "File has a .docx extension but lacks a valid OpenXML/ZIP header signature.",
                code="INVALID_SIGNATURE",
            )
        return (
            ".docx",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        )

    raise FileValidationError("Invalid document format.", code="INVALID_FILE")


def validate_file(
    content: bytes, filename: str, max_size_bytes: int = 10 * 1024 * 1024
) -> Tuple[str, str, str, int]:
    """
    Comprehensive file validation.
    Returns: (normalized_ext, mime_type, sha256_hash, file_size)
    """
    if len(content) > max_size_bytes:
        raise FileValidationError(
            f"File size exceeds maximum allowed limit of {max_size_bytes // (1024 * 1024)}MB.",
            code="FILE_TOO_LARGE",
        )

    ext, mime_type = detect_file_type_and_signature(content, filename)
    file_hash = compute_sha256(content)
    return ext, mime_type, file_hash, len(content)

