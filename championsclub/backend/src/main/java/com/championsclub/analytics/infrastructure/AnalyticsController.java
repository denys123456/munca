package com.championsclub.analytics.infrastructure;

import com.championsclub.analytics.application.AdvisorRanking;
import com.championsclub.analytics.application.AnalyticsResult;
import com.championsclub.analytics.application.AnalyticsService;
import com.championsclub.analytics.application.ForecastService;
import com.championsclub.analytics.application.LeaderboardService;
import com.championsclub.analytics.application.SalesForecast;
import com.championsclub.analytics.application.TeamAnalyticsRepository;
import com.championsclub.common.application.CachedGeneration;
import com.championsclub.common.application.Pages;
import com.championsclub.targets.application.TargetStore.OwnerType;
import com.championsclub.users.domain.AdvisorType;
import java.time.LocalDate;
import org.springframework.data.domain.Page;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
class AnalyticsController {
    private final AnalyticsService analytics;
    private final LeaderboardService leaderboards;
    private final ForecastService forecasts;

    AnalyticsController(
            AnalyticsService analytics,
            LeaderboardService leaderboards,
            ForecastService forecasts
    ) {
        this.analytics = analytics;
        this.leaderboards = leaderboards;
        this.forecasts = forecasts;
    }

    @GetMapping("/api/analytics")
    AnalyticsResult analytics(
            @RequestParam long subjectId,
            @RequestParam OwnerType subjectType,
            @RequestParam LocalDate start,
            @RequestParam LocalDate end
    ) {
        return analytics.query(subjectId, subjectType, start, end);
    }

    @GetMapping("/api/analytics/team-statistics")
    TeamAnalyticsRepository.TeamStatistics teamStatistics(
            @RequestParam long dealershipId,
            @RequestParam LocalDate start,
            @RequestParam LocalDate end
    ) {
        return leaderboards.teamStatistics(dealershipId, start, end);
    }

    @GetMapping("/api/leaderboard")
    Page<AdvisorRanking> leaderboard(
            @RequestParam long dealershipId,
            @RequestParam LocalDate start,
            @RequestParam LocalDate end,
            @RequestParam(required = false) AdvisorType advisorType,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        return leaderboards.leaderboard(dealershipId, start, end, advisorType, Pages.of(page, size));
    }

    @GetMapping("/api/forecasts")
    CachedGeneration.Generated<SalesForecast> forecast(
            @RequestParam long subjectId,
            @RequestParam OwnerType subjectType
    ) {
        return forecasts.query(subjectId, subjectType, false);
    }

    @PostMapping("/api/forecasts/refresh")
    CachedGeneration.Generated<SalesForecast> refresh(
            @RequestParam long subjectId,
            @RequestParam OwnerType subjectType
    ) {
        return forecasts.query(subjectId, subjectType, true);
    }
}
