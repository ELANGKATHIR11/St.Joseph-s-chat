import unicodedata
import re

def sanitize_input(text: str) -> str:
    if not text:
        return ""
    # Normalize unicode
    text = unicodedata.normalize("NFKC", text)
    # Remove control characters and hidden characters
    text = "".join(ch for ch in text if unicodedata.category(ch)[0] != "C" or ch == "\n" or ch == "\r" or ch == "\t")
    # Collapse multiple whitespaces
    text = re.sub(r"\s+", " ", text).strip()
    return text
