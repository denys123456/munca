package com.championsclub.analytics.infrastructure;

import com.championsclub.analytics.application.TeamAnalyticsRepository;
import com.championsclub.users.domain.AdvisorType;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

@Repository
class JdbcTeamAnalyticsRepository implements TeamAnalyticsRepository {
    private final JdbcTemplate database;

    JdbcTeamAnalyticsRepository(JdbcTemplate database) {
        this.database = database;
    }

    @Override
    public Page<AdvisorPerformance> team(
            long dealershipId,
            LocalDate start,
            LocalDate end,
            AdvisorType advisorType,
            Pageable page,
            boolean lowestFirst
    ) {
        String direction = lowestFirst ? "asc" : "desc";
        String advisorTypeFilter = advisorType == null ? "" : " and u.advisor_type=?";
        String order = "case when coalesce(t.target,0)=0 then 0 else coalesce(s.sales,0)/t.target end "
                + direction + ", u.id";
        var rows = database.query(
                teamQuery(advisorTypeFilter, order),
                this::mapAdvisorPerformance,
                teamParameters(dealershipId, start, end, advisorType, page).toArray()
        );
        return new PageImpl<>(rows, page, advisorCount(dealershipId, advisorType));
    }

    @Override
    public TeamStatistics teamStatistics(long dealershipId, LocalDate start, LocalDate end) {
        return database.queryForObject(
                """
                select
                    (select count(*) from users where dealership_id=? and role='ADVISOR') total_advisors,
                    (select count(*) from users where dealership_id=? and role='ADVISOR' and status='ACTIVE') active_advisors,
                    (select count(*) from users
                     where dealership_id=? and role='ADVISOR' and status='ACTIVE' and advisor_type='SALES') sales_advisors,
                    (select count(*) from users
                     where dealership_id=? and role='ADVISOR' and status='ACTIVE' and advisor_type='SERVICE') service_advisors,
                    (select count(distinct advisor_id) from sales
                     where dealership_id=? and status='RECORDED' and sale_date between ? and ?) advisors_with_sales,
                    (select count(*) from sales
                     where dealership_id=? and status='RECORDED' and sale_date between ? and ?) recorded_contracts,
                    (select count(*) from sales
                     where dealership_id=? and status='CANCELLED' and sale_date between ? and ?) cancelled_contracts,
                    (select coalesce(sum(contract_amount),0) from sales
                     where dealership_id=? and status='RECORDED' and sale_date between ? and ?) sales,
                    (select coalesce(avg(contract_amount),0) from sales
                     where dealership_id=? and status='RECORDED' and sale_date between ? and ?) average_contract_amount,
                    (select count(*) from financial_products where active=true and eligible=true) active_products
                """,
                (result, row) -> new TeamStatistics(
                        result.getLong("total_advisors"),
                        result.getLong("active_advisors"),
                        result.getLong("sales_advisors"),
                        result.getLong("service_advisors"),
                        result.getLong("advisors_with_sales"),
                        result.getLong("recorded_contracts"),
                        result.getLong("cancelled_contracts"),
                        result.getBigDecimal("sales"),
                        result.getBigDecimal("average_contract_amount"),
                        result.getLong("active_products")
                ),
                dealershipId,
                dealershipId,
                dealershipId,
                dealershipId,
                dealershipId, start, end,
                dealershipId, start, end,
                dealershipId, start, end,
                dealershipId, start, end,
                dealershipId, start, end
        );
    }

    private String teamQuery(String advisorTypeFilter, String order) {
        return """
                with sales_summary as (
                    select advisor_id, sum(contract_amount) sales, count(*) transactions, max(sale_date) last_sale_date
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
                point_summary as (
                    select advisor_id, sum(amount) points
                    from point_transactions
                    where type in ('SALE_EARNED','SALE_REVERSAL')
                    group by advisor_id
                )
                select u.id, u.first_name || ' ' || u.last_name name, u.advisor_type,
                       coalesce(s.sales,0) sales, coalesce(s.transactions,0) transactions,
                       coalesce(t.target,0) target, coalesce(p.points,0) lifetime_points, s.last_sale_date
                from users u
                left join sales_summary s on s.advisor_id=u.id
                left join target_summary t on t.advisor_id=u.id
                left join point_summary p on p.advisor_id=u.id
                where u.dealership_id=? and u.role='ADVISOR' and u.status='ACTIVE'
                """ + advisorTypeFilter + " order by " + order + " limit ? offset ?";
    }

    private List<Object> teamParameters(
            long dealershipId,
            LocalDate start,
            LocalDate end,
            AdvisorType advisorType,
            Pageable page
    ) {
        List<Object> parameters = new ArrayList<>();
        parameters.add(dealershipId);
        parameters.add(start);
        parameters.add(end);
        parameters.add(end);
        parameters.add(start);
        parameters.add(start);
        parameters.add(end);
        parameters.add(dealershipId);
        if (advisorType != null) {
            parameters.add(advisorType.name());
        }
        parameters.add(page.getPageSize());
        parameters.add(page.getOffset());
        return parameters;
    }

    private AdvisorPerformance mapAdvisorPerformance(java.sql.ResultSet result, int row) throws java.sql.SQLException {
        return new AdvisorPerformance(
                result.getLong("id"),
                result.getString("name"),
                AdvisorType.valueOf(result.getString("advisor_type")),
                result.getBigDecimal("sales"),
                result.getLong("transactions"),
                result.getBigDecimal("target"),
                Math.max(0, result.getInt("lifetime_points")),
                result.getDate("last_sale_date") == null ? null : result.getDate("last_sale_date").toLocalDate()
        );
    }

    private long advisorCount(long dealershipId, AdvisorType advisorType) {
        if (advisorType == null) {
            return database.queryForObject(
                    "select count(*) from users where dealership_id=? and role='ADVISOR' and status='ACTIVE'",
                    Long.class,
                    dealershipId
            );
        }
        return database.queryForObject(
                "select count(*) from users where dealership_id=? and role='ADVISOR' and status='ACTIVE' and advisor_type=?",
                Long.class,
                dealershipId,
                advisorType.name()
        );
    }
}
