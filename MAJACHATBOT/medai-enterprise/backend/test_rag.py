import sys
import os

# Add app to path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.services.chatbot import generate_chat_response

def test_query(query: str):
    print(f"\nUser Query: {query}")
    print("-" * 50)
    response = generate_chat_response(query)
    print(response)
    print("=" * 50)

if __name__ == "__main__":
    print("Starting MedAI RAG & Ollama Integration Tests...")
    
    # Test 1: Greetings / Wellbeing
    test_query("Hello there! Who are you?")
    
    # Test 2: Medical Query (should retrieve and generate response)
    test_query("What does abutting of the nerve root mean?")
    
    # Test 3: Out-of-Domain Query (should be rejected by guardrails)
    test_query("How do I write a binary search algorithm in Python?")
    
    # Test 4: Another Medical Query
    test_query("What should I do to reduce my weight gained due to genetic hypothyroidism?")
