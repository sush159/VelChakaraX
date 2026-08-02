import os
import shutil
import sys
import json

from dotenv import load_dotenv
load_dotenv()

from pypdf import PdfReader
from langchain_core.documents import Document
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_pinecone import PineconeVectorStore, PineconeEmbeddings
from pinecone import Pinecone, ServerlessSpec

# -----------------------------
# Configuration
# -----------------------------
DATA_FOLDER = "data"
CONFIG_FILE = "config.json"
PINECONE_INDEX_NAME = "policymind"
PINECONE_EMBED_MODEL = "multilingual-e5-large"  # Pinecone-hosted, 1024-dim
PINECONE_EMBED_DIM = 1024

def load_config():
    if os.path.exists(CONFIG_FILE):
        with open(CONFIG_FILE, "r") as f:
            return json.load(f)
    return {
        "chunk_size": 500,
        "chunk_overlap": 100,
        "embedding_model": PINECONE_EMBED_MODEL
    }

def get_pinecone_index():
    pc = Pinecone(api_key=os.environ.get("PINECONE_API_KEY"))
    existing = [idx.name for idx in pc.list_indexes()]
    if PINECONE_INDEX_NAME not in existing:
        print(f"Creating Pinecone index '{PINECONE_INDEX_NAME}' (dim={PINECONE_EMBED_DIM})...")
        pc.create_index(
            name=PINECONE_INDEX_NAME,
            dimension=PINECONE_EMBED_DIM,
            metric="cosine",
            spec=ServerlessSpec(cloud="aws", region="us-east-1")
        )
        import time
        time.sleep(10)  # wait for index to be ready
    return pc.Index(PINECONE_INDEX_NAME)

def rebuild_index():
    print("\nStarting Index Rebuild...")
    config = load_config()
    chunk_size = int(config.get("chunk_size", 512))
    chunk_overlap = int(config.get("chunk_overlap", 64))

    if not os.path.exists(DATA_FOLDER):
        os.makedirs(DATA_FOLDER)

    documents = []

    print("\nLoading PDF files...\n")

    for file in os.listdir(DATA_FOLDER):
        if file.lower().endswith(".pdf"):
            path = os.path.join(DATA_FOLDER, file)
            print(f"Loading: {file}")
            reader = PdfReader(path)
            for i, page in enumerate(reader.pages):
                text = page.extract_text() or ""
                documents.append(
                    Document(
                        page_content=text,
                        metadata={"source": path, "page": i + 1},
                    )
                )

    print(f"\nTotal Pages Loaded: {len(documents)}")

    if len(documents) == 0:
        print("No documents to index.")
        return

    # Split into chunks
    splitter = RecursiveCharacterTextSplitter(
        chunk_size=chunk_size,
        chunk_overlap=chunk_overlap,
        separators=["\n\n", "\n", ". ", " ", ""]
    )
    chunks = splitter.split_documents(documents)
    print(f"\nTotal Chunks Created: {len(chunks)} (Size: {chunk_size}, Overlap: {chunk_overlap})")

    # Use Pinecone hosted embedding — no local model download needed
    pinecone_api_key = os.environ.get("PINECONE_API_KEY")
    print(f"\nUsing Pinecone hosted embedding model '{PINECONE_EMBED_MODEL}'...")
    embedding_model = PineconeEmbeddings(
        model=PINECONE_EMBED_MODEL,
        pinecone_api_key=pinecone_api_key,
    )

    # Connect to Pinecone and clear old vectors
    print("Connecting to Pinecone...")
    index = get_pinecone_index()
    print("Clearing old vectors from Pinecone index...")
    try:
        index.delete(delete_all=True)
        import time
        time.sleep(3)  # allow deletion to propagate
    except Exception as e:
        print(f"Skipping delete_all due to error (index might be empty): {e}")

    # Upload new vectors
    print("Uploading new vectors to Pinecone...\n")
    PineconeVectorStore.from_documents(
        documents=chunks,
        embedding=embedding_model,
        index_name=PINECONE_INDEX_NAME,
        pinecone_api_key=pinecone_api_key,
    )

    print("\n====================================")
    print("[SUCCESS] Pinecone index updated successfully!")
    print(f"Indexed {len(chunks)} chunks from {len(documents)} pages.")
    print("====================================\n")

    # Save metadata to PostgreSQL
    try:
        sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
        from db.session import SessionLocal, Base, engine
        from db.models import Document as DocumentRecord
        from collections import Counter

        Base.metadata.create_all(bind=engine)
        session = SessionLocal()
        session.query(DocumentRecord).delete()

        chunk_counter = Counter()
        page_counter = Counter()
        for doc in documents:
            source = os.path.basename(doc.metadata.get("source", "unknown"))
            page_counter[source] += 1
        for chunk in chunks:
            source = os.path.basename(chunk.metadata.get("source", "unknown"))
            chunk_counter[source] += 1

        for file in os.listdir(DATA_FOLDER):
            if not file.lower().endswith(".pdf"):
                continue
            record = DocumentRecord(
                filename=file,
                file_path=os.path.join(DATA_FOLDER, file),
                total_pages=page_counter.get(file, 0),
                total_chunks=chunk_counter.get(file, 0),
                chunk_size=chunk_size,
                chunk_overlap=chunk_overlap,
            )
            session.add(record)

        session.commit()
        session.close()
        print("[SUCCESS] Document metadata saved to PostgreSQL.")
    except Exception as e:
        print(f"[WARNING] Could not persist metadata: {e}")

if __name__ == "__main__":
    rebuild_index()
