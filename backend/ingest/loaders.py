import hashlib
import re
from pathlib import Path
from dataclasses import dataclass, field
from typing import List
import requests
from bs4 import BeautifulSoup
import pypdf


@dataclass
class RawDocument:
    content: str
    metadata: dict = field(default_factory=dict)

    def content_hash(self) -> str:
        return hashlib.sha256(self.content.encode()).hexdigest()


def load_pdf(file_path: str) -> List[RawDocument]:
    """Load a PDF file — works for SEC filings and analyst reports."""
    docs = []
    path = Path(file_path)
    reader = pypdf.PdfReader(file_path)

    for i, page in enumerate(reader.pages):
        text = page.extract_text() or ""
        text = _clean_text(text)
        if len(text.strip()) < 50:
            continue
        docs.append(RawDocument(
            content=text,
            metadata={
                "source": path.name,
                "source_type": "pdf",
                "page": i + 1,
                "total_pages": len(reader.pages),
                "file_path": str(path),
            }
        ))
    print(f"Loaded {len(docs)} pages from {path.name}")
    return docs


def load_url(url: str, label: str = "") -> List[RawDocument]:
    """
    Load a web article — works for financial news.
    Note: some sites (Yahoo Finance, Bloomberg) block scrapers.
    Use Reuters, BBC Business, or SEC EDGAR for reliable results.
    """
    headers = {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
                      "AppleWebKit/537.36 (KHTML, like Gecko) "
                      "Chrome/120.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.5",
    }

    try:
        response = requests.get(url, headers=headers, timeout=15)
        response.raise_for_status()
    except requests.exceptions.HTTPError as e:
        raise ValueError(f"Failed to fetch URL ({e}). Try Reuters or BBC Business instead.")
    except requests.exceptions.Timeout:
        raise ValueError(f"Request timed out for {url}")

    soup = BeautifulSoup(response.text, "html.parser")

    # Remove noise
    for tag in soup(["script", "style", "nav", "footer", "header",
                     "aside", "iframe", "noscript", "form"]):
        tag.decompose()

    title = soup.find("title")
    title_text = title.get_text(strip=True) if title else label or url

    # Extract meaningful paragraphs
    paragraphs = soup.find_all(["p", "h1", "h2", "h3", "li", "article"])
    content = "\n".join(
        p.get_text(strip=True)
        for p in paragraphs
        if len(p.get_text(strip=True)) > 30  # skip tiny fragments
    )
    content = _clean_text(content)

    if len(content.strip()) < 100:
        raise ValueError(
            f"Too little content extracted from {url}. "
            f"This site may block scrapers. "
            f"Try: https://www.reuters.com/finance or https://www.bbc.com/news/business"
        )

    return [RawDocument(
        content=content,
        metadata={
            "source": title_text,
            "source_type": "news_article",
            "url": url,
        }
    )]


def load_text(file_path: str, source_type: str = "research_report") -> List[RawDocument]:
    """Load a plain text or markdown file."""
    path = Path(file_path)
    content = path.read_text(encoding="utf-8")
    content = _clean_text(content)

    if len(content.strip()) < 50:
        raise ValueError(f"File {path.name} is empty or too short to index.")

    return [RawDocument(
        content=content,
        metadata={
            "source": path.name,
            "source_type": source_type,
            "file_path": str(path),
        }
    )]


def _clean_text(text: str) -> str:
    text = re.sub(r'\n{3,}', '\n\n', text)
    text = re.sub(r'[ \t]{2,}', ' ', text)
    text = re.sub(r'[^\x20-\x7E\n]', ' ', text)
    return text.strip()
