"""S3/presigned URL helpers (stubs)."""

def generate_presigned_url(key: str, expires_in: int = 3600):
    return f"https://example.com/{key}?expires_in={expires_in}"
