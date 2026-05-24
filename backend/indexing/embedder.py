from sentence_transformers import SentenceTransformer
from typing import List


model = SentenceTransformer("all-MiniLM-L6-v2")



def embed_chunks(chunks: List) -> List:
    """
    Generate embeddings for document chunks.
    """

    texts = [
        f"Represent this financial document chunk: {chunk.content}"
        for chunk in chunks
    ]

    embeddings = model.encode(
        texts,
        show_progress_bar=True
    ).tolist()

    for chunk, embedding in zip(chunks, embeddings):
        chunk.embedding = embedding

    return chunks


def embed_query(query: str) -> List[float]:
    """
    Generate embedding for a search query.
    """

    query = (
        f"Represent this financial search query: {query}"
    )

    return model.encode(query).tolist()