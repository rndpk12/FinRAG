import chromadb
from embeddings import generate_embedding

# Initialize Chroma client
client = chromadb.PersistentClient(path="./chroma_db")

# Create collection
collection = client.get_or_create_collection(
    name="financial_docs"
)

def add_document(doc_id: str, text: str):
    """
    Store document embedding in ChromaDB
    """

    embedding = generate_embedding(text)

    collection.add(
        ids=[doc_id],
        documents=[text],
        embeddings=[embedding]
    )

    print(f"Document {doc_id} added successfully")


def search_documents(query: str, n_results=3):
    """
    Search similar documents
    """

    query_embedding = generate_embedding(query)

    results = collection.query(
        query_embeddings=[query_embedding],
        n_results=n_results
    )

    return results