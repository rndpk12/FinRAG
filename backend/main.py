from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse

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

# =========================================
# CORS
# =========================================

app.add_middleware(
    CORSMiddleware,
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

    #init_db()

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

@app.post("/chat-stream")
async def chat_stream(request: ChatRequest):

    try:

        print("\nStreaming chat request received")

        query = request.query.strip()

        session_id = request.session_id

        # ---------------------------------
        # Validate Query
        # ---------------------------------

        if not query:

            return StreamingResponse(
                iter(["Please enter a valid query."]),
                media_type="text/plain"
            )

        # ---------------------------------
        # Save User Message
        # ---------------------------------

        with get_db() as conn:

            with conn.cursor() as cur:

                cur.execute(
                    """
                    INSERT INTO chat_sessions
                    (session_id, role, content)
                    VALUES (%s, %s, %s)
                    """,
                    (
                        session_id,
                        "user",
                        query
                    )
                )

                conn.commit()

        # ---------------------------------
        # Save Memory
        # ---------------------------------

        memory.add_message(
            session_id=session_id,
            role="user",
            content=query
        )

        # ---------------------------------
        # Build Memory Context
        # ---------------------------------

        history_context = memory.build_context(
            session_id
        )

        enhanced_query = f"""
Conversation History:
{history_context}

Current Question:
{query}
"""

        # ---------------------------------
        # Retrieve Chunks
        # ---------------------------------

        chunks = retrieve(
            enhanced_query,
            request.selected_documents
        )

        print(f"Retrieved {len(chunks)} chunks")

        # ---------------------------------
        # No Chunks
        # ---------------------------------

        if not chunks:

            return StreamingResponse(
                iter([
                    "No relevant financial information found."
                ]),
                media_type="text/plain"
            )

        # ---------------------------------
        # Limit Chunks
        # ---------------------------------

        chunks = chunks[:3]

        # ---------------------------------
        # Streaming Generator
        # ---------------------------------

        def stream_generator():

            full_response = ""

            for token in generate_stream(
                query=query,
                chunks=chunks
            ):

                full_response += token

                yield token

            # ---------------------------------
            # Save Assistant Message
            # ---------------------------------

            with get_db() as conn:

                with conn.cursor() as cur:

                    cur.execute(
                        """
                        INSERT INTO chat_sessions
                        (session_id, role, content)
                        VALUES (%s, %s, %s)
                        """,
                        (
                            session_id,
                            "assistant",
                            full_response
                        )
                    )

                    conn.commit()

            # ---------------------------------
            # Save Memory
            # ---------------------------------

            memory.add_message(
                session_id=session_id,
                role="assistant",
                content=full_response
            )

            # ---------------------------------
            # Stream Sources
            # ---------------------------------

            yield "\n\n[SOURCES]\n"

            used_sources = []

            for chunk in chunks:

                source = (
                    chunk.metadata.get(
                        "source",
                        "Unknown"
                    )
                    if chunk.metadata
                    else "Unknown"
                )

                if source not in used_sources:

                    used_sources.append(source)

                    yield f"{source}\n"

        return StreamingResponse(
            stream_generator(),
            media_type="text/plain"
        )

    except Exception as e:

        print(f"Streaming error: {e}")

        return StreamingResponse(
            iter([f"Error: {str(e)}"]),
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