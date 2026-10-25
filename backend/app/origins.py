import os
import re

from dotenv import load_dotenv

load_dotenv()

# Addresses the website may be opened from during development: this
# computer, or another device on the same home/uni Wi-Fi network.
LOCAL_FRONTEND_ORIGIN = (
    r"^http://("
    r"localhost|127\.0\.0\.1"
    r"|192\.168\.\d{1,3}\.\d{1,3}"
    r"|10\.\d{1,3}\.\d{1,3}\.\d{1,3}"
    r"|172\.(1[6-9]|2\d|3[01])\.\d{1,3}\.\d{1,3}"
    r"):(3000|3001)$"
)

_LOCAL_FRONTEND_RE = re.compile(LOCAL_FRONTEND_ORIGIN)


def deployed_frontends() -> list[str]:
    """The live website address(es) from FRONTEND_URL, comma separated."""
    raw = os.getenv("FRONTEND_URL", "")
    return [url.strip().rstrip("/") for url in raw.split(",") if url.strip()]


def is_allowed_frontend(origin: str | None) -> bool:
    if not origin:
        return False
    return bool(_LOCAL_FRONTEND_RE.match(origin)) or origin.rstrip("/") in deployed_frontends()
