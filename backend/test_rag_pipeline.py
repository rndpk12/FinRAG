from rag_pipeline import ask_finrag
from vector_db import add_document

# Step 1: Add sample documents
add_document("doc1", "Tesla revenue increased by 25 percent in 2025.")
add_document("doc2", "Apple announced new AI features for iPhone.")
add_document("doc3", "NVIDIA reported strong GPU sales growth.")

# Step 2: Ask a question
query = "Which company had revenue growth?"

answer = ask_finrag(query)

print("User Query:", query)
print("AI Answer:\n", answer)