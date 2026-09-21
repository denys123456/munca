# Incentive Economy Calibration

Milestone 4A calibrates the synthetic ChampionsClub incentive economy so Sales Advisors and Service Advisors have comparable opportunities to progress while rewards remain meaningful over the full canonical history.

The calibration is a product design decision for the synthetic scenario. It is not presented as an internal Volkswagen Financial Services points policy.

## Design goals

The incentive economy is designed to satisfy four goals:

- Bronze, Silver and Gold must all be visible in the final dataset
- Sales Advisors and Service Advisors should have comparable long-term progression opportunities
- reward redemption must reduce spendable points without reducing lifetime gamification progress
- low-cost rewards should be broadly accessible while premium rewards remain selective

Points are an incentive mechanism rather than a conversion from contract value. A lower-value service contract can therefore carry a meaningful point award when that supports balanced participation between roles.

## Point awards

The initial synthetic point awards are:

| Product | Advisor scope | Base points |
| --- | --- | ---: |
| Classic Financing | SALES | 180 |
| Premium Financing | SALES | 220 |
| Balloon Financing | SALES | 200 |
| Leasing Standard | SALES | 210 |
| Leasing Flex | SALES | 230 |
| Fleet Leasing | SALES | 270 |
| Maintenance Plan | SERVICE | 150 |
| Service Care Plus | SERVICE | 180 |
| Extended Warranty | BOTH | 150 |
| Motor Insurance | BOTH | 115 |
| Payment Protection | SALES | 80 |
| Mobility Insurance | BOTH | 95 |

Point rules remain versioned. The generated scenario increases awards from 1 July 2025 using the existing point-rule versioning mechanism.

The Java backend remains the authoritative calculator of awarded points. Python generates point-rule configuration and raw contract events only.

## Gamification thresholds

The final thresholds are:

| Level | Lifetime earned points |
| --- | ---: |
| Bronze | 0 to 59,999 |
| Silver | 60,000 to 119,999 |
| Gold | 120,000 and above |

The 300,000-contract canonical dataset produces the following calibrated distribution:

| Cohort | Bronze | Silver | Gold |
| --- | ---: | ---: | ---: |
| All Advisors | 29.3% | 61.2% | 9.5% |
| Sales Advisors | 28.6% | 62.1% | 9.3% |
| Service Advisors | 31.1% | 58.9% | 10.0% |

This distribution keeps Gold selective while avoiding systematic disadvantage for Service Advisors.

## Reward catalogue

The final reward costs are:

| Reward | Points cost | Initial stock |
| --- | ---: | ---: |
| Mobility Voucher | 15,000 | 500 |
| Training Voucher | 20,000 | 300 |
| Technology Voucher | 35,000 | 200 |
| Travel Voucher | 50,000 | 120 |
| Premium Experience Voucher | 70,000 | 50 |

With the canonical dataset and generated redemption intents, the calibration produces 275 successful historical redemptions across 187 Advisors. The remaining intents fail because the Advisor did not have enough spendable points at that historical moment. Stock does not become the dominant failure reason.

At the final dataset snapshot, lower-cost rewards are available to most Advisors while the premium reward remains meaningfully selective.

## Lifetime and available points

Two balances remain intentionally separate:

```text
sale award
    -> availablePoints increases
    -> lifetimeEarnedPoints increases

sale reversal
    -> availablePoints decreases
    -> lifetimeEarnedPoints decreases

reward redemption
    -> availablePoints decreases
    -> lifetimeEarnedPoints unchanged
```

This guarantees that spending a reward cannot reduce Bronze, Silver or Gold progress.

## Configuration ownership

The synthetic generator writes:

```text
point_rules.jsonl
gamification.json
rewards.jsonl
```

The Spring Boot importer loads these configurations before importing historical contract effects. Flyway also provides the calibrated gamification thresholds as safe application defaults.

The dataset manifest records the business calibration together with the external market calibration sources so a generated scenario remains auditable and reproducible.
