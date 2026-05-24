from pdf_extractor import extract_text_from_pdf
from chunker import chunk_text
from vector_db import add_document

import os


# =========================================
# PDF Ingestion Function
# =========================================

def ingest_pdf(pdf_path: str):

    print("\n===================================")
    print("Starting PDF ingestion...")
    print("===================================\n")

    # -----------------------------------
    # Check File Exists
    # -----------------------------------

    if not os.path.exists(pdf_path):

        print(f"ERROR: File not found -> {pdf_path}")
        return

    # -----------------------------------
    # Step 1: Extract PDF Text
    # -----------------------------------

    print("Extracting PDF text...")

    text = extract_text_from_pdf(pdf_path)

    if not text or len(text.strip()) == 0:

        print("ERROR: No text extracted from PDF")
        return

    print(f"Extracted {len(text)} characters")

    # -----------------------------------
    # Step 2: Chunk Text
    # -----------------------------------

    print("\nChunking text...")

    chunks = chunk_text(text)

    if not chunks:

        print("ERROR: No chunks created")
        return

    print(f"Total chunks created: {len(chunks)}")

    # -----------------------------------
    # Step 3: Store Chunks
    # -----------------------------------

    print("\nStoring chunks in vector database...\n")

    success_count = 0

    for i, chunk in enumerate(chunks):

        try:

            doc_id = (
                f"{os.path.basename(pdf_path)}_chunk_{i}"
            )

            add_document(
                doc_id=doc_id,
                text=chunk
            )

            success_count += 1

            print(
                f"Stored chunk "
                f"{i + 1}/{len(chunks)}"
            )

        except Exception as e:

            print(
                f"Failed to store chunk {i}: {e}"
            )

    # -----------------------------------
    # Completed
    # -----------------------------------

    print("\n===================================")
    print("PDF ingestion completed successfully!")
    print(
        f"Successfully stored "
        f"{success_count} chunks"
    )
    print("===================================\n")


# =========================================
# Main
# =========================================

if __name__ == "__main__":

    pdf_path = (
        "backend/data/apple_10q_2026.pdf"
    )

    ingest_pdf(pdf_path)