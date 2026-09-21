from __future__ import annotations

from datetime import date, timedelta
from decimal import Decimal, ROUND_DOWN
from enum import Enum
from typing import Annotated, Optional

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field, model_validator

from app.fallback import detect_anomalies, statistical_forecast
from app.features import FEATURE_NAMES, build_feature_vector
from app.model_store import ModelRegistry

Money = Annotated[Decimal, Field(ge=0, max_digits=16, decimal_places=2)]
CENT = Decimal("0.01")


class SalesTrend(str, Enum):
    UP = "UP"
    DOWN = "DOWN"
    STABLE = "STABLE"


class HistoricalSale(BaseModel):
    date: date
    amount: Money


class ForecastRequest(BaseModel):
    subjectId: int = Field(gt=0)
    subjectType: str
    periodStart: date
    periodEnd: date
    asOf: date
    historicalSales: list[HistoricalSale] = Field(min_length=14, max_length=366)
    target: Money

    @model_validator(mode="after")
    def validate_period(self):
        if self.subjectType not in ("ADVISOR", "DEALERSHIP"):
            raise ValueError("Unknown subject type.")
        if not self.periodStart <= self.asOf <= self.periodEnd:
            raise ValueError("Observation date must be inside the target period.")
        if (self.periodEnd - self.periodStart).days > 365:
            raise ValueError("Forecast periods cannot exceed one year.")
        dates = [point.date for point in self.historicalSales]
        if dates[-1] != self.asOf or dates[0] > self.periodStart:
            raise ValueError("History must cover the period through the observation date.")
        if any(right - left != timedelta(days=1) for left, right in zip(dates, dates[1:])):
            raise ValueError("History must contain consecutive unique dates in ascending order.")
        return self


class ForecastPoint(BaseModel):
    date: date
    amount: Decimal


class Anomaly(BaseModel):
    date: date
    amount: Decimal
    score: float


class ForecastResponse(BaseModel):
    predictedEndValue: Decimal
    targetAchievementProbability: Optional[float]
    trend: SalesTrend
    confidence: float
    forecastPoints: list[ForecastPoint]
    lowerBound: Decimal
    upperBound: Decimal
    anomalies: list[Anomaly]
    modelVersion: str


app = FastAPI(title="ChampionsClub ML Service", version="2.0.0")
registry = ModelRegistry()


@app.exception_handler(RequestValidationError)
async def validation_error(request: Request, exception: RequestValidationError):
    errors = [
        {"field": ".".join(str(part) for part in error["loc"]), "message": error["msg"]}
        for error in exception.errors()
    ]
    return JSONResponse(
        status_code=422,
        content={
            "status": 422,
            "code": "INVALID_FORECAST_INPUT",
            "message": "Forecast inputs are invalid.",
            "path": request.url.path,
            "fieldErrors": errors,
        },
    )


@app.get("/health")
def health():
    return {
        "status": "UP",
        "modelAvailable": registry.available,
        "modelVersion": registry.model_version,
    }


def _history(request: ForecastRequest) -> list[tuple[date, float]]:
    return [(point.date, float(point.amount)) for point in request.historicalSales]


def _achieved(request: ForecastRequest) -> Decimal:
    return sum(
        (point.amount for point in request.historicalSales if point.date >= request.periodStart),
        Decimal(0),
    )


def _sum_recent(request: ForecastRequest, start_offset: int, end_offset: int) -> Decimal:
    start = request.asOf - timedelta(days=start_offset)
    end = request.asOf - timedelta(days=end_offset)
    return sum(
        (point.amount for point in request.historicalSales if start <= point.date <= end),
        Decimal(0),
    )


def _trend(request: ForecastRequest) -> SalesTrend:
    recent = _sum_recent(request, 13, 0)
    previous = _sum_recent(request, 27, 14)
    tolerance = max(previous * Decimal("0.10"), request.target * Decimal("0.02"), Decimal(1))
    difference = recent - previous
    if difference > tolerance:
        return SalesTrend.UP
    if difference < -tolerance:
        return SalesTrend.DOWN
    return SalesTrend.STABLE


