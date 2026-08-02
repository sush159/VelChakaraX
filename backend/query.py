import os
from dotenv import load_dotenv
load_dotenv()

from langchain_pinecone import PineconeVectorStore, PineconeEmbeddings

# -----------------------------
# Configuration
# -----------------------------
PINECONE_INDEX_NAME = "policymind"
PINECONE_EMBED_MODEL = "multilingual-e5-large"

# -----------------------------
# Connect to Pinecone (hosted inference — no local model needed)
# -----------------------------
pinecone_api_key = os.environ.get("PINECONE_API_KEY")
if not pinecone_api_key:
    raise ValueError("PINECONE_API_KEY is not set in environment")

embedding_model = PineconeEmbeddings(
    model=PINECONE_EMBED_MODEL,
    pinecone_api_key=pinecone_api_key,
)

db = PineconeVectorStore(
    index_name=PINECONE_INDEX_NAME,
    embedding=embedding_model,
    pinecone_api_key=pinecone_api_key,
)

print("\n==============================")
print(" AI Compliance Assistant")
print("==============================\n")

while True:
    question = input("Ask a question (or type 'exit'): ")

    if question.lower() == "exit":
        print("\nGoodbye!")
        break

    results = db.similarity_search(question, k=3)

    print("\nTop Matching Chunks:\n")

    for i, doc in enumerate(results, start=1):
        print(f"Result {i}")
        print("-" * 60)
        print(doc.page_content)
        print()