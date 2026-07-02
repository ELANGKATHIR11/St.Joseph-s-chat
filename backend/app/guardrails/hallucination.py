from rapidfuzz import fuzz

def detect_hallucinations(answer: str, retrieved_chunks: list[dict]) -> bool:
    """
    Returns True if hallucination is detected (i.e. answer lacks sufficient overlap with retrieved context).
    """
    if not answer:
        return True
        
    # If the answer is a standard safety refusal or lack of info message, it is not a hallucination.
    refusal_keywords = [
        "don't have", "do not have", "cannot answer", "no information", 
        "error generating", "consult a", "please provide", "insufficient evidence"
    ]
    if any(k in answer.lower() for k in refusal_keywords):
        return False
        
    if not retrieved_chunks:
        return True
        
    combined_context = " ".join([chunk.get("content", "") for chunk in retrieved_chunks]).lower()
    
    # We split the answer into sentences and verify each sentence has some grounding in the context.
    sentences = [s.strip() for s in answer.split(".") if len(s.strip()) > 10]
    
    if not sentences:
        return False
        
    unsupported_count = 0
    for sentence in sentences:
        score = fuzz.partial_ratio(sentence.lower(), combined_context)
        if score < 45: # Relaxed threshold for tiny model variations
            unsupported_count += 1
            
    if unsupported_count / len(sentences) > 0.3:
        return True
        
    return False
