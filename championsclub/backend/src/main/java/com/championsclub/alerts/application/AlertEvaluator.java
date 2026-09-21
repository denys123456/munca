package com.championsclub.alerts.application;

import com.championsclub.alerts.domain.AlertSeverity;
import com.championsclub.alerts.domain.AlertType;
import com.championsclub.analytics.application.AnalyticsResult;
import com.championsclub.analytics.application.ProductPerformance;
import com.championsclub.analytics.application.SalesForecast;
import com.championsclub.gamification.domain.GamificationLevel;
import com.championsclub.gamification.domain.GamificationProgress;
import com.championsclub.targets.application.TargetService;
import com.championsclub.targets.domain.TargetProgress;
import com.championsclub.users.application.UserAccount;
import com.championsclub.users.domain.UserRole;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Comparator;
import org.springframework.stereotype.Service;

@Service
public class AlertEvaluator {
    private static final BigDecimal DECLINE_PERCENTAGE = BigDecimal.valueOf(-30);
    private static final BigDecimal IMPROVEMENT_PERCENTAGE = BigDecimal.valueOf(20);
    private static final BigDecimal EXCEPTIONAL_GROWTH_PERCENTAGE = BigDecimal.valueOf(30);
    private static final double FORECAST_RISK_PROBABILITY = 0.50;
    private static final int CLOSE_TO_LEVEL_PROGRESS_PERCENTAGE = 80;
    private static final int INACTIVITY_DAYS = 7;

    private final AlertStore alerts;

    public AlertEvaluator(AlertStore alerts) {
        this.alerts = alerts;
    }

    public void evaluate(
            UserAccount user,
            TargetService.TargetSnapshot target,
            AnalyticsResult analytics,
            SalesForecast forecast,
            GamificationProgress level,
            boolean rewardEligible,
            LocalDate reportingDate
    ) {
        String period = target.periodStart().toString();
        evaluateTarget(user, target, forecast, period);
        evaluateTrend(user, target, analytics, period);
        evaluateForecast(user, target, forecast, period);
        evaluateActivity(user, analytics, reportingDate, target.periodStart(), period);
        evaluateProductMix(user, analytics, period);
        evaluateGamification(user, level);
        evaluateReward(user, rewardEligible, period);
        evaluateTeamOpportunity(user, analytics, period);
    }

    private void evaluateTarget(
            UserAccount user,
            TargetService.TargetSnapshot target,
            SalesForecast forecast,
            String period
    ) {
        if (target.progress().status() == TargetProgress.Status.AT_RISK) {
            emit(
                    user,
                    AlertType.TARGET_RISK,
                    AlertSeverity.WARNING,
                    "Target pace at risk",
                    "Sales are below the expected pace for this target period.",
                    period
            );
        }
        if (target.progress().status() == TargetProgress.Status.ACHIEVED) {
            emit(
                    user,
                    AlertType.TARGET_ACHIEVED,
                    AlertSeverity.INFO,
                    "Target achieved",
                    "Confirmed sales have reached the target.",
                    period
            );
        }
        if (forecast != null
                && target.progress().targetAmount().signum() > 0
                && forecast.predictedEndValue().compareTo(target.progress().targetAmount()) < 0) {
            emit(
                    user,
                    AlertType.FORECAST_BELOW_TARGET,
                    AlertSeverity.WARNING,
                    "Forecast below target",
                    "The trained forecast is below the configured target.",
                    period
            );
        }
    }

    private void evaluateTrend(
            UserAccount user,
            TargetService.TargetSnapshot target,
            AnalyticsResult analytics,
            String period
    ) {
        BigDecimal growth = analytics.salesGrowthPercentage();
        if (growth != null && growth.compareTo(DECLINE_PERCENTAGE) <= 0) {
            emit(
                    user,
                    AlertType.SALES_DECLINE,
                    AlertSeverity.WARNING,
                    "Sales declined",
                    "Sales are at least 30 percent below the preceding equal-length period.",
                    period
            );
        }
        if (growth != null && growth.compareTo(IMPROVEMENT_PERCENTAGE) >= 0) {
            emit(
                    user,
                    AlertType.SIGNIFICANT_IMPROVEMENT,
                    AlertSeverity.OPPORTUNITY,
                    "Sales improved",
                    "Sales are at least 20 percent above the preceding equal-length period.",
                    period
            );
        }
        if (growth != null
                && growth.compareTo(EXCEPTIONAL_GROWTH_PERCENTAGE) >= 0
                && (target.progress().status() == TargetProgress.Status.AHEAD
                || target.progress().status() == TargetProgress.Status.ACHIEVED)) {
            emit(
                    user,
                    AlertType.EXCEPTIONAL_PERFORMANCE,
                    AlertSeverity.OPPORTUNITY,
                    "Exceptional performance",
                    "Sales growth is at least 30 percent while target performance is ahead or achieved.",
                    period
            );
        }
    }

