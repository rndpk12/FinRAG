from dataclasses import dataclass, field
from typing import List, Optional


@dataclass
class Chunk:
    # Core fields — always required
    content: str
    metadata: dict = field(default_factory=dict)

    # Set after DB insert or retrieval
    id: Optional[int] = None

    # Set by embedder.py
    embedding: Optional[List[float]] = None

    # Set by vector_store.dense_search
    score: Optional[float] = None
    retrieval_method: Optional[str] = None

    # Set by reranker.py
    rerank_score: Optional[float] = None
