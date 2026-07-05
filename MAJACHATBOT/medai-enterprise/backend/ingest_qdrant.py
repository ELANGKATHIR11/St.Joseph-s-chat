import os
import sys
import pandas as pd
import argparse
from sentence_transformers import SentenceTransformer
from qdrant_client import QdrantClient
from qdrant_client.models import Distance, VectorParams, PointStruct
from app.core.config import get_settings

try:
    import torch
    _CUDA_AVAILABLE = torch.cuda.is_available()
except ImportError:
    _CUDA_AVAILABLE = False

settings = get_settings()

def main():
    parser = argparse.ArgumentParser(description="Ingest medical dataset into Qdrant")
    parser.add_argument("--limit", type=int, default=20000, help="Limit number of rows to ingest (set to -1 for full dataset)")
    parser.add_argument("--batch-size", type=int, default=256, help="Batch size for embeddings and ingestion")
    args = parser.parse_args()

    csv_path = r"c:\Users\elang\Downloads\chatbot\MediBot\ai-medical-chatbot.csv"
    if not os.path.exists(csv_path):
        print(f"Error: Dataset not found at {csv_path}")
        sys.exit(1)

    print("Loading embedding model...")
    # Target RTX 5060 (CUDA) if available
    device = "cuda" if _CUDA_AVAILABLE else "cpu"
    model = SentenceTransformer(settings.EMBEDDING_MODEL_NAME, device=device)
    print(f"Model loaded on device: {model.device}")

    print(f"Reading dataset from {csv_path}...")
    # Read CSV
    df = pd.read_csv(csv_path)
    df = df.dropna(subset=["Patient", "Doctor"])
    df = df.drop_duplicates(subset=["Patient"])
    
    total_rows = len(df)
    print(f"Total valid unique rows in CSV: {total_rows}")

    if args.limit > 0 and args.limit < total_rows:
        df = df.head(args.limit)
        print(f"Limiting ingestion to the first {args.limit} rows.")
    else:
        print("Ingesting the entire dataset.")

    # Initialize Qdrant Client
    db_path = settings.QDRANT_STORAGE_PATH
    print(f"Initializing Qdrant client at local path: {os.path.abspath(db_path)}")
    client = QdrantClient(path=db_path)

    collection_name = "medical_consultations"
    vector_size = model.get_sentence_embedding_dimension()

    # Drop existing collection if present, then create fresh
    print(f"Setting up Qdrant collection: {collection_name} (dimension: {vector_size})")
    existing = [c.name for c in client.get_collections().collections]
    if collection_name in existing:
        client.delete_collection(collection_name)
        print(f"Deleted existing collection '{collection_name}'.")
    client.create_collection(
        collection_name=collection_name,
        vectors_config=VectorParams(size=vector_size, distance=Distance.COSINE),
    )

    records = df.to_dict("records")
    num_records = len(records)
    print(f"Starting ingestion of {num_records} records in batches of {args.batch_size}...")

    for i in range(0, num_records, args.batch_size):
        batch = records[i : i + args.batch_size]
        questions = [r["Patient"] for r in batch]
        
        # Generate embeddings
        embeddings = model.encode(questions, batch_size=args.batch_size, show_progress_bar=False).tolist()
        
        points = []
        for idx, record in enumerate(batch):
            point_id = i + idx
            points.append(
                PointStruct(
                    id=point_id,
                    vector=embeddings[idx],
                    payload={
                        "question": record["Patient"],
                        "answer": record["Doctor"],
                        "description": str(record.get("Description", ""))
                    }
                )
            )
        
        client.upsert(
            collection_name=collection_name,
            points=points
        )
        print(f"Ingested points {i} to {i + len(batch)}...")

    print("Ingestion completed successfully!")

if __name__ == "__main__":
    main()
