from dataclasses import dataclass


CITIES = (
    ("Bucharest", "Bucharest"),
    ("Cluj-Napoca", "North West"),
    ("Timisoara", "West"),
    ("Iasi", "North East"),
    ("Brasov", "Center"),
    ("Constanta", "South East"),
    ("Craiova", "South West"),
    ("Sibiu", "Center"),
    ("Oradea", "North West"),
    ("Arad", "West"),
    ("Ploiesti", "South"),
    ("Pitesti", "South"),
    ("Targu Mures", "Center"),
    ("Baia Mare", "North West"),
    ("Suceava", "North East"),
    ("Galati", "South East"),
    ("Bacau", "North East"),
    ("Buzau", "South East"),
    ("Alba Iulia", "Center"),
    ("Deva", "West")
)

FIRST_NAMES = (
    "Jane", "John", "Alex", "Taylor", "Jordan", "Casey", "Morgan", "Avery", "Riley", "Jamie",
    "Cameron", "Drew", "Robin", "Sam", "Parker", "Quinn", "Reese", "Skyler", "Emerson", "Blake"
)

LAST_NAMES = (
    "Doe", "Smith", "Taylor", "Brown", "Wilson", "Miller", "Davis", "Clark", "Lewis", "Walker",
    "Hall", "Young", "King", "Wright", "Green", "Baker", "Hill", "Adams", "Turner", "Scott"
)

CATEGORY_ORDER = ("FINANCING", "LEASING", "SERVICE", "INSURANCE")


@dataclass(frozen=True)
class DealershipProfile:
    row: dict
    capacity: float
    monthly_trend: float


@dataclass(frozen=True)
class AdvisorProfile:
    row: dict
    performance: float
    monthly_trend: float
    target_stretch: float
    category_affinity: dict[str, float]


def build_dealerships(random_generator, dealership_count):
    profiles = []
    for index in range(dealership_count):
        city, region = CITIES[index % len(CITIES)]
        location_number = index // len(CITIES) + 1
        code = f"DEALER-{index + 1:03d}"
        name = f"Champions Auto {city} {location_number:02d}"
        profiles.append(DealershipProfile(
            row={
                "id": index + 1,
                "name": name,
                "code": code,
                "city": city,
                "region": region,
                "active": True
            },
            capacity=random_generator.lognormvariate(0.0, 0.24),
            monthly_trend=random_generator.uniform(-0.004, 0.007)
        ))
    return profiles


def build_users(random_generator, dealerships, advisor_count, calibration):
    managers = build_managers(dealerships)
    sales_advisor_count = round(advisor_count * calibration["assumptions"]["sales_advisor_share"])
    advisor_types = ["SALES"] * sales_advisor_count + ["SERVICE"] * (advisor_count - sales_advisor_count)
    random_generator.shuffle(advisor_types)
    dealership_assignments = allocate_advisors_to_dealerships(random_generator, dealerships, advisor_count)
    advisors = []
    for index in range(advisor_count):
        advisor_id = 1001 + index
        dealership = dealerships[dealership_assignments[index]]
        advisor_type = advisor_types[index]
        first_name, last_name = synthetic_name(index + len(dealerships))
        category_affinity = {
            category: random_generator.lognormvariate(0.0, 0.18)
            for category in CATEGORY_ORDER
        }
        advisors.append(AdvisorProfile(
            row={
                "id": advisor_id,
                "firstName": first_name,
                "lastName": last_name,
                "email": f"advisor.{advisor_id:04d}@championsclub.example",
                "role": "ADVISOR",
                "advisorType": advisor_type,
                "dealershipId": dealership.row["id"],
                "active": True
            },
            performance=random_generator.lognormvariate(0.0, 0.31),
            monthly_trend=random_generator.uniform(-0.009, 0.012),
            target_stretch=random_generator.uniform(
                calibration["assumptions"]["target_stretch_min"],
                calibration["assumptions"]["target_stretch_max"]
            ),
            category_affinity=category_affinity
        ))
    return managers, advisors


def build_managers(dealerships):
    managers = []
    for dealership in dealerships:
        dealership_id = dealership.row["id"]
        first_name, last_name = synthetic_name(dealership_id - 1)
        managers.append({
            "id": dealership_id,
            "firstName": first_name,
            "lastName": last_name,
            "email": f"manager.{dealership_id:03d}@championsclub.example",
            "role": "MANAGER",
            "advisorType": None,
            "dealershipId": dealership_id,
            "active": True
        })
    return managers


def allocate_advisors_to_dealerships(random_generator, dealerships, advisor_count):
    minimum_per_dealership = min(6, advisor_count // len(dealerships))
    assignments = []
    for dealership_index in range(len(dealerships)):
        assignments.extend([dealership_index] * minimum_per_dealership)
    remaining = advisor_count - len(assignments)
    if remaining > 0:
        weights = [profile.capacity for profile in dealerships]
        assignments.extend(random_generator.choices(range(len(dealerships)), weights=weights, k=remaining))
    random_generator.shuffle(assignments)
    return assignments


def synthetic_name(index):
    first_name = FIRST_NAMES[index % len(FIRST_NAMES)]
    last_name = LAST_NAMES[(index // len(FIRST_NAMES)) % len(LAST_NAMES)]
    cycle = index // (len(FIRST_NAMES) * len(LAST_NAMES))
    if cycle == 0:
        return first_name, last_name
    return first_name, f"{last_name}{cycle + 1}"
