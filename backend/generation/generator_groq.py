from typing import List
from groq import Groq

from backend.config import settings

client = Groq(
    api_key=settings.groq_api_key
)

SYSTEM_PROMPT = """
You are FinRAG, an elite AI financial research assistant.

Rules:
- Use ONLY provided context
- Never hallucinate
- Keep answers concise
- Use bullet points
- Mention key financial metrics
- Cite sources like [Source 1]
"""


# =========================================
# STREAMING GENERATE FUNCTION
# =========================================

def generate(query: str, chunks: List):

    try:

        context = _build_context(chunks)

        prompt = f"""
{SYSTEM_PROMPT}

Context:
{context}

Question:
{query}

Answer professionally.
"""

        print("Streaming answer from Groq...")

        stream = client.chat.completions.create(
            model="llama-3.1-8b-instant",
            messages=[
                {
                    "role": "system",
                    "content": SYSTEM_PROMPT
                },
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            temperature=0.1,
            max_tokens=500,
            stream=True
        )

        full_answer = ""

        for chunk in stream:

            delta = chunk.choices[0].delta.content

            if delta:

                full_answer += delta

        print("Groq streaming complete")

        return {
            "answer": full_answer,
            "sources": [
                _format_source(c.metadata or {}, i + 1)
                for i, c in enumerate(chunks)
            ]
        }

    except Exception as e:

        print(f"Groq streaming error: {e}")

        return {
            "answer": f"Generation error: {str(e)}",
            "sources": []
        }


# =========================================
# BUILD CONTEXT
# =========================================

def _build_context(chunks):

    parts = []

    for i, chunk in enumerate(chunks[:5], 1):

        content = chunk.content[:1200]

        source = _format_source(
            chunk.metadata or {},
            i
        )

        parts.append(
            f"[Source {i}] {source}\n{content}"
        )

    return "\n\n".join(parts)


# =========================================
# FORMAT SOURCES
# =========================================

def _format_source(metadata: dict, index: int):

    source = metadata.get(
        "source",
        "Unknown"
    )

    page = metadata.get("page")

    if page:
        return f"{source}, p.{page}"

    return source

def generate_stream(query: str, chunks: List):

    context = _build_context(chunks)

    prompt = f"""
{SYSTEM_PROMPT}

Context:
{context}

Question:
{query}

Answer professionally.
"""

    stream = client.chat.completions.create(
        model="llama-3.1-8b-instant",
        messages=[
            {
                "role": "system",
                "content": SYSTEM_PROMPT
            },
            {
                "role": "user",
                "content": prompt
            }
        ],
        temperature=0.1,
        max_tokens=500,
        stream=True
    )

    for chunk in stream:

        delta = chunk.choices[0].delta.content

        if delta:
            yield delta