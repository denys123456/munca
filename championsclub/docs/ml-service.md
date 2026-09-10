# ML Service

The Python service owns only forecasting, target prediction and trend analysis.

Endpoint:

```text
POST /forecast
```

Request shape:

```json
{
  "entityId": 42,
  "historicalSales": [72000, 81000, 89000],
  "target": 100000,
  "forecastHorizonDays": 30
}
```

Response shape:

```json
{
  "predictedSales": 93500,
  "targetAchievementProbability": 0.72,
  "trend": "UP",
  "confidence": 0.84
}
```

Spring validates the response range. If the ML service is unavailable or returns invalid data, forecasting components show a contained unavailable state while core sales, points, rewards and gamification continue to work.
