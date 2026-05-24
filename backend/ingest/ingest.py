import os
from types import SimpleNamespace

from backend.ingest.pdf_parser import parse_pdf
from backend.ingest.chunker import chunk_documents

from backend.indexing.embedder import embed_chunks
from backend.indexing.vector_store import insert_chunks


DATA_DIR = "backend/data/financial_reports"


def ingest():

    pdf_files = [
        f for f in os.listdir(DATA_DIR)
        if f.endswith(".pdf")
    ]

    print(f"Found {len(pdf_files)} PDFs")

    for pdf in pdf_files:

        path = os.path.join(DATA_DIR, pdf)

        print(f"\nProcessing: {pdf}")

        # -------------------------------
        # Parse PDF
        # -------------------------------

        text = parse_pdf(path)

        # -------------------------------
        # Create temp document object
        # -------------------------------

        doc = SimpleNamespace(
            content=text,
            metadata={
                "source": pdf
            }
        )

        # -------------------------------
        # Chunking
        # -------------------------------

        chunks = chunk_documents([doc])

        print(f"Created {len(chunks)} chunks")

        # -------------------------------
        # Embedding
        # -------------------------------

        embedded_chunks = embed_chunks(chunks)

        print(f"Embedded {len(embedded_chunks)} chunks")

        # -------------------------------
        # Store in DB
        # -------------------------------

        inserted = insert_chunks(embedded_chunks)

        print(f"Inserted {inserted} chunks")


if __name__ == "__main__":
    ingest()