from __future__ import annotations

from datetime import date, timedelta
from math import cos, log1p, pi, sin, sqrt
from statistics import pstdev
from typing import Iterable

FEATURE_NAMES = (
    "elapsed_fraction",
    "remaining_fraction",
    "target_log",
    "achieved_ratio",
    "pace_projection_ratio",
    "last_7_ratio",
    "previous_7_ratio",
    "last_14_ratio",
    "last_30_ratio",
    "last_60_ratio",
    "last_90_ratio",
    "previous_month_ratio",
    "previous_two_month_average_ratio",
    "active_day_share_current_period",
    "active_day_share_last_30",
    "recent_change_ratio",
    "last_28_daily_mean_scaled",
    "last_28_daily_std_scaled",
    "month_sin",
    "month_cos",
)


def _amounts_by_date(history: Iterable[tuple[date, float]], as_of: date) -> dict[date, float]:
    result: dict[date, float] = {}
    for day, amount in history:
        if day <= as_of:
            result[day] = float(amount)
    return result


def _sum_range(values: dict[date, float], start: date, end: date) -> float:
    if start > end:
        return 0.0
    total = 0.0
    day = start
    while day <= end:
        total += values.get(day, 0.0)
        day += timedelta(days=1)
    return total


def _series(values: dict[date, float], start: date, end: date) -> list[float]:
    if start > end:
        return []
    result: list[float] = []
    day = start
    while day <= end:
        result.append(values.get(day, 0.0))
        day += timedelta(days=1)
    return result


def _ratio(value: float, target: float) -> float:
    return value / max(target, 1.0)


def build_feature_vector(
    history: Iterable[tuple[date, float]],
    period_start: date,
    period_end: date,
    as_of: date,
    target: float,
) -> list[float]:
    values = _amounts_by_date(history, as_of)
    total_days = (period_end - period_start).days + 1
    elapsed_days = max(1, (as_of - period_start).days + 1)
    remaining_days = max(0, total_days - elapsed_days)
    achieved = _sum_range(values, period_start, as_of)
    last_7 = _sum_range(values, as_of - timedelta(days=6), as_of)
    previous_7 = _sum_range(values, as_of - timedelta(days=13), as_of - timedelta(days=7))
    last_14 = _sum_range(values, as_of - timedelta(days=13), as_of)
    last_30 = _sum_range(values, as_of - timedelta(days=29), as_of)
    last_60 = _sum_range(values, as_of - timedelta(days=59), as_of)
    last_90 = _sum_range(values, as_of - timedelta(days=89), as_of)
    previous_month_end = period_start - timedelta(days=1)
    previous_month_start = previous_month_end.replace(day=1)
    previous_two_month_end = previous_month_start - timedelta(days=1)
    previous_two_month_start = previous_two_month_end.replace(day=1)
    previous_month = _sum_range(values, previous_month_start, previous_month_end)
    previous_two_month = _sum_range(values, previous_two_month_start, previous_two_month_end)
    current_period_values = _series(values, period_start, as_of)
    last_30_values = _series(values, as_of - timedelta(days=29), as_of)
    last_28_values = _series(values, as_of - timedelta(days=27), as_of)
    pace_projection = achieved / elapsed_days * total_days
    recent_scale = max(target / max(total_days, 1) * 7, previous_7, 1.0)
    recent_change = max(-5.0, min(5.0, (last_7 - previous_7) / recent_scale))
    target_scale = max(target, 1.0)
    last_28_mean = sum(last_28_values) / max(len(last_28_values), 1)
    last_28_std = pstdev(last_28_values) if len(last_28_values) > 1 else 0.0
    angle = 2 * pi * (period_start.month - 1) / 12
    return [
        elapsed_days / total_days,
        remaining_days / total_days,
        log1p(max(target, 0.0)),
        _ratio(achieved, target),
        _ratio(pace_projection, target),
        _ratio(last_7, target),
        _ratio(previous_7, target),
        _ratio(last_14, target),
        _ratio(last_30, target),
        _ratio(last_60, target),
        _ratio(last_90, target),
        _ratio(previous_month, target),
        _ratio((previous_month + previous_two_month) / 2, target),
        sum(1 for value in current_period_values if value > 0) / max(len(current_period_values), 1),
        sum(1 for value in last_30_values if value > 0) / max(len(last_30_values), 1),
        recent_change,
        last_28_mean * total_days / target_scale,
        last_28_std * sqrt(total_days) / target_scale,
        sin(angle),
        cos(angle),
    ]


def achieved_amount(
    history: Iterable[tuple[date, float]],
    period_start: date,
    as_of: date,
) -> float:
    return _sum_range(_amounts_by_date(history, as_of), period_start, as_of)
