import hashlib

def generate_seed(forest_id: int, epoch_start: str, epoch_end: str) -> int:
    """
    Deterministically generate a 32-bit seed based on
    forest + verification epoch.
    """

    raw = f"{forest_id}:{epoch_start}:{epoch_end}".encode("utf-8")

    # SHA256 for stability across Python versions
    digest = hashlib.sha256(raw).hexdigest()

    # Convert first 8 hex chars → 32-bit int
    seed = int(digest[:8], 16)

    return seed
