package com.championsclub.dashboard.application;
import com.championsclub.admin.application.ConfigurationStore;
import com.championsclub.ai.application.InsightService;
import com.championsclub.alerts.application.AlertStore;
import com.championsclub.analytics.application.*;
import com.championsclub.common.application.Pages;
import com.championsclub.sales.application.SaleRepository;
import com.championsclub.targets.domain.TargetProgress;
import com.championsclub.users.application.UserAccount;
import java.time.LocalDate;
import java.util.Map;
import org.springframework.stereotype.Service;
import static com.championsclub.targets.application.TargetStore.OwnerType;
@Service
public class DashboardAssembler {
    private final PerformanceFactsService performance;
    private final ConfigurationStore configuration;
    private final AnalyticsService analytics;
    private final AnalyticsRepository analyticsRepository;
    private final InsightService insights;
    private final AlertStore alerts;
    private final SaleRepository sales;
    public DashboardAssembler(PerformanceFactsService performance,ConfigurationStore configuration,AnalyticsService analytics,
                              AnalyticsRepository analyticsRepository,InsightService insights,AlertStore alerts,SaleRepository sales) {
        this.performance=performance; this.configuration=configuration; this.analytics=analytics;
        this.analyticsRepository=analyticsRepository; this.insights=insights; this.alerts=alerts; this.sales=sales;
    }
    public AdvisorDashboard advisor(UserAccount user) {
        var facts=performance.calculate(user.id(),OwnerType.ADVISOR);
        var recentAlerts=alerts.list(user.id(),Pages.of(0,5)).getContent();
        var insight=insights.generate(user.id(),"SALES_ADVISOR",Map.of("advisorName",user.displayName(),
                "performance",stableFacts(facts),"alerts",recentAlerts));
        var recentSales=sales.history(new SaleRepository.SalesFilter(user.id(),null,null,null,null,null),Pages.of(0,5)).getContent();
        var target=facts.target();
        return new AdvisorDashboard(user,configuration.dealership(user.dealershipId()),facts,insight,recentAlerts,recentSales,
                configuration.rewardSummary(facts.availablePoints()),
                analytics.ranking(user.dealershipId(),target.periodStart(),target.periodEnd(),Pages.of(0,5)).getContent());
    }
    public ManagerDashboard manager(UserAccount user) {
        var facts=performance.calculate(user.dealershipId(),OwnerType.DEALERSHIP);
        var target=facts.target();
        var ranking=analytics.ranking(user.dealershipId(),target.periodStart(),target.periodEnd(),Pages.of(0,5)).getContent();
        var atRisk=analyticsRepository.team(user.dealershipId(),target.periodStart(),target.periodEnd(),Pages.of(0,10),true).stream()
                .filter(a -> TargetProgress.calculate(a.target(),a.sales(),target.periodStart(),target.periodEnd(),LocalDate.now())
                        .status() == TargetProgress.Status.AT_RISK).toList();
        var recentAlerts=alerts.list(user.id(),Pages.of(0,10)).getContent();
        var opportunities=recentAlerts.stream().filter(a -> a.severity() == com.championsclub.alerts.domain.AlertSeverity.OPPORTUNITY).toList();
        var insight=insights.generate(user.id(),"MANAGER",Map.of("managerName",user.displayName(),"performance",stableFacts(facts),
                "topPerformers",ranking,"atRiskAdvisors",atRisk,"alerts",recentAlerts));
        var activity=sales.history(new SaleRepository.SalesFilter(null,user.dealershipId(),null,null,null,null),Pages.of(0,5)).getContent();
        return new ManagerDashboard(user,configuration.dealership(user.dealershipId()),facts,insight,ranking,atRisk,recentAlerts,activity,opportunities);
    }
    private Object stableFacts(PerformanceFactsService.PerformanceFacts facts) {
        var result=new java.util.LinkedHashMap<String,Object>();
        result.put("target",facts.target());
        result.put("analytics",facts.analytics());
        result.put("forecastState",facts.forecast().state());
        result.put("forecast",facts.forecast().result());
        result.put("availablePoints",facts.availablePoints());
        result.put("gamification",facts.gamification());
        return result;
    }
}
