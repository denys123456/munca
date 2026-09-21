from __future__ import annotations

import argparse
import hashlib
import json
from bisect import bisect_left, bisect_right
from dataclasses import dataclass
from datetime import date, timedelta
from pathlib import Path
from typing import Iterable

import joblib
import numpy as np
from sklearn.ensemble import HistGradientBoostingClassifier, HistGradientBoostingRegressor
from sklearn.linear_model import LogisticRegression, Ridge
from sklearn.metrics import (
    accuracy_score,
    brier_score_loss,
    mean_absolute_error,
    mean_squared_error,
    roc_auc_score,
)
from sklearn.pipeline import make_pipeline
from sklearn.preprocessing import StandardScaler

from app.features import FEATURE_NAMES, build_feature_vector

CHECKPOINT_DAYS = (7, 14, 21)
HISTORY_DAYS = 180
MIN_TRAINING_PERIOD_START = date(2024, 7, 1)
TRAIN_END = date(2025, 12, 31)
VALIDATION_END = date(2026, 4, 30)
MODEL_FAMILY = "snapshot-selected-v2"
RANDOM_STATE = 20260916
INTERVAL_ALPHA = 0.10
ECE_BINS = 10
MAX_ACCEPTABLE_ECE = 0.08
MIN_ACCEPTABLE_ROC_AUC = 0.75
MIN_ACCEPTABLE_INTERVAL_COVERAGE = 0.85


@dataclass(frozen=True)
class SaleRecord:
    sale_date: date
    amount: float
    cancelled_at: date | None


@dataclass(frozen=True)
class TargetRecord:
    owner_type: str
    owner_id: int
    period_start: date
    period_end: date
    target_amount: float


@dataclass(frozen=True)
class TrainingExample:
    owner_type: str
    period_end: date
    features: tuple[float, ...]
    final_ratio: float
    target_reached: int
    baseline_ratio: float


class SaleIndex:
    def __init__(self, sales: Iterable[SaleRecord]):
        ordered = sorted(sales, key=lambda sale: sale.sale_date)
        self.sales = ordered
        self.dates = [sale.sale_date for sale in ordered]

    def between(self, start: date, end: date) -> list[SaleRecord]:
        left = bisect_left(self.dates, start)
        right = bisect_right(self.dates, end)
        return self.sales[left:right]

    def daily_history(self, start: date, end: date, as_of: date) -> list[tuple[date, float]]:
        totals: dict[date, float] = {}
        for sale in self.between(start, end):
            if sale.cancelled_at is not None and sale.cancelled_at <= as_of:
                continue
            totals[sale.sale_date] = totals.get(sale.sale_date, 0.0) + sale.amount
        history: list[tuple[date, float]] = []
        day = start
        while day <= end:
            history.append((day, totals.get(day, 0.0)))
            day += timedelta(days=1)
        return history

    def period_total_as_of(self, start: date, end: date, as_of: date) -> float:
        total = 0.0
        for sale in self.between(start, end):
            if sale.cancelled_at is None or sale.cancelled_at > as_of:
                total += sale.amount
        return total


def _read_jsonl(path: Path):
    with path.open(encoding="utf-8") as handle:
        for line in handle:
            if line.strip():
                yield json.loads(line)


def _load_sales(data_directory: Path):
    advisors: dict[int, list[SaleRecord]] = {}
    dealerships: dict[int, list[SaleRecord]] = {}
    for payload in _read_jsonl(data_directory / "sales.jsonl"):
        sale = SaleRecord(
            sale_date=date.fromisoformat(payload["saleDate"]),
            amount=float(payload["contractAmount"]),
            cancelled_at=(
                date.fromisoformat(payload["cancelledAt"][:10])
                if payload.get("cancelledAt")
                else None
            ),
        )
        advisors.setdefault(int(payload["advisorId"]), []).append(sale)
        dealerships.setdefault(int(payload["dealershipId"]), []).append(sale)
    return (
        {owner_id: SaleIndex(records) for owner_id, records in advisors.items()},
        {owner_id: SaleIndex(records) for owner_id, records in dealerships.items()},
    )


