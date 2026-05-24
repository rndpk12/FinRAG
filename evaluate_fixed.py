"""
Financial RAG Evaluation Script
================================
Runs evaluation without requiring RAGAS cloud dependencies.
Measures:
  - Context Recall:    Did retrieval find the right chunks?
  - Answer Faithfulness: Does the answer stay within retrieved context?
  - Answer Relevance:  Does the answer address the question?
  - Precision@5:       How many of the top-5 chunks are relevant?

Usage:
  python evaluate.py
"""

import json
import time
import sys
import os
from typing import List, Dict
from datetime import datetime
from pathlib import Path

# Ensure backend is importable
sys.path.insert(0, str(Path(__file__).parent))

# Now import from backend
try:
    from backend.retrieval.retriever import retrieve
    from backend.generation.generator import generate
except ImportError as e:
    print(f"ERROR: Cannot import backend modules: {e}")
    print(f"Current directory: {os.getcwd()}")
    print(f"Python path: {sys.path}")
    sys.exit(1)


# ─── Evaluation metrics ──────────────────────────────────────────────────────

def compute_context_recall(retrieved_chunks: List, ground_truth_contexts: List[str]) -> float:
    """
    What fraction of ground truth context was retrieved?
    Uses simple token overlap (no external deps needed).
    """
    if not ground_truth_contexts or not retrieved_chunks:
        return 0.0

    retrieved_text = " ".join(c.content.lower() for c in retrieved_chunks)
    scores = []

    for gt_ctx in ground_truth_contexts:
        gt_tokens = set(gt_ctx.lower().split())
        if not gt_tokens:
            continue
        overlap = sum(1 for t in gt_tokens if t in retrieved_text)
        scores.append(overlap / len(gt_tokens))

    return sum(scores) / len(scores) if scores else 0.0


def compute_precision_at_k(retrieved_chunks: List, ground_truth_contexts: List[str], k: int = 5) -> float:
    """
    Of the top-k retrieved chunks, how many are relevant to the ground truth?
    A chunk is 'relevant' if it has >20% token overlap with any ground truth context.
    """
    if not retrieved_chunks or not ground_truth_contexts:
        return 0.0

    top_k = retrieved_chunks[:k]
    gt_text = " ".join(ctx.lower() for ctx in ground_truth_contexts)
    gt_tokens = set(gt_text.split())

    relevant = 0
    for chunk in top_k:
        chunk_tokens = set(chunk.content.lower().split())
        overlap = len(chunk_tokens & gt_tokens) / max(len(gt_tokens), 1)
        if overlap > 0.05:  # 5% overlap threshold
            relevant += 1

    return relevant / len(top_k)


def compute_answer_relevance(question: str, answer: str) -> float:
    """
    Does the answer address the question?
    Measures keyword overlap between question terms and answer.
    """
    STOPWORDS = {"what", "is", "the", "a", "an", "how", "why", "when",
                 "does", "do", "are", "were", "was", "in", "of", "to",
                 "and", "or", "for", "on", "at", "by", "with", "from"}

    q_tokens = set(question.lower().split()) - STOPWORDS
    a_tokens = set(answer.lower().split())

    if not q_tokens:
        return 0.0

    overlap = len(q_tokens & a_tokens) / len(q_tokens)
    return min(overlap * 2, 1.0)  # Scale up, cap at 1.0


def compute_faithfulness(answer: str, retrieved_chunks: List) -> float:
    """
    Does the answer only use information present in the retrieved context?
    Measures what fraction of answer sentences have support in context.
    """
    if not retrieved_chunks:
        return 0.0

    context = " ".join(c.content.lower() for c in retrieved_chunks)
    context_tokens = set(context.split())

    sentences = [s.strip() for s in answer.split('.') if len(s.strip()) > 20]
    if not sentences:
        return 1.0

    faithful_count = 0
    for sentence in sentences:
        sent_tokens = set(sentence.lower().split())
        content_words = sent_tokens - {"the", "a", "an", "is", "are", "was",
                                        "were", "and", "or", "but", "in", "of",
                                        "to", "for", "on", "at", "by", "with",
                                        "according", "source", "context"}
        if not content_words:
            faithful_count += 1
            continue
        overlap = len(content_words & context_tokens) / len(content_words)
        if overlap > 0.3:
            faithful_count += 1

    return faithful_count / len(sentences)


