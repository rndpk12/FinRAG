from fastapi import APIRouter, HTTPException

from backend.auth.models import (
    UserSignup,
    UserLogin
)

from backend.auth.security import (
    hash_password,
    verify_password,
    create_access_token
)

from backend.database.db import get_db

router = APIRouter()


# -----------------------------
# SIGNUP
# -----------------------------

@router.post("/signup")
def signup(user: UserSignup):

    with get_db() as conn:

        with conn.cursor() as cur:

            # Check existing user
            cur.execute(
                "SELECT * FROM users WHERE email = %s",
                (user.email,)
            )

            existing_user = cur.fetchone()

            if existing_user:
                raise HTTPException(
                    status_code=400,
                    detail="User already exists"
                )

            # Hash password
            hashed_password = hash_password(
                user.password
            )

            # Insert user
            cur.execute("""
                INSERT INTO users (
                    name,
                    email,
                    password
                )
                VALUES (%s, %s, %s)
            """, (
                user.name,
                user.email,
                hashed_password
            ))

    token = create_access_token({
        "sub": user.email
    })

    return {
        "token": token,
        "user": {
            "name": user.name,
            "email": user.email
        }
    }


# -----------------------------
# LOGIN
# -----------------------------

@router.post("/login")
def login(user: UserLogin):

    with get_db() as conn:

        with conn.cursor() as cur:

            cur.execute(
                "SELECT * FROM users WHERE email = %s",
                (user.email,)
            )

            db_user = cur.fetchone()

    if not db_user:
        raise HTTPException(
            status_code=401,
            detail="Invalid credentials"
        )

    if not verify_password(
        user.password,
        db_user["password"]
    ):
        raise HTTPException(
            status_code=401,
            detail="Invalid credentials"
        )

    token = create_access_token({
        "sub": user.email
    })

    return {
        "token": token,
        "user": {
            "name": db_user["name"],
            "email": db_user["email"]
        }
    }