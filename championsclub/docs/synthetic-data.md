# Canonical Synthetic Dataset

ChampionsClub uses a large reproducible synthetic dataset for local development, analytics and ML experiments. The dataset is synthetic by design. It does not contain internal Volkswagen customer, employee or dealership data.

## Default scenario

The default generator creates:

- 40 dealerships
- 40 managers
- 600 advisors
- 420 Sales Advisors
- 180 Service Advisors
- 12 financial and service products
- 300,000 contracts
- monthly Advisor targets
- monthly Dealership targets
- reward redemption intents
- data from 1 January 2024 through 15 September 2026

The seed is fixed by default so the same configuration produces the same dataset.

Generated files are written to `data/generated` and are intentionally excluded from Git. Only `.gitkeep` is committed.

## Calibration sources

The generator separates sourced calibration values from modeled assumptions.

### Volkswagen Group Mobility

Volkswagen Group Mobility reported the following new-contract counts for 2025:

| Category | 2025 contracts | 2024 contracts | 2025 change |
| --- | ---: | ---: | ---: |
| Financing | 1,787,000 | 1,754,000 | +1.9% |
| Leasing | 2,326,000 | 2,187,000 | +6.4% |
| Services | 2,451,000 | 2,324,000 | +5.5% |
| Insurance | 4,039,000 | 4,026,000 | +0.3% |

Source: Volkswagen Group Mobility FY 2025 results

`https://www.vwfs.com/en/media/press-releases/2026/JPG-2025.html`

These values calibrate the synthetic contract-category distribution for 2024 and 2025. The 2026 category distribution is a conservative modeled continuation rather than a claim about unpublished internal Volkswagen data.

### ACEA powertrain data

New-vehicle powertrain distributions are calibrated from ACEA market statistics.

For 2024 the source reports petrol 33.3%, diesel 11.9%, battery electric 13.6%, plug-in hybrid 7.1%, hybrid electric 30.9% and other powertrains 3.1%.

Source:

`https://www.acea.auto/pc-registrations/new-car-registrations-0-8-in-2024-battery-electric-13-6-market-share/`

For 2025 the source reports battery electric 17.4%, plug-in hybrid 9.4%, hybrid electric 34.5% and petrol plus diesel 35.5%. The generator uses a documented split of the combined petrol and diesel share based on the observed 2025 mix. This split is a modeling assumption rather than a directly published full-year ACEA value.

Source:

`https://www.acea.auto/pc-registrations/new-car-registrations-1-8-in-2025-battery-electric-17-4-market-share/`

For the 2026 synthetic period the generator uses the ACEA H1 2026 mix: battery electric 20.7%, plug-in hybrid 9.8%, hybrid electric 37.3%, petrol 22.2%, diesel 7.5% and the residual share as other powertrains.

Source:

`https://www.acea.auto/pc-registrations/new-car-registrations-5-7-in-h1-2026-battery-electric-20-7-market-share/`

ACEA values describe new registrations. Used-vehicle contracts in the synthetic dataset deliberately shift toward petrol and diesel so the overall synthetic fleet mix does not incorrectly pretend that new-registration shares also describe used vehicles.

## Modeled variation

The dataset is not generated with independent uniform random values. It includes persistent structure at multiple levels:

```text
market
  -> dealership
      -> advisor
          -> product category
              -> time
```

The generator models:

- dealership size differences
- advisor performance differences
- Sales Advisor and Service Advisor product eligibility
- advisor-specific product affinity
- persistent positive and negative advisor trends
- dealership-level trends
- monthly seasonality
- weekday and weekend activity differences
- product-specific contract amount distributions
- private, SME and fleet customer segments
- new and used vehicle differences
- changing powertrain mix by year
- category-specific cancellation rates
- monthly targets based on prior performance
- reward redemption attempts after sufficient history exists

Contract amounts use log-normal distributions because financial values are positive and right-skewed. Count volume is distributed through weighted hierarchical sampling rather than assigning the same expected volume to every advisor.

## Product catalogue

The synthetic catalogue contains 12 products across four categories:

- `FINANCING`
- `LEASING`
- `SERVICE`
- `INSURANCE`

