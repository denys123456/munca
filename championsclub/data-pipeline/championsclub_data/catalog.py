from dataclasses import dataclass


@dataclass(frozen=True)
class ProductDefinition:
    id: int
    name: str
    code: str
    description: str
    category: str
    advisor_scope: str
    weight: float
    amount_median: float
    amount_sigma: float
    amount_multiplier: float
    points: int
    minimum_eligible_amount: float


PRODUCTS = (
    ProductDefinition(
        1,
        "Classic Financing",
        "FINANCE_CLASSIC",
        "Standard vehicle financing",
        "FINANCING",
        "SALES",
        0.52,
        25500,
        0.34,
        1.0,
        180,
        5000
    ),
    ProductDefinition(
        2,
        "Premium Financing",
        "FINANCE_PREMIUM",
        "Higher-value vehicle financing",
        "FINANCING",
        "SALES",
        0.31,
        34000,
        0.31,
        1.15,
        220,
        7000
    ),
    ProductDefinition(
        3,
        "Balloon Financing",
        "FINANCE_BALLOON",
        "Financing with final balloon payment",
        "FINANCING",
        "SALES",
        0.17,
        29500,
        0.33,
        1.05,
        200,
        6000
    ),
    ProductDefinition(
        4,
        "Leasing Standard",
        "LEASE_STANDARD",
        "Standard retail leasing",
        "LEASING",
        "SALES",
        0.48,
        31500,
        0.31,
        1.0,
        210,
        7000
    ),
    ProductDefinition(
        5,
        "Leasing Flex",
        "LEASE_FLEX",
        "Flexible leasing package",
        "LEASING",
        "SALES",
        0.34,
        34500,
        0.30,
        1.08,
        230,
        7500
    ),
    ProductDefinition(
        6,
        "Fleet Leasing",
        "LEASE_FLEET",
        "Fleet-oriented leasing package",
        "LEASING",
        "SALES",
        0.18,
        39500,
        0.36,
        1.35,
        270,
        9000
    ),
    ProductDefinition(
        7,
        "Maintenance Plan",
        "SERVICE_MAINTENANCE",
        "Scheduled maintenance package",
        "SERVICE",
        "SERVICE",
        0.43,
        950,
        0.48,
        1.0,
        150,
        300
    ),
    ProductDefinition(
        8,
        "Service Care Plus",
        "SERVICE_CARE_PLUS",
        "Extended service and maintenance package",
        "SERVICE",
        "SERVICE",
        0.34,
        1450,
        0.50,
        1.0,
        180,
        400
    ),
    ProductDefinition(
        9,
        "Extended Warranty",
        "SERVICE_WARRANTY",
        "Extended vehicle warranty",
        "SERVICE",
        "BOTH",
        0.23,
        1100,
        0.46,
        1.0,
        150,
        350
    ),
    ProductDefinition(
        10,
        "Motor Insurance",
        "INSURANCE_MOTOR",
        "Motor insurance contract",
        "INSURANCE",
        "BOTH",
        0.58,
        900,
        0.47,
        1.0,
        115,
        250
    ),
    ProductDefinition(
        11,
        "Payment Protection",
        "INSURANCE_PAYMENT",
        "Payment protection insurance",
        "INSURANCE",
        "SALES",
        0.24,
        720,
        0.44,
        1.0,
        80,
        200
    ),
    ProductDefinition(
        12,
        "Mobility Insurance",
        "INSURANCE_MOBILITY",
        "Mobility and assistance insurance",
        "INSURANCE",
        "BOTH",
        0.18,
        620,
        0.45,
        1.0,
        95,
        180
    )
)


INCENTIVE_ECONOMY_VERSION = "incentive-economy-v2"


GAMIFICATION_THRESHOLDS = {
    "bronze": 0,
    "silver": 60000,
    "gold": 120000
}


REWARDS = (
    {
        "id": 1,
        "name": "Mobility Voucher",
        "category": "Mobility",
        "description": "Voucher for mobility-related purchases",
        "requiredPoints": 15000,
        "stock": 500,
        "imageReference": None
    },
    {
        "id": 2,
        "name": "Technology Voucher",
        "category": "Lifestyle",
        "description": "Voucher for technology purchases",
        "requiredPoints": 35000,
        "stock": 200,
        "imageReference": None
    },
    {
        "id": 3,
        "name": "Travel Voucher",
        "category": "Travel",
        "description": "Voucher for travel purchases",
        "requiredPoints": 50000,
        "stock": 120,
        "imageReference": None
    },
    {
        "id": 4,
        "name": "Premium Experience Voucher",
        "category": "Experience",
        "description": "Voucher for premium experiences",
        "requiredPoints": 70000,
        "stock": 50,
        "imageReference": None
    },
    {
        "id": 5,
        "name": "Training Voucher",
        "category": "Development",
        "description": "Voucher for professional development",
        "requiredPoints": 20000,
        "stock": 300,
        "imageReference": None
    }
)


def business_calibration():
    return {
        "version": INCENTIVE_ECONOMY_VERSION,
        "gamificationThresholds": GAMIFICATION_THRESHOLDS,
        "pointAwards": {product.code: product.points for product in PRODUCTS},
        "rewardPoints": {reward["name"]: reward["requiredPoints"] for reward in REWARDS}
    }
