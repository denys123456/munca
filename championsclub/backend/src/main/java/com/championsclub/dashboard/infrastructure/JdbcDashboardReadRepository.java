package com.championsclub.dashboard.infrastructure;

import com.championsclub.alerts.domain.AlertSeverity;
import com.championsclub.alerts.domain.AlertType;
import com.championsclub.dashboard.application.DashboardAlert;
import com.championsclub.dashboard.application.DashboardReadRepository;
import com.championsclub.dashboard.application.EmployeeAttentionItem;
import com.championsclub.dashboard.application.LeaderboardEntry;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Repository
class JdbcDashboardReadRepository implements DashboardReadRepository {

    private final JdbcTemplate jdbcTemplate;

    JdbcDashboardReadRepository(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    @Override
    public AdvisorDashboardData findAdvisorDashboardData(Long advisorId) {
        LocalDate monthStart = LocalDate.now().withDayOfMonth(1);
        String advisorName = jdbcTemplate.queryForObject(
                "select first_name || ' ' || last_name from users where id = ?",
                String.class,
                advisorId
        );
        Long dealershipId = jdbcTemplate.queryForObject("select dealership_id from users where id = ?", Long.class, advisorId);
        return new AdvisorDashboardData(
                advisorName,
                dealershipId,
                currentAdvisorSales(advisorId, monthStart),
                currentTarget(advisorId, "ADVISOR", monthStart),
                availablePoints(advisorId),
                achievements(advisorId),
                monthlySalesHistoryForAdvisor(advisorId)
        );
    }

    @Override
    public ManagerDashboardData findManagerDashboardData(Long dealershipId) {
        LocalDate monthStart = LocalDate.now().withDayOfMonth(1);
        String dealershipName = jdbcTemplate.queryForObject("select name from dealerships where id = ?", String.class, dealershipId);
        return new ManagerDashboardData(
                dealershipName,
                currentDealershipSales(dealershipId, monthStart),
                currentTarget(dealershipId, "DEALERSHIP", monthStart),
                monthlySalesHistoryForDealership(dealershipId)
        );
    }

    @Override
    public List<LeaderboardEntry> findLeaderboardForDealership(Long dealershipId) {
        return jdbcTemplate.query(
                """
                select u.id, u.first_name || ' ' || u.last_name advisor_name,
                coalesce(sum(s.financed_amount), 0) month_sales,
                coalesce(sum(s.awarded_points), 0) points
                from users u
                left join sales s on s.advisor_id = u.id and s.status = 'RECORDED' and s.sale_date >= date_trunc('month', current_date)
                where u.dealership_id = ? and u.role = 'SALES_ADVISOR'
                group by u.id, advisor_name
                order by month_sales desc
                limit 5
                """,
                (row, index) -> new LeaderboardEntry(
                        row.getLong("id"),
                        row.getString("advisor_name"),
                        row.getBigDecimal("month_sales"),
                        row.getInt("points"),
                        index + 1
                ),
                dealershipId
        );
    }

    @Override
    public List<DashboardAlert> findUnreadAlerts(Long recipientId) {
        return jdbcTemplate.query(
                """
                select type, severity, title, message
                from alerts
                where recipient_id = ? and is_read = false
                order by created_at desc
                limit 5
                """,
                (row, index) -> new DashboardAlert(
                        AlertType.valueOf(row.getString("type")),
                        AlertSeverity.valueOf(row.getString("severity")),
                        row.getString("title"),
                        row.getString("message")
                ),
                recipientId
        );
    }

    @Override
    public List<EmployeeAttentionItem> findEmployeesNeedingAttention(Long dealershipId) {
        return jdbcTemplate.query(
                """
                select u.id, u.first_name || ' ' || u.last_name advisor_name,
                coalesce(sum(s.financed_amount), 0) month_sales,
                coalesce(t.target_amount, 1) target_amount
                from users u
                left join sales s on s.advisor_id = u.id and s.status = 'RECORDED' and s.sale_date >= date_trunc('month', current_date)
                left join targets t on t.owner_id = u.id and t.status = 'ACTIVE'
                where u.dealership_id = ? and u.role = 'SALES_ADVISOR'
                group by u.id, advisor_name, t.target_amount
                having coalesce(sum(s.financed_amount), 0) < coalesce(t.target_amount, 1) * 0.7
                order by month_sales asc
                limit 4
                """,
                (row, index) -> new EmployeeAttentionItem(
                        row.getLong("id"),
                        row.getString("advisor_name"),
                        "Below monthly target pace",
                        row.getBigDecimal("month_sales").multiply(BigDecimal.valueOf(100)).divide(row.getBigDecimal("target_amount"), 0, java.math.RoundingMode.HALF_UP).intValue()
                ),
                dealershipId
        );
    }

    private BigDecimal currentAdvisorSales(Long advisorId, LocalDate monthStart) {
        return jdbcTemplate.queryForObject(
                "select coalesce(sum(financed_amount), 0) from sales where advisor_id = ? and status = 'RECORDED' and sale_date >= ?",
                BigDecimal.class,
                advisorId,
                monthStart
        );
    }

    private BigDecimal currentDealershipSales(Long dealershipId, LocalDate monthStart) {
        return jdbcTemplate.queryForObject(
                "select coalesce(sum(financed_amount), 0) from sales where dealership_id = ? and status = 'RECORDED' and sale_date >= ?",
                BigDecimal.class,
                dealershipId,
                monthStart
        );
    }

    private BigDecimal currentTarget(Long ownerId, String ownerType, LocalDate monthStart) {
        BigDecimal target = jdbcTemplate.query(
                "select target_amount from targets where owner_id = ? and owner_type = ? and status = 'ACTIVE' and start_date <= ? and end_date >= ? limit 1",
                (row, index) -> row.getBigDecimal("target_amount"),
                ownerId,
                ownerType,
                monthStart,
                monthStart
        ).stream().findFirst().orElse(BigDecimal.ZERO);
        return target;
    }

    private int availablePoints(Long advisorId) {
        Integer points = jdbcTemplate.queryForObject(
                "select coalesce(sum(awarded_points), 0) from sales where advisor_id = ? and status = 'RECORDED'",
                Integer.class,
                advisorId
        );
        Integer redeemed = jdbcTemplate.queryForObject(
                "select coalesce(sum(redeemed_points), 0) from reward_redemptions where advisor_id = ?",
                Integer.class,
                advisorId
        );
        return points == null || redeemed == null ? 0 : points - redeemed;
    }

    private List<String> achievements(Long advisorId) {
        return jdbcTemplate.query(
                "select name from achievements where advisor_id = ? order by achieved_at desc limit 4",
                (row, index) -> row.getString("name"),
                advisorId
        );
    }

    private List<BigDecimal> monthlySalesHistoryForAdvisor(Long advisorId) {
        return jdbcTemplate.query(
                """
                select coalesce(sum(financed_amount), 0) month_sales
                from sales
                where advisor_id = ? and status = 'RECORDED' and sale_date >= current_date - interval '180 days'
                group by date_trunc('month', sale_date)
                order by date_trunc('month', sale_date)
                """,
                (row, index) -> row.getBigDecimal("month_sales"),
                advisorId
        );
    }

    private List<BigDecimal> monthlySalesHistoryForDealership(Long dealershipId) {
        return jdbcTemplate.query(
                """
                select coalesce(sum(financed_amount), 0) month_sales
                from sales
                where dealership_id = ? and status = 'RECORDED' and sale_date >= current_date - interval '180 days'
                group by date_trunc('month', sale_date)
                order by date_trunc('month', sale_date)
                """,
                (row, index) -> row.getBigDecimal("month_sales"),
                dealershipId
        );
    }
}
