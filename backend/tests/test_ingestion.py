import io
import os
import pytest
from unittest.mock import MagicMock
from fastapi.testclient import TestClient
from app.main import app
from app.services.database.sqlite import SQLiteRepository
from app.services.database import reset_repository_for_testing
from app.services.storage.local import LocalStorageService
from app.services.ingestion.validator import validate_file, FileValidationError
from app.services.ingestion.ingest import IngestionService, DuplicateResumeError

client = TestClient(app)

# Minimal valid PDF fixture
MINIMAL_VALID_PDF = (
    b"%PDF-1.4\n"
    b"1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj\n"
    b"2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj\n"
    b"3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] >> endobj\n"
    b"xref\n0 4\n0000000000 65535 f \n0000000010 00000 n \n0000000060 00000 n \n0000000117 00000 n \n"
    b"trailer << /Size 4 /Root 1 0 R >>\nstartxref\n193\n%%EOF\n"
)

# Minimal valid DOCX fixture (valid PK zip header)
MINIMAL_VALID_DOCX = b"PK\x03\x04\x14\x00\x00\x00\x08\x00" + b"\x00" * 40


@pytest.fixture(autouse=True)
def setup_test_env(tmp_path):
    """Isolate repository and storage for each test."""
    db_path = str(tmp_path / "test.db")
    storage_path = str(tmp_path / "storage")
    repo = SQLiteRepository(db_path=db_path)
    storage = LocalStorageService(base_dir=storage_path)

    reset_repository_for_testing(repo)
    app.dependency_overrides = {}
    from app.services.database import get_repository
    from app.services.storage import get_storage_service

    app.dependency_overrides[get_repository] = lambda: repo
    app.dependency_overrides[get_storage_service] = lambda: storage
    yield repo, storage
    app.dependency_overrides = {}
    reset_repository_for_testing(None)


def test_health_check_with_db():
    res = client.get("/api/health")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "healthy"
    assert data["details"]["database"]["status"] == "connected"


def test_valid_pdf_upload():
    response = client.post(
        "/api/resumes",
        files={"file": ("test_resume.pdf", io.BytesIO(MINIMAL_VALID_PDF), "application/pdf")},
    )
    assert response.status_code == 201
    data = response.json()
    assert "candidate_id" in data
    assert data["candidate_code"].startswith("CAND-")
    assert data["original_filename"] == "test_resume.pdf"
    assert data["processing_status"] == "PENDING"
    assert "job_id" in data


