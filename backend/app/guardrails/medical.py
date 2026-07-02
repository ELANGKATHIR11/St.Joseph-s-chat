import re

EMERGENCY_KEYWORDS = [
    r"\bchest pain\b", r"\bheart attack\b", r"\bstroke\b", r"\bseizure\b",
    r"\bsuicide\b", r"\bself-harm\b", r"\boverdose\b", r"\bpoisoning\b",
    r"\bbreathing difficulty\b", r"\bcannot breathe\b", r"\bsevere bleeding\b",
    r"\bheavy bleeding\b", r"\banaphylaxis\b", r"\ballergic shock\b",
    r"\bkill myself\b", r"\bend my life\b"
]

DIAGNOSTIC_KEYWORDS = [
    r"\bdiagnose\b", r"\bwhat disease do i have\b", r"\bwhat is my diagnosis\b",
    r"\bdosage\b", r"\bhow many mg\b", r"\bhow much should i take\b",
    r"\bchange my medication\b", r"\bstop taking\b", r"\bprescribe\b",
    r"\bprescription\b", r"\bmg\b", r"\bmilligrams\b", r"\bdose\b"
]

# Personal crisis markers indicating the user is experiencing the emergency themselves right now
CRISIS_MARKERS = [
    r"\bi am\b", r"\bi have\b", r"\bmy chest\b", r"\bhelp me\b", r"\bwhat should i do\b", 
    r"\bexperiencing\b", r"\bfeeling\b", r"\bactive\b", r"\brunning\b", r"\bnow\b"
]

def check_medical_emergency(text: str) -> bool:
    text_lower = text.lower()
    
    # First verify if any emergency keyword is present
    has_emergency_keyword = False
    for pattern in EMERGENCY_KEYWORDS:
        if re.search(pattern, text_lower):
            has_emergency_keyword = True
            break
            
    if not has_emergency_keyword:
        return False
        
    # Check if the query is educational (like 'tell me about', 'what is', 'define')
    educational_patterns = [
        r"\btell me about\b", r"\bwhat is\b", r"\bwhat are\b", r"\bdefine\b", 
        r"\bexplain\b", r"\binformation\b", r"\bhistory of\b", r"\bstatistics\b"
    ]
    for pattern in educational_patterns:
        if re.search(pattern, text_lower):
            # If it's phrased educationally, it's safe to provide information
            return False
            
    # If it contains crisis markers, or is very short/ambiguous, default to safety block
    for pattern in CRISIS_MARKERS:
        if re.search(pattern, text_lower):
            return True
            
    # For ambiguous short queries like "heart attack" or "chest pain" without context, 
    # we return False to let RAG/LLM handle it with standard medical disclaimer.
    return False

def check_medical_safety(text: str) -> tuple[bool, str]:
    text_lower = text.lower()
    for pattern in DIAGNOSTIC_KEYWORDS:
        if re.search(pattern, text_lower):
            return False, "This request seeks specific medical diagnosis, dosage prescription, or medication changes which are restricted."
    return True, ""
