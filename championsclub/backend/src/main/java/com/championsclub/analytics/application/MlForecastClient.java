package com.championsclub.analytics.application;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.*;
import com.championsclub.targets.application.TargetStore.OwnerType;
public interface MlForecastClient {
    Optional<SalesForecast> forecast(ForecastRequest request);
    record DailySale(LocalDate date, BigDecimal amount) {}
    record ForecastRequest(long subjectId, OwnerType subjectType, LocalDate periodStart, LocalDate periodEnd,
                           LocalDate asOf, List<DailySale> historicalSales, BigDecimal target) {}
}
