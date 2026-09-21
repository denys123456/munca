# Canonical Demo Scenario

The final synthetic dataset uses a fixed seed so the same accounts and business states are reproduced every time the canonical scenario is generated.

The preferred demo dealership is dealership `37`.

## Manager

```text
manager.037@championsclub.example
```

This Manager can demonstrate dealership KPIs, team statistics, target progress, Advisor ranking, Advisors needing attention, alerts, recommendations and the executive summary once the remaining intelligence and frontend milestones are complete.

## Primary Sales Advisor

```text
advisor.1083@championsclub.example
```

At the canonical snapshot this Advisor is deliberately useful for an interactive demo:

- Advisor type: `SALES`
- gamification level: `BRONZE`
- lifetime earned points: `59,866`
- points required for Silver: `134`
- current target status: `AT_RISK`
- current target progress: approximately `41.6%`
- historical reward redemptions are already present

A new eligible Classic Financing contract above the minimum amount awards enough points under the current rule to move this Advisor from Bronze to Silver.

After the sale, redeeming a reward demonstrates the second important rule: `availablePoints` decreases while `lifetimeEarnedPoints` and the Silver level remain unchanged.

## Service Advisor

```text
advisor.1088@championsclub.example
```

This account provides a Service Advisor scenario in the same dealership. It demonstrates that the same application supports a different product scope and different contract mix while using the same analytics, points and gamification framework.

At the canonical snapshot this Advisor is Silver and below expected target pace.

## Additional Manager examples

Within dealership `37` the generated data also contains intentionally different performance states:

```text
advisor.1394@championsclub.example
```

has already achieved the current target while remaining Bronze on lifetime gamification.

```text
advisor.1571@championsclub.example
```

is Gold on lifetime gamification while the current monthly target is at risk.

These accounts make an important product concept visible: long-term gamification progress and current-period sales performance measure different things.

## Password

All generated accounts use the local value configured in:

```text
CHAMPIONSCLUB_DEMO_PASSWORD
```

The password is configuration only and is never committed to source control.