def test_valid_docx_upload():
    response = client.post(
        "/api/resumes",
        files={
            "file": (
                "test_resume.docx",
                io.BytesIO(MINIMAL_VALID_DOCX),
                "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            )
        },
    )
    assert response.status_code == 201
    data = response.json()
    assert data["candidate_code"].startswith("CAND-")
    assert data["original_filename"] == "test_resume.docx"


def test_invalid_file_extension():
    response = client.post(
        "/api/resumes",
        files={"file": ("resume.exe", io.BytesIO(b"MZ\x90\x00"), "application/octet-stream")},
    )
    assert response.status_code == 400
    detail = response.json()["detail"]
    assert detail["error_code"] == "UNSUPPORTED_EXTENSION"


def test_invalid_file_signature_pdf():
    # File named .pdf but containing plain text
    response = client.post(
        "/api/resumes",
        files={"file": ("fake.pdf", io.BytesIO(b"This is plain text, not a PDF!"), "application/pdf")},
    )
    assert response.status_code == 400
    detail = response.json()["detail"]
    assert detail["error_code"] == "INVALID_SIGNATURE"


def test_invalid_file_signature_docx():
    # File named .docx but missing PK\x03\x04
    response = client.post(
        "/api/resumes",
        files={
            "file": (
                "fake.docx",
                io.BytesIO(b"Not a zip file!"),
                "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            )
        },
    )
    assert response.status_code == 400
    detail = response.json()["detail"]
    assert detail["error_code"] == "INVALID_SIGNATURE"


def test_empty_document():
    response = client.post(
        "/api/resumes",
        files={"file": ("empty.pdf", io.BytesIO(b""), "application/pdf")},
    )
    assert response.status_code == 400
    detail = response.json()["detail"]
    assert detail["error_code"] == "EMPTY_FILE"


def test_duplicate_sha256_detection():
    # Upload first time
    res1 = client.post(
        "/api/resumes",
        files={"file": ("candidate_1.pdf", io.BytesIO(MINIMAL_VALID_PDF), "application/pdf")},
    )
    assert res1.status_code == 201
    code1 = res1.json()["candidate_code"]

    # Upload exact same file second time
    res2 = client.post(
        "/api/resumes",
        files={"file": ("candidate_duplicate.pdf", io.BytesIO(MINIMAL_VALID_PDF), "application/pdf")},
    )
    assert res2.status_code == 409
    detail = res2.json()["detail"]
    assert detail["error_code"] == "DUPLICATE_RESUME"
    assert detail["existing_candidate_code"] == code1


def test_oversized_document():
    # Pass 1MB limit for testing
    oversized = b"%PDF" + b"X" * (1024 * 1024 + 10)
    with pytest.raises(FileValidationError) as exc:
        validate_file(oversized, "huge.pdf", max_size_bytes=1024 * 1024)
    assert exc.value.code == "FILE_TOO_LARGE"


def test_storage_failure_rollback(setup_test_env):
    repo, storage = setup_test_env
    # Mock storage to fail on upload
    mock_storage = MagicMock()
    mock_storage.upload_file.side_effect = RuntimeError("Storage cluster unreachable")

    service = IngestionService(repository=repo, storage_service=mock_storage)

    with pytest.raises(RuntimeError):
        service.ingest_resume(MINIMAL_VALID_PDF, "fail.pdf")

    # Assert no candidate or document was created in the database
    assert repo.get_candidate_count() == 0


def test_database_failure_rollback(setup_test_env):
    repo, storage = setup_test_env
    # Mock repo to fail on candidate creation
    mock_repo = MagicMock()
    mock_repo.get_document_by_hash.return_value = None
    mock_repo.get_candidate_count.return_value = 0
    mock_repo.get_candidate_by_code.return_value = None
    mock_repo.create_candidate.side_effect = RuntimeError("DB connection dropped")

    service = IngestionService(repository=mock_repo, storage_service=storage)

    with pytest.raises(RuntimeError):
        service.ingest_resume(MINIMAL_VALID_PDF, "fail_db.pdf")

    # Assert storage cleanup was called (no orphaned files left)
    storage_files = [f for f in os.listdir(storage.base_dir) if os.path.isfile(os.path.join(storage.base_dir, f))]
    assert len(storage_files) == 0


def test_secure_document_access():
    res = client.post(
        "/api/resumes",
        files={"file": ("access_test.pdf", io.BytesIO(MINIMAL_VALID_PDF), "application/pdf")},
    )
    assert res.status_code == 201
    candidate_id = res.json()["candidate_id"]

    # Request signed URL
    access_res = client.get(f"/api/resumes/{candidate_id}/document-url?expires_in_seconds=60")
    assert access_res.status_code == 200
    data = access_res.json()
    assert data["candidate_id"] == candidate_id
    assert "access_url" in data
    assert data["expires_in_seconds"] == 60

    # Test downloading file using access url
    preview_res = client.get(data["access_url"])
    assert preview_res.status_code == 200
    assert preview_res.content == MINIMAL_VALID_PDF


def test_batch_import_dataset():
    # Test batch import against the actual 47 resumes in data/
    res = client.post("/api/resumes/batch-import-local?directory=data")
    assert res.status_code == 200
    data = res.json()
    assert data["total_processed"] == 47
    assert data["total_imported"] == 47
    assert data["total_duplicates_skipped"] == 0
    assert len(data["errors"]) == 0
    assert len(data["candidates"]) == 47

    # Test idempotency: re-running batch import should detect all 47 as duplicates
    res2 = client.post("/api/resumes/batch-import-local?directory=data")
    assert res2.status_code == 200
    data2 = res2.json()
    assert data2["total_processed"] == 47
    assert data2["total_imported"] == 0
    assert data2["total_duplicates_skipped"] == 47

