import os
import lancedb
import pyarrow as pa
import pandas as pd
import numpy as np
from datetime import datetime
from sentence_transformers import SentenceTransformer
from app.core.config import settings

class LanceDBClient:
    def __init__(self):
        os.makedirs(settings.LANCEDB_URI, exist_ok=True)
        self.db = lancedb.connect(settings.LANCEDB_URI)
        
        # Load a small model to comply with the 2GB limit
        # BAAI/bge-small-en-v1.5 is ~134MB and very high quality
        self.embed_model = SentenceTransformer("BAAI/bge-small-en-v1.5")
        
        # Define Schema
        self.schema = pa.schema([
            pa.field("document_id", pa.string()),
            pa.field("chunk_id", pa.string()),
            pa.field("title", pa.string()),
            pa.field("source_url", pa.string()),
            pa.field("publisher", pa.string()),
            pa.field("domain", pa.string()),
            pa.field("subdomain", pa.string()),
            pa.field("jurisdiction", pa.string()),
            pa.field("authority_level", pa.string()),
            pa.field("publication_date", pa.string()),
            pa.field("last_verified_date", pa.string()),
            pa.field("language", pa.string()),
            pa.field("document_type", pa.string()),
            pa.field("section", pa.string()),
            pa.field("content", pa.string()),
            pa.field("content_hash", pa.string()),
            pa.field("ingestion_timestamp", pa.string()),
            pa.field("trust_score", pa.float32()),
            # 384 dimensions for bge-small-en-v1.5
            pa.field("vector", pa.list_(pa.float32(), 384))
        ])
        
        # Tables to ensure
        self.tables = [
            "medical_knowledge_base",
            "legal_knowledge_base",
            "medical_guidelines",
            "legal_jurisdictions",
            "case_law",
            "medical_faq_verified",
            "legal_faq_verified"
        ]
        self._init_tables()

    def _init_tables(self):
        for table_name in self.tables:
            if table_name not in self.db.table_names():
                self.db.create_table(table_name, schema=self.schema)

    def get_table(self, table_name: str):
        if table_name not in self.tables:
            raise ValueError(f"Invalid table: {table_name}")
        return self.db.open_table(table_name)

    def generate_embeddings(self, texts: list[str]) -> list[list[float]]:
        embeddings = self.embed_model.encode(texts, convert_to_numpy=True)
        return embeddings.tolist()

    def ingest_documents(self, table_name: str, documents: list[dict]):
        if not documents:
            return
        
        table = self.get_table(table_name)
        
        # Prepare rows matching schema
        rows = []
        texts_to_embed = [doc["content"] for doc in documents]
        embeddings = self.generate_embeddings(texts_to_embed)
        
        for idx, doc in enumerate(documents):
            row = {
                "document_id": doc.get("document_id", ""),
                "chunk_id": doc.get("chunk_id", ""),
                "title": doc.get("title", "Untitled"),
                "source_url": doc.get("source_url", ""),
                "publisher": doc.get("publisher", ""),
                "domain": doc.get("domain", ""),
                "subdomain": doc.get("subdomain", ""),
                "jurisdiction": doc.get("jurisdiction", "Federal/National"),
                "authority_level": doc.get("authority_level", "Medium"),
                "publication_date": doc.get("publication_date", ""),
                "last_verified_date": doc.get("last_verified_date", ""),
                "language": doc.get("language", "en"),
                "document_type": doc.get("document_type", ""),
                "section": doc.get("section", ""),
                "content": doc["content"],
                "content_hash": doc.get("content_hash", ""),
                "ingestion_timestamp": doc.get("ingestion_timestamp", datetime.now().isoformat()),
                "trust_score": float(doc.get("trust_score", 0.8)),
                "vector": embeddings[idx]
            }
            rows.append(row)
            
        df = pd.DataFrame(rows)
        table.add(df)
        print(f"Ingested {len(rows)} documents into table {table_name}.")

    def search(self, table_name: str, query: str, limit: int = 5) -> list[dict]:
        table = self.get_table(table_name)
        query_vector = self.generate_embeddings([query])[0]
        
        # LanceDB vector search
        results = table.search(query_vector).metric("cosine").limit(limit).to_list()
        return results

lancedb_client = LanceDBClient()
