from groq import Groq
from vector_db import search_documents
from config import settings

# Initialize Groq client
client = Groq(api_key=settings.groq_api_key)

def ask_finrag(query: str):

    # Step 1: Retrieve relevant chunks
    results = search_documents(query)

    retrieved_docs = results["documents"][0]

    # Combine retrieved context
    context = "\n\n".join(retrieved_docs)

    # Step 2: Build prompt
    system_prompt = f"""
You are FinRAG, an elite AI financial research assistant.

Answer ONLY using the provided context.

Context:
{context}
"""

    # Step 3: Send to Groq
    response = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[
            {
                "role": "system",
                "content": system_prompt
            },
            {
                "role": "user",
                "content": query
            }
        ],
        temperature=0.2
    )

    return response.choices[0].message.content