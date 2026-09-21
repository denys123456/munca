from datetime import date

import numpy as np

from app.training import (
    MODEL_FAMILY,
    expected_calibration_error,
    interval_coverage,
    residual_interval,
    split_name,
)


def test_temporal_split_is_strictly_ordered():
    assert split_name(date(2025, 12, 31)) == "train"
    assert split_name(date(2026, 1, 1)) == "validation"
    assert split_name(date(2026, 4, 30)) == "validation"
    assert split_name(date(2026, 5, 1)) == "test"


def test_v2_model_family_records_methodology_change():
    assert MODEL_FAMILY == "snapshot-selected-v2"


def test_prediction_interval_is_calibrated_from_supplied_calibration_residuals():
    calibration_y = np.asarray([0.80, 0.90, 1.00, 1.10, 1.20, 1.30])
    calibration_prediction = np.asarray([0.90, 0.95, 1.00, 1.05, 1.10, 1.20])
    lower, upper = residual_interval(calibration_y, calibration_prediction)
    assert lower < 0 < upper

    # Coverage evaluation is a separate operation, so an untouched test set does not affect calibration.
    test_y = np.asarray([0.95, 1.05, 1.15])
    test_prediction = np.asarray([1.00, 1.00, 1.10])
    coverage = interval_coverage(test_y, test_prediction, lower, upper)
    assert 0.0 <= coverage <= 1.0


def test_expected_calibration_error_is_zero_for_perfectly_calibrated_bins():
    y_true = np.asarray([0, 0, 1, 1], dtype=np.int64)
    probabilities = np.asarray([0.0, 0.0, 1.0, 1.0], dtype=np.float64)
    assert expected_calibration_error(y_true, probabilities, bins=2) == 0.0
