package com.championsclub.syntheticdata.application;

import com.championsclub.gamification.domain.GamificationThresholds;
import com.championsclub.points.domain.PointRule;
import java.nio.file.Files;
import java.nio.file.Path;
import java.sql.Timestamp;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

@Component
class SyntheticConfigurationImporter {
    private static final int BATCH_SIZE = 1000;

    private final JdbcTemplate database;
    private final SyntheticDatasetFiles files;

    SyntheticConfigurationImporter(JdbcTemplate database, SyntheticDatasetFiles files) {
        this.database = database;
        this.files = files;
    }

    Map<Long, List<PointRule>> importPointRules(Path directory) {
        List<PointRuleRow> rows = new ArrayList<>();
        files.forEach(directory.resolve("point_rules.jsonl"), PointRuleRow.class, rows::add);
        database.batchUpdate(
                """
                insert into point_rules(
                    id, product_id, points_per_sale, minimum_eligible_amount,
                    active_from, active_until, active, updated_at
                ) values(?, ?, ?, ?, ?, ?, ?, now())
                """,
                rows,
                BATCH_SIZE,
                (statement, row) -> {
                    statement.setLong(1, row.id());
                    statement.setLong(2, row.productId());
                    statement.setInt(3, row.pointsPerSale());
                    statement.setBigDecimal(4, row.minimumEligibleAmount());
                    statement.setObject(5, row.activeFrom());
                    statement.setObject(6, row.activeUntil());
                    statement.setBoolean(7, row.active());
                }
        );
        Map<Long, List<PointRule>> byProduct = new HashMap<>();
        for (PointRuleRow row : rows) {
            byProduct.computeIfAbsent(row.productId(), ignored -> new ArrayList<>()).add(
                    new PointRule(
                            row.pointsPerSale(),
                            row.minimumEligibleAmount(),
                            row.activeFrom(),
                            row.activeUntil(),
                            row.active()
                    )
            );
        }
        byProduct.values().forEach(rules -> rules.sort(Comparator.comparing(PointRule::activeFrom)));
        return byProduct;
    }

    void importGamification(Path directory, DatasetManifest manifest) {
        Path configurationPath = directory.resolve("gamification.json");
        if (!Files.isRegularFile(configurationPath)) {
            return;
        }
        GamificationRow row = files.read(configurationPath, GamificationRow.class);
        GamificationThresholds thresholds = new GamificationThresholds(
                row.bronze(),
                row.silver(),
                row.gold()
        );
        int updatedRows = database.update(
                "update gamification_configuration set bronze=?, silver=?, gold=?, updated_at=? where id=1",
                thresholds.bronze(),
                thresholds.silver(),
                thresholds.gold(),
                Timestamp.from(manifest.generatedAt())
        );
        if (updatedRows != 1) {
            throw new IllegalStateException("Gamification configuration row is missing.");
        }
    }

    void importTargets(Path directory) {
        List<TargetRow> batch = new ArrayList<>(BATCH_SIZE);
        files.forEach(directory.resolve("targets.jsonl"), TargetRow.class, row -> {
            batch.add(row);
            if (batch.size() == BATCH_SIZE) {
                writeTargets(batch);
                batch.clear();
            }
        });
        if (!batch.isEmpty()) {
            writeTargets(batch);
        }
    }

    private void writeTargets(List<TargetRow> rows) {
        database.batchUpdate(
                """
                insert into targets(
                    id, owner_id, owner_type, target_amount, start_date, end_date, status, currency,
                    created_by, created_at, updated_at
                ) values(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                rows,
                BATCH_SIZE,
                (statement, row) -> {
                    statement.setLong(1, row.id());
                    statement.setLong(2, row.ownerId());
                    statement.setString(3, row.ownerType());
                    statement.setBigDecimal(4, row.targetAmount());
                    statement.setObject(5, row.periodStart());
                    statement.setObject(6, row.periodEnd());
                    statement.setString(7, row.active() ? "ACTIVE" : "INACTIVE");
                    statement.setString(8, row.currency());
                    statement.setLong(9, row.createdBy());
                    statement.setTimestamp(10, Timestamp.from(row.createdAt()));
                    statement.setTimestamp(11, Timestamp.from(row.createdAt()));
                }
        );
    }
}
