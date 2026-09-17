from datetime import date, timedelta
from decimal import Decimal
from enum import Enum
from math import erf, sqrt
from statistics import median
from typing import Annotated, Optional

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field, model_validator

Money = Annotated[Decimal, Field(ge=0, max_digits=16, decimal_places=2)]


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
    modelVersion: str = "weekday-trend-v1"


app = FastAPI(title="ChampionsClub ML Service", version="1.0.0")


@app.exception_handler(RequestValidationError)
async def validation_error(request: Request, exception: RequestValidationError):
    errors = [{"field": ".".join(str(part) for part in error["loc"]), "message": error["msg"]}
              for error in exception.errors()]
    return JSONResponse(status_code=422, content={
        "status": 422, "code": "INVALID_FORECAST_INPUT",
        "message": "Forecast inputs are invalid.", "path": request.url.path, "fieldErrors": errors,
    })


@app.get("/health")
def health():
    return {"status": "UP", "modelVersion": "weekday-trend-v1"}


def average(values):
    return sum(values, Decimal(0)) / Decimal(len(values)) if values else Decimal(0)


def detect_anomalies(history):
    anomalies = []
    for point in history[-14:]:
        peers = [other.amount for other in history if other.date < point.date
                 and other.date.weekday() == point.date.weekday()]
        if len(peers) < 4:
            continue
        center = median(peers)
        deviation = median([abs(value - center) for value in peers])
        scale = max(deviation * Decimal("1.4826"), center * Decimal("0.1"), Decimal(1))
        score = abs(point.amount - center) / scale
        if score >= 3:
            anomalies.append(Anomaly(date=point.date, amount=point.amount, score=round(float(score), 3)))
    return anomalies


@app.post("/forecast", response_model=ForecastResponse)
def forecast_sales(request: ForecastRequest):
    history = request.historicalSales[-84:]
    values = [point.amount for point in history]
    count = len(values)
    midpoint = Decimal(count - 1) / 2
    mean = average(values)
    denominator = sum((Decimal(index) - midpoint) ** 2 for index in range(count))
    slope = sum((Decimal(index) - midpoint) * (value - mean)
                for index, value in enumerate(values)) / denominator
    residuals = [value - (mean + slope * (Decimal(index) - midpoint))
                 for index, value in enumerate(values)]
    weekday_offsets = {
        weekday: average([residuals[index] for index, point in enumerate(history)
                          if point.date.weekday() == weekday])
        for weekday in range(7)
    }
    errors = [residuals[index] - weekday_offsets[point.date.weekday()]
              for index, point in enumerate(history)]
    variance = sum(error ** 2 for error in errors) / Decimal(max(1, count - 9))
    deviation = variance.sqrt()
    confidence = float(Decimal(count) / Decimal(count + 14) / (1 + deviation / max(mean, Decimal(1))))
    shift = slope * Decimal(28)
    tolerance = max(mean * Decimal("0.05"), Decimal(1))
    trend = SalesTrend.UP if shift > tolerance else SalesTrend.DOWN if shift < -tolerance else SalesTrend.STABLE
    achieved = sum((point.amount for point in request.historicalSales if point.date >= request.periodStart), Decimal(0))
    points = []
    future_days = (request.periodEnd - request.asOf).days
    for offset in range(1, future_days + 1):
        day = request.asOf + timedelta(days=offset)
        prediction = max(Decimal(0), mean + slope * (Decimal(count - 1 + offset) - midpoint) + weekday_offsets[day.weekday()])
        points.append(ForecastPoint(date=day, amount=prediction.quantize(Decimal("0.01"))))
    predicted = achieved + sum((point.amount for point in points), Decimal(0))
    uncertainty = deviation * Decimal(future_days).sqrt() * (1 + Decimal(future_days) / Decimal(count))
    probability = None
    if request.target > 0:
        if achieved >= request.target:
            probability = 1.0
        elif uncertainty == 0:
            probability = 1.0 if predicted >= request.target else 0.0
        else:
            standardized = float((predicted - request.target) / uncertainty)
            probability = max(0.0, min(1.0, (1 + erf(standardized / sqrt(2))) / 2))
    interval = uncertainty * Decimal("1.96")
    return ForecastResponse(
        predictedEndValue=predicted.quantize(Decimal("0.01")),
        targetAchievementProbability=probability, trend=trend, confidence=round(confidence, 4),
        forecastPoints=points, lowerBound=max(achieved, predicted - interval).quantize(Decimal("0.01")),
        upperBound=(predicted + interval).quantize(Decimal("0.01")), anomalies=detect_anomalies(history),
    )
