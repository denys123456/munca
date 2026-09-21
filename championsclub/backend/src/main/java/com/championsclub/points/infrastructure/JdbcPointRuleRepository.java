package com.championsclub.points.infrastructure;

import com.championsclub.points.application.PointRuleRepository;
import com.championsclub.points.domain.PointRule;
import java.time.LocalDate;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

@Repository
class JdbcPointRuleRepository implements PointRuleRepository {
    private final JdbcTemplate database;

    JdbcPointRuleRepository(JdbcTemplate database) {
        this.database = database;
    }

    public java.util.Optional<PointRule> activeRule(long productId, LocalDate date) {
        return database.query(
                "select * from point_rules where product_id=? and active and ? between active_from and active_until",
                (result, row) -> new PointRule(
                        result.getInt("points_per_sale"),
                        result.getBigDecimal("minimum_eligible_amount"),
                        result.getDate("active_from").toLocalDate(),
                        result.getDate("active_until").toLocalDate(),
                        result.getBoolean("active")
                ),
                productId,
                date
        ).stream().findFirst();
    }

    public void save(long productId, PointRule rule) {
        database.update(
                "insert into point_rules(product_id, points_per_sale, minimum_eligible_amount, active_from, active_until, active) values(?, ?, ?, ?, ?, ?)",
                productId,
                rule.pointsPerSale(),
                rule.minimumEligibleAmount(),
                rule.activeFrom(),
                rule.activeUntil(),
                rule.active()
        );
    }
}
