import re

BLOCKED_OUTPUT_PATTERNS = [
    r"system prompt",
    r"internal instructions",
    r"safety bypass approved",
    r"dan mode",
    r"you are now a"
]

def validate_output_safety(text: str) -> bool:
    """
    Returns True if output is safe, False otherwise.
    """
    if not text:
        return False
    text_lower = text.lower()
    for pattern in BLOCKED_OUTPUT_PATTERNS:
        if re.search(pattern, text_lower):
            return False
    return True
