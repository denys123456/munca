package com.championsclub.analytics.application;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import org.springframework.stereotype.Component;

@Component
public class AnalyticsPeriodValidator {
    private final ReportingDateProvider reportingDates;

    public AnalyticsPeriodValidator(ReportingDateProvider reportingDates) {
        this.reportingDates = reportingDates;
    }

    public void validate(LocalDate start, LocalDate end) {
        LocalDate maximumDate = reportingDates.reportingDate().withDayOfMonth(1).plusMonths(1).minusDays(1);
        if (end.isBefore(start)
                || ChronoUnit.DAYS.between(start, end) > 365
                || end.isAfter(maximumDate)) {
            throw new IllegalArgumentException("Analytics requires a valid period of at most one year.");
        }
    }
}
