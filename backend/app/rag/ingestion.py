import httpx
import hashlib
from datetime import datetime
from app.rag.lancedb_client import lancedb_client

# Define online URLs for public health and legal data
MEDICAL_DATA_URL = "https://raw.githubusercontent.com/singhsidharth/Medical-Chatbot-Resources/main/sample_health_faqs.json"
LEGAL_DATA_URL = "https://raw.githubusercontent.com/singhsidharth/Medical-Chatbot-Resources/main/sample_legal_faqs.json"

# High-quality fallback data in case URLs are inaccessible
FALLBACK_MEDICAL = [
    {
        "title": "Diabetes Overview & Management",
        "content": "Diabetes is a chronic condition that affects how your body turns food into energy. Type 2 diabetes is the most common form, where the body does not use insulin properly. Management involves healthy eating, physical activity, and sometimes medication. Educating patients on glucose monitoring and lifestyle adjustments is critical for long-term health.",
        "domain": "medical",
        "subdomain": "endocrinology",
        "publisher": "World Health Organization",
        "source_url": "https://www.who.int/news-room/fact-sheets/detail/diabetes",
        "trust_score": 0.95
    },
    {
        "title": "Hypertension Guidelines",
        "content": "Hypertension (high blood pressure) is diagnosed when systolic blood pressure is >= 130 mmHg or diastolic blood pressure is >= 80 mmHg. Lifestyle modifications including weight loss, dietary sodium reduction, potassium supplementation, physical activity, and moderation of alcohol intake are recommended first-line therapies.",
        "domain": "medical",
        "subdomain": "cardiology",
        "publisher": "American Heart Association",
        "source_url": "https://www.heart.org/en/health-topics/high-blood-pressure",
        "trust_score": 0.98
    },
    {
        "title": "Influenza Prevention and Vaccination",
        "content": "Influenza is an acute respiratory infection caused by influenza viruses. The most effective way to prevent the disease is vaccination. Safe and effective vaccines are available and recommended annually, especially for high-risk groups such as healthcare workers, elderly, and individuals with chronic conditions.",
        "domain": "medical",
        "subdomain": "infectious_diseases",
        "publisher": "CDC",
        "source_url": "https://www.cdc.gov/flu/prevent/vaccinations.htm",
        "trust_score": 0.99
    }
]

FALLBACK_LEGAL = [
    {
        "title": "United States Contract Law Basics",
        "content": "A contract is a legally binding agreement between two or more parties. The essential elements of a contract are offer, acceptance, consideration, mutual assent, and capacity. Contracts can be written or oral, but certain contracts must be in writing under the Statute of Frauds, such as agreements involving real estate or contracts that cannot be performed within one year.",
        "domain": "legal",
        "subdomain": "contract_law",
        "jurisdiction": "United States",
        "publisher": "Legal Information Institute",
        "source_url": "https://www.law.cornell.edu/wex/contract",
        "trust_score": 0.92
    },
    {
        "title": "Intellectual Property: Patents and Trademarks",
        "content": "A patent is a property right granted by the government to an inventor to exclude others from making, using, or selling the invention. A trademark is a word, phrase, symbol, or design that identifies and distinguishes the source of the goods of one party from those of others. Patents protect inventions, whereas trademarks protect brand identifiers.",
        "domain": "legal",
        "subdomain": "intellectual_property",
        "jurisdiction": "United States",
        "publisher": "USPTO",
        "source_url": "https://www.uspto.gov",
        "trust_score": 0.97
    },
    {
        "title": "Landlord-Tenant Rights and Responsibilities",
        "content": "Landlord-tenant law governs the rental of commercial and residential property. Key legal aspects include the implied warranty of habitability, security deposit limits, eviction procedures, and lease term terminations. Landlords are legally required to keep the premises fit for human habitation, while tenants must pay rent and maintain cleanliness.",
        "domain": "legal",
        "subdomain": "property_law",
        "jurisdiction": "United States",
        "publisher": "US Government Portal",
        "source_url": "https://www.usa.gov/landlord-tenant",
        "trust_score": 0.90
    }
]

def load_data(url: str, fallback_data: list[dict]) -> list[dict]:
    try:
        response = httpx.get(url, timeout=5.0)
        if response.status_code == 200:
            print(f"Successfully downloaded dataset from {url}")
            return response.json()
    except Exception as e:
        print(f"Could not load online dataset from {url} ({e}). Using local fallback data.")
    return fallback_data

def ingest_all():
    print("Starting data ingestion into LanceDB...")
    
    # 1. Ingest Medical Data
    medical_docs = load_data(MEDICAL_DATA_URL, FALLBACK_MEDICAL)
    prepared_med = []
    for idx, doc in enumerate(medical_docs):
        content = doc["content"]
        content_hash = hashlib.sha256(content.encode("utf-8")).hexdigest()
        prepared_med.append({
            "document_id": f"med_doc_{idx}",
            "chunk_id": f"med_doc_{idx}_c0",
            "title": doc.get("title", "Medical Article"),
            "content": content,
            "domain": "medical",
            "subdomain": doc.get("subdomain", "general"),
            "publisher": doc.get("publisher", "Verified Medical Source"),
            "source_url": doc.get("source_url", "https://example.com/medical"),
            "trust_score": doc.get("trust_score", 0.9),
            "content_hash": content_hash,
            "ingestion_timestamp": datetime.now().isoformat()
        })
    lancedb_client.ingest_documents("medical_knowledge_base", prepared_med)
    lancedb_client.ingest_documents("medical_faq_verified", prepared_med)
    
    # 2. Ingest Legal Data
    legal_docs = load_data(LEGAL_DATA_URL, FALLBACK_LEGAL)
    prepared_leg = []
    for idx, doc in enumerate(legal_docs):
        content = doc["content"]
        content_hash = hashlib.sha256(content.encode("utf-8")).hexdigest()
        prepared_leg.append({
            "document_id": f"leg_doc_{idx}",
            "chunk_id": f"leg_doc_{idx}_c0",
            "title": doc.get("title", "Legal Information"),
            "content": content,
            "domain": "legal",
            "subdomain": doc.get("subdomain", "general"),
            "jurisdiction": doc.get("jurisdiction", "United States"),
            "publisher": doc.get("publisher", "Verified Legal Source"),
            "source_url": doc.get("source_url", "https://example.com/legal"),
            "trust_score": doc.get("trust_score", 0.9),
            "content_hash": content_hash,
            "ingestion_timestamp": datetime.now().isoformat()
        })
    lancedb_client.ingest_documents("legal_knowledge_base", prepared_leg)
    lancedb_client.ingest_documents("legal_faq_verified", prepared_leg)
    
    print("Ingestion completed successfully!")

if __name__ == "__main__":
    ingest_all()
