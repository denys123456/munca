import argparse
from datetime import date, datetime, timezone
from pathlib import Path

from championsclub_data.calibration import load_calibration
from championsclub_data.generator import generate_dataset
from championsclub_data.validation import validate_dataset


def main():
    parser = argparse.ArgumentParser(prog="championsclub-data")
    subparsers = parser.add_subparsers(dest="command", required=True)

    generate_parser = subparsers.add_parser("generate")
    generate_parser.add_argument("--output", type=Path, required=True)
    generate_parser.add_argument("--calibration", type=Path, required=True)
    generate_parser.add_argument("--contracts", type=int, default=300000)
    generate_parser.add_argument("--dealerships", type=int, default=40)
    generate_parser.add_argument("--advisors", type=int, default=600)
    generate_parser.add_argument("--seed", type=int, default=20260916)
    generate_parser.add_argument("--start", type=date.fromisoformat, default=date(2024, 1, 1))
    generate_parser.add_argument("--end", type=date.fromisoformat, default=date(2026, 9, 15))

    validate_parser = subparsers.add_parser("validate")
    validate_parser.add_argument("--output", type=Path, required=True)
    validate_parser.add_argument("--calibration", type=Path, required=True)

    arguments = parser.parse_args()
    calibration = load_calibration(arguments.calibration)

    if arguments.command == "generate":
        generated_at = datetime(2026, 9, 16, 12, 0, tzinfo=timezone.utc)
        manifest = generate_dataset(
            output_directory=arguments.output,
            calibration=calibration,
            contract_count=arguments.contracts,
            dealership_count=arguments.dealerships,
            advisor_count=arguments.advisors,
            seed=arguments.seed,
            period_start=arguments.start,
            period_end=arguments.end,
            generated_at=generated_at
        )
        report = validate_dataset(arguments.output, calibration)
        print(f"Generated {manifest['contractCount']} contracts in {arguments.output}")
        print(f"Data quality result: {'PASS' if report['passed'] else 'FAIL'}")
        if not report["passed"]:
            raise SystemExit(1)
        return

    report = validate_dataset(arguments.output, calibration)
    print(f"Data quality result: {'PASS' if report['passed'] else 'FAIL'}")
    if not report["passed"]:
        raise SystemExit(1)


if __name__ == "__main__":
    main()
