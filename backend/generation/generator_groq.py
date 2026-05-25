from typing import List

from groq import Groq

from backend.config import settings

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
- Be concise but insightful
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
- Operational trends
- Growth drivers

## Key Takeaways
- Important investor insights
- Risks

## Sources
- Mention referenced reports
"""

# =========================================
# Build Context
# =========================================

def _build_context(chunks: List):

    parts = []

    for chunk in chunks[:5]:

        source = (
            chunk.metadata.get("source", "Unknown")
            if chunk.metadata else "Unknown"
        )

        page = (
            chunk.metadata.get("page", "N/A")
            if chunk.metadata else "N/A"
        )

        content = chunk.content[:1500]

        parts.append(
            f"""
SOURCE: {source}
PAGE: {page}

CONTENT:
{content}
"""
        )

    return "\n\n------------------------\n\n".join(parts)

# =========================================
# Non-Streaming Generation
# =========================================

def generate(
    query: str,
    chunks: List
):

    try:

        context = _build_context(chunks)

        user_prompt = f"""
QUESTION:
{query}

CONTEXT:
{context}
"""

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

            temperature=0.1,
            max_tokens=700
        )

        answer = response.choices[0].message.content

        return {
            "answer": answer,
            "sources": [
                _format_source(c.metadata or {})
                for c in chunks
            ]
        }

    except Exception as e:

        print(f"Groq generation error: {e}")

        return {
            "answer": f"Generation error: {str(e)}",
            "sources": []
        }

# =========================================
# Streaming Generation
# =========================================

def generate_stream(
    query: str,
    chunks: List
):

    try:

        context = _build_context(chunks)

        user_prompt = f"""
QUESTION:
{query}

CONTEXT:
{context}
"""

        stream = client.chat.completions.create(
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

            temperature=0.1,
            max_tokens=700,
            stream=True
        )

        for chunk in stream:

            delta = chunk.choices[0].delta.content

            if delta:
                yield delta

    except Exception as e:

        print(f"Streaming error: {e}")

        yield f"\n\nGeneration error: {str(e)}"

# =========================================
# Format Source
# =========================================

def _format_source(metadata: dict):

    source = metadata.get(
        "source",
        "Unknown"
    )

    page = metadata.get("page")

    if page:
        return f"{source}, Page {page}"

    return source