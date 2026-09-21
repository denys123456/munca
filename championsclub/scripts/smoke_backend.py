import argparse
import json
import os
import time
import urllib.error
import urllib.request
from datetime import date
from pathlib import Path
from uuid import uuid4


def configuration():
    path = Path(__file__).resolve().parents[1] / ".env"
    if path.exists():
        for line in path.read_text().splitlines():
            key, separator, value = line.partition("=")
            if separator and key and not key.startswith("#"):
                os.environ.setdefault(key, value)
    return os.environ["CHAMPIONSCLUB_DEMO_PASSWORD"]


def synthetic_profile_enabled():
    profiles = os.environ.get("SPRING_PROFILES_ACTIVE", "")
    return "synthetic" in [profile.strip() for profile in profiles.split(",")]


class Verification:
    def __init__(self, base_url):
        self.base_url = base_url
        self.checks = 0

    def call(self, method, path, token=None, body=None, expected=200):
        headers = {"Accept": "application/json", "Content-Type": "application/json"}
        if token:
            headers["Authorization"] = "Bearer " + token
        request = urllib.request.Request(
            self.base_url + path,
            method=method,
            headers=headers,
            data=None if body is None else json.dumps(body).encode(),
        )
        try:
            response = urllib.request.urlopen(request, timeout=40)
        except urllib.error.HTTPError as error:
            response = error
        content = response.read()
        payload = json.loads(content) if content else None
        if response.code != expected:
            raise AssertionError(
                f"{method} {path}: expected {expected}, received {response.code}: {payload}"
            )
        self.checks += 1
        return payload

    def login(self, email, password):
        return self.call(
            "POST",
            "/api/auth/login",
            body={"email": email, "password": password},
        )


