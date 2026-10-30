import os


def provider_timeout_seconds(provider: str) -> float:
    raw_value = os.getenv(
        f"{provider.upper()}_TIMEOUT_SECONDS",
        os.getenv("PROVIDER_TIMEOUT_SECONDS", "45"),
    )
    try:
        return max(1.0, float(raw_value))
    except ValueError:
        return 45.0


def is_retryable_provider_error(error: Exception) -> bool:
    text = str(error).upper()
    permanent_markers = (
        "401",
        "403",
        "400",
        "INVALID API KEY",
        "AUTHENTICATION",
        "PERMISSION",
        "NOT FOUND",
        "MODEL NOT FOUND",
    )
    if any(marker in text for marker in permanent_markers):
        return False

    return any(
        marker in text
        for marker in (
            "408",
            "409",
            "429",
            "500",
            "502",
            "503",
            "504",
            "TIMEOUT",
            "TIMED OUT",
            "UNAVAILABLE",
            "RESOURCE_EXHAUSTED",
            "CONNECTION",
        )
    )


def retry_delay_seconds(attempt: int) -> float:
    return min(8.0, 2**attempt)
