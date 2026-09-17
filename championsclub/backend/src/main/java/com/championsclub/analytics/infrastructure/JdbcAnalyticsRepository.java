package com.championsclub.analytics.infrastructure;
import com.championsclub.analytics.application.*;
import com.championsclub.targets.application.TargetStore.OwnerType;
import java.time.LocalDate;
import java.util.List;
import org.springframework.data.domain.*;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;
@Repository
class JdbcAnalyticsRepository implements AnalyticsRepository {
    private final JdbcTemplate database;
    JdbcAnalyticsRepository(JdbcTemplate database) { this.database=database; }
    public List<MlForecastClient.DailySale> daily(long id, OwnerType type, LocalDate start, LocalDate end) {
        String ownerColumn=type == OwnerType.ADVISOR ? "advisor_id" : "dealership_id";
        return database.query("""
                select day::date, coalesce(sum(s.financed_amount), 0) amount
                from generate_series(?::date, ?::date, interval '1 day') day
                left join sales s on s.sale_date=day::date and s.status='RECORDED' and s.
                """ + ownerColumn + "=? group by day order by day",
                (r, n) -> new MlForecastClient.DailySale(r.getDate(1).toLocalDate(), r.getBigDecimal(2)), start, end, id);
    }
    public List<ProductMix> productMix(long id, OwnerType type, LocalDate start, LocalDate end) {
        String ownerColumn=type == OwnerType.ADVISOR ? "advisor_id" : "dealership_id";
        return database.query("""
                select p.id, p.name, sum(s.financed_amount) amount, count(*) transactions
                from sales s join financial_products p on p.id=s.product_id
                where s.status='RECORDED' and s.sale_date between ? and ? and s.
                """ + ownerColumn + "=? group by p.id, p.name order by amount desc, p.id limit 20",
                (r, n) -> new ProductMix(r.getLong(1), r.getString(2), r.getBigDecimal(3), r.getLong(4)), start, end, id);
    }
    public Page<AdvisorPerformance> team(long dealershipId, LocalDate start, LocalDate end, Pageable page, boolean lowestFirst) {
        String order=lowestFirst ? "coalesce(s.amount/nullif(t.target_amount,0),0) asc, u.id" : "coalesce(s.amount,0) desc, u.id";
        var rows=database.query("""
                select u.id, u.first_name || ' ' || u.last_name name, coalesce(s.amount,0) sales,
                coalesce(t.target_amount,0) target, coalesce(p.points,0) points
                from users u
                left join lateral (select sum(financed_amount) amount from sales
                    where advisor_id=u.id and status='RECORDED' and sale_date between ? and ?) s on true
                left join lateral (select target_amount from targets
                    where owner_id=u.id and owner_type='ADVISOR' and status='ACTIVE' and start_date=? and end_date=?) t on true
                left join lateral (select sum(amount) points from point_transactions where advisor_id=u.id) p on true
                where u.dealership_id=? and u.role='SALES_ADVISOR' and u.status='ACTIVE'
                order by
                """ + order + " limit ? offset ?",
                (r, n) -> new AdvisorPerformance(r.getLong(1), r.getString(2), r.getBigDecimal(3), r.getBigDecimal(4), r.getInt(5)),
                start, end, start, end, dealershipId, page.getPageSize(), page.getOffset());
        long total=database.queryForObject("select count(*) from users where dealership_id=? and role='SALES_ADVISOR' and status='ACTIVE'",
                Long.class, dealershipId);
        return new PageImpl<>(rows, page, total);
    }
}
