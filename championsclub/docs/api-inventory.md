# Corrected backend integration contract

Source: controllers, application services, DTO records and SQL in `backend/src/main`. All URLs below require a Bearer token except login. The token expires after 30 minutes. Logout revokes existing tokens. Roles are **ADVISOR** (SALES or SERVICE) and **MANAGER**. There is no administrator role or management API for users, products, rewards, dealerships, point rules or gamification configuration in the authoritative archive.

Managers can access only their dealership and its advisors. Advisors can access only their own business data, plus their dealership's own advisor-type ranking. Authorization is enforced in Java. No profile update endpoint exists.

## Endpoints and screens

| Method and path | Parameters / request | Result / screen |
| --- | --- | --- |
| POST `/api/auth/login` | email (1–160 chars), password (1–72 chars) | accessToken, tokenType, expiresAt, user; sign in |
| GET `/api/me` | none | UserAccount; session verification and profile |
| POST `/api/auth/logout` | none | 204; sign out and token revocation |
| GET `/api/dashboard/advisor/{advisorId}` | own advisor or manager's advisor | AdvisorDashboard; overview |
| GET `/api/dashboard/manager/{managerId}/dealership/{dealershipId}` | authenticated manager and own dealership | ManagerDashboard; overview |
| GET `/api/advisors` | search, dealershipId?, page, size; manager only | Page<UserAccount>; directory and advisor selection |
| GET `/api/advisors/{advisorId}` | manager only, own dealership | AdvisorDashboard; advisor detail |
| GET `/api/advisors/{advisorId}/profile` | authorized advisor | AdvisorProfile; lifetime performance and profile |
| GET `/api/analytics` | subjectId, subjectType (ADVISOR/DEALERSHIP), start, end | AnalyticsResult; performance, product/category/customer/vehicle breakdowns |
| GET `/api/analytics/team-statistics` | dealershipId, start, end; manager only | TeamStatistics; team performance |
| GET `/api/leaderboard` | dealershipId, start, end, advisorType?, page, size | Page<AdvisorRanking>; target-achievement ranking |
| GET `/api/products` | search, page, size | Page<ProductResponse>; product catalog and sale selection |
| GET `/api/products/{id}` | product id | ProductResponse; product details |
| GET `/api/sales` | advisorId?, dealershipId?, productId?, status?, from?, to?, page, size | Page<SaleResponse>; history |
| POST `/api/sales` | advisorId, dealershipId, productId, contractAmount, saleDate, externalReference, currency | SaleResponse; record a contract |
| POST `/api/sales/{id}/cancel` | authorized sale | SaleResponse; cancellation and ledger reversal |
| GET `/api/targets` | ownerId, ownerType (ADVISOR/DEALERSHIP), page, size | Page<TargetData>; target history |
| GET `/api/targets/{id}` | authorized target | TargetData |
| GET `/api/targets/progress` | ownerId, ownerType, date? | TargetSnapshot; dated progress |
| POST `/api/targets` | ownerType, ownerId, periodStart, periodEnd, targetAmount, currency, active | TargetData; manager create |
| PUT `/api/targets/{id}` | same target fields | TargetData; manager edit/deactivate |
| GET `/api/points/{advisorId}` | authorized advisor | PointSummary; available, lifetime earned, tier |
| GET `/api/points/{advisorId}/transactions` | page, size | Page<Transaction>; complete paginated ledger |
| POST `/api/points/{advisorId}/adjustments` | nonzero integer amount, reason (1–280 chars); manager only | PointSummary; adjustment with audit entry |
| GET `/api/rewards/advisor/{advisorId}` | search, page, size | Page<RewardEligibility>; catalog with server eligibility |
| POST `/api/rewards/redemptions` | rewardId, advisorId?; self advisor only | Redemption including voucherCode; redeem |
| GET `/api/redemptions` | advisorId?, page, size; manager must select advisor | Page<Redemption>; history |
| GET `/api/alerts` | recipientId?, page, size | Page<AlertData>; notifications |
| POST `/api/alerts/{id}/read` | recipient only | AlertData; mark read |
| POST `/api/alerts/{id}/resolve` | own dealership manager only | AlertData; resolve |
| GET `/api/forecasts` | subjectId, subjectType | Generated<SalesForecast>; forecast |
| POST `/api/forecasts/refresh` | subjectId, subjectType; manager only | Generated<SalesForecast>; regenerate |
| GET `/api/insights/advisor/{advisorId}` | authorized advisor | Generated<PerformanceInsight>; insights |
| GET `/api/insights/manager/{managerId}/dealership/{dealershipId}` | own manager/dealership | Generated<PerformanceInsight>; insights |

