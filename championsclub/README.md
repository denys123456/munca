# ChampionsClub

ChampionsClub is a presentation-grade sales management platform for a nationwide Volkswagen Financial Services incentive program. It upgrades a reward portal into an AI-powered platform for sales advisors, dealership managers and administrators.

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
SPRING_DATASOURCE_PASSWORD=championsclub_dev
CHAMPIONSCLUB_ML_BASE_URL=http://localhost:8000
CHAMPIONSCLUB_AI_PROVIDER=MOCK
CHAMPIONSCLUB_AI_API_KEY=
CHAMPIONSCLUB_DEMO_PASSWORD=change-this-before-production
CHAMPIONSCLUB_CORS_ALLOWED_ORIGIN=http://localhost:5173
```

Frontend:

```text
VITE_API_BASE_URL=http://localhost:8080
VITE_DEMO_PASSWORD=change-this-before-production
```

## Demo Accounts

All demo accounts use the value from `CHAMPIONSCLUB_DEMO_PASSWORD`.

- `advisor@championsclub.example`
- `manager@championsclub.example`
- `admin@championsclub.example`

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
```

## Database

Start PostgreSQL with Docker Compose. Flyway creates the schema and loads realistic fictional data.

DataGrip setup:

- Host: `localhost`
- Port: `5432`
- Database: `championsclub`
- User: `championsclub`
- Password: `championsclub_dev`

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
