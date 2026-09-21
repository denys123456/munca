import json
from collections import Counter
from datetime import date
from math import sqrt
from pathlib import Path

from championsclub_data.calibration import normalized
from championsclub_data.catalog import GAMIFICATION_THRESHOLDS, REWARDS
from championsclub_data.io import read_json_lines, write_json


def validate_dataset(output_directory: Path, calibration: dict) -> dict:
    manifest = read_json(output_directory / "dataset_manifest.json")
    gamification = read_json(output_directory / "gamification.json")
    dealerships = list(read_json_lines(output_directory / "dealerships.jsonl"))
    users = list(read_json_lines(output_directory / "users.jsonl"))
    products = list(read_json_lines(output_directory / "products.jsonl"))
    rewards = list(read_json_lines(output_directory / "rewards.jsonl"))
    targets = list(read_json_lines(output_directory / "targets.jsonl"))
    redemption_intents = list(read_json_lines(output_directory / "redemption_intents.jsonl"))

    advisor_by_id = {row["id"]: row for row in users if row["role"] == "ADVISOR"}
    product_by_id = {row["id"]: row for row in products}
    dealership_ids = {row["id"] for row in dealerships}
    category_counts = Counter()
    category_year_counts = Counter()
    powertrain_counts = Counter()
    new_vehicle_year_counts = Counter()
    yearly_counts = Counter()
    dealership_counts = Counter()
    status_counts = Counter()
    errors = []
    external_references = set()
    sale_count = 0

    for sale in read_json_lines(output_directory / "sales.jsonl"):
        sale_count += 1
        advisor = advisor_by_id.get(sale["advisorId"])
        product = product_by_id.get(sale["productId"])
        if advisor is None:
            errors.append(f"Sale {sale['id']} references an unknown advisor.")
            continue
        if sale["dealershipId"] not in dealership_ids or advisor["dealershipId"] != sale["dealershipId"]:
            errors.append(f"Sale {sale['id']} has an invalid dealership relationship.")
        if product is None:
            errors.append(f"Sale {sale['id']} references an unknown product.")
            continue
        if not supports(product["advisorScope"], advisor["advisorType"]):
            errors.append(f"Sale {sale['id']} violates product advisor scope.")
        if float(sale["contractAmount"]) <= 0:
            errors.append(f"Sale {sale['id']} has a non-positive contract amount.")
        if sale["externalReference"] in external_references:
            errors.append(f"Duplicate external reference {sale['externalReference']}.")
        external_references.add(sale["externalReference"])
        if sale["status"] == "CANCELLED" and not sale["cancelledAt"]:
            errors.append(f"Cancelled sale {sale['id']} has no cancellation timestamp.")
        sale_date = date.fromisoformat(sale["saleDate"])
        category_counts[product["category"]] += 1
        category_year_counts[(sale_date.year, product["category"])] += 1
        if sale["vehicleCondition"] == "NEW":
            powertrain_counts[(sale_date.year, sale["vehiclePowertrain"])] += 1
            new_vehicle_year_counts[sale_date.year] += 1
        yearly_counts[sale_date.year] += 1
        dealership_counts[sale["dealershipId"]] += 1
        status_counts[sale["status"]] += 1

    checks = [
        check(
            "manifest contract count",
            sale_count == manifest["contractCount"],
            sale_count,
            manifest["contractCount"]
        ),
        check(
            "manifest dealership count",
            len(dealerships) == manifest["dealershipCount"],
            len(dealerships),
            manifest["dealershipCount"]
        ),
        check(
            "manifest advisor count",
            len(advisor_by_id) == manifest["advisorCount"],
            len(advisor_by_id),
            manifest["advisorCount"]
        ),
        check(
            "gamification configuration",
            gamification == GAMIFICATION_THRESHOLDS,
            gamification,
            GAMIFICATION_THRESHOLDS
        ),
        check(
            "reward catalogue calibration",
            reward_configuration(rewards) == reward_configuration(REWARDS),
            reward_configuration(rewards),
            reward_configuration(REWARDS)
        )
    ]

    sales_advisors = sum(1 for row in advisor_by_id.values() if row["advisorType"] == "SALES")
    expected_sales_share = calibration["assumptions"]["sales_advisor_share"]
    sales_share = sales_advisors / len(advisor_by_id)
    checks.append(check(
        "advisor type distribution",
        abs(sales_share - expected_sales_share) <= 0.01,
        round(sales_share, 4),
        expected_sales_share
    ))

    for year in sorted(yearly_counts):
        expected_categories = normalized(calibration["contract_category_shares"][str(year)])
        actual_total = yearly_counts[year]
        for category, expected_share in expected_categories.items():
            actual_count = category_year_counts[(year, category)]
            actual_share = actual_count / actual_total
            tolerance = share_tolerance(expected_share, actual_total, 0.012)
            checks.append(check(
                f"{year} {category.lower()} share",
                abs(actual_share - expected_share) <= tolerance,
                round(actual_share, 4),
                {"share": round(expected_share, 4), "tolerance": round(tolerance, 4)}
            ))

    for year in sorted(yearly_counts):
        expected_powertrains = normalized(calibration["powertrain_shares"][str(year)])
        actual_total = new_vehicle_year_counts[year]
        for powertrain, expected_share in expected_powertrains.items():
            actual_share = powertrain_counts[(year, powertrain)] / actual_total
            tolerance = share_tolerance(expected_share, actual_total, 0.015)
            checks.append(check(
                f"{year} new-vehicle {powertrain.lower()} share",
                abs(actual_share - expected_share) <= tolerance,
                round(actual_share, 4),
                {"share": round(expected_share, 4), "tolerance": round(tolerance, 4)}
            ))

    cancellation_rate = status_counts["CANCELLED"] / sale_count
    checks.append(check(
        "cancellation rate",
        0.02 <= cancellation_rate <= 0.065,
        round(cancellation_rate, 4),
        "0.02..0.065"
    ))

    dealership_shares = [count / sale_count for count in dealership_counts.values()]
    maximum_allowed_share = max(0.08, 2.5 / len(dealerships))
    checks.append(check(
        "dealership concentration",
        max(dealership_shares) < maximum_allowed_share and min(dealership_shares) > 0.003,
        {"minimum": round(min(dealership_shares), 4), "maximum": round(max(dealership_shares), 4)},
        {"minimumGreaterThan": 0.003, "maximumLessThan": round(maximum_allowed_share, 4)}
    ))

    month_count = count_months(date.fromisoformat(manifest["periodStart"]), date.fromisoformat(manifest["periodEnd"]))
    expected_target_count = manifest["advisorCount"] * month_count + manifest["dealershipCount"] * month_count
    checks.append(check("target coverage", len(targets) == expected_target_count, len(targets), expected_target_count))
    if month_count >= 9:
        checks.append(check("redemption intents present", len(redemption_intents) > 0, len(redemption_intents), "> 0"))

    passed = not errors and all(item["passed"] for item in checks)
    report = {
        "passed": passed,
        "errors": errors[:100],
        "checks": checks,
        "statistics": {
            "contracts": sale_count,
            "dealerships": len(dealerships),
            "advisors": len(advisor_by_id),
            "salesAdvisors": sales_advisors,
            "serviceAdvisors": len(advisor_by_id) - sales_advisors,
            "targets": len(targets),
            "redemptionIntents": len(redemption_intents),
            "cancelledContracts": status_counts["CANCELLED"],
            "categoryCounts": dict(category_counts),
            "gamificationThresholds": gamification
        }
    }
    write_json(output_directory / "quality_report.json", report)
    return report


def reward_configuration(rewards):
    return [
        {
            "id": reward["id"],
            "requiredPoints": reward["requiredPoints"],
            "stock": reward["stock"]
        }
        for reward in rewards
    ]


def share_tolerance(expected_share, sample_size, minimum_tolerance):
    if sample_size <= 0:
        return 1.0
    standard_error = sqrt(expected_share * (1 - expected_share) / sample_size)
    return max(minimum_tolerance, 3 * standard_error)


def count_months(period_start, period_end):
    return (period_end.year - period_start.year) * 12 + period_end.month - period_start.month + 1


def supports(scope, advisor_type):
    return scope == "BOTH" or scope == advisor_type


def check(name, passed, actual, expected):
    return {
        "name": name,
        "passed": bool(passed),
        "actual": actual,
        "expected": expected
    }


def read_json(path):
    with path.open(encoding="utf-8") as handle:
        return json.load(handle)
