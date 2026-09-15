package com.championsclub.audit.application;
public interface AuditLog {
    long record(Long actorId, String action, String entityType, long entityId);
}
