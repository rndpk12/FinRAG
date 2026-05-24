# FinRAG — Financial Research Assistant

A production-style Financial RAG (Retrieval-Augmented Generation) system that allows users to ingest financial documents, retrieve relevant context, and generate grounded answers using LLMs.

Built using:
- FastAPI
- Next.js
- PostgreSQL
- BM25 + Vector Search
- Groq LLM API
- Hybrid Retrieval + Reranking

---

# Features

- Upload and ingest financial PDFs
- Ingest financial URLs/articles
- Hybrid retrieval:
  - BM25 lexical search
  - Dense vector embeddings
- Reranking pipeline
- Grounded financial Q&A
- Groq-powered fast inference
- Evaluation pipeline
- Next.js modern frontend
- Swagger API docs
- PostgreSQL persistence

---

# Tech Stack

## Frontend
- Next.js
- TypeScript
- TailwindCSS

## Backend
- FastAPI
- Python 3.11

## Database
- PostgreSQL

## AI / RAG
- Sentence Transformers
- BM25
- Groq LLM API
- Hybrid Retrieval
- Reranking

---

# Architecture

```text
                    ┌────────────────────┐
                    │   Next.js Frontend │
                    └─────────┬──────────┘
                              │
                              ▼
                    ┌────────────────────┐
                    │    FastAPI API     │
                    └─────────┬──────────┘
                              │
            ┌─────────────────┴─────────────────┐
            │                                   │
            ▼                                   ▼
    ┌───────────────┐                  ┌────────────────┐
    │ BM25 Retriever │                  │ Vector Search │
    └───────────────┘                  └────────────────┘
            │                                   │
            └─────────────────┬─────────────────┘
                              ▼
                     ┌────────────────┐
                     │   Reranker     │
                     └────────────────┘
                              │
                              ▼
                     ┌────────────────┐
                     │  Groq LLM API  │
                     └────────────────┘
                              │
                              ▼
                     ┌────────────────┐
                     │ Final Response │
                     └────────────────┘



financial-rag/
│
├── backend/
│   ├── api/
│   ├── evaluation/
│   ├── generation/
│   ├── indexing/
│   ├── ingest/
│   ├── retrieval/
│   ├── config.py
│   ├── db.py
│   └── models.py
│
├── frontend/
│
├── docker-compose.yml
├── requirements.txt
└── .env

