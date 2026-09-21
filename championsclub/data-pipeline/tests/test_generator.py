import json
import tempfile
import unittest
from datetime import date, datetime, timezone
from pathlib import Path

from championsclub_data.calibration import load_calibration
from championsclub_data.catalog import GAMIFICATION_THRESHOLDS, REWARDS
from championsclub_data.generator import generate_dataset
from championsclub_data.validation import validate_dataset


class GeneratorTest(unittest.TestCase):
    def test_small_dataset_is_reproducible_and_valid(self):
        project_directory = Path(__file__).resolve().parents[1]
        calibration = load_calibration(project_directory / "config" / "calibration.json")
        with tempfile.TemporaryDirectory() as first_directory, tempfile.TemporaryDirectory() as second_directory:
            arguments = dict(
                calibration=calibration,
                contract_count=3000,
                dealership_count=6,
                advisor_count=60,
                seed=12345,
                period_start=date(2024, 1, 1),
                period_end=date(2024, 6, 30),
                generated_at=datetime(2026, 9, 16, 12, 0, tzinfo=timezone.utc)
            )
            generate_dataset(output_directory=Path(first_directory), **arguments)
            generate_dataset(output_directory=Path(second_directory), **arguments)
            first_manifest = json.loads((Path(first_directory) / "dataset_manifest.json").read_text())
            second_manifest = json.loads((Path(second_directory) / "dataset_manifest.json").read_text())
            self.assertEqual(first_manifest["runId"], second_manifest["runId"])
            self.assertEqual(
                (Path(first_directory) / "sales.jsonl").read_bytes(),
                (Path(second_directory) / "sales.jsonl").read_bytes()
            )
            report = validate_dataset(Path(first_directory), calibration)
            self.assertTrue(report["passed"])
            gamification = json.loads((Path(first_directory) / "gamification.json").read_text())
            self.assertEqual(gamification, GAMIFICATION_THRESHOLDS)
            with (Path(first_directory) / "rewards.jsonl").open(encoding="utf-8") as handle:
                rewards = [json.loads(line) for line in handle]
            self.assertEqual(
                [reward["requiredPoints"] for reward in rewards],
                [reward["requiredPoints"] for reward in REWARDS]
            )

    def test_multi_year_smoke_dataset_is_valid(self):
        project_directory = Path(__file__).resolve().parents[1]
        calibration = load_calibration(project_directory / "config" / "calibration.json")
        with tempfile.TemporaryDirectory() as output_directory:
            generate_dataset(
                output_directory=Path(output_directory),
                calibration=calibration,
                contract_count=10000,
                dealership_count=40,
                advisor_count=600,
                seed=20260916,
                period_start=date(2024, 1, 1),
                period_end=date(2026, 9, 15),
                generated_at=datetime(2026, 9, 16, 12, 0, tzinfo=timezone.utc)
            )
            report = validate_dataset(Path(output_directory), calibration)
            self.assertTrue(report["passed"])

    def test_partial_final_month_does_not_generate_future_contracts(self):
        project_directory = Path(__file__).resolve().parents[1]
        calibration = load_calibration(project_directory / "config" / "calibration.json")
        with tempfile.TemporaryDirectory() as output_directory:
            output_path = Path(output_directory)
            period_end = date(2026, 9, 15)
            generate_dataset(
                output_directory=output_path,
                calibration=calibration,
                contract_count=3000,
                dealership_count=6,
                advisor_count=60,
                seed=98765,
                period_start=date(2026, 1, 1),
                period_end=period_end,
                generated_at=datetime(2026, 9, 16, 12, 0, tzinfo=timezone.utc)
            )
            with (output_path / "sales.jsonl").open(encoding="utf-8") as handle:
                sale_dates = [date.fromisoformat(json.loads(line)["saleDate"]) for line in handle]
            self.assertLessEqual(max(sale_dates), period_end)
            with (output_path / "targets.jsonl").open(encoding="utf-8") as handle:
                targets = [json.loads(line) for line in handle]
            september_targets = [
                row for row in targets
                if row["periodStart"] == "2026-09-01"
            ]
            self.assertTrue(september_targets)
            self.assertTrue(all(row["periodEnd"] == "2026-09-30" for row in september_targets))


if __name__ == "__main__":
    unittest.main()
