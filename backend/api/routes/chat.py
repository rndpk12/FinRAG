from fastapi import APIRouter
from pydantic import BaseModel

from rag_pipeline import ask_finrag

router = APIRouter()


# Request body schema
class ChatRequest(BaseModel):
    query: str


@router.post("/chat")
async def chat(request: ChatRequest):

    answer = ask_finrag(request.query)

    return {
        "query": request.query,
        "answer": answer
    }