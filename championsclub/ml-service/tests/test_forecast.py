from decimal import Decimal

from app.main import SalesTrend, calculate_target_probability, detect_sales_trend, predict_next_period_sales


def test_should_predict_more_than_latest_low_period_when_trend_is_positive():
    prediction = predict_next_period_sales([
        Decimal("42000"),
        Decimal("47000"),
        Decimal("52000"),
        Decimal("61000"),
    ])

    assert prediction > Decimal("52000")


def test_should_detect_upward_sales_trend():
    trend = detect_sales_trend([
        Decimal("40000"),
        Decimal("42000"),
        Decimal("62000"),
        Decimal("68000"),
    ])

    assert trend == SalesTrend.UP


def test_should_keep_target_probability_between_zero_and_one():
    probability = calculate_target_probability(Decimal("120000"), Decimal("80000"), 0.86)

    assert probability <= 0.98
    assert probability >= 0.02
