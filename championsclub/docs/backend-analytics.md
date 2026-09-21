# Backend Analytics Foundation

Milestone 3 turns the canonical PostgreSQL dataset into stable read models for Manager and Advisor experiences.

## Reporting date

The synthetic dataset ends on a fixed historical date. When the synthetic profile is enabled, analytics use the later of the latest loaded `synthetic_dataset_runs.period_end` and the latest recorded contract date up to today. The value is never allowed to move beyond the real current date.

This keeps dashboards, target progress and forecasts aligned with the canonical scenario instead of showing an empty month after the dataset end date. It also lets an interactive demo contract advance the reporting snapshot naturally.

Normal non-synthetic execution uses the current date.

## Period analytics

`GET /api/analytics` returns deterministic metrics calculated from recorded contracts:

- recorded sales value
- recorded contract count
- average contract amount
- cancelled contract count
- cancellation rate
- previous equal-length period sales
- previous equal-length period contract count
- sales growth percentage
- contract growth percentage
- daily, weekly and monthly series
- product mix
- product category mix
- powertrain mix
- new versus used vehicle mix
- customer segment mix

Product mix includes both sales share and transaction share. Category, powertrain, vehicle-condition and customer-segment breakdowns use transaction share because contract amounts vary substantially between financial and service products.

A cancelled contract is counted against the period in which the original contract was created. This makes cancellation rate a quality measure for contracts originated in the selected period.

## Team statistics

`GET /api/analytics/team-statistics` is Manager-scoped and returns:

- total Advisors
- active Advisors
- Sales Advisors
- Service Advisors
- Advisors with recorded contracts in the selected period
- recorded contracts
- cancelled contracts
- recorded sales value
- average contract amount
- active eligible products

The same read model is included in the Manager dashboard.

## Ranking

Leaderboard order is based on target achievement rather than raw contract value. This allows Sales Advisors and Service Advisors to be compared through normalized performance when a Manager requests the complete team ranking.

Advisor leaderboard requests are automatically restricted to the authenticated Advisor's own `SALES` or `SERVICE` cohort.

Target values are prorated when an analytics range overlaps only part of a configured target period. This keeps ranking calculations valid for arbitrary reporting ranges.

## Advisor profile

`GET /api/advisors/{advisorId}/profile` returns a deterministic profile without invoking ML or the LLM.

It contains:

- Advisor identity and dealership
- reporting date
- lifetime recorded sales
- lifetime recorded contract count
- lifetime cancelled contract count
- lifetime average contract amount
- first and last recorded contract dates
- strongest product by lifetime recorded sales
- current target progress
- current-period analytics
- cohort rank and cohort size
- available points
- lifetime earned points
- gamification progress

Advisors can read only their own profile. Managers can read profiles only for Advisors in their own dealership.

## Query performance

Flyway migration `V6__optimize_analytics_queries.sql` adds indexes for the main analytics access patterns over the canonical dataset. The implementation uses PostgreSQL aggregation read models instead of loading raw contracts into Java.

No materialized views are introduced at this stage because the current dataset size does not justify the additional refresh lifecycle.
