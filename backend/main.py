from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
import fastapi.middleware.cors

from pydantic import BaseModel

from backend.db import (
    init_db,
    get_db
)

from backend.retrieval.retriever import retrieve

from backend.generation.generator_groq import (
    generate_stream
)

from backend.retrieval.memory import memory

from backend.auth.auth import (
    router as auth_router
)

from backend.api.routes.upload import (
    router as upload_router
)

from backend.storage.chat_store import (
    clear_chat
)

import os

# =========================================
# FastAPI App
# =========================================

app = FastAPI(
    title="FinRAG API",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# =========================================
# CORS
# =========================================

app.add_middleware(
    fastapi.middleware.cors.CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# =========================================
# Routers
# =========================================

app.include_router(auth_router)
app.include_router(upload_router)

# =========================================
# Startup
# =========================================

@app.on_event("startup")
async def startup():

    print("\nInitializing database...")

    init_db()

    print("Database initialized successfully")
    print("FinRAG backend ready.\n")

# =========================================
# Request Model
# =========================================

class ChatRequest(BaseModel):

    query: str

    session_id: str | None = None

    selected_documents: list[str] = []

# =========================================
# Root Endpoint
# =========================================

@app.get("/")
async def root():

    return {
        "status": "ok",
        "message": "FinRAG backend running"
    }

# =========================================
# Health Endpoint
# =========================================

@app.get("/health")
async def health():

    return {
        "status": "healthy"
    }

# =========================================
# Streaming Chat Endpoint
# =========================================

# =========================================
# Streaming Chat Endpoint
# =========================================

from groq import Groq
from backend.config import settings

client = Groq(
    api_key=settings.groq_api_key
)

@app.post("/chat-stream")
async def chat_stream(request: ChatRequest):

    try:

        print("\n============================")
        print("NEW CHAT REQUEST")
        print("============================")

        print("Query:", request.query)
        print("Selected Docs:", request.selected_documents)

        # =========================================
        # Retrieve Context
        # =========================================

        retrieved_chunks = retrieve(
            query=request.query,
            selected_documents=request.selected_documents
        )

        print(f"Retrieved {len(retrieved_chunks)} chunks")

        # =========================================
        # Build Context
        # =========================================

        context = "\n\n".join([
            chunk.content
            for chunk in retrieved_chunks
        ])

        if not context.strip():
            context = "No relevant financial documents found."

        # =========================================
        # Conversation Memory
        # =========================================

        history = memory.get_history(
    request.session_id
)

        # =========================================
        # Final Prompt
        # =========================================

        prompt = f"""
You are FinRAG, an elite AI financial research assistant.

You MUST answer ONLY using the provided financial context.

If the answer is not present in the context:
say:
"I could not find that information in the uploaded documents."

====================
Conversation History
====================

{history}

====================
Financial Context
====================

{context}

====================
User Question
====================

{request.query}

====================
Answer
====================
"""

        print("\nPROMPT READY\n")

        # =========================================
        # Store User Message
        # =========================================

        if request.session_id:

            memory.add_message(
                request.session_id,
                "user",
                request.query
            )

        # =========================================
        # Streaming Generator
        # =========================================

        async def response_generator():

            full_response = ""

            try:

                for token in generate_stream(
    prompt,
    retrieved_chunks
):

                    full_response += token

                    yield token

                # save assistant response
                if request.session_id:

                    memory.add_message(
                        request.session_id,
                        "assistant",
                        full_response
                    )

            except Exception as e:

                print("Streaming Error:", e)

                yield f"\nError: {str(e)}"

        return StreamingResponse(
            response_generator(),
            media_type="text/plain"
        )

    except Exception as e:

        print("CHAT ERROR:", e)

        return StreamingResponse(
            iter([
                f"Server Error: {str(e)}"
            ]),
            media_type="text/plain"
        )
# =========================================
# Chat History Endpoint
# =========================================

@app.get("/history/{session_id}")
async def get_history(session_id: str):

    with get_db() as conn:

        with conn.cursor() as cur:

            cur.execute(
                """
                SELECT
                    role,
                    content,
                    created_at
                FROM chat_sessions
                WHERE session_id = %s
                ORDER BY created_at ASC
                """,
                (session_id,)
            )

            rows = cur.fetchall()

    return {
        "messages": rows
    }

# =========================================
# Sessions Endpoint
# =========================================

@app.get("/sessions/{user_id}")
async def get_sessions(user_id: str):

    with get_db() as conn:

        with conn.cursor() as cur:

            cur.execute(
                """
                SELECT
                    session_id,
                    MAX(created_at) as last_message_time,
                    MAX(content) as preview
                FROM chat_sessions
                WHERE session_id LIKE %s
                GROUP BY session_id
                ORDER BY last_message_time DESC
                """,
                (f"{user_id}%",)
            )

            rows = cur.fetchall()

    sessions = []

    for row in rows:

        sessions.append({
            "session_id": row["session_id"],
            "preview": row["preview"][:60]
            if row["preview"]
            else "New Chat",
            "updated_at": row[
                "last_message_time"
            ]
        })

    return {
        "sessions": sessions
    }

# =========================================
# Documents Endpoint
# =========================================

@app.get("/documents")
def get_documents():

    with get_db() as conn:

        with conn.cursor() as cur:

            cur.execute("""
                SELECT DISTINCT
                    metadata->>'source' AS source
                FROM documents
                WHERE metadata->>'source'
                    IS NOT NULL
                ORDER BY source;
            """)

            rows = cur.fetchall()

    documents = [
        {
            "id": row["source"],
            "name": row["source"]
        }
        for row in rows
    ]

    return {
        "documents": documents
    }

# =========================================
# Clear Chat Endpoint
# =========================================

@app.delete("/history/{session_id}")
def delete_history(session_id: str):

    clear_chat(session_id)

    return {
        "message": "Chat cleared"
    }

# =========================================
# Render PORT Fix
# =========================================

if __name__ == "__main__":

    import uvicorn

    port = int(os.environ.get("PORT", 10000))

    uvicorn.run(
        "backend.main:app",
        host="0.0.0.0",
        port=port
    )