from typing import List

from backend.indexing.embedder import embed_query
from backend.indexing.vector_store import dense_search
from backend.indexing.bm25_index import bm25_index

from backend.retrieval.query_expander import expand_query

from backend.database.db import get_db
from backend.database.models import Chunk

GREETING_QUERIES = {
    "hi",
    "hello",
    "hey",
    "good morning",
    "good evening",
    "how are you",
    "who are you"
}

# =========================================
# Context Formatter
# =========================================

def build_context(chunks: List[Chunk]) -> str:

    context = ""

    for chunk in chunks:

        source = (
            chunk.metadata.get("source", "Unknown")
            if chunk.metadata else "Unknown"
        )

        page = (
            chunk.metadata.get("page", "N/A")
            if chunk.metadata else "N/A"
        )

        context += f"""

SOURCE: {source}
PAGE: {page}

CONTENT:
{chunk.content}

----------------------------------------
"""

    return context.strip()


def retrieve(query, selected_documents=None, top_k=5):

    print(f"\nReceived query: {query}")

    normalized_query = query.lower().strip()

    if normalized_query in GREETING_QUERIES:
        print("Greeting detected → skipping retrieval")
        return []

    # =========================================
    # Expand Query
    # =========================================

    expanded_queries = expand_query(query)

    print(f"Expanded queries: {expanded_queries}")

    merged = {}

    # =========================================
    # Run Retrieval for Each Expanded Query
    # =========================================

    for q in expanded_queries:

        print(f"\nRunning retrieval for: {q}")

        # =========================================
        # Dense Search
        # =========================================

        query_embedding = embed_query(q)

        dense_results = dense_search(
            query_embedding=query_embedding,
            top_k=top_k * 3
        )

        print(f"Dense retrieved: {len(dense_results)}")

        for chunk in dense_results:

            # -----------------------------------
            # Metadata
            # -----------------------------------

            source = (
                chunk.metadata.get("source", "")
                if chunk.metadata else ""
            )

            # -----------------------------------
            # Document Filtering
            # -----------------------------------

            if (
                selected_documents
                and len(selected_documents) > 0
            ):

                if source not in selected_documents:
                    continue

            # -----------------------------------
            # Merge
            # -----------------------------------

            if (
    chunk.id not in merged
    and len(chunk.content.strip()) > 100
):

                chunk.retrieval_method = "dense"

                merged[chunk.id] = chunk

        # =========================================
        # Sparse Search (BM25)
        # =========================================

        sparse_hits = bm25_index.search(
            query=q,
            top_k=top_k * 3
        )

        print(f"Sparse retrieved: {len(sparse_hits)}")

        if sparse_hits:

            sparse_ids = [hit["id"] for hit in sparse_hits]

            with get_db() as conn:

                with conn.cursor() as cur:

                    cur.execute(
                        """
                        SELECT id, content, metadata
                        FROM documents
                        WHERE id = ANY(%s)
                        """,
                        (sparse_ids,)
                    )

                    rows = cur.fetchall()

            for row in rows:

                source = (
                    row["metadata"].get("source", "")
                    if row["metadata"] else ""
                )

                # -----------------------------------
                # Document Filtering
                # -----------------------------------

                if (
                    selected_documents
                    and len(selected_documents) > 0
                ):

                    if source not in selected_documents:
                        continue

                # -----------------------------------
                # Merge
                # -----------------------------------

                if (
    row["id"] not in merged
    and len(row["content"].strip()) > 100
):

                    chunk = Chunk(
                        id=row["id"],
                        content=row["content"],
                        metadata=row["metadata"]
                    )

                    chunk.retrieval_method = "sparse"

                    merged[row["id"]] = chunk

    # =========================================
    # Final Merge
    # =========================================

    final_chunks = list(merged.values())

    # =========================================
    # Sort by Chunk Length (Better heuristic)
    # =========================================

    final_chunks.sort(
    key=lambda x: (
        x.retrieval_method == "dense",
        len(x.content)
    ),
    reverse=True
)

    print(f"\nFinal merged chunks: {len(final_chunks)}")

    # =========================================
    # Final Top-K
    # =========================================

    return final_chunks[:top_k]