    private void evaluateForecast(
            UserAccount user,
            TargetService.TargetSnapshot target,
            SalesForecast forecast,
            String period
    ) {
        if (forecast == null) {
            return;
        }
        if (!forecast.anomalies().isEmpty()) {
            emit(
                    user,
                    AlertType.ML_ANOMALY,
                    AlertSeverity.WARNING,
                    "Unusual sales activity",
                    "Recent daily sales differ substantially from comparable weekdays.",
                    forecast.anomalies().getLast().date().toString()
            );
        }
        if (user.role() == UserRole.MANAGER
                && forecast.targetAchievementProbability() != null
                && forecast.targetAchievementProbability() < FORECAST_RISK_PROBABILITY
                && target.progress().targetAmount().signum() > 0) {
            emit(
                    user,
                    AlertType.DEALERSHIP_FORECAST_RISK,
                    AlertSeverity.CRITICAL,
                    "Dealership forecast risk",
                    "The trained forecast gives the dealership less than a 50 percent probability of reaching target.",
                    period
            );
        }
    }

    private void evaluateActivity(
            UserAccount user,
            AnalyticsResult analytics,
            LocalDate reportingDate,
            LocalDate periodStart,
            String period
    ) {
        if (user.role() != UserRole.ADVISOR || reportingDate.isBefore(periodStart.plusDays(INACTIVITY_DAYS))) {
            return;
        }
        LocalDate lastSale = analytics.dailySales().stream()
                .filter(point -> point.amount().signum() > 0)
                .map(point -> point.date())
                .max(LocalDate::compareTo)
                .orElse(null);
        if (lastSale == null || lastSale.isBefore(reportingDate.minusDays(INACTIVITY_DAYS))) {
            emit(
                    user,
                    AlertType.ADVISOR_INACTIVITY,
                    AlertSeverity.WARNING,
                    "Advisor inactivity",
                    "No confirmed sales were recorded during the most recent seven-day activity window.",
                    period
            );
        }
    }

    private void evaluateProductMix(UserAccount user, AnalyticsResult analytics, String period) {
        var products = analytics.productMix().stream()
                .filter(product -> product.transactions() > 0)
                .sorted(Comparator.comparing(ProductPerformance::sales))
                .toList();
        if (products.size() < 2) {
            return;
        }
        ProductPerformance weakest = products.getFirst();
        ProductPerformance strongest = products.getLast();
        if (strongest.sales().signum() > 0
                && weakest.sales().multiply(BigDecimal.valueOf(4)).compareTo(strongest.sales()) < 0) {
            emit(
                    user,
                    AlertType.PRODUCT_UNDERPERFORMANCE,
                    AlertSeverity.OPPORTUNITY,
                    "Product mix opportunity",
                    weakest.productName() + " has less than one quarter of the sales value of " + strongest.productName() + ".",
                    period + ":" + weakest.productId()
            );
        }
    }

    private void evaluateGamification(UserAccount user, GamificationProgress level) {
        if (level == null) {
            return;
        }
        if (level.currentLevel() != GamificationLevel.BRONZE) {
            emit(
                    user,
                    AlertType.LEVEL_REACHED,
                    AlertSeverity.INFO,
                    "Gamification level reached",
                    "Your lifetime earned points qualify for " + level.currentLevel().name() + ".",
                    level.currentLevel().name()
            );
        }
        if (level.nextLevel() != null && level.progressPercentage() >= CLOSE_TO_LEVEL_PROGRESS_PERCENTAGE) {
            AlertType type = level.nextLevel() == GamificationLevel.GOLD
                    ? AlertType.CLOSE_TO_GOLD
                    : AlertType.CLOSE_TO_NEXT_LEVEL;
            emit(
                    user,
                    type,
                    AlertSeverity.OPPORTUNITY,
                    "Close to " + level.nextLevel().name(),
                    "Lifetime earned points are at least 80 percent through the current level interval.",
                    level.nextLevel().name()
            );
        }
    }

    private void evaluateReward(UserAccount user, boolean rewardEligible, String period) {
        if (rewardEligible) {
            emit(
                    user,
                    AlertType.REWARD_ELIGIBLE,
                    AlertSeverity.OPPORTUNITY,
                    "Reward available",
                    "Your available points cover at least one active reward in stock.",
                    period
            );
        }
    }

    private void evaluateTeamOpportunity(UserAccount user, AnalyticsResult analytics, String period) {
        if (user.role() == UserRole.MANAGER
                && analytics.salesGrowthPercentage() != null
                && analytics.salesGrowthPercentage().compareTo(IMPROVEMENT_PERCENTAGE) >= 0) {
            emit(
                    user,
                    AlertType.TEAM_OPPORTUNITY,
                    AlertSeverity.OPPORTUNITY,
                    "Team growth opportunity",
                    "Sales grew by at least 20 percent. Review the product mix and top performers to identify repeatable practices.",
                    period
            );
        }
    }

    private void emit(
            UserAccount user,
            AlertType type,
            AlertSeverity severity,
            String title,
            String message,
            String key
    ) {
        alerts.create(new AlertStore.NewAlert(
                user.id(),
                user.dealershipId(),
                type,
                severity,
                title,
                message,
                "USER",
                user.id(),
                user.id() + ":" + type + ":" + key
        ));
    }
}
