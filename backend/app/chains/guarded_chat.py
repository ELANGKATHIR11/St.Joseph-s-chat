import httpx
import json
from app.core.config import settings
from app.prompts.system_prompts import SYSTEM_PROMPT

def generate_llm_response(query: str, retrieved_chunks: list[dict]) -> dict:
    """
    Sends the query and context to Google Gemini (or falls back to Ollama) and returns validated JSON.
    """
    if not retrieved_chunks:
        return {
            "answer": "",
            "claim_citation_map": [],
            "uncertainties": ["No relevant source documents found."],
            "requires_professional_help": False
        }

    # Construct context string
    context_str = ""
    for idx, chunk in enumerate(retrieved_chunks):
        context_str += f"\n--- CHUNK {idx} (ID: {chunk.get('chunk_id')}) ---\n"
        context_str += f"Title: {chunk.get('title')}\n"
        context_str += f"Publisher: {chunk.get('publisher')}\n"
        context_str += f"Content: {chunk.get('content')}\n"
        
    prompt = f"""
Retrieved Context:
{context_str}

User Question:
{query}

Generate your response in the specified JSON format.
"""

    # If Gemini API Key is provided, use Google Gemini API
    if settings.GEMINI_API_KEY:
        try:
            print("Using Google Gemini API key to generate response...")
            url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={settings.GEMINI_API_KEY}"
            
            payload = {
                "contents": [
                    {
                        "role": "user",
                        "parts": [
                            {"text": f"{SYSTEM_PROMPT}\n\n{prompt}"}
                        ]
                    }
                ],
                "generationConfig": {
                    "responseMimeType": "application/json",
                    "temperature": 0.1
                }
            }
            
            with httpx.Client(timeout=30.0) as client:
                response = client.post(url, json=payload)
                if response.status_code == 200:
                    res_data = response.json()
                    content = res_data["candidates"][0]["content"]["parts"][0]["text"]
                    return json.loads(content)
                else:
                    print(f"Gemini API returned status code {response.status_code}: {response.text}")
        except Exception as e:
            print(f"Gemini API error: {e}")
            
    # Fallback to local Ollama if Gemini API key fails or is not provided
    print("Falling back to local Ollama model...")
    payload = {
        "model": settings.OLLAMA_MODEL,
        "messages": [
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": prompt}
        ],
        "format": "json",
        "stream": False,
        "options": {
            "temperature": 0.0
        }
    }
    
    try:
        url = f"{settings.OLLAMA_BASE_URL}/api/chat"
        with httpx.Client(timeout=90.0) as client:
            response = client.post(url, json=payload)
            if response.status_code == 200:
                res_data = response.json()
                content = res_data.get("message", {}).get("content", "{}")
                return json.loads(content)
    except Exception as e:
        print(f"Ollama communication error: {e}")
        
    return {
        "answer": "Error generating response from LLM server.",
        "claim_citation_map": [],
        "uncertainties": ["LLM connection error"],
        "requires_professional_help": False
    }
