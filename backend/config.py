from dotenv import load_dotenv
import os

load_dotenv()


class Settings:

    # =========================================
    # API Keys
    # =========================================

    groq_api_key = os.getenv(
        "GROQ_API_KEY"
    )

    # =========================================
    # Database
    # =========================================

    database_url = os.getenv(
        "DATABASE_URL"
    )

    # =========================================
    # Auth
    # =========================================

    jwt_secret = os.getenv(
        "JWT_SECRET"
    )

    # =========================================
    # Retrieval Settings
    # =========================================

    top_k_dense = 5

    # =========================================
    # Chunking
    # =========================================

    chunk_size = 800

    chunk_overlap = 100


settings = Settings()