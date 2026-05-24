from pdf_extractor import extract_text_from_pdf
from chunker import chunk_text
from vector_db import add_document

def ingest_pdf(pdf_path: str):

    print("Extracting PDF text...")

    # Step 1: Extract text
    text = extract_text_from_pdf(pdf_path)

    print("Chunking text...")

    # Step 2: Chunk text
    chunks = chunk_text(text)

    print(f"Total chunks created: {len(chunks)}")

    # Step 3: Store chunks
    for i, chunk in enumerate(chunks):

        doc_id = f"{pdf_path}_chunk_{i}"

        add_document(
            doc_id=doc_id,
            text=chunk
        )

    print("PDF ingestion completed successfully!")