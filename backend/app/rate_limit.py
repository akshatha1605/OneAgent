import os
import time
from collections.abc import Callable

from fastapi import Depends, HTTPException, Request
from sqlalchemy.orm import Session

from app.auth import get_current_user
from app.database.database import get_db
from app.database.models import RateLimitBucket


DEFAULT_LIMITS = {
    "orchestrate": (20, 60),
    "message": (20, 60),
    "workflow": (10, 60),
    "api_key": (10, 60),
    "ip": (120, 60),
}


def _configured_limit(name: str) -> tuple[int, int]:
    default_limit, default_window = DEFAULT_LIMITS[name]
    raw_limit = os.getenv(f"RATE_LIMIT_{name.upper()}_LIMIT")
    raw_window = os.getenv(f"RATE_LIMIT_{name.upper()}_WINDOW_SECONDS")

    try:
        limit = int(raw_limit) if raw_limit else default_limit
        window = int(raw_window) if raw_window else default_window
    except ValueError:
        return default_limit, default_window

    return max(1, limit), max(1, window)


def _consume(
    db: Session,
    scope: str,
    subject: str,
    limit_name: str,
) -> int | None:
    limit, window_seconds = _configured_limit(limit_name)
    now = int(time.time())
    bucket_start = now - (now % window_seconds)
    key = f"{limit_name}:{scope}:{subject}"

    bucket = (
        db.query(RateLimitBucket)
        .filter(RateLimitBucket.bucket_key == key)
        .first()
    )

    if bucket is None or bucket.window_started != bucket_start:
        if bucket is None:
            bucket = RateLimitBucket(
                bucket_key=key,
                window_started=bucket_start,
                request_count=1,
            )
            db.add(bucket)
        else:
            bucket.window_started = bucket_start
            bucket.request_count = 1
        db.commit()
        return None

    if bucket.request_count >= limit:
        retry_after = max(1, bucket.window_started + window_seconds - now)
        return retry_after

    bucket.request_count += 1
    db.commit()
    return None


def enforce_user_rate_limit(limit_name: str) -> Callable:
    async def dependency(
        request: Request,
        db: Session = Depends(get_db),
        user: dict = Depends(get_current_user),
    ) -> None:
        retry_after = _consume(
            db=db,
            scope="user",
            subject=user["id"],
            limit_name=limit_name,
        )
        if retry_after is not None:
            raise HTTPException(
                status_code=429,
                detail="Rate limit exceeded. Please retry shortly.",
                headers={"Retry-After": str(retry_after)},
            )

    return dependency


def enforce_ip_rate_limit(
    db: Session,
    request: Request,
    limit_name: str = "ip",
) -> int | None:
    client_host = request.client.host if request.client else "unknown"
    return _consume(
        db=db,
        scope="ip",
        subject=client_host,
        limit_name=limit_name,
    )
