import json
from pathlib import Path


def load_calibration(path: Path) -> dict:
    with path.open(encoding="utf-8") as handle:
        return json.load(handle)


def normalized(weights: dict[str, float]) -> dict[str, float]:
    total = sum(weights.values())
    if total <= 0:
        raise ValueError("Calibration weights must have a positive total.")
    return {key: value / total for key, value in weights.items()}
