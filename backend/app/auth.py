import os
from importlib import import_module
from typing import Any

import httpx
from fastapi import Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer


try:
    load_dotenv = import_module("dotenv").load_dotenv
    load_dotenv()
except ImportError:
    pass


security = HTTPBearer(auto_error=False)


async def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(security),
) -> dict[str, Any]:
    """Validate a Supabase access token and return the verified user."""

    if credentials is None or credentials.scheme.lower() != "bearer":
        raise HTTPException(
            status_code=401,
            detail="Authentication required",
            headers={"WWW-Authenticate": "Bearer"},
        )

    supabase_url = os.getenv("SUPABASE_URL")
    supabase_anon_key = os.getenv("SUPABASE_ANON_KEY")

    if not supabase_url or not supabase_anon_key:
        raise HTTPException(
            status_code=500,
            detail="Authentication service is not configured",
        )

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(
                f"{supabase_url.rstrip('/')}/auth/v1/user",
                headers={
                    "apikey": supabase_anon_key,
                    "Authorization": (
                        f"Bearer {credentials.credentials}"
                    ),
                },
            )

        if response.status_code != 200:
            raise HTTPException(
                status_code=401,
                detail="Invalid or expired access token",
                headers={"WWW-Authenticate": "Bearer"},
            )

        user = response.json()

        if not isinstance(user, dict) or not user.get("id"):
            raise HTTPException(
                status_code=401,
                detail="Invalid authentication response",
            )

        return {
            "id": user["id"],
            "email": user.get("email"),
            "user_metadata": user.get("user_metadata") or {},
        }

    except HTTPException:
        raise
    except (httpx.HTTPError, ValueError):
        raise HTTPException(
            status_code=503,
            detail="Unable to verify authentication",
        )
