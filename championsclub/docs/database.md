# Database

PostgreSQL is the system database. Flyway owns schema changes and Hibernate auto-create is disabled.

Important tables:

- `dealerships`
- `users`
- `financial_products`
- `sales`
- `targets`
- `rewards`
- `reward_redemptions`
- `achievements`
- `alerts`

Indexes are created for current dashboard queries:

- advisor sales by month
- dealership sales by month
- active target lookup
- unread alert lookup

## DataGrip

Create a PostgreSQL data source in DataGrip:

- Host: `localhost`
- Port: `5432`
- Database: `championsclub`
- User: `championsclub`
- Password: `championsclub_dev`

Use DataGrip to inspect Flyway migrations, browse demo rows, check indexes and investigate dashboard query results.

