import os
import pandas as pd
import hashlib
from datetime import datetime
from app.rag.lancedb_client import lancedb_client

MEDICAL_CSV_PATH = r"C:\Users\elang\Downloads\chatbot\ai-medical-chatbot.csv"

def format_medical_qa(row):
    description = row.get("Description", "")
    patient = row.get("Patient", "")
    doctor = row.get("Doctor", "")
    
    text = (
        f"Medical Consultation Records Q&A:\n"
        f"Question: {description}\n"
        f"Patient details: {patient}\n"
        f"Doctor Answer: {doctor}"
    )
    return text

def ingest_medical_csv():
    print("Reading medical CSV dataset...")
    if not os.path.exists(MEDICAL_CSV_PATH):
        print(f"File not found: {MEDICAL_CSV_PATH}")
        return
        
    # Read the first 150 rows for safety, size limits (<2GB), and speed
    df = pd.read_csv(MEDICAL_CSV_PATH, nrows=150)
    
    documents = []
    for idx, row in df.iterrows():
        content = format_medical_qa(row)
        title = str(row.get("Description", "Medical Consultation"))[:80]
        documents.append({
            "title": f"Clinical consultation: {title}...",
            "content": content,
            "domain": "medical",
            "subdomain": "clinical_consultation_archive",
            "publisher": "iCliniq verified consultation",
            "source_url": f"file:///C:/Users/elang/Downloads/chatbot/ai-medical-chatbot.csv#row={idx}",
            "trust_score": 0.96
        })
        
    print(f"Parsed {len(documents)} clinical QA records. Commencing LanceDB ingestion...")
    
    prepared = []
    for idx, doc in enumerate(documents):
        content = doc["content"]
        content_hash = hashlib.sha256(content.encode("utf-8")).hexdigest()
        prepared.append({
            "document_id": f"med_csv_{idx}",
            "chunk_id": f"med_csv_{idx}_c0",
            "title": doc["title"],
            "content": content,
            "domain": doc["domain"],
            "subdomain": doc["subdomain"],
            "jurisdiction": "Global/Clinical",
            "publisher": doc["publisher"],
            "source_url": doc["source_url"],
            "trust_score": doc["trust_score"],
            "content_hash": content_hash,
            "ingestion_timestamp": datetime.now().isoformat()
        })
        
    lancedb_client.ingest_documents("medical_knowledge_base", prepared)
    lancedb_client.ingest_documents("medical_faq_verified", prepared)
    print("Ingestion of Medical CSV completed successfully!")

if __name__ == "__main__":
    ingest_medical_csv()