def _future_points(request: ForecastRequest, predicted: Decimal, achieved: Decimal) -> list[ForecastPoint]:
    days = [
        request.asOf + timedelta(days=offset)
        for offset in range(1, (request.periodEnd - request.asOf).days + 1)
    ]
    if not days:
        return []
    remaining = max(Decimal(0), predicted - achieved)
    recent = request.historicalSales[-84:]
    weekday_values: dict[int, list[Decimal]] = {weekday: [] for weekday in range(7)}
    for point in recent:
        weekday_values[point.date.weekday()].append(point.amount)
    weekday_means = {
        weekday: (
            sum(values, Decimal(0)) / Decimal(len(values)) if values else Decimal(0)
        )
        for weekday, values in weekday_values.items()
    }
    weights = [weekday_means[day.weekday()] for day in days]
    weight_total = sum(weights, Decimal(0))
    if weight_total <= 0:
        weights = [Decimal(1) for _ in days]
        weight_total = Decimal(len(days))
    points: list[ForecastPoint] = []
    allocated = Decimal(0)
    for index, day in enumerate(days):
        if index == len(days) - 1:
            amount = remaining - allocated
        else:
            amount = (remaining * weights[index] / weight_total).quantize(CENT, rounding=ROUND_DOWN)
            allocated += amount
        points.append(ForecastPoint(date=day, amount=max(Decimal(0), amount)))
    return points


def _ml_forecast(request: ForecastRequest) -> ForecastResponse | None:
    bundle = registry.get(request.subjectType)
    if bundle is None or request.target <= 0 or tuple(FEATURE_NAMES) != bundle.feature_names:
        return None
    features = build_feature_vector(
        _history(request),
        request.periodStart,
        request.periodEnd,
        request.asOf,
        float(request.target),
    )
    try:
        predicted_ratio = max(0.0, float(bundle.regressor.predict([features])[0]))
        probability = float(bundle.classifier.predict_proba([features])[0][1])
    except (ValueError, TypeError, IndexError, AttributeError):
        return None
    achieved = _achieved(request)
    period_complete = request.asOf == request.periodEnd
    if period_complete:
        predicted = achieved.quantize(CENT)
        probability = 1.0 if achieved >= request.target else 0.0
        lower = predicted
        upper = predicted
        confidence = 1.0
    else:
        predicted = max(achieved, request.target * Decimal(str(predicted_ratio))).quantize(CENT)
        if achieved >= request.target:
            probability = 1.0
        probability = max(0.0, min(1.0, probability))
        lower_candidate = predicted + request.target * Decimal(str(bundle.residual_lower_ratio))
        upper_candidate = predicted + request.target * Decimal(str(bundle.residual_upper_ratio))
        lower = max(achieved, min(predicted, lower_candidate)).quantize(CENT)
        upper = max(predicted, upper_candidate).quantize(CENT)
        interval_width = max(Decimal(0), upper - lower)
        interval_penalty = float(interval_width / max(request.target * Decimal(2), Decimal(1)))
        quality = max(0.0, 1.0 - bundle.validation_mae_ratio)
        confidence = max(0.0, min(1.0, quality * max(0.0, 1.0 - interval_penalty)))
    anomalies = [
        Anomaly(date=day, amount=amount, score=score)
        for day, amount, score in detect_anomalies(request.historicalSales[-84:])
    ]
    return ForecastResponse(
        predictedEndValue=predicted,
        targetAchievementProbability=probability,
        trend=_trend(request),
        confidence=round(confidence, 4),
        forecastPoints=_future_points(request, predicted, achieved),
        lowerBound=lower,
        upperBound=upper,
        anomalies=anomalies,
        modelVersion=bundle.model_version,
    )


def _fallback_response(request: ForecastRequest) -> ForecastResponse:
    result = statistical_forecast(request)
    return ForecastResponse(
        predictedEndValue=result["predicted"],
        targetAchievementProbability=result["probability"],
        trend=SalesTrend(result["trend"]),
        confidence=result["confidence"],
        forecastPoints=[ForecastPoint(date=day, amount=amount) for day, amount in result["points"]],
        lowerBound=result["lower"],
        upperBound=result["upper"],
        anomalies=[
            Anomaly(date=day, amount=amount, score=score)
            for day, amount, score in result["anomalies"]
        ],
        modelVersion=result["model_version"],
    )


@app.post("/forecast", response_model=ForecastResponse)
def forecast_sales(request: ForecastRequest):
    return _ml_forecast(request) or _fallback_response(request)