## Validation and responses

Pages use `{content, number, size, totalElements, totalPages, hasNext}`. Page numbers are zero-based; size is 1–100. Controllers do not accept arbitrary sorting parameters. Lists retain the backend's deterministic order; the UI must not pretend a partial page is globally sorted or aggregated.

Sales require positive IDs, an active eligible product matching advisor type, EUR currency, a non-future date, amount > 0 with at most 12 integer / 2 decimal digits, and a unique external reference of at most 160 characters. Targets require EUR, positive amount, start <= end, at most a year and no active overlapping owner periods. The backend validates and atomically enforces reward stock, points and self-only redemption. Point adjustment and target editing require a manager.

Errors use `{status, code, message, timestamp, path, fieldErrors:[{field,message}]}`. 400: validation; 401: credentials/session; 403: scope/role; 404: missing resource/endpoint; 409: conflict/business rule; 503: external service. Unexpected errors return safe messages. `Generated<T>` uses `{state, result, generatedAt, expiresAt}`; an unavailable result is null, never a fabricated forecast.

## Metric definitions

All totals and comparisons come from PostgreSQL read models, never a paginated client subset. Analytics dates are inclusive. Recorded sales exclude cancelled contracts. Average contract value is the average of recorded contracts. Cancellation rate = cancelled / (recorded + cancelled), by original sale date. Growth compares the previous equal-length period and is null when its denominator is zero. EUR is the only supported sales/target currency. Daily series include zero-sale dates; weekly/monthly buckets include only dates inside the selected period.

Dashboard analytics end on the server reporting date, which may be historical in the synthetic profile. Target periods and ranking periods are separately labeled. Achievement, remaining gap, days and pace come from TargetSnapshot. Without a configured target, achievement is shown as unavailable. Leaderboard ranks target achievement with prorated target amounts for partial periods, not points or gross contract value. Available points and lifetime earned are separate backend ledger figures; redemptions do not reduce lifetime tier progress. Negative available points following cancellation are preserved.

Forecast points are predicted daily amounts, not historical actuals. Period-end prediction, lower/upper bounds, probability, confidence, anomalies and model version are supplied by Java's ML client. Insight `generationSource` distinguishes LLM from DETERMINISTIC_FALLBACK. Deterministic recommendations are Java rules, never labeled as generated AI output.

## Integration decisions

Archive backend, ML service and trained artifacts, data generation code, backend scripts and selected backend documentation were integrated. Generated scenario data, `.env`, archive frontend and UI assets were excluded. The original ZIP remains untouched. Recovery commit: `7fbed9f`; branch: `rebuild/premium-saas`. See `backend-integration-manifest.json` for hashes and per-file decisions.

Migrations V1–V3 were preserved byte-for-byte. V4–V7 are additive migration files. V4 intentionally removes ADMIN and deactivates converted accounts, changes SALES_ADVISOR to ADVISOR and renames financed_amount to contract_amount. V5 adds dimensions and synthetic dataset metadata; V6 adds analytics indexes; V7 recalibrates tier thresholds. Never reset an existing database. Review V4's account impact and back up an existing database before applying.

The test harness additionally accepts CHAMPIONSCLUB_TEST_DATABASE_URL, CHAMPIONSCLUB_TEST_DATABASE_USER and CHAMPIONSCLUB_TEST_DATABASE_PASSWORD for a **dedicated disposable test database** when Docker is unavailable. Without these variables it retains Testcontainers. Tests insert and update data; never point them at a business database.
