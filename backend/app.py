import sys

# Fix Windows console encoding so emoji / unicode prints don't crash
try:
    sys.stdout.reconfigure(encoding="utf-8")
    sys.stderr.reconfigure(encoding="utf-8")
except Exception:
    pass

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from langchain_community.vectorstores import Chroma
from langchain_community.embeddings import HuggingFaceEmbeddings

from risk_engine import SystemDescription, run_simulation

import ollama

# -----------------------------
# FastAPI App
# -----------------------------
app = FastAPI(title="AI Compliance Assistant")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# -----------------------------
# Configuration
# -----------------------------
CHROMA_FOLDER = "chroma_db"

# -----------------------------
# Load Embedding Model
# -----------------------------
embedding_model = HuggingFaceEmbeddings(
    model_name="sentence-transformers/all-MiniLM-L6-v2"
)

# -----------------------------
# Load ChromaDB
# -----------------------------
db = Chroma(
    persist_directory=CHROMA_FOLDER,
    embedding_function=embedding_model
)

# -----------------------------
# Request Model
# -----------------------------
class Question(BaseModel):
    question: str

# -----------------------------
# API Endpoint
# -----------------------------
@app.post("/simulate")
def simulate(system: SystemDescription):
    return run_simulation(system)


@app.post("/ask")
def ask_question(data: Question):
    try:
        # -----------------------------
        # Retrieve documents using MMR
        # -----------------------------
        retriever = db.as_retriever(
            search_type="mmr",
            search_kwargs={
                "k": 5,
                "fetch_k": 20
            }
        )

        docs = retriever.invoke(data.question)

        print("=" * 80)
        print("QUESTION:", data.question)
        print("Retrieved Chunks:", len(docs))

        context = ""

        for i, doc in enumerate(docs, start=1):
            print(f"\n---------- CHUNK {i} ----------")
            print(doc.page_content[:500])
            print("-------------------------------")

            context += doc.page_content + "\n\n"

        print("\nContext Length:", len(context))
        print("=" * 80)

        # -----------------------------
        # Prompt
        # -----------------------------
        prompt = f"""
You are an AI Policy Compliance Assistant.

Answer ONLY using the context below.

If the answer exists in the context, explain it in simple and professional language.

Do not copy large sections verbatim.

Summarize the important points.

If the answer does not exist, reply exactly:

I could not find this information in the uploaded documents.

Context:
{context}

Question:
{data.question}

Return your response in this format:

Answer:
Relevant Regulations:
Recommendation:
"""

        # -----------------------------
        # Generate Response
        # -----------------------------
        response = ollama.chat(
            model="llama3.2:3b",
            messages=[
                {
                    "role": "system",
                    "content": (
                        "You are a helpful AI Policy Compliance Assistant. "
                        "Always answer using the provided context. "
                        "If the context contains the answer, explain it clearly and professionally."
                    )
                },
                {
                    "role": "user",
                    "content": prompt
                }
            ]
        )

        # -----------------------------
        # Return Response
        # -----------------------------
        return {
            "answer": response["message"]["content"]
        }

    except Exception as e:
        print(f"ERROR in /ask: {type(e).__name__}: {e}")

        return {
            "answer": (
                "I could not generate a response due to an error.\n\n"
                f"{type(e).__name__}: {e}"
            )
        }

