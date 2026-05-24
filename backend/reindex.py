from pathlib import Path

from backend.ingest.loaders import load_pdf
from backend.ingest.chunker import chunk_documents
from backend.indexing.embedder import embed_chunks
from backend.indexing.vector_store import insert_chunks


DATA_DIR = Path("backend/data/financial_reports")


def main():

    all_docs = []

    pdf_files = list(DATA_DIR.glob("*.pdf"))

    print(f"Found {len(pdf_files)} PDF files")

    for pdf_path in pdf_files:

        print(f"\nLoading: {pdf_path.name}")

        docs = load_pdf(str(pdf_path))

        all_docs.extend(docs)

    print(f"\nLoaded {len(all_docs)} pages total")

    chunks = chunk_documents(all_docs)

    print(f"Created {len(chunks)} chunks")

    embedded_chunks = embed_chunks(chunks)

    inserted = insert_chunks(embedded_chunks)

    print(f"\nInserted {inserted} chunks into database")


if __name__ == "__main__":
    main()