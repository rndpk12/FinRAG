from typing import List
from sentence_transformers import CrossEncoder

_model = None

def _get_model() -> CrossEncoder:
    global _model
    if _model is None:
        print("Loading cross-encoder model...")
        _model = CrossEncoder(
    "BAAI/bge-reranker-large"
)
    return _model


def rerank(query: str, chunks: List, top_k: int = 3) -> List:
    """
    Cross-encoder reranking: unlike bi-encoders (used for embedding),
    a cross-encoder sees query + document together and gives a more
    accurate relevance score. Slower but only runs on top-20 candidates.
    """
    if not chunks:
        return []

    model = _get_model()
    pairs = [(query, chunk.content) for chunk in chunks]
    scores = model.predict(pairs)

    for chunk, score in zip(chunks, scores):
        chunk.rerank_score = float(score)
        chunk.metadata["rerank_score"] = float(score)

    reranked = sorted(
        chunks,
        key=lambda x: x.rerank_score,
        reverse=True
    )
    return reranked[:top_k]
