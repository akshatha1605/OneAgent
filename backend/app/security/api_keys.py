
import os

from cryptography.fernet import Fernet, InvalidToken
from sqlalchemy.orm import Session

from app.database.models import UserAPIKey


def get_fernet() -> Fernet:
    encryption_key = os.getenv("API_KEY_ENCRYPTION_KEY")

    if not encryption_key:
        raise RuntimeError(
            "API_KEY_ENCRYPTION_KEY is not configured on the backend."
        )

    try:
        return Fernet(encryption_key.encode("utf-8"))
    except (ValueError, TypeError) as exc:
        raise RuntimeError(
            "API_KEY_ENCRYPTION_KEY is invalid. Generate a valid Fernet key."
        ) from exc


def encrypt_api_key(api_key: str) -> str:
    if not api_key or not api_key.strip():
        raise ValueError("API key cannot be empty.")

    encrypted = get_fernet().encrypt(api_key.strip().encode("utf-8"))
    return encrypted.decode("utf-8")


def decrypt_api_key(encrypted_key: str) -> str:
    try:
        decrypted = get_fernet().decrypt(encrypted_key.encode("utf-8"))
        return decrypted.decode("utf-8")
    except InvalidToken as exc:
        raise RuntimeError(
            "The stored API key could not be decrypted. "
            "Check that API_KEY_ENCRYPTION_KEY has not changed."
        ) from exc


def get_user_api_key(
    db: Session,
    user_id: str,
    provider: str,
) -> str | None:
    record = (
        db.query(UserAPIKey)
        .filter(
            UserAPIKey.user_id == user_id,
            UserAPIKey.provider == provider,
        )
        .first()
    )

    if record is None:
        return None

    return decrypt_api_key(record.encrypted_key)
