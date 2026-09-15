package com.championsclub.analytics.application;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import org.springframework.data.domain.*;
import com.championsclub.targets.application.TargetStore.OwnerType;
public interface AnalyticsRepository {
    List<MlForecastClient.DailySale> daily(long id, OwnerType type, LocalDate start, LocalDate end);
    List<ProductMix> productMix(long id, OwnerType type, LocalDate start, LocalDate end);
    Page<AdvisorPerformance> team(long dealershipId, LocalDate start, LocalDate end, Pageable page, boolean lowestFirst);
    record ProductMix(long productId, String productName, BigDecimal sales, long transactions) {}
    record AdvisorPerformance(long advisorId, String advisorName, BigDecimal sales, BigDecimal target, int points) {}
}
