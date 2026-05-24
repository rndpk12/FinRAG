import pickle
import re
from pathlib import Path
from typing import List
from rank_bm25 import BM25Okapi
from backend.db import get_db
from backend.config import settings

INDEX_PATH = Path("bm25_index.pkl")


class BM25Index:
    def __init__(self):
        self.bm25 = None
        self.doc_ids: List[int] = []
        self.corpus: List[List[str]] = []

    def build(self):
        """Build BM25 index from all documents currently in the DB."""
        print("Building BM25 index from database...")
        with get_db() as conn:
            with conn.cursor() as cur:
                cur.execute("SELECT id, content FROM documents ORDER BY id")
                rows = cur.fetchall()

        self.doc_ids = [row["id"] for row in rows]
        self.corpus = [_tokenize(row["content"]) for row in rows]
        self.bm25 = BM25Okapi(self.corpus)

        self.save()
        print(f"BM25 index built with {len(self.doc_ids)} documents")

    def search(self, query: str, top_k: int = None) -> List[dict]:
        """Return top_k results with BM25 scores."""
        if self.bm25 is None:
            self.load()
        if self.bm25 is None:
            print("Warning: BM25 index not available, skipping sparse search")
            return []

        k = top_k or settings.top_k_sparse
        tokens = _tokenize(query)
        scores = self.bm25.get_scores(tokens)

        # Get top-k indices by score
        top_indices = sorted(range(len(scores)), key=lambda i: scores[i], reverse=True)[:k]

        results = []
        for idx in top_indices:
            if scores[idx] > 0:
                results.append({
                    "id": self.doc_ids[idx],
                    "bm25_score": float(scores[idx]),
                    "retrieval_method": "sparse",
                })
        return results

    def save(self):
        with open(INDEX_PATH, "wb") as f:
            pickle.dump({"bm25": self.bm25, "doc_ids": self.doc_ids}, f)

    def load(self):
        if INDEX_PATH.exists():
            with open(INDEX_PATH, "rb") as f:
                data = pickle.load(f)
                self.bm25 = data["bm25"]
                self.doc_ids = data["doc_ids"]
            print(f"BM25 index loaded ({len(self.doc_ids)} docs)")
        else:
            print("No BM25 index found — run build() first")


def _tokenize(text: str) -> List[str]:
    """Simple lowercase tokenizer with stopword removal."""
    STOPWORDS = {"the", "a", "an", "and", "or", "but", "in", "on", "at", "to", "for",
                 "of", "with", "by", "from", "is", "was", "are", "were", "be", "been"}
    tokens = re.findall(r'\b[a-zA-Z0-9]+\b', text.lower())
    return [t for t in tokens if t not in STOPWORDS and len(t) > 1]


bm25_index = BM25Index()
