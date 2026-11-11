import io
import os
import pymupdf
import docx
import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.services.database.sqlite import SQLiteRepository
from app.services.database import reset_repository_for_testing
from app.services.storage.local import LocalStorageService
from app.services.extraction.pdf_extractor import extract_text_from_pdf
from app.services.extraction.docx_extractor import extract_text_from_docx
from app.services.normalization.normalizer import normalize_text
from app.services.extraction.pipeline import ExtractionPipelineService

client = TestClient(app)


def create_sample_pdf(text: str, num_pages: int = 1) -> bytes:
    doc = pymupdf.open()
    for i in range(num_pages):
        page = doc.new_page(width=612, height=792)
        page.insert_text((50, 72), f"{text} (Page {i+1})")
    pdf_bytes = doc.tobytes()
    doc.close()
    return pdf_bytes


def create_image_only_pdf() -> bytes:
    doc = pymupdf.open()
    page = doc.new_page(width=612, height=792)
    # Create a small RGB pixmap with alpha=0 (3 channels)
    pix = pymupdf.Pixmap(pymupdf.csRGB, (0, 0, 100, 100), 0)
    pix.set_rect(pix.irect, (255, 0, 0))
    page.insert_image(pymupdf.Rect(50, 50, 200, 200), pixmap=pix)
    # No text inserted
    pdf_bytes = doc.tobytes()
    doc.close()
    return pdf_bytes


def create_encrypted_pdf() -> bytes:
    doc = pymupdf.open()
    page = doc.new_page(width=612, height=792)
    page.insert_text((50, 72), "Confidential Resume")
    pdf_bytes = doc.tobytes(encryption=pymupdf.PDF_ENCRYPT_AES_256, user_pw="secret123")
    doc.close()
    return pdf_bytes


def create_sample_docx(paragraphs: list[str], table_data: list[list[str]] = None) -> bytes:
    doc = docx.Document()
    for p in paragraphs:
        doc.add_paragraph(p)
    if table_data:
        table = doc.add_table(rows=len(table_data), cols=len(table_data[0]))
        for r_idx, row in enumerate(table_data):
            for c_idx, val in enumerate(row):
                table.rows[r_idx].cells[c_idx].text = val
    stream = io.BytesIO()
    doc.save(stream)
    return stream.getvalue()


@pytest.fixture(autouse=True)
def setup_test_env(tmp_path):
    db_path = str(tmp_path / "test_extract.db")
    storage_path = str(tmp_path / "storage_extract")
    repo = SQLiteRepository(db_path=db_path)
    storage = LocalStorageService(base_dir=storage_path)

    reset_repository_for_testing(repo)
    from app.services.database import get_repository
    from app.services.storage import get_storage_service

    app.dependency_overrides[get_repository] = lambda: repo
    app.dependency_overrides[get_storage_service] = lambda: storage
    yield repo, storage
    app.dependency_overrides = {}
    reset_repository_for_testing(None)


# --- 1. Parser & Extraction Tests ---

def test_pdf_extraction_page_preservation():
    pdf_bytes = create_sample_pdf("Life Cycle Assessment Specialist with GaBi experience", num_pages=2)
    res = extract_text_from_pdf(pdf_bytes)

    assert res.status == "COMPLETED"
    assert res.page_count == 2
    assert len(res.pages) == 2
    assert res.pages[0].page_number == 1
    assert "Page 1" in res.pages[0].text
    assert res.pages[1].page_number == 2
    assert "Page 2" in res.pages[1].text
    assert "GaBi" in res.raw_text
    assert res.word_count > 0
    assert res.char_count > 0
    assert not res.is_scanned
    assert not res.is_empty


def test_scanned_image_only_pdf_detection():
    scanned_bytes = create_image_only_pdf()
    res = extract_text_from_pdf(scanned_bytes)

    assert res.is_scanned is True
    assert res.status == "PARTIAL"
    assert any("Scanned or image-only" in w for w in res.warnings)
    assert res.pages[0].has_images is True


def test_encrypted_pdf_handling():
    enc_bytes = create_encrypted_pdf()
    res = extract_text_from_pdf(enc_bytes)

    assert res.status == "FAILED"
    assert any("encrypted" in w.lower() or "password" in w.lower() for w in res.warnings)


def test_corrupt_pdf_handling():
    corrupt_bytes = b"%PDF-1.4\nCorrupt garbage stream that cannot be parsed %%EOF"
    res = extract_text_from_pdf(corrupt_bytes)

    assert res.status == "FAILED"
    assert res.is_empty is True
    assert len(res.warnings) > 0


