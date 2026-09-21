package com.championsclub.analytics.infrastructure;

import com.championsclub.analytics.application.AdvisorAnalyticsRepository;
import com.championsclub.sales.domain.ProductCategory;
import com.championsclub.users.domain.AdvisorType;
import java.time.LocalDate;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

@Repository
class JdbcAdvisorAnalyticsRepository implements AdvisorAnalyticsRepository {
    private final JdbcTemplate database;

    JdbcAdvisorAnalyticsRepository(JdbcTemplate database) {
        this.database = database;
    }

    @Override
    public AdvisorLifetimeStatistics lifetime(long advisorId) {
        return database.queryForObject(
                """
                with summary as (
                    select
                        coalesce(sum(contract_amount) filter(where status='RECORDED'),0) sales,
                        count(*) filter(where status='RECORDED') recorded_contracts,
                        count(*) filter(where status='CANCELLED') cancelled_contracts,
                        coalesce(avg(contract_amount) filter(where status='RECORDED'),0) average_contract_amount,
                        min(sale_date) filter(where status='RECORDED') first_sale_date,
                        max(sale_date) filter(where status='RECORDED') last_sale_date
                    from sales where advisor_id=?
                ),
                strongest_product as (
                    select p.id, p.name, p.category
                    from sales s join financial_products p on p.id=s.product_id
                    where s.advisor_id=? and s.status='RECORDED'
                    group by p.id, p.name, p.category
                    order by sum(s.contract_amount) desc, p.id
                    limit 1
                )
                select summary.*, strongest_product.id strongest_product_id,
                       strongest_product.name strongest_product_name,
                       strongest_product.category strongest_product_category
                from summary left join strongest_product on true
                """,
                (result, row) -> new AdvisorLifetimeStatistics(
                        result.getBigDecimal("sales"),
                        result.getLong("recorded_contracts"),
                        result.getLong("cancelled_contracts"),
                        result.getBigDecimal("average_contract_amount"),
                        result.getDate("first_sale_date") == null ? null : result.getDate("first_sale_date").toLocalDate(),
                        result.getDate("last_sale_date") == null ? null : result.getDate("last_sale_date").toLocalDate(),
                        result.getObject("strongest_product_id", Long.class),
                        result.getString("strongest_product_name"),
                        productCategory(result.getString("strongest_product_category"))
                ),
                advisorId,
                advisorId
        );
    }

    @Override
    public AdvisorPosition position(
            long advisorId,
            long dealershipId,
            AdvisorType advisorType,
            LocalDate start,
            LocalDate end
    ) {
        return database.queryForObject(
                positionQuery(),
                (result, row) -> new AdvisorPosition(
                        result.getInt("position_rank"),
                        result.getLong("cohort_size"),
                        result.getBigDecimal("achievement_percentage")
                ),
                dealershipId,
                start,
                end,
                end,
                start,
                start,
                end,
                dealershipId,
                advisorType.name(),
                advisorId
        );
    }

    private String positionQuery() {
        return """
                with sales_summary as (
                    select advisor_id, sum(contract_amount) sales
                    from sales
                    where dealership_id=? and status='RECORDED' and sale_date between ? and ?
                    group by advisor_id
                ),
                target_summary as (
                    select owner_id advisor_id,
                           sum(target_amount *
                               ((least(end_date, ?) - greatest(start_date, ?) + 1)::numeric /
                                (end_date - start_date + 1)::numeric)) target
                    from targets
                    where owner_type='ADVISOR' and status='ACTIVE' and end_date>=? and start_date<=?
                    group by owner_id
                ),
                performance as (
                    select u.id, coalesce(s.sales,0) sales, coalesce(t.target,0) target
                    from users u
                    left join sales_summary s on s.advisor_id=u.id
                    left join target_summary t on t.advisor_id=u.id
                    where u.dealership_id=? and u.role='ADVISOR' and u.status='ACTIVE' and u.advisor_type=?
                ),
                ranked as (
                    select id,
                           row_number() over(order by case when target=0 then 0 else sales/target end desc, id) position_rank,
                           count(*) over() cohort_size,
                           case when target=0 then null else sales*100/target end achievement_percentage
                    from performance
                )
                select position_rank, cohort_size, achievement_percentage from ranked where id=?
                """;
    }

    private ProductCategory productCategory(String value) {
        return value == null ? null : ProductCategory.valueOf(value);
    }
}
