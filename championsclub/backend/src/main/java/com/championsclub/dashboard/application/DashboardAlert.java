package com.championsclub.dashboard.application;

import com.championsclub.alerts.domain.AlertSeverity;
import com.championsclub.alerts.domain.AlertType;

public record DashboardAlert(
        AlertType type,
        AlertSeverity severity,
        String title,
        String message
) {
}

