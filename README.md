PolicyMind: AI Governance & Compliance Assistant
PolicyMind is a full-stack, AI-driven governance and compliance application designed to help organizations navigate complex, ever-changing regulatory landscapes (such as the EU AI Act and India's DPDP Act). 

It provides instantaneous, mathematically verifiable, and context-aware compliance guidance by leveraging advanced Retrieval-Augmented Generation (RAG) and a deterministic risk-simulation engine.

---
 ✨ Features

- 📚 **Dynamic Knowledge Base (RAG):** Upload regulatory PDFs directly from the Admin Dashboard. The system automatically chunks, embeds (via SBERT), and stores the law in a local ChromaDB vector database.
- 💬 **Strict Compliance Chatbot:** Ask complex legal questions and receive answers based *only* on the exact text of uploaded regulations—eliminating AI hallucination.
- ⚖️ **Deterministic Risk Simulator:** A pre-development self-assessment tool. Input your proposed AI system's sector, data types, and automation level to instantly receive a legal risk tier (e.g., "High Risk" or "Unacceptable") based on hardcoded legal logic.
- 🕸️ **Interactive Knowledge Graphs:** The AI extracts entities and relationships from the law, generating a beautiful, interactive node-map (via React Flow) to visualize compliance risks.
- 📊 **Admin Analytics Dashboard:** Monitor daily query volumes, track vector database health, and dynamically tune embedding settings (Chunk Size, Top-K retrieval) in real-time.

---

 🛠️ Tech Stack

### Frontend
- **Framework:** React.js + Vite
- **Styling:** Tailwind CSS
- **Data Viz & UI:** Recharts, `@xyflow/react` (React Flow), Lucide Icons

### Backend
- **API Framework:** Python & FastAPI (Uvicorn)
- **Database (Relational):** PostgreSQL (Hosted via Supabase) + SQLAlchemy (ORM)
- **Database (Vector):** ChromaDB (Local)

### AI & Data Pipeline
- **Orchestration:** LangChain (PyPDFLoader, TextSplitters)
- **Embeddings:** HuggingFace `sentence-transformers/all-MiniLM-L6-v2` (SBERT)
- **LLM Inference:** `meta-llama/llama-3.2-3b-instruct:free` (Via OpenRouter API)

### Prerequisites
- Node.js (v18+)
- Python (v3.10+)


├── backend/
│   ├── app.py               # Main FastAPI application & endpoints
│   ├── ingest.py            # PDF loading, chunking, and ChromaDB ingestion logic
│   ├── risk_engine.py       # Deterministic compliance rules (EU AI Act, DPDP)
│   ├── db/
│   │   ├── models.py        # SQLAlchemy database schemas
│   │   └── session.py       # Database connection configuration
│   └── data/                # Directory for uploaded PDF regulations
├── Frontend/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── Chat.jsx               # User-facing Chatbot & Risk Simulator UI
│   │   │   └── admin/
│   │   │       ├── AdminDashboard.jsx # Admin analytics and charts
│   │   │       ├── AdminSettings.jsx  # Dynamic RAG tuning interface
│   │   │       └── AdminDocuments.jsx # PDF Upload management table
│   │   └── App.jsx          # React Router configuration
│   └── package.json
└── README.md

### 1. Backend Setup
Navigate to the backend directory and install dependencies:
```bash
cd backend
pip install -r requirements.txt
