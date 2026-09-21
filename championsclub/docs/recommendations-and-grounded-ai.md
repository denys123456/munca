# Alerts, recommendations and grounded AI

Milestone 5 keeps business decisions deterministic and uses the LLM only as a presentation layer. Java owns alert and recommendation rules. The LLM receives verified facts plus recommendations that Java has already selected.

## Alert rules

The alert evaluator covers target risk and achievement, period-over-period decline and improvement, trained-forecast risk, anomaly detection, advisor inactivity, product underperformance, gamification progress, reward eligibility and manager team opportunities. Alerts remain deduplicated through their existing database deduplication key.

Forecast-based alerts use the trained ML result only when a forecast is available. The target-risk rules still work without ML.

## Deterministic recommendations

The recommendation engine returns up to five prioritized actions. Each recommendation contains:

- `type`
- `priority`
- `title`
- `action`
- `reason`
- `supportingFacts`

Supported recommendation types are:

- `TARGET_RECOVERY`
- `PRODUCT_FOCUS`
- `COACHING_REQUIRED`
- `MAINTAIN_MOMENTUM`
- `CLOSE_TO_NEXT_LEVEL`
- `REWARD_OPPORTUNITY`
- `IMPROVE_PRODUCT_MIX`

Advisor recommendations use target progress, forecast probability, product performance, gamification progress and reward affordability. Manager recommendations additionally use team statistics, at-risk advisors, ranking and category mix.

## Grounded AI contract

`InsightService` sends the AI provider a payload containing only verified dashboard facts and deterministic recommendations. The system prompt explicitly forbids recalculating values, inventing causes, inventing forecasts or adding recommendations that were not supplied by Java.

The response contract remains `PerformanceInsight` with:

- `summary`
- `whatChanged`
- `whyItMatters`
- `risk`
- `opportunity`
- `recommendedAction`

If the provider is disabled, unavailable, times out or returns invalid output, `InsightService` returns a deterministic grounded fallback instead. This keeps dashboard summaries available during the demo without requiring an external AI key.

## Dashboard contract

Both Advisor and Manager dashboards now expose a top-level `recommendations` array next to `insight` and `alerts`. The AI input includes the same recommendation objects that are returned to the frontend, which keeps the natural-language summary traceable to deterministic business logic.
