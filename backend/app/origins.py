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


def _clean(url: str) -> str:
    """Forgive small slips: quotes, spaces, a missing https://, a trailing /."""
    url = url.strip().strip("'\"").strip().rstrip("/").lower()
    if url and not url.startswith(("http://", "https://")):
        url = "https://" + url
    return url


def deployed_frontends() -> list[str]:
    """The live website address(es) from FRONTEND_URL, comma separated.

    A '*' matches one part of an address, so preview links work too, e.g.
    FRONTEND_URL=https://itec-322.vercel.app,https://itec-322-*-parth-ebfa.vercel.app
    """
    raw = os.getenv("FRONTEND_URL", "")
    return [_clean(url) for url in raw.split(",") if _clean(url)]


def _pattern(url: str) -> str:
    # '*' becomes "letters, numbers or dashes"; everything else is literal
    return "".join("[a-z0-9-]+" if part == "*" else re.escape(part) for part in re.split(r"(\*)", url))


def allowed_origin_regex() -> str:
    """One regex for every address the website may be opened from."""
    live = [_pattern(url) for url in deployed_frontends()]
    if not live:
        return LOCAL_FRONTEND_ORIGIN
    return "(?:" + LOCAL_FRONTEND_ORIGIN + ")|(?:^(?:" + "|".join(live) + ")$)"


def is_allowed_frontend(origin: str | None) -> bool:
    if not origin:
        return False
    return re.fullmatch(allowed_origin_regex(), origin.lower().rstrip("/")) is not None
