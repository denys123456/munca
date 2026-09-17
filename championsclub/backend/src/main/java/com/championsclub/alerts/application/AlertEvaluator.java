package com.championsclub.alerts.application;
import com.championsclub.alerts.domain.*;
import com.championsclub.analytics.application.*;
import com.championsclub.gamification.domain.*;
import com.championsclub.targets.application.TargetService;
import com.championsclub.targets.domain.TargetProgress;
import com.championsclub.users.application.UserAccount;
import java.math.BigDecimal;
import java.time.LocalDate;
import org.springframework.stereotype.Service;
@Service
public class AlertEvaluator {
    private final AlertStore alerts;
    public AlertEvaluator(AlertStore alerts) { this.alerts=alerts; }
    public void evaluate(UserAccount user, TargetService.TargetSnapshot target, AnalyticsService.AnalyticsResult analytics,
                         SalesForecast forecast, GamificationProgress level, boolean rewardEligible) {
        String period=target.periodStart().toString();
        if (target.progress().status() == TargetProgress.Status.AT_RISK)
            emit(user,AlertType.TARGET_RISK,AlertSeverity.WARNING,"Target pace at risk","Sales are below the expected pace for this target period.",period);
        if (target.progress().status() == TargetProgress.Status.ACHIEVED)
            emit(user,AlertType.TARGET_ACHIEVED,AlertSeverity.INFO,"Target achieved","Confirmed sales have reached the target.",period);
        if (analytics.growthPercentage() != null && analytics.growthPercentage().compareTo(BigDecimal.valueOf(-30)) <= 0)
            emit(user,AlertType.SALES_DECLINE,AlertSeverity.WARNING,"Sales declined","Sales are at least 30 percent below the preceding equal-length period.",period);
        if (forecast != null && target.progress().targetAmount().signum() > 0
                && forecast.predictedEndValue().compareTo(target.progress().targetAmount()) < 0)
            emit(user,AlertType.FORECAST_BELOW_TARGET,AlertSeverity.WARNING,"Forecast below target","The statistical forecast is below the configured target.",period);
        if (forecast != null && !forecast.anomalies().isEmpty())
            emit(user,AlertType.ML_ANOMALY,AlertSeverity.WARNING,"Unusual sales activity","Recent daily sales differ substantially from comparable weekdays.",
                    forecast.anomalies().getLast().date().toString());
        if (level != null && level.currentLevel() != GamificationLevel.BRONZE)
            emit(user,AlertType.LEVEL_REACHED,AlertSeverity.INFO,"Gamification level reached",
                    "Your current points qualify for " + level.currentLevel().name() + ".",level.currentLevel().name());
        if (rewardEligible) emit(user,AlertType.REWARD_ELIGIBLE,AlertSeverity.OPPORTUNITY,"Reward available",
                "Your available points cover at least one active reward in stock.",period);
        if (user.role() == com.championsclub.users.domain.UserRole.MANAGER && analytics.growthPercentage() != null
                && analytics.growthPercentage().compareTo(BigDecimal.valueOf(20)) >= 0)
            emit(user,AlertType.TEAM_OPPORTUNITY,AlertSeverity.OPPORTUNITY,"Team growth opportunity",
                    "Sales grew by at least 20 percent. Review the product mix and top performers to identify repeatable practices.",period);
    }
    private void emit(UserAccount user,AlertType type,AlertSeverity severity,String title,String message,String key) {
        alerts.create(new AlertStore.NewAlert(user.id(),user.dealershipId(),type,severity,title,message,"USER",user.id(),
                user.id()+":"+type+":"+key));
    }
}
