# PolicyMind Database Schema & Sample Data

This document outlines the PostgreSQL database schema defined via SQLAlchemy in `backend/db/models.py`, along with representative sample data.

---

## 1. `users`
Stores registered user accounts and profile information.

| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | Integer | Primary Key, Auto-increment | Unique user identifier |
| `email` | String(255) | Unique, Not Null, Indexed | User email address |
| `password_hash` | String(255) | Not Null | Hashed password |
| `full_name` | String(255) | Nullable | User's full name |
| `organization` | String(255) | Nullable | Company or org name |
| `is_active` | Boolean | Default: True | Account status |
| `created_at` | DateTime | Default: UTC Now | Account creation timestamp |
| `updated_at` | DateTime | Default: UTC Now | Last update timestamp |

### Sample Data
```json
{
  "id": 1,
  "email": "admin@policymind.io",
  "password_hash": "$2b$12$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjIQG8INj6",
  "full_name": "Admin User",
  "organization": "PolicyMind Corp",
  "is_active": true,
  "created_at": "2026-08-01T10:00:00Z"
}
```

---

## 2. `documents`
Stores metadata about ingested regulatory PDFs stored in the vector database (ChromaDB).

| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | Integer | Primary Key, Auto-increment | Unique document identifier |
| `filename` | String(255) | Not Null | Name of the PDF file |
| `file_path` | String(500) | Nullable | Path to the file on disk |
| `total_pages` | Integer | Default: 0 | Number of pages in the PDF |
| `total_chunks` | Integer | Default: 0 | Number of vector chunks generated |
| `chunk_size` | Integer | Default: 500 | Text characters per chunk |
| `chunk_overlap` | Integer | Default: 100 | Overlapping characters between chunks|
| `ingested_at` | DateTime | Default: UTC Now | When the document was ingested |

### Sample Data
```json
{
  "id": 1,
  "filename": "EU_AI_Act.pdf",
  "file_path": "data/EU_AI_Act.pdf",
  "total_pages": 144,
  "total_chunks": 850,
  "chunk_size": 512,
  "chunk_overlap": 64,
  "ingested_at": "2026-08-01T10:15:00Z"
}
```

---

## 3. `chat_sessions`
Groups individual chat messages into conversation threads.

| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | Integer | Primary Key, Auto-increment | Unique session identifier |
| `user_id` | Integer | Foreign Key (`users.id`) | Owner of the session |
| `title` | String(255) | Nullable | Auto-generated title based on first query |
| `created_at` | DateTime | Default: UTC Now | Session creation timestamp |
| `updated_at` | DateTime | Default: UTC Now | Last update timestamp |

### Sample Data
```json
{
  "id": 101,
  "user_id": 1,
  "title": "Can I use AI to screen or hire employees?",
  "created_at": "2026-08-01T10:30:00Z"
}
```

---

## 4. `chat_messages`
Stores individual Q&A turns within a chat session.

| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | Integer | Primary Key, Auto-increment | Unique message identifier |
| `session_id` | Integer | Foreign Key (`chat_sessions.id`) | The parent session |
| `role` | String(20) | Not Null | "user" or "assistant" |
| `content` | Text | Not Null | The message text or AI response |
| `prompt` | Text | Nullable | The original user prompt (for assistant) |
| `source_documents`| JSON | Nullable | Metadata of retrieved vector chunks |
| `created_at` | DateTime | Default: UTC Now | Message timestamp |

### Sample Data (Assistant Response)
```json
{
  "id": 505,
  "session_id": 101,
  "role": "assistant",
  "content": "## Risk Level\nHIGH\nReasoning: Employment screening is explicitly High-Risk...",
  "prompt": "Can I use AI to screen employees?",
  "source_documents": [
    {"chunk": 1, "source": "EU_AI_Act.pdf", "content_preview": "Annex III, Point 4(a) classifying AI intended for recruitment..."}
  ],
  "created_at": "2026-08-01T10:30:05Z"
}
```

---

## 5. `simulations`
Stores inputs and outputs from the Risk Simulator pre-development assessment tool.

| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | Integer | Primary Key, Auto-increment | Unique simulation identifier |
| `user_id` | Integer | Foreign Key (`users.id`) | The user who ran the simulation |
| `jurisdiction` | String(20) | Default: "both" | "eu", "india", or "both" |
| `system_description`| JSON | Not Null | The answers to the simulator form |
| `results` | JSON | Not Null | The classified risk tiers and checklists|
| `created_at` | DateTime | Default: UTC Now | Simulation timestamp |

### Sample Data
```json
{
  "id": 42,
  "user_id": 1,
  "jurisdiction": "both",
  "system_description": {
    "sector": "employment",
    "personal_data_used": ["resume"],
    "uses_biometric_or_emotion_data": false,
    "affected_group": "public",
    "decision_level": "human_assisted",
    "org_size": "startup"
  },
  "results": {
    "eu": {
      "risk_tier": "High",
      "matched_clause": "EU AI Act, Annex III, Point 4(a)",
      "reason": "'employment' is explicitly listed as high-risk under Annex III.",
      "checklist": ["Conformity assessment before deployment", "Maintain technical documentation"]
    }
  }
}
```

---

## 6. `bookmarks` & `bookmark_regulations`
Saves compliance checklists generated by the AI or Simulator for future tracking.

### `bookmarks`
| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | Integer | Primary Key, Auto-increment | Unique bookmark identifier |
| `user_id` | Integer | Foreign Key (`users.id`) | The owner |
| `bookmark_type` | String(20) | Default: "chat" | "chat" or "simulation" |
| `title` | String(255) | Not Null | Title of the checklist |
| `summary` | Text | Nullable | Optional description |
| `question` | Text | Nullable | The prompt that generated this |
| `chat_messages` | JSON | Nullable | Snapshot of the chat at the time |

### `bookmark_regulations` (Child Table)
| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | Integer | Primary Key, Auto-increment | Unique regulation item ID |
| `bookmark_id` | Integer | Foreign Key (`bookmarks.id`) | Parent bookmark |
| `order` | Integer | Default: 1 | Display order |
| `title` | String(500) | Not Null | The checklist item text |
| `clause` | String(255) | Nullable | The legal article reference |
| `completed` | Boolean | Default: False | Has the user checked this off? |

### Sample Data
```json
// Bookmark Record
{
  "id": 10,
  "bookmark_type": "chat",
  "title": "Hiring AI Compliance",
  "question": "Can I use AI to screen employees?"
}

// Associated BookmarkRegulation Records
[
  { "id": 1, "bookmark_id": 10, "order": 1, "title": "Data Governance", "clause": "Article 10", "completed": true },
  { "id": 2, "bookmark_id": 10, "order": 2, "title": "Human Oversight", "clause": "Article 14", "completed": false }
]
```

---

## 7. `history_entries`
Archived, flattened records of completed checklists or old chats for dashboard analytics.

| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | Integer | Primary Key, Auto-increment | Unique history identifier |
| `user_id` | Integer | Foreign Key (`users.id`) | The owner |
| `title` | String(255) | Not Null | Title of the entry |
| `entry_type` | String(20) | Default: "chat" | Origin of the entry |
| `question` | Text | Nullable | Original question |
| `score` | Float | Nullable | Calculated compliance score |
| `created_at` | DateTime | Default: UTC Now | When the interaction occurred |

### Sample Data
```json
{
  "id": 88,
  "title": "EU AI Act Compliance Check",
  "entry_type": "chat",
  "question": "What are the rules for biometric data?",
  "score": 45.5,
  "created_at": "2026-08-01T08:00:00Z"
}
```
