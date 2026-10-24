from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.chat import router as chat_router

from app.core.database import Base
from app.core.database import engine
from app.models.user import User

Base.metadata.create_all(bind=engine)

app = FastAPI(title="Atlas API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(
    chat_router,
    prefix="/api/chat",
    tags=["Chat"]
)

@app.get("/")
def root():
    return {
        "message": "Atlas API Running"
    }