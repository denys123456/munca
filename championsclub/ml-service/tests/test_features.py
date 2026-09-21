from datetime import date, timedelta

from app.features import FEATURE_NAMES, build_feature_vector


def test_feature_vector_ignores_future_values():
    as_of = date(2026, 9, 15)
    start = as_of - timedelta(days=179)
    history = []
    for offset in range(180):
        day = start + timedelta(days=offset)
        history.append((day, 1000.0 if day.weekday() < 5 else 0.0))
    baseline = build_feature_vector(
        history,
        date(2026, 9, 1),
        date(2026, 9, 30),
        as_of,
        30000.0,
    )
    with_future = build_feature_vector(
        history + [(as_of + timedelta(days=1), 999999.0)],
        date(2026, 9, 1),
        date(2026, 9, 30),
        as_of,
        30000.0,
    )
    assert baseline == with_future
    assert len(baseline) == len(FEATURE_NAMES)


def test_feature_vector_uses_only_information_available_at_snapshot():
    as_of = date(2026, 9, 14)
    history = [(as_of - timedelta(days=offset), 100.0) for offset in range(179, -1, -1)]
    features = build_feature_vector(
        history,
        date(2026, 9, 1),
        date(2026, 9, 30),
        as_of,
        3000.0,
    )
    assert features[0] == 14 / 30
    assert features[1] == 16 / 30
    assert features[3] == 1400 / 3000
