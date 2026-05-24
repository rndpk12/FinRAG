from sentence_transformers import SentenceTransformer

# Load embedding model
model = SentenceTransformer("BAAI/bge-small-en")

def generate_embedding(text: str):
    """
    Convert text into vector embedding.
    """
    embedding = model.encode(text)

    # convert numpy array → normal python list
    return embedding.tolist()