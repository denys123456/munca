package com.championsclub.syntheticdata.application;

import java.sql.Timestamp;
import java.util.List;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

@Component
class SyntheticPointTransactionWriter {
    private static final int BATCH_SIZE = 1000;

    private final JdbcTemplate database;

    SyntheticPointTransactionWriter(JdbcTemplate database) {
        this.database = database;
    }

    void write(List<PointTransactionRow> transactions) {
        if (transactions.isEmpty()) {
            return;
        }
        database.batchUpdate(
                """
                insert into point_transactions(advisor_id, type, amount, source_id, description, created_at)
                values(?, ?, ?, ?, ?, ?)
                """,
                transactions,
                BATCH_SIZE,
                (statement, row) -> {
                    statement.setLong(1, row.advisorId());
                    statement.setString(2, row.type());
                    statement.setInt(3, row.amount());
                    statement.setLong(4, row.sourceId());
                    statement.setString(5, row.description());
                    statement.setTimestamp(6, Timestamp.from(row.createdAt()));
                }
        );
    }
}
