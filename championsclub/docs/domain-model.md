# Domain Model

## Identity and dealership ownership

`User` represents a Manager or Advisor. Every user belongs to one dealership.

An Advisor also has an `AdvisorType`:

- `SALES`
- `SERVICE`

Managers do not have an advisor type.

Authorization is enforced in the backend:

- an Advisor can access only personal data
- a Manager can access data belonging to the Manager's dealership

## Financial products and contracts

`FinancialProduct` represents an eligible financial or service product. Each product has an advisor scope:

- `SALES`
- `SERVICE`
- `BOTH`

Each product also belongs to a business category:

- `FINANCING`
- `LEASING`
- `SERVICE`
- `INSURANCE`
- `OTHER`

`Sale` represents a recorded contract and contains the advisor, dealership, product, contract amount, sale date, external reference, currency, awarded points and status.

A contract can also carry vehicle and customer context for analytics:

- vehicle powertrain
- new or used vehicle condition
- private, SME or fleet customer segment
- cancellation timestamp when applicable

Point calculation is performed by the backend. The frontend and synthetic data generator do not determine authoritative points.

## Points

Points are stored as a transaction ledger rather than a mutable total on the user.

Supported transaction types:

- `SALE_EARNED`
- `SALE_REVERSAL`
- `REWARD_REDEMPTION`
- `MANUAL_ADJUSTMENT`

Two values are derived from the ledger:

- `availablePoints`: all point transactions combined
- `lifetimeEarnedPoints`: sale-earned points minus sale reversals

Reward redemption affects `availablePoints` only. This preserves gamification progress after a reward is used.

A sale reversal remains an auditable business event even if the points from that sale have already been spent. The available balance may therefore become negative until later earnings recover it.

## Point rules

`PointRule` belongs to a financial product and defines:

- points per eligible sale
- minimum eligible contract amount
- effective start date
- effective end date
- active status

Effective periods make point configuration versionable without changing historical contracts.

## Rewards

`Reward` owns reward availability, point cost and optional stock.

A redemption requires enough `availablePoints`. An issued voucher writes a `REWARD_REDEMPTION` transaction. The transaction does not modify `lifetimeEarnedPoints`.

## Targets

`Target` supports Advisor and Dealership ownership. Managers can create or update targets only inside their dealership.

Target progress is calculated from recorded contracts for the relevant period.

## Gamification

`GamificationProgress` derives Bronze, Silver and Gold membership from `lifetimeEarnedPoints` and configurable thresholds.

This model intentionally separates reward spending from long-term achievement progress.
