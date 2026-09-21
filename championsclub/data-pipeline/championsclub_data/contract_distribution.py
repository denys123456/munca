import calendar
import math
from datetime import date, timedelta

from championsclub_data.calibration import normalized
from championsclub_data.profiles import CATEGORY_ORDER
from championsclub_data.temporal import event_instant


def allocate_contract_groups(contract_count, months, calibration, period_start, period_end):
    weighted_groups = []
    for month_start in months:
        year = str(month_start.year)
        year_multiplier = calibration["year_volume_multiplier"].get(year, 1.0)
        seasonality = calibration["monthly_seasonality"][str(month_start.month)]
        coverage = month_coverage(month_start, period_start, period_end)
        category_shares = normalized(calibration["contract_category_shares"][year])
        for category in CATEGORY_ORDER:
            weighted_groups.append(((month_start, category), year_multiplier * seasonality * coverage * category_shares[category]))
    return integer_allocation(contract_count, weighted_groups)



def month_coverage(month_start, period_start, period_end):
    _, day_count = calendar.monthrange(month_start.year, month_start.month)
    month_end = date(month_start.year, month_start.month, day_count)
    first_day = max(month_start, period_start)
    last_day = min(month_end, period_end)
    included_days = (last_day - first_day).days + 1
    return included_days / day_count


def integer_allocation(total, weighted_items):
    weight_total = sum(weight for _, weight in weighted_items)
    raw = [(key, total * weight / weight_total) for key, weight in weighted_items]
    result = {key: math.floor(value) for key, value in raw}
    remaining = total - sum(result.values())
    residuals = sorted(raw, key=lambda item: item[1] - math.floor(item[1]), reverse=True)
    for index in range(remaining):
        result[residuals[index][0]] += 1
    return result


def split_advisor_types(random_generator, category, count, calibration):
    if category in ("FINANCING", "LEASING"):
        return {"SALES": count, "SERVICE": 0}
    if category == "SERVICE":
        return {"SALES": 0, "SERVICE": count}
    sales_share = calibration["assumptions"]["insurance_sales_advisor_share"]
    sales_count = round(count * sales_share)
    variation = min(max(round(count * 0.015), 1), 20)
    sales_count = max(0, min(count, sales_count + random_generator.randint(-variation, variation)))
    return {"SALES": sales_count, "SERVICE": count - sales_count}


def advisor_selection_weights(advisor_pool, dealerships_by_id, category, month_index):
    weights = []
    for advisor in advisor_pool:
        dealership = dealerships_by_id[advisor.row["dealershipId"]]
        advisor_trend = max(0.65, 1.0 + advisor.monthly_trend * month_index)
        dealership_trend = max(0.75, 1.0 + dealership.monthly_trend * month_index)
        weights.append(
            advisor.performance
            * advisor.category_affinity[category]
            * advisor_trend
            * dealership_trend
        )
    return weights


def weighted_days(month_start, period_start, period_end):
    _, day_count = calendar.monthrange(month_start.year, month_start.month)
    month_end = date(month_start.year, month_start.month, day_count)
    first_day = max(month_start, period_start)
    last_day = min(month_end, period_end)
    days = [first_day + timedelta(days=offset) for offset in range((last_day - first_day).days + 1)]
    weights = []
    for value in days:
        if value.weekday() < 5:
            weights.append(1.0)
        elif value.weekday() == 5:
            weights.append(0.62)
        else:
            weights.append(0.16)
    return days, weights


def choose_vehicle_condition(random_generator, category):
    new_share = {
        "FINANCING": 0.82,
        "LEASING": 0.93,
        "SERVICE": 0.38,
        "INSURANCE": 0.72
    }[category]
    return "NEW" if random_generator.random() < new_share else "USED"


def choose_customer_segment(random_generator, product_code, advisor_type):
    if product_code == "LEASE_FLEET":
        return random_generator.choices(("FLEET", "SME", "PRIVATE"), weights=(0.86, 0.12, 0.02), k=1)[0]
    if advisor_type == "SERVICE":
        return random_generator.choices(("PRIVATE", "SME", "FLEET"), weights=(0.79, 0.16, 0.05), k=1)[0]
    return random_generator.choices(("PRIVATE", "SME", "FLEET"), weights=(0.72, 0.21, 0.07), k=1)[0]


def choose_powertrain(random_generator, calibration, year, vehicle_condition):
    shares = dict(calibration["powertrain_shares"][str(year)])
    if vehicle_condition == "USED":
        adjustment = {
            "PETROL": 1.20,
            "DIESEL": 1.25,
            "BATTERY_ELECTRIC": 0.58,
            "PLUG_IN_HYBRID": 0.68,
            "HYBRID": 0.90,
            "OTHER": 1.00
        }
        shares = {key: value * adjustment[key] for key, value in shares.items()}
    shares = normalized(shares)
    keys = list(shares)
    return random_generator.choices(keys, weights=[shares[key] for key in keys], k=1)[0]


def generate_contract_amount(random_generator, product, customer_segment, vehicle_condition):
    value = random_generator.lognormvariate(math.log(product.amount_median), product.amount_sigma)
    value *= product.amount_multiplier
    if customer_segment == "SME":
        value *= 1.22
    elif customer_segment == "FLEET":
        value *= 1.85
    if vehicle_condition == "USED" and product.category in ("FINANCING", "LEASING"):
        value *= 0.76
    minimum = max(120.0, product.minimum_eligible_amount * 0.55)
    maximum = 250000.0 if product.category in ("FINANCING", "LEASING") else 12000.0
    return round(min(max(value, minimum), maximum), 2)


def cancellation(random_generator, calibration, category, sale_date, generated_at):
    probability = calibration["assumptions"]["cancellation_rates"][category]
    if random_generator.random() >= probability:
        return "RECORDED", None
    cancellation_date = sale_date + timedelta(days=random_generator.randint(1, 45))
    latest_date = generated_at.date()
    if cancellation_date > latest_date:
        cancellation_date = latest_date
    if cancellation_date < sale_date:
        return "RECORDED", None
    return "CANCELLED", event_instant(random_generator, cancellation_date, 9, 18)


def supports(scope, advisor_type):
    return scope == "BOTH" or scope == advisor_type