# ─── Main evaluation loop ─────────────────────────────────────────────────────

def run_evaluation(test_set_path: str = "eval_test_set.json") -> Dict:
    print("\n" + "=" * 60)
    print("  FINANCIAL RAG EVALUATION")
    print("=" * 60)

    with open(test_set_path) as f:
        test_cases = json.load(f)

    print(f"  Running {len(test_cases)} test cases...\n")

    results = []
    all_scores = {
        "context_recall": [],
        "precision_at_5": [],
        "answer_relevance": [],
        "faithfulness": [],
    }

    for i, case in enumerate(test_cases):
        question = case["question"]
        ground_truth = case.get("ground_truth", "")
        ground_truth_contexts = case.get("ground_truth_contexts", [])

        print(f"  [{i+1}/{len(test_cases)}] {question[:55]}...")

        try:
            # Retrieve
            t0 = time.time()
            chunks = retrieve(question)
            retrieval_time = time.time() - t0

            # Generate
            t1 = time.time()
            result = generate(question, chunks, stream=False)
            generation_time = time.time() - t1
            answer = result["answer"]

            # Score
            ctx_recall = compute_context_recall(chunks, ground_truth_contexts)
            prec_at_5 = compute_precision_at_k(chunks, ground_truth_contexts, k=5)
            ans_relevance = compute_answer_relevance(question, answer)
            faithfulness = compute_faithfulness(answer, chunks)

            all_scores["context_recall"].append(ctx_recall)
            all_scores["precision_at_5"].append(prec_at_5)
            all_scores["answer_relevance"].append(ans_relevance)
            all_scores["faithfulness"].append(faithfulness)

            results.append({
                "question": question,
                "answer": answer[:150] + "...",
                "context_recall": round(ctx_recall, 3),
                "precision_at_5": round(prec_at_5, 3),
                "answer_relevance": round(ans_relevance, 3),
                "faithfulness": round(faithfulness, 3),
                "retrieval_ms": round(retrieval_time * 1000),
                "generation_ms": round(generation_time * 1000),
                "chunks_retrieved": len(chunks),
            })

            print(f"         recall={ctx_recall:.2f}  faith={faithfulness:.2f}  "
                  f"relevance={ans_relevance:.2f}  p@5={prec_at_5:.2f}")

        except Exception as e:
            print(f"         ERROR: {e}")
            results.append({"question": question, "error": str(e)})

        time.sleep(0.5)  # Small delay between API calls

    # Aggregate scores
    avg_scores = {
        k: round(sum(v) / len(v), 4) if v else 0.0
        for k, v in all_scores.items()
    }

    # Print report
    print("\n" + "=" * 60)
    print("  RESULTS")
    print("=" * 60)
    print(f"  Context Recall:    {avg_scores['context_recall']:.4f}  "
          f"(did retrieval find the right chunks?)")
    print(f"  Faithfulness:      {avg_scores['faithfulness']:.4f}  "
          f"(does answer stay within context?)")
    print(f"  Answer Relevance:  {avg_scores['answer_relevance']:.4f}  "
          f"(does answer address the question?)")
    print(f"  Precision@5:       {avg_scores['precision_at_5']:.4f}  "
          f"(relevant chunks in top 5?)")
    print(f"\n  Test cases: {len(test_cases)}")
    print(f"  Timestamp:  {datetime.now().strftime('%Y-%m-%d %H:%M')}")
    print("=" * 60)

    # Save results
    output = {
        "timestamp": datetime.now().isoformat(),
        "avg_scores": avg_scores,
        "per_question": results,
    }
    with open("eval_results.json", "w") as f:
        json.dump(output, f, indent=2)

    print(f"\n  Full results saved to eval_results.json")
    print("\n  📋 Resume bullet (copy this):")
    print(f"  Context Recall {avg_scores['context_recall']:.2f} · "
          f"Faithfulness {avg_scores['faithfulness']:.2f} · "
          f"Answer Relevance {avg_scores['answer_relevance']:.2f} · "
          f"Precision@5 {avg_scores['precision_at_5']:.2f}")

    return avg_scores


if __name__ == "__main__":
    run_evaluation()
