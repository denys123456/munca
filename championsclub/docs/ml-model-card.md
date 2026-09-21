# ChampionsClub Forecast Model Card

## Purpose

The model supports sales-management forecasting for ChampionsClub. It estimates final monthly sales value and the probability of reaching the configured monthly target for an Advisor or Dealership.

It is a decision-support signal, not a business-rule engine. Java remains authoritative for targets, points, product eligibility, rewards, gamification and access control.

## Training data

The model is trained only on the canonical synthetic ChampionsClub scenario.

Canonical scenario:

- 40 dealerships
- 600 advisors
- 300,000 contracts
- January 1, 2024 through September 15, 2026
- deterministic seed `20260916`

September 2026 is incomplete and is never used as a training label. Complete monthly periods through August 2026 are eligible.

## Leakage controls

Snapshots are created on day 7, 14 and 21 of each eligible month. Feature computation only sees events known by the snapshot date. Cancellations that occur later are not applied early. Labels are computed as of the target period end. Random train/test splitting is not used.

The v2 evaluation workflow is deliberately temporal:

1. candidate models are fitted on **train only**;
2. model selection and prediction-interval calibration use **validation only**;
3. the **test split remains untouched** until final evaluation;
4. the deployed artifact is the same train-fitted pipeline that produced the reported held-out test metrics.

The test set is therefore not used for fitting, model selection, prediction-interval calibration or runtime confidence.

## Features

The model uses normalized pace, rolling sales windows, previous-month context, activity frequency, recent momentum, volatility, target scale and month seasonality. User IDs and dealership IDs are excluded from features.

## Candidate models and selection

Regression candidates:

- Histogram Gradient Boosting Regressor
- Ridge regression with standardized inputs

Classification candidates:

- Histogram Gradient Boosting Classifier
- Logistic Regression with standardized inputs

Regression selection minimizes validation MAE. Classification selection minimizes validation Brier score. The held-out test metrics are never used to choose a model.

For the canonical dataset, validation selects:

| Subject | Regressor | Classifier |
| --- | --- | --- |
| Advisor | Histogram Gradient Boosting | Histogram Gradient Boosting |
| Dealership | Histogram Gradient Boosting | Logistic Regression |

## Prediction interval calibration

The 90% interval is calibrated from **validation residuals**, using the empirical 5th and 95th residual percentiles. Those fixed residual offsets are then applied once to the untouched test predictions to measure final coverage.

This replaces the previous v1 methodology, which estimated residual quantiles from the same held-out test set on which coverage was reported.

## Probability calibration diagnostic

Probability quality is evaluated with:

- Brier score
- ROC-AUC
- accuracy at threshold 0.5
- Expected Calibration Error (ECE, 10 fixed bins)
- a no-skill probability baseline based on the training positive rate

No extra Platt/isotonic calibration layer is applied because the selected canonical models already pass the explicit ECE quality gate (`<= 0.08`).

## Temporal split

```text
Train:      2024-07-01 through 2025-12-31
Validation: 2026-01-01 through 2026-04-30
Test:       2026-05-01 through 2026-08-31
```

## Final canonical evaluation

For dataset fingerprint `5f17b42970...`:

| Subject | Test examples | Pace baseline MAE | Model MAE | MAE improvement | Brier | ECE | ROC-AUC | 90% interval test coverage |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Advisor | 7,200 | 0.3551 | 0.2312 | 34.89% | 0.1527 | 0.0183 | 0.8493 | 92.39% |
| Dealership | 480 | 0.1097 | 0.0797 | 27.35% | 0.1499 | 0.0421 | 0.8462 | 91.04% |

MAE is measured on final target achievement ratio. Lower is better. The pace baseline projects current achieved sales at the current calendar-day pace through the end of the period.

The test interval coverage is intentionally **not exactly 90%**: it is a genuine held-out measurement after calibration on the earlier validation period.

## Confidence field semantics

The API field named `confidence` is **not** a probability and must not be described as one. It is a bounded runtime reliability heuristic combining:

- validation MAE of the deployed regressor; and
- relative width of the validation-calibrated prediction interval for the current forecast.

`targetAchievementProbability` is the model probability. `confidence` is only a presentation-level reliability signal.

## Quality gates

Each subject type must satisfy all of the following before artifacts are written as a successful training run:

- regression beats the deterministic pace baseline on the held-out test split;
- classification Brier beats the no-skill probability baseline;
- ROC-AUC is at least `0.75`;
- test ECE is at most `0.08`;
- held-out test interval coverage is at least `0.85` for the nominal 90% interval.

## Limitations

The model is trained on synthetic data and must not be presented as evidence of real-world Volkswagen Financial Services performance. It learns the behavior encoded by the canonical synthetic generator and its calibration assumptions.

The probability is an ML estimate, not a guarantee. Forecast uncertainty increases for sparse Advisor histories and volatile sales patterns. The current model is designed for monthly targets and a 180-day daily-history input window.

## Reproducibility

Training is deterministic for the canonical input dataset and fixed model configuration. The artifact version contains a SHA-256-derived dataset fingerprint. Generated model files are local build artifacts and are not committed to source control.
