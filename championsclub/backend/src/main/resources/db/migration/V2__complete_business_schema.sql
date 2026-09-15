create extension if not exists btree_gist;

alter table dealerships add column code varchar(40);
update dealerships set code = 'DEALER-' || id;
alter table dealerships alter column code set not null;
alter table dealerships add unique (code);
alter table dealerships add column active boolean not null default true;
alter table dealerships add column created_at timestamptz not null default now();
alter table dealerships add column updated_at timestamptz not null default now();

alter table users add column password_hash varchar(100) not null default '{disabled}';
alter table users add column token_version bigint not null default 0;
alter table users add column created_at timestamptz not null default now();
alter table users add column updated_at timestamptz not null default now();
alter table users add constraint user_role_check check (role in ('SALES_ADVISOR', 'MANAGER', 'ADMIN'));
alter table users add constraint user_status_check check (status in ('ACTIVE', 'INACTIVE'));
alter table users add constraint user_dealership_check check (role = 'ADMIN' or dealership_id is not null);
create unique index users_email_lower_unique on users(lower(email));
create index users_dealership_role_index on users(dealership_id, role, id);

alter table financial_products add column code varchar(40);
update financial_products set code = 'PRODUCT-' || id;
alter table financial_products alter column code set not null;
alter table financial_products add unique(code);
alter table financial_products add column description varchar(1000) not null default '';
alter table financial_products add column active boolean not null default true;
alter table financial_products add column created_at timestamptz not null default now();
alter table financial_products add column updated_at timestamptz not null default now();

create table point_rules (
    id bigserial primary key,
    product_id bigint not null references financial_products(id),
    points_per_sale integer not null check(points_per_sale > 0),
    minimum_eligible_amount numeric(14,2) not null check(minimum_eligible_amount >= 0),
    active_from date not null,
    active_until date not null,
    active boolean not null default true,
    updated_at timestamptz not null default now(),
    check(active_until >= active_from),
    exclude using gist (product_id with =, daterange(active_from, active_until, '[]') with &&) where (active)
);

alter table sales add column external_reference varchar(160);
update sales set external_reference = 'LEGACY-' || id;
alter table sales alter column external_reference set not null;
alter table sales add unique(external_reference);
alter table sales add column currency varchar(3) not null default 'EUR' check(currency = 'EUR');
alter table sales add column created_at timestamptz not null default now();
alter table sales add constraint sale_amount_check check(financed_amount > 0);
alter table sales add constraint sale_points_check check(awarded_points >= 0);
alter table sales add constraint sale_status_check check(status in ('RECORDED', 'CANCELLED'));
create index sales_advisor_date_index on sales(advisor_id, sale_date desc, id desc);
create index sales_dealership_date_index on sales(dealership_id, sale_date desc, id desc);
create index sales_product_index on sales(product_id);

alter table rewards add column description varchar(1000) not null default '';
alter table rewards add column stock integer check(stock >= 0);
alter table rewards add column image_reference varchar(500);
alter table rewards add column created_at timestamptz not null default now();
alter table rewards add column updated_at timestamptz not null default now();
alter table rewards add constraint reward_cost_check check(required_points > 0);
alter table rewards add constraint reward_status_check check(status in ('ACTIVE', 'INACTIVE'));
alter table reward_redemptions add column voucher_code uuid not null default gen_random_uuid() unique;
alter table reward_redemptions add column status varchar(30) not null default 'ISSUED' check(status = 'ISSUED');
create index redemptions_advisor_date_index on reward_redemptions(advisor_id, redeemed_at desc, id desc);

create table point_transactions (
    id bigserial primary key,
    advisor_id bigint not null references users(id),
    type varchar(40) not null check(type in ('SALE_EARNED', 'SALE_REVERSAL', 'REWARD_REDEMPTION', 'MANUAL_ADJUSTMENT')),
    amount integer not null check(amount <> 0),
    source_id bigint not null,
    description varchar(280) not null,
    created_at timestamptz not null default now(),
    unique(type, source_id),
    check((type = 'SALE_EARNED' and amount > 0) or
          (type in ('SALE_REVERSAL', 'REWARD_REDEMPTION') and amount < 0) or type = 'MANUAL_ADJUSTMENT')
);
insert into point_transactions(advisor_id, type, amount, source_id, description)
select advisor_id, 'SALE_EARNED', awarded_points, id, 'Historical sale award' from sales where awarded_points > 0;
insert into point_transactions(advisor_id, type, amount, source_id, description)
select advisor_id, 'SALE_REVERSAL', -awarded_points, id, 'Historical sale reversal' from sales where awarded_points > 0 and status = 'CANCELLED';
insert into point_transactions(advisor_id, type, amount, source_id, description)
select advisor_id, 'REWARD_REDEMPTION', -redeemed_points, id, 'Historical redemption' from reward_redemptions;
create index points_advisor_date_index on point_transactions(advisor_id, created_at desc, id desc);

alter table targets add column currency varchar(3) not null default 'EUR' check(currency = 'EUR');
alter table targets add column created_by bigint references users(id);
alter table targets add column created_at timestamptz not null default now();
alter table targets add column updated_at timestamptz not null default now();
alter table targets add constraint target_owner_check check(owner_type in ('ADVISOR', 'DEALERSHIP'));
alter table targets add constraint target_amount_check check(target_amount > 0);
alter table targets add constraint target_period_check check(end_date >= start_date);
alter table targets add constraint target_period_exclusion exclude using gist
    (owner_id with =, owner_type with =, daterange(start_date, end_date, '[]') with &&) where (status = 'ACTIVE');

create table gamification_configuration (
    id integer primary key check(id = 1),
    bronze integer not null check(bronze = 0),
    silver integer not null,
    gold integer not null,
    updated_at timestamptz not null default now(),
    check(silver > bronze and gold > silver)
);
insert into gamification_configuration(id, bronze, silver, gold) values(1, 0, 1000, 3000);

alter table alerts add column read_at timestamptz;
alter table alerts add column resolved_at timestamptz;
alter table alerts add column related_entity_type varchar(40);
alter table alerts add column related_entity_id bigint;
alter table alerts add column deduplication_key varchar(200) unique;
create index alerts_recipient_date_index on alerts(recipient_id, created_at desc, id desc);

create table audit_events (
    id bigserial primary key,
    actor_user_id bigint references users(id),
    action varchar(60) not null,
    entity_type varchar(40) not null,
    entity_id bigint not null,
    occurred_at timestamptz not null default now(),
    metadata jsonb not null default '{}'
);
create index audit_date_index on audit_events(occurred_at desc, id desc);

create table generated_results (
    cache_key varchar(200) primary key,
    source_hash varchar(64) not null,
    result jsonb not null,
    generated_at timestamptz not null,
    expires_at timestamptz not null
);
create index generated_results_expiry_index on generated_results(expires_at);