def _load_targets(data_directory: Path) -> list[TargetRecord]:
    targets: list[TargetRecord] = []
    for payload in _read_jsonl(data_directory / "targets.jsonl"):
        targets.append(
            TargetRecord(
                owner_type=str(payload["ownerType"]),
                owner_id=int(payload["ownerId"]),
                period_start=date.fromisoformat(payload["periodStart"]),
                period_end=date.fromisoformat(payload["periodEnd"]),
                target_amount=float(payload["targetAmount"]),
            )
        )
    return targets


def _manifest(data_directory: Path) -> dict:
    return json.loads((data_directory / "dataset_manifest.json").read_text(encoding="utf-8"))


def _data_fingerprint(data_directory: Path) -> str:
    digest = hashlib.sha256()
    for name in ("dataset_manifest.json", "sales.jsonl", "targets.jsonl"):
        path = data_directory / name
        with path.open("rb") as handle:
            while chunk := handle.read(1024 * 1024):
                digest.update(chunk)
    return digest.hexdigest()


def _checkpoint(period_start: date, period_end: date, day_of_month: int) -> date:
    candidate = period_start.replace(day=min(day_of_month, period_end.day))
    return min(candidate, period_end)


def build_examples(data_directory: Path) -> tuple[list[TrainingExample], dict]:
    manifest = _manifest(data_directory)
    dataset_end = date.fromisoformat(manifest["periodEnd"])
    advisor_sales, dealership_sales = _load_sales(data_directory)
    sale_indexes = {"ADVISOR": advisor_sales, "DEALERSHIP": dealership_sales}
    examples: list[TrainingExample] = []
    for target in _load_targets(data_directory):
        if target.period_start < MIN_TRAINING_PERIOD_START:
            continue
        if target.period_end > dataset_end:
            continue
        if target.target_amount <= 0:
            continue
        index = sale_indexes[target.owner_type].get(target.owner_id)
        if index is None:
            continue
        final_amount = index.period_total_as_of(
            target.period_start,
            target.period_end,
            target.period_end,
        )
        final_ratio = final_amount / target.target_amount
        for checkpoint_day in CHECKPOINT_DAYS:
            as_of = _checkpoint(target.period_start, target.period_end, checkpoint_day)
            history_start = as_of - timedelta(days=HISTORY_DAYS - 1)
            history = index.daily_history(history_start, as_of, as_of)
            features = tuple(
                build_feature_vector(
                    history,
                    target.period_start,
                    target.period_end,
                    as_of,
                    target.target_amount,
                )
            )
            baseline_ratio = max(features[3], features[4])
            examples.append(
                TrainingExample(
                    owner_type=target.owner_type,
                    period_end=target.period_end,
                    features=features,
                    final_ratio=final_ratio,
                    target_reached=int(final_ratio >= 1.0),
                    baseline_ratio=baseline_ratio,
                )
            )
    return examples, manifest


def split_name(period_end: date) -> str:
    if period_end <= TRAIN_END:
        return "train"
    if period_end <= VALIDATION_END:
        return "validation"
    return "test"


def _arrays(examples: list[TrainingExample]):
    x = np.asarray([example.features for example in examples], dtype=np.float64)
    regression = np.asarray([example.final_ratio for example in examples], dtype=np.float64)
    classification = np.asarray([example.target_reached for example in examples], dtype=np.int64)
    baseline = np.asarray([example.baseline_ratio for example in examples], dtype=np.float64)
    return x, regression, classification, baseline


def _hgb_regressor():
    return HistGradientBoostingRegressor(
        loss="squared_error",
        learning_rate=0.05,
        max_iter=80,
        max_leaf_nodes=15,
        min_samples_leaf=40,
        l2_regularization=0.2,
        random_state=RANDOM_STATE,
    )


def _ridge_regressor():
    return make_pipeline(StandardScaler(), Ridge(alpha=1.0))


def _hgb_classifier():
    return HistGradientBoostingClassifier(
        loss="log_loss",
        learning_rate=0.05,
        max_iter=80,
        max_leaf_nodes=15,
        min_samples_leaf=40,
        l2_regularization=0.2,
        random_state=RANDOM_STATE,
    )


def _logistic_classifier():
    return make_pipeline(
        StandardScaler(),
        LogisticRegression(max_iter=1000, random_state=RANDOM_STATE),
    )


def _auc(y_true: np.ndarray, probabilities: np.ndarray) -> float | None:
    return float(roc_auc_score(y_true, probabilities)) if len(np.unique(y_true)) > 1 else None


