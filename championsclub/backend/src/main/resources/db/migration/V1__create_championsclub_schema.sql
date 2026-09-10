create table dealerships (
    id bigserial primary key,
    name varchar(160) not null,
    city varchar(120) not null,
    region varchar(120) not null
);

create table users (
    id bigserial primary key,
    first_name varchar(80) not null,
    last_name varchar(80) not null,
    email varchar(160) not null unique,
    dealership_id bigint references dealerships(id),
    role varchar(40) not null,
    status varchar(40) not null
);

create table financial_products (
    id bigserial primary key,
    name varchar(160) not null,
    points_per_thousand_euro integer not null,
    eligible boolean not null
);

create table sales (
    id bigserial primary key,
    advisor_id bigint not null references users(id),
    dealership_id bigint not null references dealerships(id),
    product_id bigint not null references financial_products(id),
    financed_amount numeric(14, 2) not null,
    sale_date date not null,
    awarded_points integer not null,
    status varchar(40) not null
);

create table targets (
    id bigserial primary key,
    owner_id bigint not null,
    owner_type varchar(40) not null,
    target_amount numeric(14, 2) not null,
    start_date date not null,
    end_date date not null,
    status varchar(40) not null
);

create table rewards (
    id bigserial primary key,
    name varchar(160) not null,
    category varchar(120) not null,
    required_points integer not null,
    status varchar(40) not null
);

create table reward_redemptions (
    id bigserial primary key,
    advisor_id bigint not null references users(id),
    reward_id bigint not null references rewards(id),
    redeemed_points integer not null,
    redeemed_at timestamp with time zone not null
);

create table achievements (
    id bigserial primary key,
    advisor_id bigint not null references users(id),
    name varchar(160) not null,
    achieved_at timestamp with time zone not null
);

create table alerts (
    id bigserial primary key,
    recipient_id bigint not null references users(id),
    dealership_id bigint not null references dealerships(id),
    type varchar(60) not null,
    severity varchar(40) not null,
    title varchar(160) not null,
    message varchar(280) not null,
    is_read boolean not null,
    created_at timestamp with time zone not null
);

create index sales_advisor_month_index on sales(advisor_id, sale_date) where status = 'RECORDED';
create index sales_dealership_month_index on sales(dealership_id, sale_date) where status = 'RECORDED';
create index targets_owner_period_index on targets(owner_id, owner_type, start_date, end_date) where status = 'ACTIVE';
create index alerts_recipient_status_index on alerts(recipient_id, is_read, created_at);

insert into dealerships(name, city, region) values
('Volkswagen Capital North', 'Cluj-Napoca', 'North West'),
('Volkswagen Mobility Center', 'Bucharest', 'South'),
('Volkswagen Financial Hub West', 'Timisoara', 'West');

insert into users(first_name, last_name, email, dealership_id, role, status) values
('Jane', 'Doe', 'jane.doe@championsclub.example', 1, 'SALES_ADVISOR', 'ACTIVE'),
('John', 'Doe', 'john.doe@championsclub.example', 1, 'SALES_ADVISOR', 'ACTIVE'),
('Alex', 'Smith', 'alex.smith@championsclub.example', 1, 'SALES_ADVISOR', 'ACTIVE'),
('Taylor', 'Smith', 'taylor.smith@championsclub.example', 1, 'MANAGER', 'ACTIVE'),
('Morgan', 'Lee', 'morgan.lee@championsclub.example', 2, 'SALES_ADVISOR', 'ACTIVE'),
('Jordan', 'Brown', 'jordan.brown@championsclub.example', 2, 'MANAGER', 'ACTIVE'),
('Casey', 'Miller', 'casey.miller@championsclub.example', null, 'ADMIN', 'ACTIVE');

insert into financial_products(name, points_per_thousand_euro, eligible) values
('Classic Financing', 12, true),
('Leasing Plus', 16, true),
('Service Protection', 9, true),
('Fleet Advantage', 14, true);

insert into sales(advisor_id, dealership_id, product_id, financed_amount, sale_date, awarded_points, status) values
(1, 1, 1, 24500.00, current_date - interval '95 days', 288, 'RECORDED'),
(1, 1, 2, 31000.00, current_date - interval '70 days', 496, 'RECORDED'),
(1, 1, 4, 42000.00, current_date - interval '32 days', 588, 'RECORDED'),
(1, 1, 2, 38500.00, current_date - interval '10 days', 608, 'RECORDED'),
(2, 1, 1, 22000.00, current_date - interval '85 days', 264, 'RECORDED'),
(2, 1, 3, 15000.00, current_date - interval '40 days', 135, 'RECORDED'),
(2, 1, 1, 18500.00, current_date - interval '12 days', 216, 'RECORDED'),
(3, 1, 4, 61000.00, current_date - interval '60 days', 854, 'RECORDED'),
(3, 1, 2, 46500.00, current_date - interval '20 days', 736, 'RECORDED'),
(5, 2, 2, 33000.00, current_date - interval '18 days', 528, 'RECORDED');

insert into targets(owner_id, owner_type, target_amount, start_date, end_date, status) values
(1, 'ADVISOR', 90000.00, date_trunc('month', current_date), date_trunc('month', current_date) + interval '1 month' - interval '1 day', 'ACTIVE'),
(2, 'ADVISOR', 70000.00, date_trunc('month', current_date), date_trunc('month', current_date) + interval '1 month' - interval '1 day', 'ACTIVE'),
(3, 'ADVISOR', 85000.00, date_trunc('month', current_date), date_trunc('month', current_date) + interval '1 month' - interval '1 day', 'ACTIVE'),
(1, 'DEALERSHIP', 260000.00, date_trunc('month', current_date), date_trunc('month', current_date) + interval '1 month' - interval '1 day', 'ACTIVE'),
(2, 'DEALERSHIP', 210000.00, date_trunc('month', current_date), date_trunc('month', current_date) + interval '1 month' - interval '1 day', 'ACTIVE');

insert into rewards(name, category, required_points, status) values
('Premium Fuel Voucher', 'Mobility', 650, 'ACTIVE'),
('Dealer Partner Experience', 'Experience', 1400, 'ACTIVE'),
('Home Technology Voucher', 'Lifestyle', 2200, 'ACTIVE'),
('Sustainable Travel Voucher', 'Travel', 3000, 'ACTIVE');

insert into reward_redemptions(advisor_id, reward_id, redeemed_points, redeemed_at) values
(1, 1, 650, current_timestamp - interval '21 days');

insert into achievements(advisor_id, name, achieved_at) values
(1, 'Silver Momentum', current_timestamp - interval '15 days'),
(1, 'Leasing Specialist', current_timestamp - interval '8 days'),
(3, 'Gold Challenger', current_timestamp - interval '4 days');

insert into alerts(recipient_id, dealership_id, type, severity, title, message, is_read, created_at) values
(1, 1, 'CLOSE_TO_GOLD', 'INFO', 'Gold level within reach', 'A strong week of eligible leasing sales can move you closer to Gold.', false, current_timestamp - interval '2 hours'),
(2, 1, 'TARGET_RISK', 'WARNING', 'Target pace below plan', 'Current performance is below the expected monthly target pace.', false, current_timestamp - interval '6 hours'),
(4, 1, 'ADVISOR_INACTIVITY', 'WARNING', 'Advisor activity needs attention', 'One advisor has lower activity than expected for this point in the month.', false, current_timestamp - interval '5 hours'),
(4, 1, 'EXCEPTIONAL_PERFORMANCE', 'INFO', 'Top performer accelerating', 'Alex Smith is creating strong financial product momentum this month.', false, current_timestamp - interval '1 hour');

