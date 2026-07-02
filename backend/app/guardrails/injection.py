import re

INJECTION_PATTERNS = [
    r"ignore previous instructions",
    r"bypass safety",
    r"system prompt",
    r"you are now",
    r"act as",
    r"roleplay",
    r"dan mode",
    r"do anything now",
    r"jailbreak",
    r"reveal your internal",
    r"reveal system instructions",
    r"disregard rules",
    r"override policy"
]

def detect_injection(text: str) -> tuple[bool, float]:
    """
    Returns (is_injection, confidence/score).
    """
    text_lower = text.lower()
    for pattern in INJECTION_PATTERNS:
        if re.search(pattern, text_lower):
            return True, 1.0
    return False, 0.0
