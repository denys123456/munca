import argparse
import json
import os
import time
import urllib.error
import urllib.request
from datetime import date, timedelta
from decimal import Decimal
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


class Verification:
    def __init__(self, base_url):
        self.base_url = base_url
        self.checks = 0

    def call(self, method, path, token=None, body=None, expected=200):
        headers = {"Accept": "application/json", "Content-Type": "application/json"}
        if token:
            headers["Authorization"] = "Bearer " + token
        request = urllib.request.Request(self.base_url + path, method=method, headers=headers,
                                         data=None if body is None else json.dumps(body).encode())
        try:
            response = urllib.request.urlopen(request, timeout=40)
        except urllib.error.HTTPError as error:
            response = error
        content = response.read()
        payload = json.loads(content) if content else None
        if response.code != expected:
            raise AssertionError(f"{method} {path}: expected {expected}, received {response.code}: {payload}")
        self.checks += 1
        return payload

    def login(self, email, password):
        return self.call("POST", "/api/auth/login", body={"email": email, "password": password})


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--base-url", default="http://localhost:8080")
    parser.add_argument("--forecast-only", action="store_true")
    parser.add_argument("--expect-ml-unavailable", action="store_true")
    args = parser.parse_args()
    password = configuration()
    verify = Verification(args.base_url)
    admin = verify.login("john.doe@championsclub.example", password)["accessToken"]
    advisor_login = verify.login("jane.doe@championsclub.example", password)
    advisor = advisor_login["accessToken"]
    advisor_id = advisor_login["user"]["id"]
    dealership = advisor_login["user"]["dealershipId"]
    manager_login = verify.login("alex.smith@championsclub.example", password)
    manager = manager_login["accessToken"]
    manager_id = manager_login["user"]["id"]
    forecast = verify.call("POST", f"/api/forecasts/refresh?subjectType=ADVISOR&subjectId={advisor_id}", admin)
    expected_state = "UNAVAILABLE" if args.expect_ml_unavailable else "AVAILABLE"
    assert forecast["state"] == expected_state, forecast
    dashboard = verify.call("GET", f"/api/dashboard/advisor/{advisor_id}", advisor)
    assert dashboard["performance"]["forecast"]["state"] == expected_state
    assert dashboard["performance"]["availablePoints"] > 0
    if args.forecast_only:
        print(json.dumps({"result": "PASS", "checks": verify.checks, "forecastState": forecast["state"]}))
        return
    verify.call("GET", f"/api/dashboard/manager/{manager_id}/dealership/{dealership}", manager)
    verify.call("GET", "/api/dashboard/admin", admin)
    verify.call("GET", "/api/admin/health", advisor, expected=403)
    verify.call("GET", "/api/me", expected=401)
    for token in (advisor, manager, admin):
        assert "passwordHash" not in verify.call("GET", "/api/me", token)
    today = date.today()
    start = today.replace(day=1)
    next_month = (start + timedelta(days=32)).replace(day=1)
    end = next_month - timedelta(days=1)
    products = verify.call("GET", "/api/products?search=Financing", advisor)["content"]
    product = next(item for item in products if item["active"] and item["eligible"])
    before = verify.call("GET", f"/api/points/{advisor_id}", advisor)["availablePoints"]
    request = {"advisorId": advisor_id, "dealershipId": dealership, "productId": product["id"],
               "financedAmount": 10000, "saleDate": today.isoformat(), "externalReference": "SMOKE-" + uuid4().hex,
               "currency": "EUR"}
    sale = verify.call("POST", "/api/sales", advisor, request, 201)
    assert sale["awardedPoints"] > 0
    assert verify.call("GET", f"/api/points/{advisor_id}", advisor)["availablePoints"] == before + sale["awardedPoints"]
    verify.call("POST", "/api/sales", advisor, request, 409)
    verify.call("POST", f"/api/sales/{sale['id']}/cancel", advisor)
    assert verify.call("GET", f"/api/points/{advisor_id}", advisor)["availablePoints"] == before
    first = verify.call("GET", "/api/sales?size=1", advisor)["content"][0]["id"]
    second = verify.call("GET", "/api/sales?size=1&page=1", advisor)["content"][0]["id"]
    assert first != second
    user = verify.call("POST", "/api/admin/users", admin, {
        "firstName": "Synthetic", "lastName": "Verification", "email": "smoke-" + uuid4().hex + "@example.test",
        "role": "SALES_ADVISOR", "dealershipId": dealership, "active": True, "password": password}, 201)
    user_id = user["id"]
    token = verify.login(user["email"], password)["accessToken"]
    target = {"ownerId": user_id, "ownerType": "ADVISOR", "periodStart": start.isoformat(),
              "periodEnd": end.isoformat(), "targetAmount": 10000, "currency": "EUR", "active": True}
    created_target = verify.call("POST", "/api/targets", admin, target, 201)
    verify.call("GET", f"/api/targets/{created_target['id']}", token)
    verify.call("POST", "/api/targets", admin, target, 409)
    target["targetAmount"] = 12000
    verify.call("PUT", f"/api/targets/{created_target['id']}", admin, target)
    progress = verify.call("GET", f"/api/targets/progress?ownerType=ADVISOR&ownerId={user_id}", token)
    assert Decimal(str(progress["progress"]["remainingAmount"])) == 12000
    reward = verify.call("POST", "/api/admin/rewards", admin, {
        "name": "Verification Voucher", "category": "Travel", "description": "Synthetic smoke verification",
        "requiredPoints": 650, "stock": 1, "active": True}, 201)
    insufficient = verify.call("POST", "/api/rewards/redemptions", token, {"rewardId": reward["id"]}, 409)
    assert insufficient["code"] == "INSUFFICIENT_POINTS"
    verify.call("POST", f"/api/points/{user_id}/adjustments", admin, {"amount": 650, "reason": "Synthetic verification award"})
    voucher = verify.call("POST", "/api/rewards/redemptions", token, {"rewardId": reward["id"]}, 201)
    assert voucher["status"] == "ISSUED" and voucher["voucherCode"]
    assert verify.call("GET", "/api/redemptions", token)["totalElements"] == 1
    assert verify.call("GET", f"/api/admin/rewards/{reward['id']}", admin)["stock"] == 0
    assert verify.call("GET", f"/api/points/{user_id}", token)["availablePoints"] == 0
    leaderboard = verify.call("GET", f"/api/leaderboard?dealershipId={dealership}&start={start}&end={end}&size=2", manager)
    assert leaderboard["content"][0]["rank"] == 1
    assert verify.call("GET", "/api/advisors?search=Morgan", manager)["totalElements"] == 0
    other = verify.call("GET", "/api/admin/users?search=Morgan", admin)["content"][0]["id"]
    verify.call("GET", f"/api/advisors/{other}", manager, expected=403)
    verify.call("GET", f"/api/points/{other}", advisor, expected=403)
    verify.call("GET", f"/api/advisors/{advisor_id}", manager)
    alerts = verify.call("GET", "/api/alerts", advisor)
    deadline = time.monotonic() + 20
    while not alerts["content"] and time.monotonic() < deadline:
        time.sleep(0.5)
        alerts = verify.call("GET", "/api/alerts", advisor)
    assert alerts["content"], "Expected generated demo alerts"
    verify.call("POST", f"/api/alerts/{alerts['content'][0]['id']}/read", advisor)
    audit = verify.call("GET", "/api/audit?size=100", admin)
    assert any(event["action"] == "REWARD_REDEEMED" for event in audit["content"])
    health = verify.call("GET", "/api/admin/health", admin)
    assert health["database"] == "UP" and health["mlService"] == "UP"
    verify.call("POST", "/api/auth/logout", token, expected=204)
    verify.call("GET", "/api/me", token, expected=401)
    print(json.dumps({"result": "PASS", "checks": verify.checks, "forecastState": forecast["state"],
                      "aiState": dashboard["insight"]["state"], "health": health}))


if __name__ == "__main__":
    main()
