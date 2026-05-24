"""
Lightweight evaluation pipeline for Financial RAG.

Tracks:
- Answer relevance
- Average retrieved chunks
- Evaluation history
"""

import json
from typing import List

from backend.retrieval.retriever import retrieve
from backend.generation.generator_groq import generate
from backend.db import get_db


def run_evaluation(test_set_path: str) -> dict:

    with open(test_set_path) as f:
        test_cases = json.load(f)

    print(f"Running evaluation on {len(test_cases)} test cases...")

    total_relevance = 0
    total_chunks = 0

    results = []

    for i, case in enumerate(test_cases):

        print(
            f"  Evaluating {i + 1}/{len(test_cases)}: "
            f"{case['question'][:60]}..."
        )

        # Retrieve relevant chunks
        chunks = retrieve(case["question"])

        # Generate grounded answer
        result = generate(
            case["question"],
            chunks,
            stream=False
        )

        answer = result["answer"]

        # Simple relevance scoring
        expected = case["ground_truth"].lower()

        relevance = 0

        for word in expected.split():

            if word in answer.lower():
                relevance += 1

        relevance_score = relevance / max(len(expected.split()), 1)

        total_relevance += relevance_score
        total_chunks += len(chunks)

        results.append({
            "question": case["question"],
            "answer": answer,
            "relevance_score": round(relevance_score, 4),
            "chunks_used": len(chunks)
        })

    avg_relevance = total_relevance / len(test_cases)
    avg_chunks = total_chunks / len(test_cases)

    scores = {
        "answer_relevance": round(avg_relevance, 4),
        "avg_chunks_used": round(avg_chunks, 2),
        "n_questions": len(test_cases)
    }

    # Save to DB
    _save_eval_run(scores)

    # Print report
    _print_report(scores)

    return scores


def _save_eval_run(scores: dict):
    """
    Persist evaluation results to DB.
    """

    with get_db() as conn:

        with conn.cursor() as cur:

            cur.execute("""
                CREATE TABLE IF NOT EXISTS eval_runs (
                    id SERIAL PRIMARY KEY,
                    run_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    answer_relevance FLOAT,
                    avg_chunks_used FLOAT,
                    n_questions INT
                )
            """)

            cur.execute("""
                INSERT INTO eval_runs (
                    answer_relevance,
                    avg_chunks_used,
                    n_questions
                )
                VALUES (%s, %s, %s)
            """, (
                scores["answer_relevance"],
                scores["avg_chunks_used"],
                scores["n_questions"]
            ))

        conn.commit()


def get_eval_history() -> List[dict]:
    """
    Fetch previous evaluation runs.
    """

    with get_db() as conn:

        with conn.cursor() as cur:

            cur.execute("""
                SELECT
                    run_at,
                    answer_relevance,
                    avg_chunks_used,
                    n_questions
                FROM eval_runs
                ORDER BY run_at DESC
                LIMIT 50
            """)

            return [dict(row) for row in cur.fetchall()]


def _print_report(scores: dict):

    print("\n" + "=" * 50)
    print("EVALUATION RESULTS")
    print("=" * 50)

    print(
        f"Answer relevance: "
        f"{scores['answer_relevance']:.4f}"
    )

    print(
        f"Average chunks:   "
        f"{scores['avg_chunks_used']:.2f}"
    )

    print(
        f"Questions:        "
        f"{scores['n_questions']}"
    )

    print("=" * 50 + "\n")


if __name__ == "__main__":

    run_evaluation(
        "backend/evaluation/sample_test_set.json"
    )