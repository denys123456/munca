import random
import shutil
import uuid
from collections import defaultdict
from datetime import date, datetime
from pathlib import Path

from championsclub_data.catalog import (
    GAMIFICATION_THRESHOLDS,
    INCENTIVE_ECONOMY_VERSION,
    REWARDS,
    business_calibration
)
from championsclub_data.contracts import generate_sales
from championsclub_data.engagement import build_redemption_intents, build_targets
from championsclub_data.io import write_json, write_json_line
from championsclub_data.profiles import build_dealerships, build_users
from championsclub_data.reference_data import build_point_rules, build_products
from championsclub_data.temporal import iso_instant


def generate_dataset(
        output_directory: Path,
        calibration: dict,
        contract_count: int,
        dealership_count: int,
        advisor_count: int,
        seed: int,
        period_start: date,
        period_end: date,
        generated_at: datetime
) -> dict:
    validate_generation_request(contract_count, dealership_count, advisor_count, period_start, period_end)
    reset_output(output_directory)
    random_generator = random.Random(seed)
    run_id = dataset_run_id(
        seed,
        contract_count,
        dealership_count,
        advisor_count,
        period_start,
        period_end,
        calibration["version"],
        INCENTIVE_ECONOMY_VERSION
    )

    dealerships = build_dealerships(random_generator, dealership_count)
    managers, advisors = build_users(random_generator, dealerships, advisor_count, calibration)
    write_reference_data(output_directory, dealerships, managers, advisors, period_start, period_end)

    monthly_advisor_sales = defaultdict(float)
    monthly_dealership_sales = defaultdict(float)
    sales_summary = generate_sales(
        output_directory / "sales.jsonl",
        random_generator,
        calibration,
        dealerships,
        advisors,
        contract_count,
        period_start,
        period_end,
        generated_at,
        monthly_advisor_sales,
        monthly_dealership_sales
    )
    targets = build_targets(
        random_generator,
        calibration,
        dealerships,
        managers,
        advisors,
        period_start,
        period_end,
        monthly_advisor_sales
    )
    write_rows(output_directory / "targets.jsonl", targets)
    redemption_intents = build_redemption_intents(
        random_generator,
        advisors,
        period_start,
        period_end,
        generated_at
    )
    write_rows(output_directory / "redemption_intents.jsonl", redemption_intents)

    manifest = dataset_manifest(
        run_id,
        seed,
        generated_at,
        period_start,
        period_end,
        dealership_count,
        len(managers),
        advisor_count,
        contract_count,
        calibration,
        sales_summary
    )
    write_json(output_directory / "dataset_manifest.json", manifest)
    return manifest


def write_reference_data(output_directory, dealerships, managers, advisors, period_start, period_end):
    write_rows(output_directory / "dealerships.jsonl", [profile.row for profile in dealerships])
    write_rows(output_directory / "users.jsonl", managers + [profile.row for profile in advisors])
    write_rows(output_directory / "products.jsonl", build_products())
    write_rows(output_directory / "point_rules.jsonl", build_point_rules(period_start, period_end))
    write_rows(output_directory / "rewards.jsonl", REWARDS)
    write_json(output_directory / "gamification.json", GAMIFICATION_THRESHOLDS)


def dataset_run_id(
        seed,
        contract_count,
        dealership_count,
        advisor_count,
        period_start,
        period_end,
        calibration_version,
        incentive_economy_version
):
    identity = (
        f"championsclub:{seed}:{contract_count}:{dealership_count}:{advisor_count}:"
        f"{period_start}:{period_end}:{calibration_version}:{incentive_economy_version}"
    )
    return str(uuid.uuid5(uuid.NAMESPACE_URL, identity))


def dataset_manifest(
        run_id,
        seed,
        generated_at,
        period_start,
        period_end,
        dealership_count,
        manager_count,
        advisor_count,
        contract_count,
        calibration,
        sales_summary
):
    return {
        "runId": run_id,
        "seed": seed,
        "generatedAt": iso_instant(generated_at),
        "periodStart": period_start.isoformat(),
        "periodEnd": period_end.isoformat(),
        "dealershipCount": dealership_count,
        "managerCount": manager_count,
        "advisorCount": advisor_count,
        "contractCount": contract_count,
        "calibrationVersion": calibration["version"],
        "sourceManifest": {
            "sources": calibration["sources"],
            "modeledAssumptions": calibration["assumptions"],
            "businessCalibration": business_calibration()
        },
        "generatedFiles": [
            "dealerships.jsonl",
            "users.jsonl",
            "products.jsonl",
            "point_rules.jsonl",
            "rewards.jsonl",
            "gamification.json",
            "sales.jsonl",
            "targets.jsonl",
            "redemption_intents.jsonl"
        ],
        "summary": sales_summary
    }


def validate_generation_request(contract_count, dealership_count, advisor_count, period_start, period_end):
    if contract_count < 1000:
        raise ValueError("Contract count must be at least 1000.")
    if dealership_count < 3:
        raise ValueError("At least three dealerships are required.")
    if advisor_count < dealership_count * 3:
        raise ValueError("Advisor count must support at least three advisors per dealership.")
    if period_end <= period_start:
        raise ValueError("Dataset end date must be after the start date.")


def reset_output(output_directory: Path):
    output_directory.mkdir(parents=True, exist_ok=True)
    for path in output_directory.iterdir():
        if path.name == ".gitkeep":
            continue
        if path.is_dir():
            shutil.rmtree(path)
        else:
            path.unlink()


def write_rows(path, rows):
    with path.open("w", encoding="utf-8") as handle:
        for row in rows:
            write_json_line(handle, row)
