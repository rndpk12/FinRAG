import hashlib
from typing import List
from backend.ingest.chunker import Chunk
from backend.db import get_db


def deduplicate_chunks(chunks: List[Chunk]) -> List[Chunk]:
    """
    Two-stage dedup:
    1. In-memory: remove duplicates within this batch
    2. DB-level: skip chunks already stored (by content hash)
    """
    # Stage 1: deduplicate within the current batch
    seen_hashes = set()
    unique_chunks = []
    for chunk in chunks:
        h = _hash(chunk.content)
        if h not in seen_hashes:
            seen_hashes.add(h)
            unique_chunks.append(chunk)

    removed_in_batch = len(chunks) - len(unique_chunks)

    # Stage 2: check against DB
    hashes = [_hash(c.content) for c in unique_chunks]
    existing_hashes = _fetch_existing_hashes(hashes)

    final_chunks = [
        c for c in unique_chunks
        if _hash(c.content) not in existing_hashes
    ]

    removed_in_db = len(unique_chunks) - len(final_chunks)
    print(
        f"Dedup: {len(chunks)} → {len(final_chunks)} chunks "
        f"(removed {removed_in_batch} in-batch, {removed_in_db} already in DB)"
    )
    return final_chunks


def _hash(text: str) -> str:
    return hashlib.sha256(text.encode()).hexdigest()


def _fetch_existing_hashes(hashes: List[str]) -> set:
    if not hashes:
        return set()
    try:
        with get_db() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    "SELECT content_hash FROM documents WHERE content_hash = ANY(%s)",
                    (hashes,)
                )
                rows = cur.fetchall()
                return {row["content_hash"] for row in rows}
    except Exception:
        return set()
