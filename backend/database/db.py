import psycopg2
from psycopg2.extras import RealDictCursor
from contextlib import contextmanager

from backend.config import settings


# =========================================
# Database Connection
# =========================================

def get_connection():

    return psycopg2.connect(
        settings.database_url,
        cursor_factory=RealDictCursor
    )


# =========================================
# Database Context Manager
# =========================================

@contextmanager
def get_db():

    conn = get_connection()

    try:

        yield conn

        conn.commit()

    except Exception:

        conn.rollback()

        raise

    finally:

        conn.close()


# =========================================
# Initialize Database
# =========================================

def init_db():

    with get_db() as conn:

        with conn.cursor() as cur:

            # ---------------------------------
            # Documents Table
            # ---------------------------------

            cur.execute("""
                CREATE TABLE IF NOT EXISTS documents (
                    id SERIAL PRIMARY KEY,
                    content TEXT NOT NULL,
                    embedding TEXT,
                    metadata JSONB DEFAULT '{}',
                    content_hash VARCHAR(64) UNIQUE,
                    created_at TIMESTAMP DEFAULT NOW()
                );
            """)

            # ---------------------------------
            # Evaluation Runs Table
            # ---------------------------------

            cur.execute("""
                CREATE TABLE IF NOT EXISTS eval_runs (
                    id SERIAL PRIMARY KEY,
                    run_at TIMESTAMP DEFAULT NOW(),
                    config JSONB DEFAULT '{}',
                    faithfulness FLOAT,
                    answer_relevance FLOAT,
                    context_recall FLOAT,
                    precision_at_5 FLOAT
                );
            """)

            # ---------------------------------
            # Users Table
            # ---------------------------------

            cur.execute("""
                CREATE TABLE IF NOT EXISTS users (
                    id SERIAL PRIMARY KEY,
                    name TEXT NOT NULL,
                    email TEXT UNIQUE NOT NULL,
                    password TEXT NOT NULL,
                    created_at TIMESTAMP DEFAULT NOW()
                );
            """)

            # ---------------------------------
            # Chat Sessions Table
            # ---------------------------------

            cur.execute("""
                CREATE TABLE IF NOT EXISTS chat_sessions (
                    id SERIAL PRIMARY KEY,
                    session_id TEXT,
                    role TEXT,
                    content TEXT,
                    created_at TIMESTAMP DEFAULT NOW()
                );
            """)

    print("Database initialized successfully.")


# =========================================
# Run Directly
# =========================================

if __name__ == "__main__":

    init_db()