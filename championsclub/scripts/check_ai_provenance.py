import argparse
import json

from smoke_backend import Verification, account_emails, configuration


def insight_summary(dashboard):
    generated = dashboard["insight"]
    result = generated.get("result") or {}
    return {
        "state": generated.get("state"),
        "generationSource": result.get("generationSource"),
        "provider": result.get("provider"),
        "model": result.get("model"),
        "generatedAt": generated.get("generatedAt"),
        "expiresAt": generated.get("expiresAt"),
    }


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--base-url", default="http://localhost:8080")
    parser.add_argument("--expect-source")
    parser.add_argument("--expect-provider")
    parser.add_argument("--expect-model")
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

    advisor_dashboard = verify.call(
        "GET", f"/api/dashboard/advisor/{advisor_id}", advisor_token
    )
    manager_dashboard = verify.call(
        "GET",
        f"/api/dashboard/manager/{manager_id}/dealership/{dealership_id}",
        manager_token,
    )

    result = {
        "result": "PASS",
        "checks": verify.checks,
        "advisor": insight_summary(advisor_dashboard),
        "manager": insight_summary(manager_dashboard),
    }

    for subject in ("advisor", "manager"):
        insight = result[subject]
        assert insight["state"] == "AVAILABLE", insight
        if args.expect_source:
            assert insight["generationSource"] == args.expect_source, insight
        if args.expect_provider:
            assert insight["provider"] == args.expect_provider, insight
        if args.expect_model:
            assert insight["model"] == args.expect_model, insight

    print(json.dumps(result))


if __name__ == "__main__":
    main()
