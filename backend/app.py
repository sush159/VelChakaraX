import os
import json
import shutil
import re
from string import Template
from typing import List, Optional, Any

from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI, Depends, HTTPException, Query, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from sqlalchemy.orm import Session

from langchain_pinecone import PineconeVectorStore, PineconeEmbeddings
from pinecone import Pinecone

from risk_engine import SystemDescription, run_simulation

from db.session import get_db, engine, Base
from db.models import (
    User, ChatSession, ChatMessage, Simulation,
    Bookmark, BookmarkRegulation, HistoryEntry, Document
)

from groq import Groq
import datetime

# -----------------------------
# Groq LLM Client
# -----------------------------
groq_client = Groq(api_key=os.environ.get("GROQ_API_KEY"))
GROQ_MODEL = "llama-3.3-70b-versatile"

# -----------------------------
# FastAPI App
# -----------------------------
app = FastAPI(title="AI Compliance Assistant")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# -----------------------------
# Configuration
# -----------------------------
CONFIG_FILE = "config.json"
PINECONE_INDEX_NAME = "policymind"
PINECONE_EMBED_MODEL = "multilingual-e5-large"  # Pinecone-hosted, 1024-dim, no local torch needed

def load_config():
    if os.path.exists(CONFIG_FILE):
        with open(CONFIG_FILE, "r") as f:
            return json.load(f)
    return {
        "chunk_size": 512,
        "chunk_overlap": 64,
        "embedding_model": PINECONE_EMBED_MODEL,
        "top_k": 6
    }

# -----------------------------
# Load Pinecone Vector Store (hosted inference — no local model)
# -----------------------------
global_db = None

def reload_vector_db():
    """Connect to Pinecone using its hosted embedding API. No local model download needed."""
    global global_db
    pinecone_api_key = os.environ.get("PINECONE_API_KEY")
    if not pinecone_api_key:
        print("WARNING: PINECONE_API_KEY not set — vector search will be unavailable.")
        return
    try:
        embeddings = PineconeEmbeddings(
            model=PINECONE_EMBED_MODEL,
            pinecone_api_key=pinecone_api_key,
        )
        global_db = PineconeVectorStore(
            index_name=PINECONE_INDEX_NAME,
            embedding=embeddings,
            pinecone_api_key=pinecone_api_key,
        )
        print(f"[Pinecone] Connected to index '{PINECONE_INDEX_NAME}' using hosted model '{PINECONE_EMBED_MODEL}'")
    except Exception as e:
        print(f"WARNING: Could not connect to Pinecone index '{PINECONE_INDEX_NAME}': {e}")
        print("Run 'python ingest.py' to create the index, then call /rebuild to reconnect.")
        global_db = None

# Initialize on startup — create DB tables then connect to Pinecone
try:
    Base.metadata.create_all(bind=engine)
    print("[DB] Tables created/verified OK")
except Exception as _db_err:
    print(f"[DB] WARNING: Could not create tables: {_db_err}")

reload_vector_db()

