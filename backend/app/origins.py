import re

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


def is_local_frontend(origin: str | None) -> bool:
    return bool(origin) and bool(_LOCAL_FRONTEND_RE.match(origin))
