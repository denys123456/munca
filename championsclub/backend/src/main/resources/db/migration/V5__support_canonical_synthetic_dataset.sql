alter table financial_products add column category varchar(20) not null default 'OTHER';
update financial_products set category = 'FINANCING' where code = 'FINANCE';
update financial_products set category = 'LEASING' where code in ('LEASE', 'FLEET');
update financial_products set category = 'SERVICE' where code in ('PROTECT', 'CARE');
alter table financial_products add constraint financial_product_category_check
    check (category in ('FINANCING', 'LEASING', 'SERVICE', 'INSURANCE', 'OTHER'));
create index financial_products_category_index on financial_products(category, active, id);

alter table sales add column vehicle_powertrain varchar(30) not null default 'UNKNOWN';
alter table sales add column vehicle_condition varchar(20) not null default 'UNKNOWN';
alter table sales add column customer_segment varchar(20) not null default 'UNKNOWN';
alter table sales add column cancelled_at timestamptz;
update sales set cancelled_at = created_at where status = 'CANCELLED';
alter table sales add constraint sale_vehicle_powertrain_check
    check (vehicle_powertrain in ('BATTERY_ELECTRIC', 'PLUG_IN_HYBRID', 'HYBRID', 'PETROL', 'DIESEL', 'OTHER', 'UNKNOWN'));
alter table sales add constraint sale_vehicle_condition_check
    check (vehicle_condition in ('NEW', 'USED', 'UNKNOWN'));
alter table sales add constraint sale_customer_segment_check
    check (customer_segment in ('PRIVATE', 'SME', 'FLEET', 'UNKNOWN'));
alter table sales add constraint sale_cancellation_timestamp_check
    check ((status = 'RECORDED' and cancelled_at is null) or (status = 'CANCELLED' and cancelled_at is not null));
create index sales_powertrain_date_index on sales(vehicle_powertrain, sale_date);
create index sales_customer_segment_date_index on sales(customer_segment, sale_date);

create table synthetic_dataset_runs (
    id uuid primary key,
    seed bigint not null,
    generated_at timestamptz not null,
    period_start date not null,
    period_end date not null,
    dealership_count integer not null check(dealership_count > 0),
    advisor_count integer not null check(advisor_count > 0),
    contract_count integer not null check(contract_count > 0),
    calibration_version varchar(80) not null,
    source_manifest jsonb not null,
    loaded_at timestamptz not null default now(),
    check(period_end >= period_start)
);
