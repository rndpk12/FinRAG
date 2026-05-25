from groq import Groq

from backend.config import settings

from backend.retrieval.retriever import (
    retrieve,
    build_context
)

# =========================================
# Groq Client
# =========================================

client = Groq(
    api_key=settings.groq_api_key
)

# =========================================
# System Prompt
# =========================================

SYSTEM_PROMPT = """
You are FinRAG, an elite AI financial research assistant.

You answer like a professional Wall Street equity research analyst.

Rules:
- Use ONLY the provided context
- Never hallucinate facts
- If information is missing, clearly say so
- Structure answers professionally
- Use markdown formatting
- Always cite sources

Citation format:

(Source: filename, Page X)

Example:
(Source: tesla_q1_2026.pdf, Page 8)

FORMAT:

# Title

## Financial Highlights
- Revenue
- Profitability
- Margins

## Business Performance
- Segment analysis
- Growth drivers
- Risks

## Key Takeaways
- Investor insights
- Strategic observations

## Sources
- Mention referenced reports
"""

# =========================================
# Main RAG Function
# =========================================

def ask_finrag(
    query: str,
    selected_documents=None
):

    # =====================================
    # Retrieve Chunks
    # =====================================

    chunks = retrieve(
        query=query,
        selected_documents=selected_documents,
        top_k=5
    )

    # =====================================
    # Build Context
    # =====================================

    context = build_context(chunks)

    # =====================================
    # User Prompt
    # =====================================

    user_prompt = f"""
QUESTION:
{query}

CONTEXT:
{context}
"""

    # =====================================
    # Generate Response
    # =====================================

    response = client.chat.completions.create(
        model="llama-3.3-70b-versatile",

        messages=[
            {
                "role": "system",
                "content": SYSTEM_PROMPT
            },
            {
                "role": "user",
                "content": user_prompt
            }
        ],

        temperature=0.2,
    )

    return response.choices[0].message.content