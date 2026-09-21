from __future__ import annotations

import json
import os
from dataclasses import dataclass
from pathlib import Path
from typing import Any

import joblib


@dataclass(frozen=True)
class ModelBundle:
    subject_type: str
    model_version: str
    regressor: Any
    classifier: Any
    residual_lower_ratio: float
    residual_upper_ratio: float
    validation_mae_ratio: float
    feature_names: tuple[str, ...]


class ModelRegistry:
    def __init__(self, artifact_directory: str | Path | None = None):
        directory = artifact_directory or os.getenv("CHAMPIONSCLUB_ML_ARTIFACT_DIR", "/app/artifacts")
        self.artifact_directory = Path(directory)
        self.metadata: dict[str, Any] = {}
        self.models: dict[str, ModelBundle] = {}
        self._load()

    def _load(self) -> None:
        metadata_path = self.artifact_directory / "metadata.json"
        if not metadata_path.exists():
            return
        try:
            self.metadata = json.loads(metadata_path.read_text(encoding="utf-8"))
            for subject_type in ("ADVISOR", "DEALERSHIP"):
                artifact_path = self.artifact_directory / f"{subject_type.lower()}.joblib"
                if not artifact_path.exists():
                    self.models = {}
                    return
                artifact = joblib.load(artifact_path)
                self.models[subject_type] = ModelBundle(
                    subject_type=subject_type,
                    model_version=str(artifact["model_version"]),
                    regressor=artifact["regressor"],
                    classifier=artifact["classifier"],
                    residual_lower_ratio=float(artifact["residual_lower_ratio"]),
                    residual_upper_ratio=float(artifact["residual_upper_ratio"]),
                    validation_mae_ratio=float(
                        artifact.get("validation_mae_ratio", artifact.get("test_mae_ratio", 1.0))
                    ),
                    feature_names=tuple(artifact["feature_names"]),
                )
        except (OSError, EOFError, ImportError, AttributeError, ValueError, KeyError, TypeError):
            self.metadata = {}
            self.models = {}

    @property
    def available(self) -> bool:
        return set(self.models) == {"ADVISOR", "DEALERSHIP"}

    @property
    def model_version(self) -> str:
        if not self.available:
            return "weekday-trend-fallback-v1"
        versions = {bundle.model_version for bundle in self.models.values()}
        return next(iter(versions)) if len(versions) == 1 else "mixed-model-artifacts"

    def get(self, subject_type: str) -> ModelBundle | None:
        return self.models.get(subject_type)
