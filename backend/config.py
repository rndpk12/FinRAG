from dotenv import load_dotenv

import os

load_dotenv()

class Settings:

    groq_api_key = os.getenv(
        "GROQ_API_KEY"
    )

    database_url = os.getenv(
        "DATABASE_URL"
    )

    jwt_secret = os.getenv(
        "JWT_SECRET"
    )

settings = Settings()