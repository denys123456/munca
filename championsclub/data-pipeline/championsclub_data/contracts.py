from collections import defaultdict

from championsclub_data.catalog import PRODUCTS
from championsclub_data.contract_distribution import (
    advisor_selection_weights,
    allocate_contract_groups,
    cancellation,
    choose_customer_segment,
    choose_powertrain,
    choose_vehicle_condition,
    generate_contract_amount,
    split_advisor_types,
    supports,
    weighted_days
)
from championsclub_data.io import write_json_line
from championsclub_data.profiles import CATEGORY_ORDER
from championsclub_data.temporal import event_instant, iso_instant, month_identifier, month_range


def generate_sales(
        path,
        random_generator,
        calibration,
        dealerships,
        advisors,
        contract_count,
        period_start,
        period_end,
        generated_at,
        monthly_advisor_sales,
        monthly_dealership_sales
):
    months = list(month_range(period_start, period_end))
    group_counts = allocate_contract_groups(contract_count, months, calibration, period_start, period_end)
    dealerships_by_id = {profile.row["id"]: profile for profile in dealerships}
    advisor_pools = {
        "SALES": [advisor for advisor in advisors if advisor.row["advisorType"] == "SALES"],
        "SERVICE": [advisor for advisor in advisors if advisor.row["advisorType"] == "SERVICE"]
    }
    products_by_category = {
        category: [product for product in PRODUCTS if product.category == category]
        for category in CATEGORY_ORDER
    }
    category_counts = defaultdict(int)
    powertrain_counts = defaultdict(int)
    cancelled_count = 0
    sale_id = 1

    with path.open("w", encoding="utf-8") as handle:
        for month_index, month_start in enumerate(months):
            day_choices, day_weights = weighted_days(month_start, period_start, period_end)
            for category in CATEGORY_ORDER:
                count = group_counts[(month_start, category)]
                advisor_types = split_advisor_types(random_generator, category, count, calibration)
                for advisor_type, type_count in advisor_types.items():
                    if type_count == 0:
                        continue
                    sale_id, cancelled_count = generate_group_sales(
                        handle,
                        random_generator,
                        calibration,
                        dealerships_by_id,
                        advisor_pools[advisor_type],
                        products_by_category[category],
                        category,
                        advisor_type,
                        type_count,
                        month_index,
                        day_choices,
                        day_weights,
                        generated_at,
                        monthly_advisor_sales,
                        monthly_dealership_sales,
                        category_counts,
                        powertrain_counts,
                        sale_id,
                        cancelled_count
                    )

    return {
        "categoryCounts": dict(category_counts),
        "cancelledContracts": cancelled_count,
        "powertrainCounts": {
            f"{year}:{powertrain}": count
            for (year, powertrain), count in sorted(powertrain_counts.items())
        }
    }


def generate_group_sales(
        handle,
        random_generator,
        calibration,
        dealerships_by_id,
        advisor_pool,
        category_products,
        category,
        advisor_type,
        count,
        month_index,
        day_choices,
        day_weights,
        generated_at,
        monthly_advisor_sales,
        monthly_dealership_sales,
        category_counts,
        powertrain_counts,
        sale_id,
        cancelled_count
):
    advisor_weights = advisor_selection_weights(advisor_pool, dealerships_by_id, category, month_index)
    selected_advisors = random_generator.choices(advisor_pool, weights=advisor_weights, k=count)
    eligible_products = [
        product for product in category_products
        if supports(product.advisor_scope, advisor_type)
    ]
    product_weights = [product.weight for product in eligible_products]

    for advisor in selected_advisors:
        product = random_generator.choices(eligible_products, weights=product_weights, k=1)[0]
        sale_date = random_generator.choices(day_choices, weights=day_weights, k=1)[0]
        vehicle_condition = choose_vehicle_condition(random_generator, category)
        customer_segment = choose_customer_segment(random_generator, product.code, advisor_type)
        vehicle_powertrain = choose_powertrain(random_generator, calibration, sale_date.year, vehicle_condition)
        contract_amount = generate_contract_amount(random_generator, product, customer_segment, vehicle_condition)
        status, cancelled_at = cancellation(random_generator, calibration, category, sale_date, generated_at)
        recorded_at = event_instant(random_generator, sale_date, 8, 18)
        row = {
            "id": sale_id,
            "advisorId": advisor.row["id"],
            "dealershipId": advisor.row["dealershipId"],
            "productId": product.id,
            "contractAmount": contract_amount,
            "saleDate": sale_date.isoformat(),
            "recordedAt": iso_instant(recorded_at),
            "externalReference": f"SYN-{sale_id:09d}",
            "currency": "EUR",
            "status": status,
            "vehiclePowertrain": vehicle_powertrain,
            "vehicleCondition": vehicle_condition,
            "customerSegment": customer_segment,
            "cancelledAt": iso_instant(cancelled_at) if cancelled_at else None
        }
        write_json_line(handle, row)
        category_counts[category] += 1
        powertrain_counts[(sale_date.year, vehicle_powertrain)] += 1
        if status == "CANCELLED":
            cancelled_count += 1
        else:
            month_key = month_identifier(sale_date)
            monthly_advisor_sales[(advisor.row["id"], month_key)] += contract_amount
            monthly_dealership_sales[(advisor.row["dealershipId"], month_key)] += contract_amount
        sale_id += 1

    return sale_id, cancelled_count
