import hashlib
import json
from typing import List

from backend.db import get_db
from backend.config import settings
from backend.models import Chunk


# =========================================
# Insert Chunks
# =========================================

def insert_chunks(embedded_chunks: List) -> int:

    inserted = 0

    with get_db() as conn:

        with conn.cursor() as cur:

            for chunk in embedded_chunks:

                content_hash = hashlib.sha256(
                    chunk.content.encode()
                ).hexdigest()

                embedding_str = "[" + ",".join(
                    str(x) for x in chunk.embedding
                ) + "]"

                try:

                    cur.execute(
                        """
                        INSERT INTO documents
                        (content, embedding, metadata, content_hash)

                        VALUES (%s, %s, %s, %s)

                        ON CONFLICT (content_hash)
                        DO NOTHING
                        """,
                        (
                            chunk.content,
                            embedding_str,
                            json.dumps(chunk.metadata),
                            content_hash,
                        )
                    )

                    if cur.rowcount > 0:
                        inserted += 1

                except Exception as e:

                    print(f"Insert error: {e}")

    print(f"Inserted {inserted}/{len(embedded_chunks)} chunks")

    return inserted


# =========================================
# Dense Search
# =========================================

def dense_search(
    query_embedding: List[float],
    top_k: int = None
) -> List[Chunk]:

    k = top_k or settings.top_k_dense

    with get_db() as conn:

        with conn.cursor() as cur:

            cur.execute(
                """
                SELECT
                    id,
                    content,
                    metadata
                FROM documents
                LIMIT %s
                """,
                (k,)
            )

            rows = cur.fetchall()

    chunks = []

    for row in rows:

        chunk = Chunk(
            id=row["id"],
            content=row["content"],
            metadata=row["metadata"]
        )

        chunk.retrieval_method = "dense"

        chunks.append(chunk)

    return chunks


# =========================================
# Count
# =========================================

def get_chunk_count() -> int:

    with get_db() as conn:

        with conn.cursor() as cur:

            cur.execute(
                "SELECT COUNT(*) as count FROM documents"
            )

            return cur.fetchone()["count"]