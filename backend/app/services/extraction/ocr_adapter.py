from abc import ABC, abstractmethod
from typing import List, Optional


class OCRAdapter(ABC):
    @abstractmethod
    def is_available(self) -> bool:
        pass

    @abstractmethod
    def extract_text(self, image_bytes: bytes) -> str:
        pass


class DefaultOCRAdapter(OCRAdapter):
    """
    Default adapter when an external OCR binary (e.g. Tesseract) or OCR cloud service
    is not installed in the execution environment.
    Gracefully notifies the pipeline that OCR is required rather than throwing unhandled exceptions.
    """

    def is_available(self) -> bool:
        return False

    def extract_text(self, image_bytes: bytes) -> str:
        raise NotImplementedError(
            "OCR adapter is not configured in this environment. Scanned document marked for manual review."
        )


def get_ocr_adapter() -> OCRAdapter:
    return DefaultOCRAdapter()

