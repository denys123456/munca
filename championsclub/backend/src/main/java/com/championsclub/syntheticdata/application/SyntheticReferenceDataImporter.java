package com.championsclub.syntheticdata.application;

import java.nio.file.Path;
import java.sql.Timestamp;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

@Component
class SyntheticReferenceDataImporter {
    private static final int BATCH_SIZE = 1000;

    private final JdbcTemplate database;
    private final SyntheticDatasetFiles files;

    SyntheticReferenceDataImporter(JdbcTemplate database, SyntheticDatasetFiles files) {
        this.database = database;
        this.files = files;
    }

    void importDealerships(Path directory, DatasetManifest manifest) {
        List<DealershipRow> rows = new ArrayList<>();
        files.forEach(directory.resolve("dealerships.jsonl"), DealershipRow.class, rows::add);
        requireCount("dealerships", rows.size(), manifest.dealershipCount());
        Timestamp generatedAt = Timestamp.from(manifest.generatedAt());
        database.batchUpdate(
                """
                insert into dealerships(id, name, city, region, code, active, created_at, updated_at)
                values(?, ?, ?, ?, ?, ?, ?, ?)
                """,
                rows,
                BATCH_SIZE,
                (statement, row) -> {
                    statement.setLong(1, row.id());
                    statement.setString(2, row.name());
                    statement.setString(3, row.city());
                    statement.setString(4, row.region());
                    statement.setString(5, row.code());
                    statement.setBoolean(6, row.active());
                    statement.setTimestamp(7, generatedAt);
                    statement.setTimestamp(8, generatedAt);
                }
        );
    }

    Map<Long, UserRow> importUsers(Path directory, DatasetManifest manifest, String passwordHash) {
        List<UserRow> rows = new ArrayList<>();
        files.forEach(directory.resolve("users.jsonl"), UserRow.class, rows::add);
        requireCount("users", rows.size(), manifest.managerCount() + manifest.advisorCount());
        Timestamp generatedAt = Timestamp.from(manifest.generatedAt());
        database.batchUpdate(
                """
                insert into users(
                    id, first_name, last_name, email, dealership_id, role, status, password_hash,
                    token_version, created_at, updated_at, advisor_type
                ) values(?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?, ?)
                """,
                rows,
                BATCH_SIZE,
                (statement, row) -> {
                    statement.setLong(1, row.id());
                    statement.setString(2, row.firstName());
                    statement.setString(3, row.lastName());
                    statement.setString(4, row.email());
                    statement.setLong(5, row.dealershipId());
                    statement.setString(6, row.role());
                    statement.setString(7, row.active() ? "ACTIVE" : "INACTIVE");
                    statement.setString(8, passwordHash);
                    statement.setTimestamp(9, generatedAt);
                    statement.setTimestamp(10, generatedAt);
                    statement.setString(11, row.advisorType());
                }
        );
        Map<Long, UserRow> byId = new HashMap<>();
        rows.forEach(row -> byId.put(row.id(), row));
        return byId;
    }

    Map<Long, ProductRow> importProducts(Path directory, DatasetManifest manifest) {
        List<ProductRow> rows = new ArrayList<>();
        files.forEach(directory.resolve("products.jsonl"), ProductRow.class, rows::add);
        Timestamp generatedAt = Timestamp.from(manifest.generatedAt());
        database.batchUpdate(
                """
                insert into financial_products(
                    id, name, code, description, eligible, active, created_at, updated_at, advisor_scope, category
                ) values(?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                rows,
                BATCH_SIZE,
                (statement, row) -> {
                    statement.setLong(1, row.id());
                    statement.setString(2, row.name());
                    statement.setString(3, row.code());
                    statement.setString(4, row.description());
                    statement.setBoolean(5, row.eligible());
                    statement.setBoolean(6, row.active());
                    statement.setTimestamp(7, generatedAt);
                    statement.setTimestamp(8, generatedAt);
                    statement.setString(9, row.advisorScope());
                    statement.setString(10, row.category());
                }
        );
        Map<Long, ProductRow> byId = new HashMap<>();
        rows.forEach(row -> byId.put(row.id(), row));
        return byId;
    }

    Map<Long, RewardRow> importRewards(Path directory, DatasetManifest manifest) {
        List<RewardRow> rows = new ArrayList<>();
        files.forEach(directory.resolve("rewards.jsonl"), RewardRow.class, rows::add);
        Timestamp generatedAt = Timestamp.from(manifest.generatedAt());
        database.batchUpdate(
                """
                insert into rewards(
                    id, name, category, required_points, status, description, stock, image_reference, created_at, updated_at
                ) values(?, ?, ?, ?, 'ACTIVE', ?, ?, ?, ?, ?)
                """,
                rows,
                BATCH_SIZE,
                (statement, row) -> {
                    statement.setLong(1, row.id());
                    statement.setString(2, row.name());
                    statement.setString(3, row.category());
                    statement.setInt(4, row.requiredPoints());
                    statement.setString(5, row.description());
                    statement.setInt(6, row.stock());
                    statement.setString(7, row.imageReference());
                    statement.setTimestamp(8, generatedAt);
                    statement.setTimestamp(9, generatedAt);
                }
        );
        Map<Long, RewardRow> byId = new HashMap<>();
        rows.forEach(row -> byId.put(row.id(), row));
        return byId;
    }

    private void requireCount(String entity, int actual, int expected) {
        if (actual != expected) {
            throw new IllegalStateException(
                    "Synthetic dataset manifest expected " + expected + " " + entity + " but found " + actual + "."
            );
        }
    }
}