# -----------------------------
# PolicyMind System Prompt
# -----------------------------
POLICYMIND_SYSTEM_PROMPT = Template("""You are PolicyMind, an AI Governance & Compliance Assistant.

Your job is to analyze AI systems and return compliance guidance based ONLY on the retrieved regulatory documents provided to you in context.

===========================================================
NON-NEGOTIABLE OUTPUT RULES (read before answering)
===========================================================
1. NEVER respond in a paragraph. Every single response MUST use the exact section structure below, in the exact order below, with Markdown "##" headings.
2. If you catch yourself writing more than 2 consecutive sentences without a bullet, STOP and reformat as bullets.
3. Do NOT skip a section. If a section has no data, write exactly: "Not available in the uploaded knowledge base." — never omit the heading itself.
4. Do NOT merge sections. Do NOT rename sections. Do NOT add extra sections.
5. Never invent a regulation, article number, statistic, or score. Only use what is present in the retrieved context.
6. Output the Knowledge Graph section as raw JSON only — no prose, no markdown fence commentary before/after it.
7. Keep the "Detailed Answer" section to bullet points only — 5 to 10 bullets, no narrative paragraphs.

===========================================================
REQUIRED OUTPUT FORMAT (follow this structure exactly)
===========================================================

## Risk Level
[LOW | MEDIUM | HIGH | PROHIBITED]
Reasoning: <one line>

## Applicable Regulations
- <Regulation Name>
  - Article/Section: <value or "Not available in the uploaded knowledge base.">
  - Why it applies: <one line>

(repeat for each regulation found)

## Compliance Score
Compliance Score: <0-100>%
Status: [Compliant | Partially Compliant | Non-Compliant]

## Primary Category
<one category, e.g. "Facial Recognition", "Recruitment AI", "Healthcare AI">

## Detailed Answer
- Purpose: <bullet>
- Applicable regulations: <bullet>
- Why they apply: <bullet>
- Key obligations: <bullet>
- Compliance expectations: <bullet>
(5–10 bullets total, no paragraphs)

## Compliance Checklist
✔ Data Governance — <short reason>
✔ Transparency — <short reason>
✔ Human Oversight — <short reason>
✔ Technical Documentation — <short reason>
✔ Risk Management — <short reason>
✔ Record Keeping — <short reason>
✔ Cybersecurity — <short reason>
✔ Accuracy — <short reason>
❌ Prohibited Practices — <short reason>
(use ✔ if satisfied/expected, ⚠ if partial, ❌ if missing/violated)

## Knowledge Graph
{
  "nodes": [ { "id": "1", "label": "<use case>", "type": "Use Case" } ],
  "edges": [ { "source": "1", "target": "2", "label": "regulated by" } ]
}

## Potential Compliance Risks
- <Risk name> — <1-2 line explanation>
- <Risk name> — <1-2 line explanation>

## Recommendations
✔ <actionable recommendation>
✔ <actionable recommendation>
✔ <actionable recommendation>

## Sources Used
<Regulation Name> — <Article/Section if available>
<Regulation Name> — <Article/Section if available>

===========================================================
FINAL REMINDER (highest priority — overrides any drift above)
===========================================================
- Your response is ONLY valid if it contains all 9 "##" headings above, in that order.
- Do NOT write a single flowing paragraph anywhere in the response.
- Do NOT summarize the analysis in prose before or after the structured sections — the structured sections ARE the entire answer.
- Base every claim strictly on retrieved documents. If information is missing, say so explicitly per section — never guess.

===========================================================
RETRIEVED REGULATORY CONTEXT (base every claim ONLY on this)
===========================================================
$context

===========================================================
QUESTION FROM USER
===========================================================
$question
""")

# -----------------------------
# Request Models
# -----------------------------
class Question(BaseModel):
    question: str


class BookmarkRegulationIn(BaseModel):
    order: int = 1
    title: str
    clause: Optional[str] = None
    completed: bool = False


class BookmarkCreate(BaseModel):
    bookmark_type: str = "chat"  # "chat" | "simulation"
    title: str
    summary: Optional[str] = None
    question: Optional[str] = None
    chat_messages: Optional[Any] = None
    regulations: List[BookmarkRegulationIn] = []


class BookmarkToggleItem(BaseModel):
    regulation_id: int
    completed: bool


# -----------------------------
# DB Helpers
# -----------------------------
def serialize_bookmark(bookmark: Bookmark) -> dict:
    return {
        "id": f"chat-{bookmark.id}" if bookmark.bookmark_type == "chat" else f"sim-{bookmark.id}",
        "type": bookmark.bookmark_type,
        "title": bookmark.title,
        "summary": bookmark.summary or "",
        "question": bookmark.question or "",
        "chatMessages": bookmark.chat_messages or [],
        "createdAt": bookmark.created_at.isoformat(),
        "updatedAt": bookmark.updated_at.isoformat() if bookmark.updated_at else None,
        "regulations": [
            {
                "id": f"reg-{r.id}",
                "order": r.order,
                "title": r.title,
                "clause": r.clause or "",
                "completed": r.completed,
            }
            for r in sorted(bookmark.regulations, key=lambda x: x.order)
        ],
    }


