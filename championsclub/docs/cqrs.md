# CQRS

ChampionsClub uses in-process CQRS to keep write behaviour and read behaviour clear.

Commands:

- `CreateSaleCommand` records eligible sales and awards deterministic points.
- `RedeemRewardCommand` validates available points and records reward redemptions.

Queries:

- `GetAdvisorDashboardQuery` returns personal sales, points, target progress, forecast, insights, alerts and rewards context.
- `GetManagerDashboardQuery` returns dealership performance, ranking, employees needing attention, forecast and recommended actions.

There is no command bus, event sourcing or messaging infrastructure. The current problem is clarity, not distributed processing.

