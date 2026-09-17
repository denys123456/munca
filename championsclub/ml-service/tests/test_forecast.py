from datetime import date, timedelta
from decimal import Decimal

import pytest
from fastapi.testclient import TestClient
from app.main import app, ForecastRequest, HistoricalSale, SalesTrend, forecast_sales

client = TestClient(app)


def request_for(slope=0, anomaly=False):
    as_of = date(2026, 9, 15)
    history = []
    for index in range(84):
        day = as_of - timedelta(days=83-index)
        amount = Decimal(1000 + index * slope)
        if anomaly and index == 83:
            amount = Decimal(20000)
        history.append(HistoricalSale(date=day, amount=amount))
    return ForecastRequest(subjectId=1, subjectType="ADVISOR", periodStart=date(2026, 9, 1),
                           periodEnd=date(2026, 9, 30), asOf=as_of, historicalSales=history, target=Decimal(30000))


def test_stable_forecast():
    response = forecast_sales(request_for())
    assert response.predictedEndValue == Decimal(30000)
    assert response.trend == SalesTrend.STABLE
    assert len(response.forecastPoints) == 15
    assert response.lowerBound <= response.predictedEndValue <= response.upperBound


@pytest.mark.parametrize("slope,trend", [(8, SalesTrend.UP), (-8, SalesTrend.DOWN)])
def test_trends(slope, trend):
    assert forecast_sales(request_for(slope)).trend == trend


def test_probability_boundaries():
    request = request_for()
    for target in (Decimal(1), Decimal(30000), Decimal(1000000)):
        request.target = target
        probability = forecast_sales(request).targetAchievementProbability
        assert 0 <= probability <= 1
    request.target = Decimal(0)
    assert forecast_sales(request).targetAchievementProbability is None


def test_anomaly():
    assert forecast_sales(request_for(anomaly=True)).anomalies[-1].date == date(2026, 9, 15)


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


def test_api_contract():
    response = client.post("/forecast", json=request_for().model_dump(mode="json"))
    assert response.status_code == 200
    assert Decimal(response.json()["predictedEndValue"]) == Decimal(30000)
    assert client.get("/health").json()["status"] == "UP"
