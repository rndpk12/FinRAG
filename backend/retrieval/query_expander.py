from typing import List


def expand_query(query: str) -> List[str]:
    """
    Generate multiple retrieval queries from one user query.
    Improves recall for financial RAG.
    """

    queries = [query]

    q = query.lower()

    # Revenue-related
    if "revenue" in q:
        queries.extend([
            f"{query} business segments",
            f"{query} revenue growth",
            f"{query} operating income",
        ])

    # Risk-related
    if "risk" in q or "risks" in q:
        queries.extend([
            f"{query} risk factors",
            f"{query} competition",
            f"{query} macroeconomic risks",
        ])

    # Compare queries
    if "compare" in q:
        queries.extend([
            f"{query} financial performance",
            f"{query} growth comparison",
            f"{query} margins",
        ])

    # AI queries
    if "ai" in q or "artificial intelligence" in q:
        queries.extend([
            f"{query} data center",
            f"{query} AI demand",
            f"{query} accelerated computing",
        ])

    # Remove duplicates
    queries = list(dict.fromkeys(queries))

    return queries