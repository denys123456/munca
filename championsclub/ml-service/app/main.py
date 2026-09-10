from decimal import Decimal
from enum import StrEnum

from fastapi import FastAPI
from pydantic import BaseModel, Field


class SalesTrend(StrEnum):
    UP = "UP"
    DOWN = "DOWN"
    STABLE = "STABLE"


class ForecastRequest(BaseModel):
    entityId: int = Field(gt=0)
    historicalSales: list[Decimal]
    target: Decimal = Field(gt=0)
    forecastHorizonDays: int = Field(gt=0, le=90)


class ForecastResponse(BaseModel):
    predictedSales: Decimal
    targetAchievementProbability: float
    trend: SalesTrend
    confidence: float


app = FastAPI(title="ChampionsClub ML Service")


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "UP"}


@app.post("/forecast")
def forecast_sales(request: ForecastRequest) -> ForecastResponse:
    cleaned_sales = [sale for sale in request.historicalSales if sale >= Decimal("0")]
    predicted_sales = predict_next_period_sales(cleaned_sales)
    trend = detect_sales_trend(cleaned_sales)
    confidence = calculate_confidence(cleaned_sales)
    probability = calculate_target_probability(predicted_sales, request.target, confidence)

    return ForecastResponse(
        predictedSales=predicted_sales,
        targetAchievementProbability=probability,
        trend=trend,
        confidence=confidence,
    )


def predict_next_period_sales(historical_sales: list[Decimal]) -> Decimal:
    if not historical_sales:
        return Decimal("0")
    if len(historical_sales) == 1:
        return historical_sales[0]

    weighted_total = Decimal("0")
    weight_sum = Decimal("0")
    for index, sale in enumerate(historical_sales, start=1):
        weight = Decimal(index)
        weighted_total += sale * weight
        weight_sum += weight

    trend_adjustment = calculate_trend_adjustment(historical_sales)
    return max(Decimal("0"), (weighted_total / weight_sum) + trend_adjustment).quantize(Decimal("0.01"))


def calculate_trend_adjustment(historical_sales: list[Decimal]) -> Decimal:
    first_sale = historical_sales[0]
    last_sale = historical_sales[-1]
    periods = Decimal(len(historical_sales) - 1)
    return (last_sale - first_sale) / periods * Decimal("0.35")


def detect_sales_trend(historical_sales: list[Decimal]) -> SalesTrend:
    if len(historical_sales) < 2:
        return SalesTrend.STABLE

    first_half, second_half = split_sales_history(historical_sales)
    first_average = average(first_half)
    second_average = average(second_half)
    difference = second_average - first_average
    tolerance = max(first_average * Decimal("0.05"), Decimal("1000"))

    if difference > tolerance:
        return SalesTrend.UP
    if difference < -tolerance:
        return SalesTrend.DOWN
    return SalesTrend.STABLE


def split_sales_history(historical_sales: list[Decimal]) -> tuple[list[Decimal], list[Decimal]]:
    midpoint = len(historical_sales) // 2
    return historical_sales[:midpoint], historical_sales[midpoint:]


def average(values: list[Decimal]) -> Decimal:
    if not values:
        return Decimal("0")
    return sum(values, Decimal("0")) / Decimal(len(values))


def calculate_confidence(historical_sales: list[Decimal]) -> float:
    if len(historical_sales) >= 6:
        return 0.86
    if len(historical_sales) >= 3:
        return 0.74
    if len(historical_sales) >= 1:
        return 0.58
    return 0.35


def calculate_target_probability(predicted_sales: Decimal, target: Decimal, confidence: float) -> float:
    achievement_ratio = predicted_sales / target
    probability = float(achievement_ratio) * confidence
    return round(min(0.98, max(0.02, probability)), 2)