def expected_calibration_error(
    y_true: np.ndarray,
    probabilities: np.ndarray,
    bins: int = ECE_BINS,
) -> float:
    """Weighted absolute calibration gap across fixed probability bins."""
    if bins <= 0:
        raise ValueError("bins must be positive")
    edges = np.linspace(0.0, 1.0, bins + 1)
    total = 0.0
    for index in range(bins):
        lower = edges[index]
        upper = edges[index + 1]
        if index == bins - 1:
            mask = (probabilities >= lower) & (probabilities <= upper)
        else:
            mask = (probabilities >= lower) & (probabilities < upper)
        count = int(np.sum(mask))
        if count == 0:
            continue
        observed = float(np.mean(y_true[mask]))
        predicted = float(np.mean(probabilities[mask]))
        total += (count / len(y_true)) * abs(observed - predicted)
    return float(total)


def residual_interval(
    calibration_y: np.ndarray,
    calibration_prediction: np.ndarray,
    alpha: float = INTERVAL_ALPHA,
) -> tuple[float, float]:
    """Fit an asymmetric empirical residual interval on calibration data only."""
    if not 0.0 < alpha < 1.0:
        raise ValueError("alpha must be between zero and one")
    residuals = calibration_y - calibration_prediction
    return (
        float(np.quantile(residuals, alpha / 2.0)),
        float(np.quantile(residuals, 1.0 - alpha / 2.0)),
    )


def interval_coverage(
    y_true: np.ndarray,
    prediction: np.ndarray,
    lower_residual: float,
    upper_residual: float,
) -> float:
    lower = prediction + lower_residual
    upper = prediction + upper_residual
    return float(np.mean((y_true >= lower) & (y_true <= upper)))


