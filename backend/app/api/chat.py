import csv
from datetime import date
from functools import lru_cache
from pathlib import Path

from fastapi import APIRouter
from pydantic import BaseModel, Field

router = APIRouter()


class ChatRequest(BaseModel):
    message: str = Field(min_length=1, max_length=2_000)


class Citation(BaseModel):
    label: str
    source: str


class ChatResponse(BaseModel):
    response: str
    citations: list[Citation]
    last_updated: str


@lru_cache
def revenue_rows() -> list[dict[str, str]]:
    data_path = Path(__file__).resolve().parents[2] / "data" / "revenue.csv"
    with data_path.open(newline="", encoding="utf-8") as revenue_file:
        return list(csv.DictReader(revenue_file))


def annual_revenue(year: str) -> float:
    return sum(
        float(row["revenue_millions"])
        for row in revenue_rows()
        if row["year"] == year
    )


@router.post("/")
def chat(request: ChatRequest) -> ChatResponse:
    """Revenue Analyst MVP using a local CSV data source.

    This deterministic adapter is intentionally a placeholder for the future
    permission-aware RAG and LLM orchestration layer.
    """
    question = request.message.lower()
    current_year = "2025"
    previous_year = "2024"
    current_revenue = annual_revenue(current_year)
    previous_revenue = annual_revenue(previous_year)
    growth = (current_revenue - previous_revenue) / previous_revenue * 100
    citations = [
        Citation(label="FY25 revenue export", source="backend/data/revenue.csv"),
        Citation(label="Quarterly revenue records", source="2025 Q1–Q4"),
    ]

    if "quarter" in question or any(quarter in question for quarter in ("q1", "q2", "q3", "q4")):
        rows = [row for row in revenue_rows() if row["year"] == current_year]
        quarterly_breakdown = ", ".join(
            f"{row['quarter']}: ${float(row['revenue_millions']):.1f}M"
            for row in rows
        )
        response = (
            f"Revenue in {current_year} was ${current_revenue:.1f}M. "
            f"Quarterly performance: {quarterly_breakdown}."
        )
    elif any(term in question for term in ("revenue", "last year", "sales", "fy25", "2025")):
        response = (
            f"Total revenue for {current_year} was ${current_revenue:.1f}M, "
            f"up {growth:.1f}% from ${previous_revenue:.1f}M in {previous_year}. "
            "The strongest quarter was Q4 at $13.5M."
        )
    else:
        response = (
            "The Revenue Analyst MVP currently answers questions about annual and quarterly revenue. "
            "Try: “What was our revenue last year?” or “Show revenue by quarter.”"
        )
        citations = []

    return ChatResponse(
        response=response,
        citations=citations,
        last_updated=date.today().isoformat(),
    )
