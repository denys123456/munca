package com.championsclub.syntheticdata.application;

import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.sql.Timestamp;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

@Component
class SyntheticRedemptionImporter {
    private final JdbcTemplate database;
    private final SyntheticDatasetFiles files;
    private final SyntheticPointTransactionWriter pointTransactions;

    SyntheticRedemptionImporter(
            JdbcTemplate database,
            SyntheticDatasetFiles files,
            SyntheticPointTransactionWriter pointTransactions
    ) {
        this.database = database;
        this.files = files;
        this.pointTransactions = pointTransactions;
    }

    void importRedemptions(Path directory, Map<Long, RewardRow> rewards) {
        Path intentsPath = directory.resolve("redemption_intents.jsonl");
        if (!Files.isRegularFile(intentsPath)) {
            return;
        }
        files.forEach(intentsPath, RedemptionIntentRow.class, intent -> issue(intent, rewards));
    }

    private void issue(RedemptionIntentRow intent, Map<Long, RewardRow> rewards) {
        RewardRow reward = rewards.get(intent.rewardId());
        if (reward == null) {
            throw new IllegalStateException("Synthetic redemption references an invalid reward " + intent.rewardId() + ".");
        }
        Integer stock = database.queryForObject(
                "select stock from rewards where id = ? for update",
                Integer.class,
                reward.id()
        );
        Timestamp redeemedAt = Timestamp.from(intent.redeemedAt());
        Long availablePoints = database.queryForObject(
                "select coalesce(sum(amount), 0) from point_transactions where advisor_id = ? and created_at <= ?",
                Long.class,
                intent.advisorId(),
                redeemedAt
        );
        if (stock == null || stock <= 0 || availablePoints == null || availablePoints < reward.requiredPoints()) {
            return;
        }
        UUID voucherCode = UUID.nameUUIDFromBytes(
                ("championsclub-redemption-" + intent.id()).getBytes(StandardCharsets.UTF_8)
        );
        database.update(
                """
                insert into reward_redemptions(id, advisor_id, reward_id, redeemed_points, redeemed_at, voucher_code, status)
                values(?, ?, ?, ?, ?, ?, 'ISSUED')
                """,
                intent.id(),
                intent.advisorId(),
                reward.id(),
                reward.requiredPoints(),
                redeemedAt,
                voucherCode
        );
        database.update(
                "update rewards set stock = stock - 1, updated_at = ? where id = ?",
                redeemedAt,
                reward.id()
        );
        pointTransactions.write(List.of(new PointTransactionRow(
                intent.advisorId(),
                "REWARD_REDEMPTION",
                -reward.requiredPoints(),
                intent.id(),
                "Synthetic reward redemption",
                intent.redeemedAt()
        )));
    }
}
