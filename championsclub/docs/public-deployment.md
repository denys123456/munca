# Public deployment

The public frontend is https://munca.vercel.app. Its Vercel project is `munca`,
with root directory `championsclub/frontend`. The current application lives on
`rebuild/premium-saas`; `main` contains an older version. The current frontend
supports `MANAGER` and `ADVISOR` accounts, not the legacy `ADMIN` and
`SALES_ADVISOR` roles.

Vercel builds the frontend only. The Vite `server.proxy` setting applies only
in development. An empty `VITE_API_BASE_URL` sends login to Vercel's own `/api`
path, where this project has no backend. A laptop's `localhost:8080` is not a
public backend URL.

## Backend hosting configuration

Deploy the existing Docker services on a container host such as Railway, using
an independent PostgreSQL database. Do not mount or replace the local database.
The `railway.json` files configure Docker builds and HTTP health checks; resource
creation and account/billing configuration are separate hosting operations.

| Service | Repository root directory | Railway config path | Health check |
| --- | --- | --- | --- |
| Java backend | `championsclub/backend` | `/championsclub/backend/railway.json` | `/actuator/health` |
| Python ML | `championsclub/ml-service` | `/championsclub/ml-service/railway.json` | `/health` |

Backend variables (use references to the actual database/service, not literal placeholders):

- `SPRING_DATASOURCE_URL`: `jdbc:postgresql://<private-db-host>:5432/<database>`
- `SPRING_DATASOURCE_USERNAME` and `SPRING_DATASOURCE_PASSWORD`: database credentials
- `CHAMPIONSCLUB_JWT_SECRET`: independently generated random secret, at least 32 bytes
- `SPRING_PROFILES_ACTIVE=demo`: initializes a new database with eight presentation accounts
- `CHAMPIONSCLUB_DEMO_PASSWORD`: shared presentation password selected by the owner
- `CHAMPIONSCLUB_CORS_ALLOWED_ORIGIN=https://munca.vercel.app`: add exact preview origins separated by commas if required
- `CHAMPIONSCLUB_ML_BASE_URL=http://<private-ml-host>:8000`
- `CHAMPIONSCLUB_AI_PROVIDER=DISABLED`: deterministic summaries, no external API key needed
- `CHAMPIONSCLUB_SCHEDULING_ENABLED=false`: initial presentation deployment can refresh on demand
- `PORT`: assigned by the hosting platform; the backend defaults to 8080 locally

The ML image listens on port 8000; set `PORT=8000` on that service. Without trained
artifacts it explicitly uses statistical fallback forecasts.

For Railway, set each service's root directory and config file path explicitly.
Keep PostgreSQL and ML private; expose only the Java HTTPS API. The demo profile
creates three managers (Alex Smith, Jordan Brown, Taylor Wilson) and five advisors
(Jane Doe, John Doe, Emma Taylor, Morgan Lee, Casey Miller), with emails of the form
`first.last@championsclub.example`. It does not migrate legacy local accounts.

## Connect the frontend after the API is healthy

Set `VITE_API_BASE_URL` in Vercel to the Java API's public HTTPS origin, without
an `/api` suffix. Apply it to Production and the intended Preview environment.
Redeploy: Vite embeds this value at build time, so changing the environment alone
does not update an existing deployment. Promote the verified build to production.

For future updates, deploy the current branch deliberately; Vercel's production
branch setting must match the branch intended for release.

## Acceptance checks

1. Open `https://munca.vercel.app` in a fresh browser session; it must not redirect
   to Vercel sign-in.
2. Java `/actuator/health` returns `200` with only `{"status":"UP"}`.
3. Sign in as `alex.smith@championsclub.example` and verify the manager dashboard.
4. Sign out; sign in as `jane.doe@championsclub.example` and verify the advisor dashboard.
5. Refresh the page and verify `/api/me` keeps the session valid.
6. A wrong password must fail; an advisor must not access manager endpoints.
7. Verify browser network requests go to the public Java API, never localhost.

Until a public backend/database is provisioned and those checks pass, a public
frontend URL does not imply working online login.
