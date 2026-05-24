from dataclasses import dataclass, field
from typing import List
from backend.config import settings


@dataclass
class Chunk:
    content: str
    metadata: dict = field(default_factory=dict)
    chunk_index: int = 0


def chunk_documents(docs: List) -> List[Chunk]:
    """
    Recursively split documents into chunks.

    Financial docs need careful splitting:
    - preserve paragraphs
    - preserve tables/lists
    - avoid breaking sections mid-way
    """

    all_chunks = []

    for doc in docs:

        # Skip empty documents
        if not doc.content or len(doc.content.strip()) < 50:
            print(
                f"Skipping empty/too-short document: "
                f"{doc.metadata.get('source', 'unknown')}"
            )
            continue

        chunks = _recursive_split(
            text=doc.content,
            chunk_size=settings.chunk_size,
            chunk_overlap=settings.chunk_overlap,
            separators=[
                "\n\n",
                "\n",
                ". ",
                "; ",
                ", ",
                " "
            ]
        )

        # Skip if splitting produced nothing
        if not chunks:
            continue

        for i, chunk_text in enumerate(chunks):

            if len(chunk_text.strip()) < 30:
                continue

            all_chunks.append(
                Chunk(
                    content=chunk_text.strip(),
                    metadata={
                        **doc.metadata,
                        "chunk_index": i,
                        "total_chunks": len(chunks),
                        "chunk_length": len(chunk_text),
                    },
                    chunk_index=i,
                )
            )

    print(f"Created {len(all_chunks)} chunks from {len(docs)} documents")

    return all_chunks


def _recursive_split(
    text: str,
    chunk_size: int,
    chunk_overlap: int,
    separators: List[str]
) -> List[str]:

    if not separators:
        return _split_by_size(text, chunk_size, chunk_overlap)

    separator = separators[0]

    splits = [
        s for s in text.split(separator)
        if s.strip()
    ]

    if not splits:
        return []

    chunks = []
    current = ""

    for split in splits:

        candidate = (
            current + separator + split
            if current else split
        )

        if _token_estimate(candidate) <= chunk_size:
            current = candidate

        else:

            if current:
                chunks.append(current)

            if _token_estimate(split) > chunk_size:

                sub_chunks = _recursive_split(
                    split,
                    chunk_size,
                    chunk_overlap,
                    separators[1:]
                )

                chunks.extend(sub_chunks)
                current = ""

            else:
                current = split

    if current:
        chunks.append(current)

    return _add_overlap(chunks, chunk_overlap)


def _split_by_size(
    text: str,
    chunk_size: int,
    chunk_overlap: int
) -> List[str]:

    char_size = chunk_size * 4
    overlap = chunk_overlap * 4

    step = max(char_size - overlap, 1)

    chunks = []

    start = 0

    while start < len(text):

        end = start + char_size

        chunks.append(text[start:end])

        start += step

    return chunks


def _add_overlap(
    chunks: List[str],
    overlap_tokens: int
) -> List[str]:

    if len(chunks) <= 1:
        return chunks

    overlap_chars = max(overlap_tokens * 4, 0)

    result = [chunks[0]]

    for i in range(1, len(chunks)):

        prev_tail = (
            chunks[i - 1][-overlap_chars:]
            if overlap_chars else ""
        )

        result.append(
            prev_tail + "\n" + chunks[i]
            if prev_tail else chunks[i]
        )

    return result


def _token_estimate(text: str) -> int:
    """
    Rough token estimate:
    ~4 chars per token for English text.
    """

    if not text:
        return 0

    return len(text) // 4