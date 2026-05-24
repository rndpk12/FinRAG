from vector_db import add_document, search_documents

# Add sample documents
add_document(
    "doc1",
    "Tesla revenue increased by 25 percent in 2025."
)

add_document(
    "doc2",
    "Apple announced new AI features for iPhone."
)

add_document(
    "doc3",
    "NVIDIA reported strong GPU sales growth."
)

# Search query
results = search_documents(
    "Which company had revenue growth?"
)

print(results)