
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.auth import get_current_user
from app.database.database import get_db
from app.database.models import UserAPIKey
from app.security.api_keys import encrypt_api_key
from app.rate_limit import enforce_user_rate_limit


router = APIRouter(prefix="/api/settings", tags=["Settings"])

ALLOWED_PROVIDERS = {
    "openai",
    "gemini",
    "groq",
    "grok",
    "tavily",
}


class APIKeyRequest(BaseModel):
    api_key: str = Field(min_length=1, max_length=4096)


def validate_provider(provider: str) -> str:
    provider = provider.strip().lower()

    if provider not in ALLOWED_PROVIDERS:
        raise HTTPException(
            status_code=404,
            detail="Unsupported API-key provider.",
        )

    return provider


@router.get("/api-keys")
async def list_api_keys(
    db: Session = Depends(get_db),
    user: dict = Depends(get_current_user),
):
    records = (
        db.query(UserAPIKey)
        .filter(UserAPIKey.user_id == user["id"])
        .all()
    )

    saved = {record.provider: record for record in records}

    return {
        "providers": [
            {
                "provider": provider,
                "configured": provider in saved,
                "updated_at": (
                    saved[provider].updated_at.isoformat()
                    if provider in saved and saved[provider].updated_at
                    else None
                ),
            }
            for provider in sorted(ALLOWED_PROVIDERS)
        ]
    }


@router.put(
    "/api-keys/{provider}",
    dependencies=[Depends(enforce_user_rate_limit("api_key"))],
)
async def save_api_key(
    provider: str,
    request: APIKeyRequest,
    db: Session = Depends(get_db),
    user: dict = Depends(get_current_user),
):
    provider = validate_provider(provider)
    api_key = request.api_key.strip()

    if not api_key:
        raise HTTPException(
            status_code=400,
            detail="API key cannot be empty.",
        )

    try:
        encrypted_key = encrypt_api_key(api_key)
    except (RuntimeError, ValueError):
        raise HTTPException(
            status_code=503,
            detail="API-key encryption is unavailable. Check backend configuration.",
        )

    record = (
        db.query(UserAPIKey)
        .filter(
            UserAPIKey.user_id == user["id"],
            UserAPIKey.provider == provider,
        )
        .first()
    )

    now = datetime.now(timezone.utc).replace(tzinfo=None)

    if record:
        record.encrypted_key = encrypted_key
        record.updated_at = now
    else:
        record = UserAPIKey(
            user_id=user["id"],
            provider=provider,
            encrypted_key=encrypted_key,
            created_at=now,
            updated_at=now,
        )
        db.add(record)

    try:
        db.commit()
    except Exception:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail="Could not save the API key.",
        )

    return {
        "provider": provider,
        "configured": True,
        "updated_at": now.isoformat(),
        "message": "API key saved securely.",
    }


@router.delete(
    "/api-keys/{provider}",
    dependencies=[Depends(enforce_user_rate_limit("api_key"))],
)
async def delete_api_key(
    provider: str,
    db: Session = Depends(get_db),
    user: dict = Depends(get_current_user),
):
    provider = validate_provider(provider)

    record = (
        db.query(UserAPIKey)
        .filter(
            UserAPIKey.user_id == user["id"],
            UserAPIKey.provider == provider,
        )
        .first()
    )

    if not record:
        raise HTTPException(
            status_code=404,
            detail="No saved API key exists for this provider.",
        )

    db.delete(record)

    try:
        db.commit()
    except Exception:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail="Could not delete the API key.",
        )

    return {
        "provider": provider,
        "configured": False,
        "message": "Saved API key deleted.",
    }
