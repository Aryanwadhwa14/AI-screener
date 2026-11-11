import re
import unicodedata


# Common bullet characters across Word and PDF documents
BULLET_CHARS = ["•", "▪", "●", "‣", "⁃", "◦", "►", "★", "–", "—"]
BULLET_REGEX = re.compile(r"^[\s]*[" + "".join(BULLET_CHARS) + r"][\s]*", re.MULTILINE)

# Zero-width and invisible characters
ZERO_WIDTH_CHARS = ["\u200b", "\u200c", "\u200d", "\ufeff", "\u00ad"]


def normalize_unicode_artifacts(text: str) -> str:
    """Standardizes unicode characters, ligatures, and quotation marks."""
    # Standard NFKC normalization handles ligatures like 'fi', 'fl'
    normalized = unicodedata.normalize("NFKC", text)

    # Remove zero-width noise
    for zw in ZERO_WIDTH_CHARS:
        normalized = normalized.replace(zw, "")

    # Replace non-breaking spaces
    normalized = normalized.replace("\u00a0", " ")

    # Standardize quotation marks
    normalized = normalized.replace("“", '"').replace("”", '"')
    normalized = normalized.replace("‘", "'").replace("’", "'")

    return normalized


def standardize_bullets_and_lists(text: str) -> str:
    """Standardizes various bullet styles into a uniform '• ' indicator."""
    return BULLET_REGEX.sub("• ", text)


def normalize_whitespace_conservatively(text: str) -> str:
    """
    Cleans up whitespace without mangling paragraphs or section boundaries.
    - Strips trailing whitespace per line.
    - Collapses horizontal spaces within lines.
    - Collapses 3+ consecutive newlines down to 2 (one blank line).
    """
    lines = text.splitlines()
    cleaned_lines = []

    for line in lines:
        # Collapse multiple horizontal spaces/tabs to a single space
        cleaned_line = re.sub(r"[ \t]+", " ", line).strip()
        cleaned_lines.append(cleaned_line)

    result = "\n".join(cleaned_lines)
    # Collapse 3 or more consecutive newlines into 2
    result = re.sub(r"\n{3,}", "\n\n", result)
    return result.strip()


def normalize_text(raw_text: str) -> str:
    """
    Executes conservative, non-destructive normalization.
    Preserves all keywords, dates, URLs, and numbers while removing parsing noise.
    """
    if not raw_text:
        return ""

    step1 = normalize_unicode_artifacts(raw_text)
    step2 = standardize_bullets_and_lists(step1)
    step3 = normalize_whitespace_conservatively(step2)

    return step3

