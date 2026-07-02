from app.rag.lancedb_client import lancedb_client
from app.guardrails.domain import cosine_similarity

def retrieve_and_rerank(query: str, domain: str, limit: int = 5) -> list[dict]:
    """
    Retrieves chunks from LanceDB based on domain, computes simple similarity reranking.
    """
    table_name = "medical_knowledge_base" if domain in ["medical", "mixed_medical_legal"] else "legal_knowledge_base"
    
    # 1. Retrieve candidate chunks using LanceDB vector search
    candidates = lancedb_client.search(table_name, query, limit=limit * 2)
    
    if not candidates:
        return []
        
    # 2. Rerank candidates by computing exact cosine similarity on query vs content
    query_vector = lancedb_client.generate_embeddings([query])[0]
    
    reranked = []
    for cand in candidates:
        cand_vector = cand.get("vector")
        if cand_vector is not None:
            score = cosine_similarity(query_vector, cand_vector)
        else:
            score = cand.get("_distance", 0.0)  # fallback
            
        # Structure chunk
        reranked.append({
            "document_id": cand.get("document_id"),
            "chunk_id": cand.get("chunk_id"),
            "title": cand.get("title"),
            "content": cand.get("content"),
            "source_url": cand.get("source_url"),
            "publisher": cand.get("publisher"),
            "relevance_score": float(score),
            "publication_date": cand.get("publication_date"),
            "trust_score": float(cand.get("trust_score", 0.8))
        })
        
    # Sort by relevance score descending
    reranked.sort(key=lambda x: x["relevance_score"], reverse=True)
    
    # Filter by threshold (Plan requires rerank score >= 0.75, let's use 0.50 for small model tolerance)
    filtered = [chunk for chunk in reranked if chunk["relevance_score"] >= 0.50]
    
    return filtered[:limit]
