package com.championsclub.alerts.application;
import com.championsclub.security.application.Access;
import com.championsclub.users.domain.UserRole;
import org.springframework.data.domain.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
@Service
public class AlertService {
    private final AlertStore alerts;
    private final Access access;
    public AlertService(AlertStore alerts,Access access) { this.alerts=alerts; this.access=access; }
    public Page<AlertStore.AlertData> list(Long recipientId,Pageable page) {
        long id=recipientId == null ? access.current().id() : recipientId;
        if (id != access.current().id()) access.advisor(id);
        return alerts.list(id,page);
    }
    @Transactional
    public AlertStore.AlertData read(long id) {
        var alert=alerts.get(id);
        access.self(alert.recipientId());
        return alerts.read(id);
    }
    @Transactional
    public AlertStore.AlertData resolve(long id) {
        var alert=alerts.get(id);
        access.dealership(alert.dealershipId());
        return alerts.resolve(id);
    }
}
