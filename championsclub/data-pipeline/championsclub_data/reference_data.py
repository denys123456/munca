from datetime import date, timedelta

from championsclub_data.catalog import PRODUCTS


def build_products():
    return [
        {
            "id": product.id,
            "name": product.name,
            "code": product.code,
            "description": product.description,
            "category": product.category,
            "advisorScope": product.advisor_scope,
            "eligible": True,
            "active": True
        }
        for product in PRODUCTS
    ]


def build_point_rules(period_start, period_end):
    transition_date = date(2025, 7, 1)
    rules = []
    rule_id = 1
    for product in PRODUCTS:
        first_end = min(period_end, transition_date - timedelta(days=1))
        if period_start <= first_end:
            rules.append(point_rule(rule_id, product, period_start, first_end, product.points))
            rule_id += 1
        second_start = max(period_start, transition_date)
        if second_start <= period_end:
            increased_points = max(product.points + 5, round(product.points * 1.08))
            rules.append(point_rule(rule_id, product, second_start, period_end + timedelta(days=365), increased_points))
            rule_id += 1
    return rules


def point_rule(rule_id, product, active_from, active_until, points):
    return {
        "id": rule_id,
        "productId": product.id,
        "pointsPerSale": points,
        "minimumEligibleAmount": round(product.minimum_eligible_amount, 2),
        "activeFrom": active_from.isoformat(),
        "activeUntil": active_until.isoformat(),
        "active": True
    }