def _subject_metrics(subject_type: str, examples: list[TrainingExample]):
    groups = {
        name: [example for example in examples if split_name(example.period_end) == name]
        for name in ("train", "validation", "test")
    }
    if any(not groups[name] for name in groups):
        raise ValueError(f"{subject_type} requires non-empty train, validation and test splits.")

    train_x, train_y, train_class, _ = _arrays(groups["train"])
    validation_x, validation_y, validation_class, _ = _arrays(groups["validation"])
    test_x, test_y, test_class, test_baseline = _arrays(groups["test"])

    # Candidate fitting is train-only. Validation is used for model selection and interval calibration.
    regression_candidates = {
        "HIST_GRADIENT_BOOSTING": _hgb_regressor().fit(train_x, train_y),
        "RIDGE": _ridge_regressor().fit(train_x, train_y),
    }
    regression_benchmark: dict[str, dict[str, float]] = {}
    validation_regression_predictions: dict[str, np.ndarray] = {}
    test_regression_predictions: dict[str, np.ndarray] = {}
    for name, candidate in regression_candidates.items():
        validation_prediction = np.maximum(0.0, candidate.predict(validation_x))
        test_prediction = np.maximum(0.0, candidate.predict(test_x))
        validation_regression_predictions[name] = validation_prediction
        test_regression_predictions[name] = test_prediction
        regression_benchmark[name] = {
            "validationMaeRatio": float(mean_absolute_error(validation_y, validation_prediction)),
            "testMaeRatio": float(mean_absolute_error(test_y, test_prediction)),
        }

    selected_regressor_name = min(
        regression_benchmark,
        key=lambda name: regression_benchmark[name]["validationMaeRatio"],
    )
    regressor = regression_candidates[selected_regressor_name]
    validation_prediction = validation_regression_predictions[selected_regressor_name]
    test_prediction = test_regression_predictions[selected_regressor_name]

    classification_candidates = {
        "HIST_GRADIENT_BOOSTING": _hgb_classifier().fit(train_x, train_class),
        "LOGISTIC_REGRESSION": _logistic_classifier().fit(train_x, train_class),
    }
    classification_benchmark: dict[str, dict[str, float | None]] = {}
    validation_classification_probabilities: dict[str, np.ndarray] = {}
    test_classification_probabilities: dict[str, np.ndarray] = {}
    for name, candidate in classification_candidates.items():
        validation_probability = candidate.predict_proba(validation_x)[:, 1]
        test_probability = candidate.predict_proba(test_x)[:, 1]
        validation_classification_probabilities[name] = validation_probability
        test_classification_probabilities[name] = test_probability
        classification_benchmark[name] = {
            "validationBrierScore": float(brier_score_loss(validation_class, validation_probability)),
            "validationExpectedCalibrationError": expected_calibration_error(
                validation_class, validation_probability
            ),
            "validationRocAuc": _auc(validation_class, validation_probability),
            "testBrierScore": float(brier_score_loss(test_class, test_probability)),
            "testExpectedCalibrationError": expected_calibration_error(test_class, test_probability),
            "testRocAuc": _auc(test_class, test_probability),
        }

    selected_classifier_name = min(
        classification_benchmark,
        key=lambda name: classification_benchmark[name]["validationBrierScore"],
    )
    classifier = classification_candidates[selected_classifier_name]
    validation_probability = validation_classification_probabilities[selected_classifier_name]
    test_probability = test_classification_probabilities[selected_classifier_name]

    # Critical leakage control: interval parameters are learned from validation residuals only.
    lower_ratio, upper_ratio = residual_interval(validation_y, validation_prediction)
    validation_coverage = interval_coverage(
        validation_y, validation_prediction, lower_ratio, upper_ratio
    )
    test_coverage = interval_coverage(test_y, test_prediction, lower_ratio, upper_ratio)

    baseline_mae = float(mean_absolute_error(test_y, test_baseline))
    model_mae = float(mean_absolute_error(test_y, test_prediction))
    train_positive_rate = float(np.mean(train_class))
    no_skill_probability = np.full(test_class.shape, train_positive_rate, dtype=np.float64)
    no_skill_brier = float(brier_score_loss(test_class, no_skill_probability))
    test_auc = _auc(test_class, test_probability)
    test_ece = expected_calibration_error(test_class, test_probability)
    test_brier = float(brier_score_loss(test_class, test_probability))

    passes = {
        "beatsPaceBaseline": model_mae < baseline_mae,
        "beatsNoSkillProbabilityBaseline": test_brier < no_skill_brier,
        "rocAucAcceptable": test_auc is not None and test_auc >= MIN_ACCEPTABLE_ROC_AUC,
        "probabilityCalibrationAcceptable": test_ece <= MAX_ACCEPTABLE_ECE,
        "intervalCoverageAcceptable": test_coverage >= MIN_ACCEPTABLE_INTERVAL_COVERAGE,
    }

    metrics = {
        "subjectType": subject_type,
        "exampleCount": len(examples),
        "splitCounts": {name: len(group) for name, group in groups.items()},
        "selection": {
            "selectionSplit": "validation",
            "selectedRegressor": selected_regressor_name,
            "regressionSelectionMetric": "validationMaeRatio",
            "selectedClassifier": selected_classifier_name,
            "classificationSelectionMetric": "validationBrierScore",
        },
        "regression": {
            "validationMaeRatio": float(mean_absolute_error(validation_y, validation_prediction)),
            "testMaeRatio": model_mae,
            "testRmseRatio": float(mean_squared_error(test_y, test_prediction) ** 0.5),
            "baselineTestMaeRatio": baseline_mae,
            "maeImprovementPercent": (
                100.0 * (baseline_mae - model_mae) / baseline_mae if baseline_mae > 0 else 0.0
            ),
            "candidateBenchmark": regression_benchmark,
        },
        "classification": {
            "validationBrierScore": float(brier_score_loss(validation_class, validation_probability)),
            "validationExpectedCalibrationError": expected_calibration_error(
                validation_class, validation_probability
            ),
            "validationRocAuc": _auc(validation_class, validation_probability),
            "testBrierScore": test_brier,
            "testExpectedCalibrationError": test_ece,
            "testRocAuc": test_auc,
            "testAccuracy": float(accuracy_score(test_class, test_probability >= 0.5)),
            "testPositiveRate": float(np.mean(test_class)),
            "noSkillTestBrierScore": no_skill_brier,
            "candidateBenchmark": classification_benchmark,
        },
        "predictionInterval": {
            "nominalCoverage": 1.0 - INTERVAL_ALPHA,
            "calibrationSplit": "validation",
            "residualLowerRatio": lower_ratio,
            "residualUpperRatio": upper_ratio,
            "validationCoverage": validation_coverage,
            "testCoverage": test_coverage,
            "intervalWidthRatio": upper_ratio - lower_ratio,
        },
        "qualityGates": passes,
        "passesQualityGate": all(passes.values()),
    }
    return metrics, regressor, classifier, lower_ratio, upper_ratio


