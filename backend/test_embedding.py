from embeddings import generate_embedding

embedding = generate_embedding("Tesla revenue increased")

print(type(embedding))
print(len(embedding))
print(embedding[:5])