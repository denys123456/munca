create index sales_dealership_advisor_date_recorded_index
    on sales(dealership_id, advisor_id, sale_date)
    where status = 'RECORDED';

create index sales_advisor_product_date_recorded_index
    on sales(advisor_id, product_id, sale_date)
    where status = 'RECORDED';

create index sales_dealership_status_date_index
    on sales(dealership_id, status, sale_date);

create index sales_advisor_status_date_index
    on sales(advisor_id, status, sale_date);
