import re

LEGAL_SUBJECTS = [
    r"\blaw\b", r"\bstatute\b", r"\bpenalty\b", r"\bdeadline\b", r"\bcontract\b",
    r"\bemployment\b", r"\bcriminal\b", r"\bfamily law\b", r"\btax\b",
    r"\bimmigration\b", r"\bproperty\b", r"\btenant\b", r"\beviction\b",
    r"\bcourt\b", r"\bsue\b", r"\blawsuit\b"
]

ILLEGAL_LEGAL_KEYWORDS = [
    r"\bevade\b", r"\bhide assets\b", r"\btax evasion\b", r"\bdestroy evidence\b",
    r"\bmanipulate witness\b", r"\bforgery\b", r"\bidentity theft\b", r"\bcheat\b",
    r"\bguarantee win\b", r"\bwill i win\b", r"\battorney-client privilege\b"
]

def needs_jurisdiction(text: str) -> bool:
    # Softened for general education legal assistant; let LLM handle jurisdiction disclaimers.
    return False

def check_legal_safety(text: str) -> tuple[bool, str]:
    text_lower = text.lower()
    for pattern in ILLEGAL_LEGAL_KEYWORDS:
        if re.search(pattern, text_lower):
            return False, "This request involves outcome guarantees, privileged communications, or illegal operations (e.g. tax evasion, fraud, evading enforcement)."
    return True, ""
