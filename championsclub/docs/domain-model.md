# Domain Model

Core concepts:

- `User` represents advisors, managers and administrators.
- `Dealership` represents the operating unit for sales and management dashboards.
- `FinancialProduct` owns point calculation for eligible products.
- `Sale` records financial service sales and awarded points.
- `Target` owns target period validity and achievement calculation.
- `Reward` owns redemption eligibility.
- `GamificationProgress` calculates Bronze, Silver and Gold progress.
- `Alert` represents concise proactive attention items.

The domain does not depend on Spring, JPA, HTTP, PostgreSQL, Python or AI providers. This keeps business behaviour readable without infrastructure knowledge.