def train(data_directory: Path, artifact_directory: Path) -> dict:
    examples, manifest = build_examples(data_directory)
    fingerprint = _data_fingerprint(data_directory)
    model_version = f"{MODEL_FAMILY}-{fingerprint[:10]}"
    artifact_directory.mkdir(parents=True, exist_ok=True)
    metrics: dict[str, dict] = {}
    for subject_type in ("ADVISOR", "DEALERSHIP"):
        subject_examples = [example for example in examples if example.owner_type == subject_type]
        subject_metrics, regressor, classifier, lower_ratio, upper_ratio = _subject_metrics(
            subject_type,
            subject_examples,
        )
        metrics[subject_type] = subject_metrics
        joblib.dump(
            {
                "model_version": model_version,
                "regressor": regressor,
                "classifier": classifier,
                "residual_lower_ratio": lower_ratio,
                "residual_upper_ratio": upper_ratio,
                # Runtime reliability uses validation/calibration quality, never the untouched test metric.
                "validation_mae_ratio": subject_metrics["regression"]["validationMaeRatio"],
                "feature_names": list(FEATURE_NAMES),
                "selected_regressor": subject_metrics["selection"]["selectedRegressor"],
                "selected_classifier": subject_metrics["selection"]["selectedClassifier"],
                "interval_calibration_split": "validation",
            },
            artifact_directory / f"{subject_type.lower()}.joblib",
        )
    if not all(subject["passesQualityGate"] for subject in metrics.values()):
        raise RuntimeError("The trained model failed one or more ML quality gates.")
    metadata = {
        "modelVersion": model_version,
        "modelFamily": MODEL_FAMILY,
        "dataFingerprint": fingerprint,
        "datasetRunId": manifest.get("runId"),
        "datasetPeriodStart": manifest.get("periodStart"),
        "datasetPeriodEnd": manifest.get("periodEnd"),
        "trainingWindowStart": MIN_TRAINING_PERIOD_START.isoformat(),
        "trainEnd": TRAIN_END.isoformat(),
        "validationEnd": VALIDATION_END.isoformat(),
        "testEnd": max(example.period_end for example in examples).isoformat(),
        "checkpointDays": list(CHECKPOINT_DAYS),
        "historyDays": HISTORY_DAYS,
        "featureNames": list(FEATURE_NAMES),
        "selectionPolicy": "fit on train; select on validation; evaluate once on untouched test",
        "intervalCalibration": "validation residual 5th/95th percentiles",
        "confidenceSemantics": (
            "bounded reliability heuristic from validation MAE and calibrated interval width; "
            "not a probability"
        ),
        "deploymentArtifactPolicy": "same train-fitted model evaluated on the untouched test split",
    }
    (artifact_directory / "metadata.json").write_text(
        json.dumps(metadata, indent=2, sort_keys=True) + "\n",
        encoding="utf-8",
    )
    (artifact_directory / "metrics.json").write_text(
        json.dumps(metrics, indent=2, sort_keys=True) + "\n",
        encoding="utf-8",
    )
    return {"metadata": metadata, "metrics": metrics}


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--data-dir", type=Path, required=True)
    parser.add_argument("--artifact-dir", type=Path, required=True)
    arguments = parser.parse_args()
    result = train(arguments.data_dir, arguments.artifact_dir)
    print(f"Model version: {result['metadata']['modelVersion']}")
    for subject_type, metrics in result["metrics"].items():
        regression = metrics["regression"]
        classification = metrics["classification"]
        interval = metrics["predictionInterval"]
        selection = metrics["selection"]
        print(
            f"{subject_type}: regressor={selection['selectedRegressor']}, "
            f"classifier={selection['selectedClassifier']}, "
            f"model MAE={regression['testMaeRatio']:.4f}, "
            f"baseline MAE={regression['baselineTestMaeRatio']:.4f}, "
            f"improvement={regression['maeImprovementPercent']:.2f}%, "
            f"Brier={classification['testBrierScore']:.4f}, "
            f"ECE={classification['testExpectedCalibrationError']:.4f}, "
            f"ROC-AUC={classification['testRocAuc']:.4f}, "
            f"90% interval test coverage={interval['testCoverage']:.2%}"
        )
    print("ML quality result: PASS")


if __name__ == "__main__":
    main()
