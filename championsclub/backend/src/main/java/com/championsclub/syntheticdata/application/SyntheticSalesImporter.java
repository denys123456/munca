package com.championsclub.syntheticdata.application;

import com.championsclub.points.domain.PointRule;
import com.championsclub.sales.domain.ProductAdvisorScope;
import com.championsclub.users.domain.AdvisorType;
import java.nio.file.Path;
import java.sql.PreparedStatement;
import java.sql.SQLException;
import java.sql.Timestamp;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

@Component
class SyntheticSalesImporter {
    private static final int BATCH_SIZE = 1000;

    private final JdbcTemplate database;
    private final SyntheticDatasetFiles files;
    private final SyntheticPointTransactionWriter pointTransactions;

    SyntheticSalesImporter(
            JdbcTemplate database,
            SyntheticDatasetFiles files,
            SyntheticPointTransactionWriter pointTransactions
    ) {
        this.database = database;
        this.files = files;
        this.pointTransactions = pointTransactions;
    }

    void importSales(
            Path directory,
            Map<Long, UserRow> users,
            Map<Long, ProductRow> products,
            Map<Long, List<PointRule>> pointRules
    ) {
        List<PreparedSale> batch = new ArrayList<>(BATCH_SIZE);
        files.forEach(directory.resolve("sales.jsonl"), SaleRow.class, row -> {
            batch.add(prepare(row, users, products, pointRules));
            if (batch.size() == BATCH_SIZE) {
                write(batch);
                batch.clear();
            }
        });
        if (!batch.isEmpty()) {
            write(batch);
        }
    }

    private PreparedSale prepare(
            SaleRow row,
            Map<Long, UserRow> users,
            Map<Long, ProductRow> products,
            Map<Long, List<PointRule>> pointRules
    ) {
        UserRow advisor = users.get(row.advisorId());
        ProductRow product = products.get(row.productId());
        if (advisor == null || !"ADVISOR".equals(advisor.role())) {
            throw new IllegalStateException("Synthetic sale references an invalid advisor " + row.advisorId() + ".");
        }
        if (product == null) {
            throw new IllegalStateException("Synthetic sale references an invalid product " + row.productId() + ".");
        }
        if (advisor.dealershipId() != row.dealershipId()) {
            throw new IllegalStateException("Synthetic sale advisor and dealership do not match for sale " + row.id() + ".");
        }
        AdvisorType advisorType = AdvisorType.valueOf(advisor.advisorType());
        if (!ProductAdvisorScope.valueOf(product.advisorScope()).supports(advisorType)) {
            throw new IllegalStateException("Synthetic sale uses a product outside the advisor scope for sale " + row.id() + ".");
        }
        int awardedPoints = pointRules.getOrDefault(row.productId(), List.of()).stream()
                .filter(rule -> !row.saleDate().isBefore(rule.activeFrom()) && !row.saleDate().isAfter(rule.activeUntil()))
                .findFirst()
                .map(rule -> rule.award(product.eligible(), row.contractAmount(), row.saleDate()))
                .orElse(0);
        return new PreparedSale(row, awardedPoints);
    }

    private void write(List<PreparedSale> sales) {
        database.batchUpdate(
                """
                insert into sales(
                    id, advisor_id, dealership_id, product_id, contract_amount, sale_date, awarded_points, status,
                    external_reference, currency, created_at, vehicle_powertrain, vehicle_condition, customer_segment, cancelled_at
                ) values(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                sales,
                BATCH_SIZE,
                this::bindSale
        );
        List<PointTransactionRow> transactions = new ArrayList<>(sales.size() * 2);
        for (PreparedSale prepared : sales) {
            SaleRow sale = prepared.sale();
            if (prepared.awardedPoints() == 0) {
                continue;
            }
            transactions.add(new PointTransactionRow(
                    sale.advisorId(),
                    "SALE_EARNED",
                    prepared.awardedPoints(),
                    sale.id(),
                    "Synthetic contract award",
                    sale.recordedAt()
            ));
            if ("CANCELLED".equals(sale.status())) {
                transactions.add(new PointTransactionRow(
                        sale.advisorId(),
                        "SALE_REVERSAL",
                        -prepared.awardedPoints(),
                        sale.id(),
                        "Synthetic contract cancellation reversal",
                        sale.cancelledAt()
                ));
            }
        }
        pointTransactions.write(transactions);
    }

    private void bindSale(PreparedStatement statement, PreparedSale prepared) throws SQLException {
        SaleRow row = prepared.sale();
        statement.setLong(1, row.id());
        statement.setLong(2, row.advisorId());
        statement.setLong(3, row.dealershipId());
        statement.setLong(4, row.productId());
        statement.setBigDecimal(5, row.contractAmount());
        statement.setObject(6, row.saleDate());
        statement.setInt(7, prepared.awardedPoints());
        statement.setString(8, row.status());
        statement.setString(9, row.externalReference());
        statement.setString(10, row.currency());
        statement.setTimestamp(11, Timestamp.from(row.recordedAt()));
        statement.setString(12, row.vehiclePowertrain());
        statement.setString(13, row.vehicleCondition());
        statement.setString(14, row.customerSegment());
        statement.setTimestamp(15, row.cancelledAt() == null ? null : Timestamp.from(row.cancelledAt()));
    }

    private record PreparedSale(SaleRow sale, int awardedPoints) {
    }
}
