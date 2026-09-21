# CQRS

ChampionsClub uses lightweight in-process CQRS where separating writes from read-oriented models improves readability.

Commands include:

- `CreateSaleCommand`
- `RedeemRewardCommand`

Query-oriented services include:

- `GetAdvisorDashboardQuery`
- `GetManagerDashboardQuery`
- analytics read models
- sales history queries
- reward catalogue queries

There is no command bus, event sourcing or messaging infrastructure. The goal is clear ownership and maintainable code rather than distributed processing.