Each product has an explicit `SALES`, `SERVICE` or `BOTH` advisor scope.

Point rules are versioned. The generated scenario contains one rule period before 1 July 2025 and another rule period from 1 July 2025 onward. The Java backend calculates awarded points from these point rules while loading contracts. The Python generator never calculates authoritative points.

## Contract context

Synthetic contracts include fields needed by later analytics and ML work:

- `vehiclePowertrain`
- `vehicleCondition`
- `customerSegment`
- `status`
- `cancelledAt`

These fields are intentionally limited to attributes that support planned business analysis. The project does not add arbitrary columns merely to make the dataset look larger.

## Targets

Targets are generated monthly for every Advisor and every Dealership.

For an Advisor the target is derived from recent historical performance and a stable advisor-specific stretch factor. The generator does not derive a target from the same month's realized performance. This avoids a trivial same-period relationship that would make later forecasting artificially easy.

Dealership targets are based on the Advisor targets within that dealership.

## Points, gamification and rewards

The Python generator creates raw contract events, point-rule configuration, gamification configuration, reward configuration and redemption intents. It does not calculate authoritative account balances.

The Spring Boot synthetic dataset importer owns authoritative business effects:

- product eligibility validation
- point-rule lookup
- sale point awards
- sale reversal transactions
- reward balance checks
- reward stock checks
- reward redemption point transactions

The synthetic point economy is calibrated so Sales Advisors and Service Advisors have comparable gamification progression opportunities. Bronze, Silver and Gold remain visible in the final 300,000-contract scenario. Reward costs are scaled to the same multi-year point economy rather than to the small smoke-test dataset.

The generated `gamification.json` file configures Bronze at `0`, Silver at `60,000` and Gold at `120,000` lifetime earned points. Reward redemption affects spendable points only.

The detailed rationale and measured distribution are documented in `docs/incentive-calibration.md`.

This prevents the data generator from becoming a second implementation of the Java business rules.


## Current-period snapshot

The default scenario ends on September 15, 2026 so the application has a realistic partial current month instead of an empty reporting period. The generator scales the final month volume by the fraction of the month included and never generates a contract after the configured dataset end date.

September targets still cover the complete calendar month. This allows target progress and forecasting to evaluate month-to-date performance against a full monthly objective.

The period can be changed through `CHAMPIONSCLUB_DATASET_START_DATE` and `CHAMPIONSCLUB_DATASET_END_DATE`.

## Validation

Generation automatically produces `quality_report.json`.

The validation checks include:

- manifest row counts
- Advisor type distribution
- annual financial-product category distributions
- new-vehicle powertrain distributions
- product eligibility by Advisor type
- dealership ownership consistency
- unique external contract references
- positive contract amounts
- valid cancellation timestamps
- cancellation rate range
- dealership concentration
- complete monthly target coverage
- presence of reward redemption intents for sufficiently long datasets
- calibrated gamification configuration
- calibrated reward catalogue configuration

The Docker generator exits with a non-zero status if validation fails.

## Generation

From the repository root:

```bash
docker compose --profile data run --rm data-generator
```

The default output is `data/generated`.

Generation parameters can be changed in `.env`:

```text
CHAMPIONSCLUB_DATASET_CONTRACTS=300000
CHAMPIONSCLUB_DATASET_DEALERSHIPS=40
CHAMPIONSCLUB_DATASET_ADVISORS=600
CHAMPIONSCLUB_DATASET_SEED=20260916
CHAMPIONSCLUB_DATASET_START_DATE=2024-01-01
CHAMPIONSCLUB_DATASET_END_DATE=2026-09-15
```

For a quick development dataset use a smaller contract count such as 10000. The same generator and validation logic are used.

## Loading into PostgreSQL

Use the `synthetic` Spring profile. The backend reads the generated JSON Lines files from `/app/data/generated` and imports them in batches.

The loader refuses to mix the canonical synthetic scenario with an existing application dataset. Reset the local database volume before the first synthetic load.

The imported run is stored in `synthetic_dataset_runs`. Restarting the same generated dataset is idempotent because the backend recognizes the loaded run identifier and skips a second import.

The generated dataset should be regenerated only when the seed, calibration or scenario parameters intentionally change.
