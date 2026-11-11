import pymupdf
from typing import List
from app.services.extraction.models import ExtractionResult, PageExtraction


class PDFExtractionError(Exception):
    def __init__(self, message: str, code: str = "PDF_EXTRACTION_ERROR"):
        self.message = message
        self.code = code
        super().__init__(self.message)


def extract_text_from_pdf(content: bytes) -> ExtractionResult:
    """
    Extracts text from a digital PDF byte string using PyMuPDF.
    Preserves page-level text, detects scanned/image-only PDFs, checks for encryption,
    and returns a structured ExtractionResult.
    """
    parser_name = "PyMuPDF"
    parser_version = pymupdf.__version__
    warnings: List[str] = []

    try:
        doc = pymupdf.open(stream=content, filetype="pdf")
    except Exception as e:
        return ExtractionResult(
            raw_text="",
            pages=[],
            char_count=0,
            word_count=0,
            page_count=0,
            parser_name=parser_name,
            parser_version=parser_version,
            is_empty=True,
            warnings=[f"Corrupt or unreadable PDF document: {str(e)}"],
            status="FAILED",
        )

    if doc.is_encrypted:
        doc.close()
        return ExtractionResult(
            raw_text="",
            pages=[],
            char_count=0,
            word_count=0,
            page_count=0,
            parser_name=parser_name,
            parser_version=parser_version,
            warnings=["Password-protected or encrypted PDF documents are not supported."],
            status="FAILED",
        )

    page_count = len(doc)
    if page_count == 0:
        doc.close()
        return ExtractionResult(
            raw_text="",
            pages=[],
            char_count=0,
            word_count=0,
            page_count=0,
            parser_name=parser_name,
            parser_version=parser_version,
            is_empty=True,
            warnings=["PDF document contains 0 pages."],
            status="FAILED",
        )

    pages: List[PageExtraction] = []
    total_text_blocks: List[str] = []
    total_images = 0

    for idx, page in enumerate(doc, start=1):
        text = page.get_text("text") or ""
        images = page.get_images()
        image_count = len(images) if images else 0
        total_images += image_count

        clean_page_text = text.strip()
        if clean_page_text:
            total_text_blocks.append(clean_page_text)

        pages.append(
            PageExtraction(
                page_number=idx,
                text=text,
                char_count=len(text),
                word_count=len(text.split()),
                has_images=image_count > 0,
                image_count=image_count,
            )
        )

    doc.close()

    raw_text = "\n\n".join(total_text_blocks)
    total_chars = len(raw_text)
    total_words = len(raw_text.split())

    is_scanned = False
    is_empty = False
    is_low_text = False
    status = "COMPLETED"

    # Scanned PDF Detection Rule:
    # If the document has pages and embedded images, but text is essentially absent (< 50 chars),
    # it is an image-only / scanned document requiring OCR.
    if total_chars < 50 and total_images > 0:
        is_scanned = True
        status = "PARTIAL"
        warnings.append(
            "Scanned or image-only PDF detected (contains images with minimal digital text). Requires OCR."
        )
    elif total_chars == 0:
        is_empty = True
        status = "FAILED"
        warnings.append("PDF contains no readable text or characters.")
    elif total_chars < 50:
        is_low_text = True
        warnings.append("Document triggered low-text validation (< 50 characters).")

    return ExtractionResult(
        raw_text=raw_text,
        pages=pages,
        char_count=total_chars,
        word_count=total_words,
        page_count=page_count,
        parser_name=parser_name,
        parser_version=parser_version,
        is_scanned=is_scanned,
        is_empty=is_empty,
        is_low_text=is_low_text,
        warnings=warnings,
        status=status,
    )

