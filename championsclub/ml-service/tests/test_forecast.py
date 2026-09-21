from datetime import date, timedelta
from decimal import Decimal

import pytest
from fastapi.testclient import TestClient

import app.main as main
from app.main import ForecastRequest, HistoricalSale, SalesTrend

client = TestClient(main.app)


class FakeRegressor:
    def predict(self, values):
        return [1.1]


class FakeClassifier:
    def predict_proba(self, values):
        return [[0.2, 0.8]]


class FakeBundle:
    subject_type = "ADVISOR"
    model_version = "snapshot-hgb-v1-test"
    regressor = FakeRegressor()
    classifier = FakeClassifier()
    residual_lower_ratio = -0.10
    residual_upper_ratio = 0.12
    validation_mae_ratio = 0.08
    feature_names = tuple(main.FEATURE_NAMES)


def request_for(slope=0, anomaly=False):
    as_of = date(2026, 9, 15)
    history = []
    for index in range(180):
        day = as_of - timedelta(days=179 - index)
        amount = Decimal(1000 + index * slope)
        if anomaly and index == 179:
            amount = Decimal(20000)
        history.append(HistoricalSale(date=day, amount=amount))
    return ForecastRequest(
        subjectId=1,
        subjectType="ADVISOR",
        periodStart=date(2026, 9, 1),
        periodEnd=date(2026, 9, 30),
        asOf=as_of,
        historicalSales=history,
        target=Decimal(30000),
    )


def test_ml_forecast_uses_trained_model_contract(monkeypatch):
    monkeypatch.setattr(main.registry, "get", lambda subject_type: FakeBundle())
    response = main.forecast_sales(request_for())
    assert response.modelVersion == "snapshot-hgb-v1-test"
    assert response.predictedEndValue == Decimal("33000.00")
    assert response.targetAchievementProbability == 0.8
    assert len(response.forecastPoints) == 15
    assert sum(point.amount for point in response.forecastPoints) + Decimal(15000) == response.predictedEndValue
    assert response.lowerBound <= response.predictedEndValue <= response.upperBound


def test_fallback_remains_available_when_artifact_is_missing(monkeypatch):
    monkeypatch.setattr(main.registry, "get", lambda subject_type: None)
    response = main.forecast_sales(request_for())
    assert response.modelVersion == "weekday-trend-fallback-v1"
    assert response.predictedEndValue == Decimal(30000)
    assert response.trend == SalesTrend.STABLE


def test_probability_is_one_after_target_is_already_reached(monkeypatch):
    monkeypatch.setattr(main.registry, "get", lambda subject_type: FakeBundle())
    request = request_for()
    request.target = Decimal(10000)
    response = main.forecast_sales(request)
    assert response.targetAchievementProbability == 1.0
    assert response.predictedEndValue >= Decimal(15000)


def test_anomaly_detection_survives_ml_path(monkeypatch):
    monkeypatch.setattr(main.registry, "get", lambda subject_type: FakeBundle())
    response = main.forecast_sales(request_for(anomaly=True))
    assert response.anomalies[-1].date == date(2026, 9, 15)


@pytest.mark.parametrize("mutation", ["empty", "short", "negative", "duplicate", "future", "target"])
def test_invalid_input(mutation):
    body = request_for().model_dump(mode="json")
    if mutation == "empty":
        body["historicalSales"] = []
    elif mutation == "short":
        body["historicalSales"] = body["historicalSales"][-3:]
    elif mutation == "negative":
        body["historicalSales"][0]["amount"] = "-1"
    elif mutation == "duplicate":
        body["historicalSales"][1]["date"] = body["historicalSales"][0]["date"]
    elif mutation == "future":
        body["periodEnd"] = "2026-09-01"
    else:
        del body["target"]
    response = client.post("/forecast", json=body)
    assert response.status_code == 422
    assert response.json()["code"] == "INVALID_FORECAST_INPUT"


def test_health_exposes_model_availability():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "UP"
    assert "modelAvailable" in response.json()
    assert "modelVersion" in response.json()