def account_emails():
    if synthetic_profile_enabled():
        return "advisor.1001@championsclub.example", None
    return "jane.doe@championsclub.example", "alex.smith@championsclub.example"


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--base-url", default="http://localhost:8080")
    parser.add_argument("--forecast-only", action="store_true")
    parser.add_argument("--expect-ml-unavailable", action="store_true")
    args = parser.parse_args()

    password = configuration()
    verify = Verification(args.base_url)
    advisor_email, configured_manager_email = account_emails()

    advisor_login = verify.login(advisor_email, password)
    advisor_token = advisor_login["accessToken"]
    advisor_id = advisor_login["user"]["id"]
    dealership_id = advisor_login["user"]["dealershipId"]
    manager_email = configured_manager_email or f"manager.{dealership_id:03d}@championsclub.example"

    manager_login = verify.login(manager_email, password)
    manager_token = manager_login["accessToken"]
    manager_id = manager_login["user"]["id"]

    forecast = verify.call(
        "POST",
        f"/api/forecasts/refresh?subjectType=ADVISOR&subjectId={advisor_id}",
        manager_token,
    )
    expected_state = "UNAVAILABLE" if args.expect_ml_unavailable else "AVAILABLE"
    assert forecast["state"] == expected_state, forecast

    advisor_dashboard = verify.call(
        "GET", f"/api/dashboard/advisor/{advisor_id}", advisor_token
    )
    assert advisor_dashboard["performance"]["forecast"]["state"] == expected_state
    assert advisor_dashboard["performance"]["availablePoints"] > 0
    assert advisor_dashboard["performance"]["lifetimeEarnedPoints"] > 0
    assert advisor_dashboard["identity"]["role"] == "ADVISOR"
    assert advisor_dashboard["identity"]["advisorType"] in ("SALES", "SERVICE")
    assert advisor_dashboard["cohortPosition"]["rank"] > 0
    assert advisor_dashboard["insight"]["state"] == "AVAILABLE"
    assert advisor_dashboard["insight"]["result"]["recommendedAction"]
    assert isinstance(advisor_dashboard["recommendations"], list)
    reporting_date = date.fromisoformat(advisor_dashboard["performance"]["reportingDate"])

    if args.forecast_only:
        print(
            json.dumps(
                {
                    "result": "PASS",
                    "checks": verify.checks,
                    "forecastState": forecast["state"],
                    "reportingDate": reporting_date.isoformat(),
                }
            )
        )
        return

    manager_dashboard = verify.call(
        "GET",
        f"/api/dashboard/manager/{manager_id}/dealership/{dealership_id}",
        manager_token,
    )
    assert manager_dashboard["dealership"]["id"] == dealership_id
    assert manager_dashboard["teamStatistics"]["activeAdvisors"] > 0
    assert manager_dashboard["teamStatistics"]["recordedContracts"] > 0

    profile = verify.call("GET", f"/api/advisors/{advisor_id}/profile", advisor_token)
    assert profile["lifetime"]["recordedContracts"] > 0
    assert profile["currentPeriod"]["recordedContracts"] > 0
    assert profile["cohortPosition"]["cohortSize"] > 0

    period_start = profile["currentTarget"]["periodStart"]
    analytics = verify.call(
        "GET",
        f"/api/analytics?subjectId={advisor_id}&subjectType=ADVISOR&start={period_start}&end={reporting_date.isoformat()}",
        advisor_token,
    )
    assert analytics["recordedContracts"] > 0
    assert analytics["productMix"]
    assert analytics["productCategoryMix"]
    assert analytics["powertrainMix"]
    assert analytics["vehicleConditionMix"]
    assert analytics["customerSegmentMix"]

    statistics = verify.call(
        "GET",
        f"/api/analytics/team-statistics?dealershipId={dealership_id}&start={period_start}&end={reporting_date.isoformat()}",
        manager_token,
    )
    assert statistics["activeAdvisors"] > 0
    assert statistics["salesAdvisors"] > 0
    assert statistics["serviceAdvisors"] > 0

    verify.call("GET", "/api/me", expected=401)
    for token in (advisor_token, manager_token):
        assert "passwordHash" not in verify.call("GET", "/api/me", token)

    products = verify.call("GET", "/api/products?search=", advisor_token)["content"]
    advisor_type = advisor_dashboard["identity"]["advisorType"]
    product = next(
        item
        for item in products
        if item["active"]
        and item["eligible"]
        and item["advisorScope"] in (advisor_type, "BOTH")
    )

    points_before = verify.call("GET", f"/api/points/{advisor_id}", advisor_token)
    request = {
        "advisorId": advisor_id,
        "dealershipId": dealership_id,
        "productId": product["id"],
        "contractAmount": 10000,
        "saleDate": reporting_date.isoformat(),
        "externalReference": "SMOKE-" + uuid4().hex,
        "currency": "EUR",
    }
    sale = verify.call("POST", "/api/sales", advisor_token, request, 201)
    assert sale["awardedPoints"] > 0

    points_after_sale = verify.call("GET", f"/api/points/{advisor_id}", advisor_token)
    assert points_after_sale["availablePoints"] == points_before["availablePoints"] + sale["awardedPoints"]
    assert points_after_sale["lifetimeEarnedPoints"] == points_before["lifetimeEarnedPoints"] + sale["awardedPoints"]

    verify.call("POST", "/api/sales", advisor_token, request, 409)
    verify.call("POST", f"/api/sales/{sale['id']}/cancel", advisor_token)

    points_after_cancellation = verify.call("GET", f"/api/points/{advisor_id}", advisor_token)
    assert points_after_cancellation["availablePoints"] == points_before["availablePoints"]
    assert points_after_cancellation["lifetimeEarnedPoints"] == points_before["lifetimeEarnedPoints"]

    rewards = verify.call(
        "GET", f"/api/rewards/advisor/{advisor_id}?size=10", advisor_token
    )
    assert rewards["totalElements"] >= 3

    advisors = verify.call("GET", "/api/advisors?size=100", manager_token)
    assert advisors["totalElements"] > 0
    assert all(item["dealershipId"] == dealership_id for item in advisors["content"])
    assert {item["advisorType"] for item in advisors["content"]} >= {"SALES", "SERVICE"}

    other_dealership_id = 1 if dealership_id != 1 else 2
    verify.call(
        "GET",
        f"/api/analytics/team-statistics?dealershipId={other_dealership_id}&start={period_start}&end={reporting_date.isoformat()}",
        manager_token,
        expected=403,
    )

    alerts = verify.call("GET", "/api/alerts", advisor_token)
    deadline = time.monotonic() + 20
    while not alerts["content"] and time.monotonic() < deadline:
        time.sleep(0.5)
        alerts = verify.call("GET", "/api/alerts", advisor_token)
    assert alerts["content"], "Expected generated alerts"

    verify.call("POST", f"/api/alerts/{alerts['content'][0]['id']}/read", advisor_token)
    verify.call("POST", "/api/auth/logout", advisor_token, expected=204)
    verify.call("GET", "/api/me", advisor_token, expected=401)

    print(
        json.dumps(
            {
                "result": "PASS",
                "checks": verify.checks,
                "forecastState": forecast["state"],
                "aiState": advisor_dashboard["insight"]["state"],
                "reportingDate": reporting_date.isoformat(),
            }
        )
    )


if __name__ == "__main__":
    main()
