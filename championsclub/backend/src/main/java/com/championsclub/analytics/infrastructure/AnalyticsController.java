package com.championsclub.analytics.infrastructure;
import com.championsclub.analytics.application.*;
import com.championsclub.common.application.*;
import com.championsclub.targets.application.TargetStore.OwnerType;
import java.time.LocalDate;
import org.springframework.data.domain.Page;
import org.springframework.web.bind.annotation.*;
@RestController
class AnalyticsController {
    private final AnalyticsService analytics;
    private final ForecastService forecasts;
    AnalyticsController(AnalyticsService analytics, ForecastService forecasts) { this.analytics=analytics; this.forecasts=forecasts; }
    @GetMapping("/api/analytics")
    AnalyticsService.AnalyticsResult analytics(@RequestParam long subjectId, @RequestParam OwnerType subjectType,
                                               @RequestParam LocalDate start, @RequestParam LocalDate end) {
        return analytics.query(subjectId,subjectType,start,end);
    }
    @GetMapping("/api/leaderboard")
    Page<AnalyticsService.Ranking> leaderboard(@RequestParam long dealershipId, @RequestParam LocalDate start, @RequestParam LocalDate end,
                                               @RequestParam(defaultValue="0") int page, @RequestParam(defaultValue="20") int size) {
        return analytics.leaderboard(dealershipId,start,end,Pages.of(page,size));
    }
    @GetMapping("/api/forecasts")
    CachedGeneration.Generated<SalesForecast> forecast(@RequestParam long subjectId, @RequestParam OwnerType subjectType) {
        return forecasts.query(subjectId,subjectType,false);
    }
    @PostMapping("/api/forecasts/refresh")
    CachedGeneration.Generated<SalesForecast> refresh(@RequestParam long subjectId, @RequestParam OwnerType subjectType) {
        return forecasts.query(subjectId,subjectType,true);
    }
}
