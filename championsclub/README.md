# ChampionsClub

ChampionsClub is a presentation-grade sales management platform for a nationwide Volkswagen Financial Services incentive program. It upgrades a reward portal into an AI-powered platform for sales advisors, dealership managers and administrators.

The frontend opens with an original scroll-driven automotive experience built with Three.js, GSAP and Lenis. Its unbranded procedural concept vehicle decomposes into an engine, connects mechanical systems to application data and reassembles. Operational pages are available through the Workspace control. Final licensed vehicle and engine GLB assets are still required. See [frontend architecture](docs/frontend-product-structure.md) and [asset requirements](docs/automotive-assets.md).

## Solution Overview

The application helps teams understand current performance, target progress, gamification level, reward readiness, alerts and forecasted outcomes within seconds.

Main capabilities:

- Advisor dashboard with sales, points, target progress, forecast and AI recommendations
- Manager command center with dealership performance, rankings, employees needing attention and recommended actions
- Role-aware multi-page navigation for advisors, managers and administrators
- Deterministic Bronze, Silver and Gold gamification in Java
- Reward catalogue and redemption rules
- Admin catalogue management for financial products and rewards
- Proactive alerts for target risk, inactivity, improvement and Gold progression
- Python ML service for forecasting and target achievement probability
- LLM boundary for natural-language insight generation

## Product Pages

Advisor pages:

- Overview
- My Performance
- Targets
- Rewards
- Insights
- Alerts
- Sales History
- Profile

Manager pages:

- Executive Overview
- Team Performance
- Advisors
- Advisor Detail
- Targets
- Forecasts
- Alerts
- Leaderboard
- Rewards
- AI Insights
- Dealership Activity

Admin pages:

- Overview
- Users
- Dealerships
- Financial Products
- Point Rules
- Reward Catalog
- Gamification Settings
- Target Configuration
- System Health
- Audit / Activity

## Architecture

Backend packages follow feature-oriented Clean Architecture:

```text
sales/domain
sales/application
sales/infrastructure
rewards/domain
rewards/application
rewards/infrastructure
dashboard/application
dashboard/infrastructure
analytics/application
analytics/infrastructure
ai/application
ai/infrastructure
```

Domain has no Spring, HTTP, PostgreSQL, Python or AI dependencies. Application code uses commands and queries. Infrastructure owns REST controllers, JPA, SQL read models, security and external clients.

## Technology Stack

- Java 21
- Spring Boot, Spring Web, Spring Security, Spring Data JPA and Bean Validation
- PostgreSQL and Flyway
- React, JavaScript, CSS and Vite
- Three.js, GSAP ScrollTrigger and Lenis
- Python, FastAPI and pytest
- Docker Compose

## Run Locally

```bash
cd championsclub
docker compose up --build
```

Frontend:

```text
http://localhost:5173
```

Backend:

```text
http://localhost:8080
```

ML service:

```text
http://localhost:8000
```

## Environment

Backend:

```text
SPRING_DATASOURCE_URL=jdbc:postgresql://localhost:5432/championsclub
SPRING_DATASOURCE_USERNAME=championsclub
SPRING_DATASOURCE_PASSWORD=<set-a-unique-local-database-password>
CHAMPIONSCLUB_ML_BASE_URL=http://localhost:8000
CHAMPIONSCLUB_AI_PROVIDER=MOCK
CHAMPIONSCLUB_AI_API_KEY=
CHAMPIONSCLUB_DEMO_PASSWORD=<set-a-unique-local-demo-password>
CHAMPIONSCLUB_CORS_ALLOWED_ORIGIN=http://localhost:5173
```

Frontend:

```text
VITE_API_BASE_URL=http://localhost:8080
```

Keep credentials in the ignored local `.env` file or server environment. `VITE_*` values are public browser configuration: never put API keys, database passwords, signing secrets or demo passwords there. Use the placeholder-only `.env.example` files as templates.

## Demo Accounts

Demo and synthetic-data accounts use `CHAMPIONSCLUB_DEMO_PASSWORD`, defaulting to `manger123` when unset. These seeders only run when their respective profile is enabled. Existing account passwords are not changed on startup.

The local presentation database has these accounts, all reset to `manger123`:

| Role | Email |
| --- | --- |
| Manager | `alex.smith@championsclub.example` |
| Manager | `jordan.brown@championsclub.example` |
| Manager | `taylor.wilson@championsclub.example` |
| Advisor | `jane.doe@championsclub.example` |
| Advisor | `emma.taylor@championsclub.example` |
| Advisor | `morgan.lee@championsclub.example` |
| Advisor | `casey.miller@championsclub.example` |
| Advisor | `daniel.brown@championsclub.example` |
| Admin | `john.doe@championsclub.example` |

This is the existing local database inventory. A fresh demo seed creates eight accounts: the three managers above and advisors Jane, John, Emma, Morgan and Casey; it does not create an administrator or Daniel.

To explicitly reset all accounts in the local presentation database (also revoking existing sessions), run from `championsclub`:

```bash
docker compose exec -T postgres psql -U championsclub -d championsclub -v demo_password=manger123 < scripts/reset_demo_passwords.sql
```

## Tests

Backend:

```bash
cd backend
mvn test
```

ML service:

```bash
cd ml-service
pytest
```

Frontend:

```bash
cd frontend
npm run build
npm run test:data
npm test
npm run profile
```

The browser tests and profile require the frontend dev server on port 5173. The browser suite uses Microsoft Edge.

## Database

Start PostgreSQL with Docker Compose. Flyway creates the schema and loads realistic fictional data.

DataGrip setup:

- Host: `localhost`
- Port: `5432`
- Database: `championsclub`
- User: `championsclub`
- Password: use your local `SPRING_DATASOURCE_PASSWORD` value.

Use DataGrip to inspect schemas, relationships, indexes, migration results and dashboard query data.

## Architecture Decisions

- CQRS is in-process because the goal is readable separation of writes and reads.
- Java owns deterministic business rules.
- Python owns only ML forecasting, prediction and analytics.
- Generative AI explains performance but never controls business rules.
- External AI and ML integrations use interfaces because provider boundaries are real replacement points.
- Source code intentionally avoids comments; design rationale lives in `docs`.
- Frontend service failures are handled inside the affected product areas instead of showing a global broken state.

## Fallback Strategy

The React app uses live API calls when the backend is available. If the backend, ML service or AI provider is unavailable during a presentation, the UI keeps operating with realistic demo data and component-level availability states.

Core deterministic workflows remain Java-owned. ML and AI failures affect only forecasting and generated insight areas.
