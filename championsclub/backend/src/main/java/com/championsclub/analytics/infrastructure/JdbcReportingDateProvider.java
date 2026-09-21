package com.championsclub.analytics.infrastructure;

import com.championsclub.analytics.application.ReportingDateProvider;
import java.time.LocalDate;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

@Component
class JdbcReportingDateProvider implements ReportingDateProvider {
    private final JdbcTemplate database;
    private final boolean syntheticDataEnabled;

    JdbcReportingDateProvider(
            JdbcTemplate database,
            @Value("${championsclub.synthetic-data.enabled:false}") boolean syntheticDataEnabled
    ) {
        this.database = database;
        this.syntheticDataEnabled = syntheticDataEnabled;
    }

    @Override
    public LocalDate reportingDate() {
        LocalDate today = LocalDate.now();
        if (!syntheticDataEnabled) {
            return today;
        }
        LocalDate datasetEnd = database.queryForObject(
                "select max(period_end) from synthetic_dataset_runs",
                LocalDate.class
        );
        LocalDate latestSaleDate = database.queryForObject(
                "select max(sale_date) from sales where sale_date <= current_date",
                LocalDate.class
        );
        LocalDate latestKnownDate = later(datasetEnd, latestSaleDate);
        return latestKnownDate != null && latestKnownDate.isBefore(today) ? latestKnownDate : today;
    }

    private LocalDate later(LocalDate first, LocalDate second) {
        if (first == null) {
            return second;
        }
        if (second == null) {
            return first;
        }
        return first.isAfter(second) ? first : second;
    }
}
