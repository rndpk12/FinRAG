from pdf_extractor import extract_text_from_pdf
from chunker import chunk_text

# Extract PDF text
text = extract_text_from_pdf("sample.pdf")

# Chunk text
chunks = chunk_text(text)

print("Total chunks:", len(chunks))

print("\nFIRST CHUNK:\n")
print(chunks[0][:500])