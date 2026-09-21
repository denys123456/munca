from collections import defaultdict
from datetime import date, datetime, time, timedelta, timezone

from championsclub_data.catalog import REWARDS
from championsclub_data.temporal import end_of_month, event_instant, iso_instant, month_identifier, month_range


def build_targets(
        random_generator,
        calibration,
        dealerships,
        managers,
        advisors,
        period_start,
        period_end,
        monthly_advisor_sales
):
    months = list(month_range(period_start, period_end))
    targets = []
    target_id = 1
    manager_by_dealership = {manager["dealershipId"]: manager["id"] for manager in managers}
    advisor_targets_by_month = defaultdict(float)

    for advisor in advisors:
        advisor_targets, target_id = build_advisor_targets(
            advisor,
            months,
            calibration,
            manager_by_dealership,
            monthly_advisor_sales,
            target_id,
            advisor_targets_by_month
        )
        targets.extend(advisor_targets)

    for dealership in dealerships:
        dealership_targets, target_id = build_dealership_targets(
            random_generator,
            dealership,
            months,
            manager_by_dealership,
            advisor_targets_by_month,
            target_id
        )
        targets.extend(dealership_targets)
    return targets


def build_advisor_targets(
        advisor,
        months,
        calibration,
        manager_by_dealership,
        monthly_advisor_sales,
        target_id,
        advisor_targets_by_month
):
    rows = []
    prior_values = []
    base_amount = (275000.0 if advisor.row["advisorType"] == "SALES" else 24500.0) * advisor.performance
    dealership_id = advisor.row["dealershipId"]
    for month_start in months:
        month_key = month_identifier(month_start)
        if prior_values:
            rolling_values = prior_values[-3:]
            expected = sum(rolling_values) / len(rolling_values)
        else:
            expected = base_amount * calibration["monthly_seasonality"][str(month_start.month)]
        target_amount = round(max(1000.0, expected * advisor.target_stretch), 2)
        rows.append(target_row(
            target_id,
            "ADVISOR",
            advisor.row["id"],
            month_start,
            target_amount,
            manager_by_dealership[dealership_id]
        ))
        advisor_targets_by_month[(dealership_id, month_key)] += target_amount
        target_id += 1
        prior_values.append(monthly_advisor_sales[(advisor.row["id"], month_key)])
    return rows, target_id


def build_dealership_targets(
        random_generator,
        dealership,
        months,
        manager_by_dealership,
        advisor_targets_by_month,
        target_id
):
    rows = []
    dealership_id = dealership.row["id"]
    for month_start in months:
        month_key = month_identifier(month_start)
        advisor_total = advisor_targets_by_month[(dealership_id, month_key)]
        target_amount = round(max(1000.0, advisor_total * random_generator.uniform(0.97, 1.01)), 2)
        rows.append(target_row(
            target_id,
            "DEALERSHIP",
            dealership_id,
            month_start,
            target_amount,
            manager_by_dealership[dealership_id]
        ))
        target_id += 1
    return rows, target_id


def target_row(target_id, owner_type, owner_id, month_start, target_amount, created_by):
    return {
        "id": target_id,
        "ownerType": owner_type,
        "ownerId": owner_id,
        "periodStart": month_start.isoformat(),
        "periodEnd": end_of_month(month_start).isoformat(),
        "targetAmount": target_amount,
        "currency": "EUR",
        "createdBy": created_by,
        "createdAt": target_created_at(month_start),
        "active": True
    }


def target_created_at(month_start):
    created_date = month_start - timedelta(days=7)
    return datetime.combine(created_date, time(9, 0, tzinfo=timezone.utc)).isoformat().replace("+00:00", "Z")


def build_redemption_intents(random_generator, advisors, period_start, period_end, generated_at):
    earliest = max(period_start + timedelta(days=180), date(2024, 7, 1))
    latest = min(period_end, generated_at.date())
    if latest <= earliest:
        return []
    intents = []
    intent_id = 1
    reward_ids = [reward["id"] for reward in REWARDS]
    reward_weights = [0.36, 0.24, 0.14, 0.08, 0.18]
    for advisor in advisors:
        if random_generator.random() >= 0.38:
            continue
        for _ in range(random_generator.randint(1, 3)):
            redemption_date = earliest + timedelta(days=random_generator.randint(0, (latest - earliest).days))
            intents.append({
                "id": intent_id,
                "advisorId": advisor.row["id"],
                "rewardId": random_generator.choices(reward_ids, weights=reward_weights, k=1)[0],
                "redeemedAt": iso_instant(event_instant(random_generator, redemption_date, 10, 19))
            })
            intent_id += 1
    intents.sort(key=lambda item: (item["redeemedAt"], item["id"]))
    return intents
