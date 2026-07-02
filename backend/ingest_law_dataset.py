import os
import pandas as pd
import hashlib
from datetime import datetime
from app.rag.lancedb_client import lancedb_client

LAW_DATASET_DIR = r"C:\Users\elang\Downloads\chatbot\Law dataset"

def format_state_elementary(row):
    state = row.get("STATNAME", "Unknown")
    year = row.get("AC_YEAR", "2015-16")
    lit = row.get("OVERALL_LI", "N/A")
    f_lit = row.get("FEMALE_LIT", "N/A")
    m_lit = row.get("MALE_LIT", "N/A")
    dist = row.get("DISTRICTS", "N/A")
    pop = row.get("TOTPOPULAT", "N/A")
    sex_ratio = row.get("SEXRATIO", "N/A")
    
    text = (
        f"Education and Demographic Precedence State Profile: {state} ({year}). "
        f"Overall Literacy Rate: {lit}%. Female Literacy: {f_lit}%, Male Literacy: {m_lit}%. "
        f"Total Districts reported: {dist}. "
        f"Total Population (Census 2011 standard): {pop} thousand. Sex Ratio: {sex_ratio} females per 1000 males. "
        f"Area: {row.get('AREA_SQKM', 'N/A')} Sq KM. Growth Rate: {row.get('GROWTHRATE', 'N/A')}%."
    )
    return text

def format_state_secondary(row):
    state = row.get("STATNAME", "Unknown")
    year = row.get("AC_YEAR", "2015-16")
    lit = row.get("OVERALL_LI", "N/A")
    f_lit = row.get("FEMALE_LIT", "N/A")
    m_lit = row.get("MALE_LIT", "N/A")
    
    text = (
        f"Secondary Education State profile for {state} ({year}). "
        f"Overall Literacy rate: {lit}%. Female: {f_lit}%, Male: {m_lit}%. "
        f"Number of districts: {row.get('DISTRICTS', 'N/A')}. "
        f"Urban population percentage: {row.get('P_URB_POP', 'N/A')}%. "
        f"Percentage SC population: {row.get('P_SC_POP', 'N/A')}%. "
        f"Percentage ST population: {row.get('P_ST_POP', 'N/A')}%."
    )
    return text

def format_district(row):
    district = row.get("DISTNAME", "Unknown")
    state = row.get("STATNAME", "Unknown")
    lit = row.get("OVERALL_LI", "N/A")
    f_lit = row.get("FEMALE_LIT", "N/A")
    m_lit = row.get("MALE_LIT", "N/A")
    pop = row.get("TOTPOPULAT", "N/A")
    
    text = (
        f"District Level Education demographic index. District: {district}, State: {state}. "
        f"Overall Literacy: {lit}%. Female Literacy: {f_lit}%, Male Literacy: {m_lit}%. "
        f"Total population in district: {pop} thousand. "
        f"Sex ratio: {row.get('SEXRATIO', 'N/A')} females per 1000 males."
    )
    return text

def ingest_dataset():
    print("Parsing CSV files from Law dataset directory...")
    documents = []
    
    # 1. Parse Statewise Elementary
    elem_path = os.path.join(LAW_DATASET_DIR, "2015_16_Statewise_Elementary.csv")
    if os.path.exists(elem_path):
        df = pd.read_csv(elem_path)
        for idx, row in df.iterrows():
            content = format_state_elementary(row)
            documents.append({
                "title": f"Elementary Education Index - {row.get('STATNAME')}",
                "content": content,
                "domain": "legal",
                "subdomain": "education_demography_precedence",
                "publisher": "DISE India Statistics",
                "source_url": "file:///C:/Users/elang/Downloads/chatbot/Law dataset/2015_16_Statewise_Elementary.csv",
                "trust_score": 0.95
            })
            
    # 2. Parse Statewise Secondary
    sec_path = os.path.join(LAW_DATASET_DIR, "2015_16_Statewise_Secondary.csv")
    if os.path.exists(sec_path):
        df = pd.read_csv(sec_path)
        for idx, row in df.iterrows():
            content = format_state_secondary(row)
            documents.append({
                "title": f"Secondary Education Index - {row.get('STATNAME')}",
                "content": content,
                "domain": "legal",
                "subdomain": "education_demography_precedence",
                "publisher": "DISE India Statistics",
                "source_url": "file:///C:/Users/elang/Downloads/chatbot/Law dataset/2015_16_Statewise_Secondary.csv",
                "trust_score": 0.95
            })
            
    # 3. Parse Districtwise
    dist_path = os.path.join(LAW_DATASET_DIR, "2015_16_Districtwise.csv")
    if os.path.exists(dist_path):
        df = pd.read_csv(dist_path)
        # Limit to 100 rows to keep embeddings generation fast and responsive
        for idx, row in df.head(100).iterrows():
            content = format_district(row)
            documents.append({
                "title": f"District Education Index - {row.get('DISTNAME')} ({row.get('STATNAME')})",
                "content": content,
                "domain": "legal",
                "subdomain": "education_demography_precedence",
                "publisher": "DISE India Statistics",
                "source_url": "file:///C:/Users/elang/Downloads/chatbot/Law dataset/2015_16_Districtwise.csv",
                "trust_score": 0.95
            })

    print(f"Loaded {len(documents)} chunks from CSV. Commencing ingestion into LanceDB...")
    
    # Format for LanceDB client ingestion
    prepared = []
    for idx, doc in enumerate(documents):
        content = doc["content"]
        content_hash = hashlib.sha256(content.encode("utf-8")).hexdigest()
        prepared.append({
            "document_id": f"law_csv_{idx}",
            "chunk_id": f"law_csv_{idx}_c0",
            "title": doc["title"],
            "content": content,
            "domain": doc["domain"],
            "subdomain": doc["subdomain"],
            "jurisdiction": "India",
            "publisher": doc["publisher"],
            "source_url": doc["source_url"],
            "trust_score": doc["trust_score"],
            "content_hash": content_hash,
            "ingestion_timestamp": datetime.now().isoformat()
        })
        
    lancedb_client.ingest_documents("legal_knowledge_base", prepared)
    lancedb_client.ingest_documents("legal_faq_verified", prepared)
    print("Ingestion of Law dataset CSVs completed successfully!")

if __name__ == "__main__":
    ingest_dataset()