def serialize_history(entry: HistoryEntry) -> dict:
    return {
        "id": f"history-{entry.id}",
        "title": entry.title,
        "summary": entry.summary or "",
        "createdAt": entry.created_at.isoformat(),
        "completedAt": entry.completed_at.isoformat(),
        "question": entry.question or "",
        "messages": entry.messages or [],
        "regulations": entry.regulations or [],
        "type": entry.entry_type,
        "score": entry.score,
    }


# -----------------------------
# Health check
# -----------------------------
@app.get("/")
def health():
    return {"status": "ok", "service": "AI Compliance Assistant"}


@app.get("/health/db")
def db_health():
    try:
        Base.metadata.create_all(bind=engine)
        return {"database": "connected"}
    except Exception as e:
        return {"database": "error", "detail": str(e)}


# -----------------------------
# API Endpoint: Simulate
# -----------------------------
@app.post("/simulate")
def simulate(system: SystemDescription, session: Session = Depends(get_db)):

    results = run_simulation(system)

    # Persist the simulation
    try:
        sim = Simulation(
            jurisdiction=system.get("jurisdiction", "both"),
            system_description=dict(system),
            results=results,
        )
        session.add(sim)
        session.commit()
    except Exception as e:
        print("Warning: Failed to persist simulation:", e)
        session.rollback()

    return results


