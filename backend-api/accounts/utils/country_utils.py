from typing import Optional

# Canonical internal name for Haiti stored today is 'Haiti'
HAITI_VARIANTS = { 'haiti', 'haïti', 'ayiti', 'haití' }

CANONICAL_MAP = {
    # Map every variant (lowercased) to canonical English name used in DB legacy field
    **{v: 'Haiti' for v in HAITI_VARIANTS},
}

def normalize_country_name(raw: Optional[str]) -> Optional[str]:
    if not raw:
        return raw
    key = raw.strip().lower()
    return CANONICAL_MAP.get(key, raw.strip())
