package com.championsclub.alerts.domain;

import java.time.Instant;

public record Alert(
        Long id,
        Long recipientId,
        Long dealershipId,
        AlertType type,
        AlertSeverity severity,
        String title,
        String message,
        boolean isRead,
        Instant createdAt
) {
    public Alert {
        if (recipientId == null || dealershipId == null || type == null || severity == null) {
            throw new IllegalArgumentException("Alert identifiers and types must be provided.");
        }
        if (title == null || title.isBlank() || message == null || message.isBlank()) {
            throw new IllegalArgumentException("Alert text must be provided.");
        }
        createdAt = createdAt == null ? Instant.now() : createdAt;
    }
}

