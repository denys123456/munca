from __future__ import annotations

from datetime import date, timedelta
from decimal import Decimal
from math import erf, sqrt
from statistics import median


def average(values: list[Decimal]) -> Decimal:
    return sum(values, Decimal(0)) / Decimal(len(values)) if values else Decimal(0)


def detect_anomalies(history):
    anomalies = []
    for point in history[-14:]:
        peers = [
            other.amount
            for other in history
            if other.date < point.date and other.date.weekday() == point.date.weekday()
        ]
        if len(peers) < 4:
            continue
        center = median(peers)
        deviation = median([abs(value - center) for value in peers])
        scale = max(deviation * Decimal("1.4826"), center * Decimal("0.1"), Decimal(1))
        score = abs(point.amount - center) / scale
        if score >= 3:
            anomalies.append((point.date, point.amount, round(float(score), 3)))
    return anomalies


def statistical_forecast(request):
    history = request.historicalSales[-84:]
    values = [point.amount for point in history]
    count = len(values)
    midpoint = Decimal(count - 1) / 2
    mean = average(values)
    denominator = sum((Decimal(index) - midpoint) ** 2 for index in range(count))
    slope = (
        sum((Decimal(index) - midpoint) * (value - mean) for index, value in enumerate(values))
        / denominator
        if denominator
        else Decimal(0)
    )
    residuals = [value - (mean + slope * (Decimal(index) - midpoint)) for index, value in enumerate(values)]
    weekday_offsets = {
        weekday: average(
            [residuals[index] for index, point in enumerate(history) if point.date.weekday() == weekday]
        )
        for weekday in range(7)
    }
    errors = [
        residuals[index] - weekday_offsets[point.date.weekday()]
        for index, point in enumerate(history)
    ]
    variance = sum(error**2 for error in errors) / Decimal(max(1, count - 9))
    deviation = variance.sqrt()
    confidence = float(
        Decimal(count) / Decimal(count + 14) / (1 + deviation / max(mean, Decimal(1)))
    )
    shift = slope * Decimal(28)
    tolerance = max(mean * Decimal("0.05"), Decimal(1))
    trend = "UP" if shift > tolerance else "DOWN" if shift < -tolerance else "STABLE"
    achieved = sum(
        (point.amount for point in request.historicalSales if point.date >= request.periodStart),
        Decimal(0),
    )
    points: list[tuple[date, Decimal]] = []
    future_days = (request.periodEnd - request.asOf).days
    for offset in range(1, future_days + 1):
        day = request.asOf + timedelta(days=offset)
        prediction = max(
            Decimal(0),
            mean
            + slope * (Decimal(count - 1 + offset) - midpoint)
            + weekday_offsets[day.weekday()],
        )
        points.append((day, prediction.quantize(Decimal("0.01"))))
    predicted = achieved + sum((amount for _, amount in points), Decimal(0))
    uncertainty = deviation * Decimal(future_days).sqrt() * (
        1 + Decimal(future_days) / Decimal(count)
    )
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
    return {
        "predicted": predicted.quantize(Decimal("0.01")),
        "probability": probability,
        "trend": trend,
        "confidence": round(confidence, 4),
        "points": points,
        "lower": max(achieved, predicted - interval).quantize(Decimal("0.01")),
        "upper": (predicted + interval).quantize(Decimal("0.01")),
        "anomalies": detect_anomalies(history),
        "model_version": "weekday-trend-fallback-v1",
    }
