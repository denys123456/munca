alter table users drop constraint if exists user_role_check;
alter table users drop constraint if exists user_dealership_check;

alter table users add column advisor_type varchar(20);
update users set advisor_type = 'SALES' where role = 'SALES_ADVISOR';
update users set role = 'ADVISOR' where role = 'SALES_ADVISOR';
update users
set role = 'MANAGER',
    dealership_id = (select min(id) from dealerships),
    status = 'INACTIVE',
    token_version = token_version + 1
where role = 'ADMIN';

alter table users add constraint user_role_check check (role in ('ADVISOR', 'MANAGER'));
alter table users add constraint user_dealership_check check (dealership_id is not null);
alter table users add constraint user_advisor_type_check check (
    (role = 'ADVISOR' and advisor_type in ('SALES', 'SERVICE')) or
    (role = 'MANAGER' and advisor_type is null)
);
create index users_dealership_advisor_type_index on users(dealership_id, advisor_type, id) where role = 'ADVISOR';

alter table financial_products add column advisor_scope varchar(20) not null default 'BOTH';
alter table financial_products add constraint financial_product_advisor_scope_check check (advisor_scope in ('SALES', 'SERVICE', 'BOTH'));
update financial_products set advisor_scope = 'SERVICE' where upper(code) in ('PROTECT', 'SERVICE', 'MAINTENANCE');
update financial_products set advisor_scope = 'SALES' where upper(code) in ('FINANCE', 'LEASE', 'FLEET');

alter table sales rename column financed_amount to contract_amount;
alter table sales drop constraint if exists sale_amount_check;
alter table sales add constraint sale_contract_amount_check check(contract_amount > 0);
