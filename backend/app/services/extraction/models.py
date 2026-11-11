from typing import List, Optional
from pydantic import BaseModel, Field


class PageExtraction(BaseModel):
    page_number: int
    text: str
    char_count: int
    word_count: int
    has_images: bool = False
    image_count: int = 0


class ExtractionResult(BaseModel):
    raw_text: str
    pages: List[PageExtraction] = Field(default_factory=list)
    char_count: int
    word_count: int
    page_count: int
    parser_name: str
    parser_version: str
    is_scanned: bool = False
    is_empty: bool = False
    is_low_text: bool = False
    warnings: List[str] = Field(default_factory=list)
    status: str = "COMPLETED"  # 'COMPLETED', 'PARTIAL', 'FAILED'