# -----------------------------
# API Endpoint: Ask
# -----------------------------
@app.post("/ask")
def ask_question(data: Question, session: Session = Depends(get_db)):

    print("[API] /ask endpoint called")

    if global_db is None:
        raise HTTPException(
            status_code=503,
            detail="Vector store not initialized. Check that PINECONE_API_KEY is set and the index exists."
        )

    config = load_config()
    top_k = int(config.get("top_k", 6))

    # Retrieve documents from Pinecone (similarity search)
    retriever = global_db.as_retriever(
        search_type="mmr",
        search_kwargs={
            "k": top_k,
            "fetch_k": max(top_k * 4, 20)
        }
    )

    docs = retriever.invoke(data.question)

    print("=" * 80)
    print("QUESTION:", data.question)
    print("Retrieved Chunks:", len(docs))

    context = ""

    source_meta = []
    for i, doc in enumerate(docs, start=1):
        print(f"\n---------- CHUNK {i} ----------")
        print(doc.page_content[:500].encode('ascii', 'replace').decode('ascii'))
        print("-------------------------------")

        context += doc.page_content + "\n\n"
        source_meta.append({
            "chunk": i,
            "source": getattr(doc.metadata, "get", lambda k, d=None: d)("source"),
            "content_preview": doc.page_content[:200],
        })

    print("\nContext Length:", len(context))
    print("=" * 80)

    # -----------------------------
    # Prompt
    # -----------------------------
    prompt = POLICYMIND_SYSTEM_PROMPT.substitute(
        context=context,
        question=data.question,
    )

    # -----------------------------
    # Generate Response (Groq — Llama 3.2 3B)
    # -----------------------------
    try:
        completion = groq_client.chat.completions.create(
            model=GROQ_MODEL,
            messages=[
                {
                    "role": "system",
                    "content": (
                        "You are PolicyMind, an AI Governance & Compliance Assistant.\n"
                        "You MUST strictly follow the REQUIRED OUTPUT FORMAT.\n"
                        "NEVER respond in a paragraph. Use bullet points ONLY.\n"
                        "The 'Knowledge Graph' section MUST be raw JSON without markdown fences.\n"
                        "You must include ALL 9 '##' headings."
                    )
                },
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            temperature=0.2,
            max_tokens=2048,
        )
        answer = completion.choices[0].message.content
    except Exception as e:
        print("[WARN] Groq LLM call failed:", e)
        raise HTTPException(status_code=502, detail=f"LLM request failed: {str(e)}")

    # -----------------------------
    # Persist the Q&A
    # -----------------------------
    try:
        chat_session = session.query(ChatSession).order_by(ChatSession.id.desc()).first()
        if chat_session is None:
            chat_session = ChatSession(title=data.question[:80])
            session.add(chat_session)
            session.flush()

        user_msg = ChatMessage(
            session_id=chat_session.id,
            role="user",
            content=data.question,
            source_documents=source_meta,
        )
        assistant_msg = ChatMessage(
            session_id=chat_session.id,
            role="assistant",
            content=answer,
            prompt=data.question,
            source_documents=source_meta,
        )
        session.add_all([user_msg, assistant_msg])
        session.commit()
    except Exception as e:
        print("Warning: Failed to persist chat:", e)
        session.rollback()

    # -----------------------------
    # Return Response
    # -----------------------------
    return {
        "answer": answer
    }


# -----------------------------
# Chat history endpoints
# -----------------------------
@app.get("/chat/messages", response_model=List[dict])
def list_chat_messages(limit: int = Query(100, ge=1, le=500), session: Session = Depends(get_db)):
    messages = (
        session.query(ChatMessage)
        .order_by(ChatMessage.id.desc())
        .limit(limit)
        .all()
    )
    return [
        {
            "id": f"msg-{m.id}",
            "role": m.role,
            "text": m.content,
            "prompt": m.prompt,
            "createdAt": m.created_at.isoformat(),
            "sourceDocuments": m.source_documents or [],
        }
        for m in reversed(messages)
    ]


@app.get("/chat/sessions", response_model=List[dict])
def list_chat_sessions(session: Session = Depends(get_db)):
    sessions = session.query(ChatSession).order_by(ChatSession.id.desc()).limit(50).all()
    result = []
    for s in sessions:
        result.append({
            "id": s.id,
            "title": s.title or "New chat",
            "createdAt": s.created_at.isoformat(),
            "messageCount": len(s.messages),
        })
    return result


@app.delete("/chat/messages/{message_id}")
def delete_chat_message(message_id: int, session: Session = Depends(get_db)):
    msg = session.get(ChatMessage, message_id)
    if not msg:
        raise HTTPException(status_code=404, detail="Message not found")
    session.delete(msg)
    session.commit()
    return {"deleted": message_id}


# -----------------------------
# Simulations history
# -----------------------------
@app.get("/simulations", response_model=List[dict])
def list_simulations(limit: int = Query(100, ge=1, le=500), session: Session = Depends(get_db)):
    sims = session.query(Simulation).order_by(Simulation.id.desc()).limit(limit).all()
    return [
        {
            "id": sim.id,
            "jurisdiction": sim.jurisdiction,
            "systemDescription": sim.system_description,
            "results": sim.results,
            "createdAt": sim.created_at.isoformat(),
        }
        for sim in sims
    ]


# -----------------------------
# Bookmarks CRUD
# -----------------------------
@app.get("/bookmarks", response_model=List[dict])
def list_bookmarks(session: Session = Depends(get_db)):
    bookmarks = session.query(Bookmark).order_by(Bookmark.id.desc()).all()
    return [serialize_bookmark(b) for b in bookmarks]


@app.post("/bookmarks", response_model=dict)
def create_bookmark(payload: BookmarkCreate, session: Session = Depends(get_db)):
    bookmark = Bookmark(
        bookmark_type=payload.bookmark_type,
        title=payload.title,
        summary=payload.summary,
        question=payload.question,
        chat_messages=payload.chat_messages,
    )
    for item in payload.regulations:
        bookmark.regulations.append(
            BookmarkRegulation(
                order=item.order,
                title=item.title,
                clause=item.clause,
                completed=item.completed,
            )
        )
    session.add(bookmark)
    session.commit()
    session.refresh(bookmark)
    return serialize_bookmark(bookmark)


def _parse_id(raw: str) -> int:
    """Extract the numeric ID from a frontend string ID like 'chat-5', 'reg-3'."""
    match = re.search(r"(\d+)$", str(raw))
    if not match:
        raise HTTPException(status_code=400, detail=f"Invalid ID format: {raw}")
    return int(match.group(1))


@app.patch("/bookmarks/{bookmark_id}/items/{regulation_id}")
def toggle_bookmark_item(
    bookmark_id: str,
    regulation_id: str,
    session: Session = Depends(get_db),
):
    b_id = _parse_id(bookmark_id)
    r_id = _parse_id(regulation_id)

    regulation = session.get(BookmarkRegulation, r_id)
    if not regulation or regulation.bookmark_id != b_id:
        raise HTTPException(status_code=404, detail="Regulation item not found")

    regulation.completed = not regulation.completed
    session.commit()

    bookmark = session.get(Bookmark, b_id)
    return serialize_bookmark(bookmark)


@app.delete("/bookmarks/{bookmark_id}")
def delete_bookmark(bookmark_id: str, session: Session = Depends(get_db)):
    b_id = _parse_id(bookmark_id)
    bookmark = session.get(Bookmark, b_id)
    if not bookmark:
        raise HTTPException(status_code=404, detail="Bookmark not found")
    session.delete(bookmark)
    session.commit()
    return {"deleted": b_id}


# -----------------------------
# History endpoints
# -----------------------------
@app.get("/history", response_model=List[dict])
def list_history(session: Session = Depends(get_db)):
    entries = session.query(HistoryEntry).order_by(HistoryEntry.id.desc()).all()
    return [serialize_history(e) for e in entries]


@app.post("/history", response_model=dict)
def create_history_entry(payload: dict, session: Session = Depends(get_db)):
    entry = HistoryEntry(
        title=payload.get("title", "Untitled"),
        summary=payload.get("summary"),
        entry_type=payload.get("type", "chat"),
        question=payload.get("question"),
        messages=payload.get("messages"),
        regulations=payload.get("regulations"),
        score=payload.get("score"),
    )
    session.add(entry)
    session.commit()
    session.refresh(entry)
    return serialize_history(entry)


@app.delete("/history/{entry_id}")
def delete_history_entry(entry_id: int, session: Session = Depends(get_db)):
    entry = session.get(HistoryEntry, entry_id)
    if not entry:
        raise HTTPException(status_code=404, detail="History entry not found")
    session.delete(entry)
    session.commit()
    return {"deleted": entry_id}


# -----------------------------
# Documents
# -----------------------------
@app.get("/documents", response_model=List[dict])
def list_documents(session: Session = Depends(get_db)):
    docs = session.query(Document).order_by(Document.id.desc()).all()
    return [
        {
            "id": d.id,
            "filename": d.filename,
            "filePath": d.file_path,
            "totalPages": d.total_pages,
            "totalChunks": d.total_chunks,
            "ingestedAt": d.ingested_at.isoformat(),
        }
        for d in docs
    ]


# -----------------------------
# Settings & Ingestion
# -----------------------------
@app.get("/settings")
def get_settings():
    return load_config()


@app.post("/settings")
def update_settings(settings: dict):
    config = load_config()
    config.update(settings)
    with open(CONFIG_FILE, "w") as f:
        json.dump(config, f, indent=2)
    return {"status": "success", "settings": config}


@app.post("/rebuild")
def rebuild_vector_index():
    try:
        from ingest import rebuild_index
        rebuild_index()
        reload_vector_db()
        return {"status": "success", "message": "Index rebuilt successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/upload")
def upload_file(file: UploadFile = File(...)):
    if not file.filename.endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are supported")

    data_dir = "data"
    os.makedirs(data_dir, exist_ok=True)
    file_path = os.path.join(data_dir, file.filename)

    with open(file_path, "wb") as f:
        shutil.copyfileobj(file.file, f)

    # Automatically rebuild the index to include the new file
    try:
        from ingest import rebuild_index
        rebuild_index()
        reload_vector_db()
        return {"status": "success", "message": f"{file.filename} uploaded and indexed"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to index file: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run("app:app", host="0.0.0.0", port=port)
