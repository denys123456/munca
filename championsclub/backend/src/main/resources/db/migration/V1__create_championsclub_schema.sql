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

