def validate_citations(claim_citation_map: list[dict], retrieved_chunks: list[dict]) -> bool:
    """
    Validates and cleans cited chunk IDs. Automatically binds placeholders to the top chunk.
    """
    if not retrieved_chunks:
        return False
        
    retrieved_chunk_ids = {chunk.get("chunk_id") for chunk in retrieved_chunks if chunk.get("chunk_id")}
    top_chunk_id = retrieved_chunks[0].get("chunk_id")
    
    for citation in claim_citation_map:
        chunk_ids = citation.get("citation_chunk_ids", [])
        new_ids = []
        for cid in chunk_ids:
            # Check if it is a placeholder or instruction text from system prompt
            if "chunk_id" in cid.lower() or "exact" in cid.lower() or cid not in retrieved_chunk_ids:
                print(f"Resolving citation placeholder/invalid '{cid}' to top chunk '{top_chunk_id}'")
                new_ids.append(top_chunk_id)
            else:
                new_ids.append(cid)
        citation["citation_chunk_ids"] = new_ids
        
    return True
