# Database

PostgreSQL is the system database. Flyway owns schema evolution and Hibernate schema creation is disabled.

Important tables:

- `dealerships`
- `users`
- `financial_products`
- `point_rules`
- `sales`
- `point_transactions`
- `targets`
- `rewards`
- `reward_redemptions`
- `gamification_configuration`
- `alerts`
- `audit_events`
- `generated_results`
- `synthetic_dataset_runs`

## Domain foundation migration

`V4__align_advisors_points_and_contracts.sql` updates the initial prototype schema to the current role and points model.

It introduces Advisor type and product advisor scope, removes the obsolete Admin role from the active schema and renames the sale amount to `contract_amount`.

## Synthetic data migration

`V5__support_canonical_synthetic_dataset.sql` adds fields required by the canonical analytics and ML dataset.

Financial products gain a business category:

- `FINANCING`
- `LEASING`
- `SERVICE`
- `INSURANCE`
- `OTHER`

Contracts gain:

- `vehicle_powertrain`
- `vehicle_condition`
- `customer_segment`
- `cancelled_at`

The migration also adds `synthetic_dataset_runs` so a generated dataset can be identified and loaded idempotently.

Historical Flyway migrations are never edited. Legacy names inside earlier migrations describe earlier schema states and are expected.

## Analytics and incentive calibration migrations

`V6__optimize_analytics_queries.sql` adds indexes for the canonical analytics access patterns.

`V7__calibrate_incentive_economy.sql` updates the default Bronze, Silver and Gold thresholds to the calibrated multi-year point economy. The synthetic importer can also load the generated `gamification.json` configuration so the database and generated scenario remain aligned.

## Point accounting

The authoritative point balance is derived from `point_transactions`.

`availablePoints` includes every transaction type. `lifetimeEarnedPoints` includes sale earnings and sale reversals only.

No point total is stored directly on the user.

The synthetic data importer calculates sale awards with the same Java `PointRule` domain logic used by normal contract creation. Python does not calculate authoritative points.

## Canonical synthetic dataset

The production-like local scenario is generated outside Flyway. Hundreds of thousands of event rows do not belong in schema migration files.

The flow is:

```text
Python generator
    -> JSON Lines dataset
    -> quality validation
    -> Spring Boot batch importer
    -> PostgreSQL
```

Generated files live in `data/generated` and are not committed to Git.

See `docs/synthetic-data.md` for the complete methodology, calibration sources and generation commands.
