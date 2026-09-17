package com.championsclub.alerts.application;
import com.championsclub.alerts.domain.*;
import java.time.Instant;
import org.springframework.data.domain.*;
public interface AlertStore {
    Page<AlertData> list(long recipientId, Pageable page);
    AlertData get(long id);
    AlertData read(long id);
    AlertData resolve(long id);
    void create(NewAlert alert);
    record NewAlert(long recipientId, long dealershipId, AlertType type, AlertSeverity severity, String title,
                    String message, String relatedEntityType, long relatedEntityId, String deduplicationKey) {}
    record AlertData(long id, long recipientId, long dealershipId, AlertType type, AlertSeverity severity, String title,
                     String message, String relatedEntityType, Long relatedEntityId, Instant createdAt, Instant readAt, Instant resolvedAt) {}
}
