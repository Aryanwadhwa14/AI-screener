import io
import docx
from typing import List
from app.services.extraction.models import ExtractionResult, PageExtraction


def extract_text_from_docx(content: bytes) -> ExtractionResult:
    """
    Extracts text from a Microsoft Word OpenXML (.docx) byte string using python-docx.
    Traverses paragraphs and tables, preserves structure, evaluates low-text triggers,
    and returns a structured ExtractionResult.
    """
    parser_name = "python-docx"
    parser_version = docx.__version__
    warnings: List[str] = []

    try:
        doc = docx.Document(io.BytesIO(content))
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
            warnings=[f"Corrupt or malformed DOCX archive: {str(e)}"],
            status="FAILED",
        )

    text_sections: List[str] = []

    # 1. Paragraph extraction
    for p in doc.paragraphs:
        txt = p.text.strip()
        if txt:
            text_sections.append(txt)

    # 2. Table extraction
    table_count = len(doc.tables)
    for table in doc.tables:
        for row in table.rows:
            row_cells = [cell.text.strip() for cell in row.cells if cell.text.strip()]
            # Deduplicate adjacent identical cells resulting from merged cells
            deduped_cells = []
            for c in row_cells:
                if not deduped_cells or deduped_cells[-1] != c:
                    deduped_cells.append(c)
            if deduped_cells:
                text_sections.append(" | ".join(deduped_cells))

    raw_text = "\n\n".join(text_sections)
    total_chars = len(raw_text)
    total_words = len(raw_text.split())

    is_empty = False
    is_low_text = False
    status = "COMPLETED"

    # Evaluation against 50-character validation trigger
    if total_chars == 0:
        is_empty = True
        status = "FAILED"
        warnings.append("Document is empty or contains no readable text.")
    elif total_chars < 50:
        is_low_text = True
        warnings.append(
            f"Document triggered low-text validation ({total_chars} characters found, threshold is 50)."
        )

    # DOCX does not natively expose paginated pages in the XML stream; represent as single composite document
    pages = [
        PageExtraction(
            page_number=1,
            text=raw_text,
            char_count=total_chars,
            word_count=total_words,
            has_images=False,
            image_count=0,
        )
    ]

    return ExtractionResult(
        raw_text=raw_text,
        pages=pages,
        char_count=total_chars,
        word_count=total_words,
        page_count=1 if total_chars > 0 else 0,
        parser_name=parser_name,
        parser_version=parser_version,
        is_scanned=False,
        is_empty=is_empty,
        is_low_text=is_low_text,
        warnings=warnings,
        status=status,
    )