def test_docx_extraction_with_tables():
    docx_bytes = create_sample_docx(
        paragraphs=["UI/UX Designer", "Proficient in Figma and Human-Centered Design"],
        table_data=[["Company", "Role", "Years"], ["GFI", "Designer", "1"]],
    )
    res = extract_text_from_docx(docx_bytes)

    assert res.status == "COMPLETED"
    assert "UI/UX Designer" in res.raw_text
    assert "Figma" in res.raw_text
    assert "GFI | Designer | 1" in res.raw_text
    assert res.char_count > 50
    assert not res.is_empty
    assert not res.is_low_text


def test_empty_docx_edge_case():
    # Test with the actual 0-word empty docx in data/
    with open("data/anonymized_resume_1793685080327.docx", "rb") as f:
        empty_bytes = f.read()

    res = extract_text_from_docx(empty_bytes)
    assert res.status == "FAILED"
    assert res.is_empty is True
    assert res.char_count == 0
    assert any("empty" in w.lower() for w in res.warnings)


def test_low_text_validation_trigger():
    # 20 characters of text (below the 50 char threshold)
    short_bytes = create_sample_docx(paragraphs=["Short note only."])
    res = extract_text_from_docx(short_bytes)

    assert res.is_low_text is True
    assert any("triggered low-text validation" in w for w in res.warnings)
    assert "Short note only." in res.raw_text


# --- 2. Normalization Tests ---

def test_normalization_non_destructive():
    raw = (
        "•  Led LCA study using GaBi & SimaPro (ISO 14040).\n\n\n\n\n"
        "▪  Designed high-fidelity prototypes in Figma.\n"
        "Contact: candidate@example.com | +91 9876543210\n"
        "Portfolio: https://behance.net/sample\n"
    )
    norm = normalize_text(raw)

    # Asserts meaningful content is preserved
    assert "GaBi & SimaPro (ISO 14040)" in norm
    assert "candidate@example.com" in norm
    assert "+91 9876543210" in norm
    assert "https://behance.net/sample" in norm
    # Asserts excessive blank lines were collapsed
    assert "\n\n\n\n" not in norm
    # Asserts bullets are standardized
    assert "• Led LCA study" in norm
    assert "• Designed high-fidelity" in norm


def test_raw_vs_normalized_distinction():
    raw = "Senior   LCA   Consultant\u00a0•\u00a0\u00a0Chennai"
    norm = normalize_text(raw)

    assert raw != norm
    assert "Senior LCA Consultant • Chennai" == norm


# --- 3. End-to-End Extraction Pipeline API Tests ---

def test_pipeline_single_extraction():
    # Ingest a resume
    docx_bytes = create_sample_docx(
        paragraphs=["LCA Consultant with 3 years experience in SimaPro and ISO 14044."]
    )
    upload_res = client.post(
        "/api/resumes",
        files={"file": ("candidate_lca.docx", io.BytesIO(docx_bytes), "application/vnd.openxmlformats-officedocument.wordprocessingml.document")},
    )
    assert upload_res.status_code == 201
    cand_id = upload_res.json()["candidate_id"]

    # Extract text
    ext_res = client.post(f"/api/resumes/{cand_id}/extract")
    assert ext_res.status_code == 200
    data = ext_res.json()
    assert data["status"] == "COMPLETED"
    assert data["parser_name"] == "python-docx"
    assert data["word_count"] > 5
    assert "SimaPro" in data["normalized_text_snippet"]

    # Verify extracted text endpoint
    text_res = client.get(f"/api/resumes/{cand_id}/extracted-text")
    assert text_res.status_code == 200
    text_data = text_res.json()
    assert "SimaPro and ISO 14044" in text_data["normalized_text"]
    assert text_data["extraction_status"] == "COMPLETED"


def test_batch_extraction_across_all_47_resumes():
    # 1. Ingest all 47 resumes from data/
    import_res = client.post("/api/resumes/batch-import-local?directory=data")
    assert import_res.status_code == 200
    assert import_res.json()["total_imported"] == 47

    # 2. Run batch extraction
    batch_res = client.post("/api/resumes/batch-extract")
    assert batch_res.status_code == 200
    data = batch_res.json()

    assert data["total_candidates"] == 47
    # 46 should succeed completely, 1 is the known empty docx (anonymized_resume_1793685080327.docx)
    assert data["completed"] == 46
    assert data["failed"] == 1
    assert data["partial"] == 0

    # Verify every one of the 47 resumes has an extraction status recorded
    assert len(data["results"]) == 47
    for item in data["results"]:
        assert item["status"] in ["COMPLETED", "PARTIAL", "FAILED"]
