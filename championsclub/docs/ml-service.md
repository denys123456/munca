# ML Service

The Python service owns trained forecasting, target-achievement probability and forecast uncertainty. Java remains the source of truth for business rules, targets, points, rewards and access control.

## Training design

The canonical synthetic dataset is converted into monthly forecasting snapshots for both Advisors and Dealerships. Training examples use checkpoints on day 7, 14 and 21 of each complete target month.

Every snapshot is leakage-safe:

- features use only sales information available on or before the snapshot date
- a later cancellation is not treated as known before its cancellation date
- the label is the final target-period result as known at that period end
- subject identifiers are not model features
- September 2026 is excluded from training because the canonical dataset ends on September 15

The service uses separate pipelines for `ADVISOR` and `DEALERSHIP` because their sales scales and aggregation behavior differ.

## Features

The trained models use 180 days of daily sales history together with the configured target. The feature set includes:

- elapsed and remaining period fractions
- target scale
- achieved-to-target ratio
- pace projection ratio
- rolling 7, 14, 30, 60 and 90 day sales ratios
- previous-month and previous-two-month performance
- active-day shares
- recent momentum
- rolling mean and volatility
- cyclical month seasonality

The same feature builder is used by training and live inference.

## Temporal evaluation and calibration

The split is chronological, never random:

```text
Training:   July 2024 through December 2025
Validation: January 2026 through April 2026
Test:       May 2026 through August 2026
```

The workflow is:

```text
train -> fit candidate models
validation -> select candidates + calibrate 90% residual interval
test -> one untouched final evaluation
```

Regression compares Histogram Gradient Boosting with standardized Ridge and selects by validation MAE. Classification compares Histogram Gradient Boosting with standardized Logistic Regression and selects by validation Brier score.

The prediction interval is calibrated on validation residuals only. Held-out test coverage is reported afterwards; the test split is not used to construct the interval.

The pace baseline is a deterministic current-period projection. The probability model is also compared against a no-skill probability baseline, and calibration is measured with 10-bin Expected Calibration Error.

## Model family

The current family is:

```text
snapshot-selected-v2
```

Artifacts are persisted with Joblib and loaded by FastAPI at startup. The generated model version includes a deterministic fingerprint of the canonical dataset.

The deployment artifact is the same train-fitted selected model used for the final untouched test evaluation. This makes the reported metrics directly attributable to the deployed pipeline rather than to a later refit on the test period.

Generated local artifacts:

```text
ml-service/artifacts/advisor.joblib
ml-service/artifacts/dealership.joblib
ml-service/artifacts/metadata.json
ml-service/artifacts/metrics.json
```

## Train locally

The final dataset must already exist in `data/generated`.

```bash
docker compose --profile ml-training build ml-trainer
docker compose --profile ml-training run --rm ml-trainer
```

A successful training run ends with:

```text
ML quality result: PASS
```

Then restart the ML service and backend so the new artifacts are loaded:

```bash
docker compose up -d --build ml-service backend
```

## Runtime contract

Endpoint:

```text
POST /forecast
```

The request contains subject type/id, target period, observation date, consecutive daily history and target. Spring supplies the canonical 180-day history window.

The response contains:

- predicted final value
- target-achievement probability
- trend
- `confidence`
- future daily allocation points
- lower/upper interval bounds
- anomalies
- model version

`targetAchievementProbability` is an ML probability. `confidence` is **not** a probability: it is a bounded reliability heuristic based on validation MAE and the relative width of the calibrated interval.

Forecast points allocate the predicted remaining amount across future days using recent weekday behavior. Their sum plus achieved sales is validated by Spring against `predictedEndValue`.

## Graceful degradation

If model artifacts are missing or cannot be loaded, FastAPI stays healthy and uses the previous bounded statistical forecast as a deterministic fallback. Its model version is:

```text
weekday-trend-fallback-v1
```

Spring also validates the returned ranges and structure. If the service is unavailable or returns invalid data, the backend exposes forecast state `UNAVAILABLE` while core sales, points, rewards, analytics and gamification continue to operate.
