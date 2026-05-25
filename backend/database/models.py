from sqlalchemy import Column, Integer, String, Text
from backend.database.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)

    name = Column(String, nullable=False)

    email = Column(String, unique=True, nullable=False)

    password = Column(String, nullable=False)


class ChatMessage(Base):
    __tablename__ = "messages"

    id = Column(Integer, primary_key=True, index=True)

    session_id = Column(String, index=True)

    role = Column(String)

    content = Column(Text)

from dataclasses import dataclass
from typing import Dict


@dataclass
class Chunk:
    id: str
    content: str
    metadata: Dict
    retrieval_method: str = ""