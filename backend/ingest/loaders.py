import hashlib
import re
from pathlib import Path
from dataclasses import dataclass, field
from typing import List

import requests
from bs4 import BeautifulSoup
import pypdf


# =========================================
# Raw Document
# =========================================

@dataclass
class RawDocument:
    content: str
    metadata: dict = field(default_factory=dict)

    def content_hash(self) -> str:
        return hashlib.sha256(
            self.content.encode()
        ).hexdigest()


# =========================================
# PDF Loader
# =========================================

def load_pdf(file_path: str) -> List[RawDocument]:
    """
    Load PDF files such as:
    - SEC filings
    - Earnings reports
    - Analyst reports
    """

    docs = []

    path = Path(file_path)

    reader = pypdf.PdfReader(file_path)

    total_pages = len(reader.pages)

    for page_num, page in enumerate(reader.pages):

        try:
            text = page.extract_text() or ""

        except Exception as e:

            print(f"Failed to read page {page_num + 1}: {e}")

            continue

        text = _clean_text(text)

        # Skip empty/noisy pages
        if len(text.strip()) < 50:
            continue

        docs.append(
            RawDocument(
                content=text,
                metadata={
                    "source": path.name,
                    "source_type": "pdf",
                    "page": page_num + 1,
                    "total_pages": total_pages,
                    "file_path": str(path),
                }
            )
        )

    print(f"Loaded {len(docs)} pages from {path.name}")

    return docs


# =========================================
# URL Loader
# =========================================

def load_url(
    url: str,
    label: str = ""
) -> List[RawDocument]:
    """
    Load financial news articles or web pages.
    """

    headers = {
        "User-Agent": (
            "Mozilla/5.0 "
            "(Macintosh; Intel Mac OS X 10_15_7) "
            "AppleWebKit/537.36 "
            "(KHTML, like Gecko) "
            "Chrome/120.0.0.0 Safari/537.36"
        ),
        "Accept": (
            "text/html,application/xhtml+xml,"
            "application/xml;q=0.9,*/*;q=0.8"
        ),
        "Accept-Language": "en-US,en;q=0.5",
    }

    try:

        response = requests.get(
            url,
            headers=headers,
            timeout=15
        )

        response.raise_for_status()

    except requests.exceptions.HTTPError as e:

        raise ValueError(
            f"Failed to fetch URL ({e})"
        )

    except requests.exceptions.Timeout:

        raise ValueError(
            f"Request timed out for {url}"
        )

    soup = BeautifulSoup(
        response.text,
        "html.parser"
    )

    # Remove noisy tags
    for tag in soup([
        "script",
        "style",
        "nav",
        "footer",
        "header",
        "aside",
        "iframe",
        "noscript",
        "form",
    ]):
        tag.decompose()

    title = soup.find("title")

    title_text = (
        title.get_text(strip=True)
        if title
        else label or url
    )

    paragraphs = soup.find_all([
        "p",
        "h1",
        "h2",
        "h3",
        "li",
        "article",
    ])

    content = "\n".join(
        p.get_text(strip=True)
        for p in paragraphs
        if len(p.get_text(strip=True)) > 30
    )

    content = _clean_text(content)

    if len(content.strip()) < 100:

        raise ValueError(
            f"Too little content extracted from {url}"
        )

    return [
        RawDocument(
            content=content,
            metadata={
                "source": title_text,
                "source_type": "news_article",
                "url": url,
            }
        )
    ]


# =========================================
# Text Loader
# =========================================

def load_text(
    file_path: str,
    source_type: str = "research_report"
) -> List[RawDocument]:

    path = Path(file_path)

    content = path.read_text(
        encoding="utf-8"
    )

    content = _clean_text(content)

    if len(content.strip()) < 50:

        raise ValueError(
            f"{path.name} is empty or too short."
        )

    return [
        RawDocument(
            content=content,
            metadata={
                "source": path.name,
                "source_type": source_type,
                "file_path": str(path),
            }
        )
    ]


# =========================================
# Text Cleaning
# =========================================

def _clean_text(text: str) -> str:

    # Remove excessive newlines
    text = re.sub(
        r"\n{3,}",
        "\n\n",
        text
    )

    # Remove extra spaces
    text = re.sub(
        r"[ \t]{2,}",
        " ",
        text
    )

    # Remove weird unicode artifacts
    text = re.sub(
        r"[^\x20-\x7E\n]",
        " ",
        text
    )

    return text.strip()