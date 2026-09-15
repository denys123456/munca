package com.championsclub.admin.application;
import com.championsclub.admin.application.ConfigurationStore.*;
import com.championsclub.audit.application.AuditLog;
import com.championsclub.security.application.Access;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
@Service
public class ConfigurationCommands {
    private final ConfigurationStore store;
    private final Access access;
    private final AuditLog audit;
    public ConfigurationCommands(ConfigurationStore store, Access access, AuditLog audit) {
        this.store = store; this.access = access; this.audit = audit;
    }
    @Transactional
    public DealershipData dealership(Long id, DealershipData d) {
        access.admin();
        com.championsclub.users.domain.Dealership.builder().id(id).name(d.name()).city(d.city()).region(d.region()).build();
        var result = store.saveDealership(id, d);
        audit.record(access.current().id(), "DEALERSHIP_CHANGED", "DEALERSHIP", result.id());
        return result;
    }
    @Transactional
    public ProductData product(Long id, ProductData d) {
        access.admin();
        var result = store.saveProduct(id, d);
        audit.record(access.current().id(), "PRODUCT_CHANGED", "PRODUCT", result.id());
        return result;
    }
    @Transactional
    public RewardData reward(Long id, RewardData d) {
        access.admin();
        if (d.requiredPoints() <= 0 || d.stock() != null && d.stock() < 0) throw new IllegalArgumentException("Invalid reward cost or stock.");
        var result = store.saveReward(id, d);
        audit.record(access.current().id(), "REWARD_CHANGED", "REWARD", result.id());
        return result;
    }
    @Transactional
    public RuleData rule(Long id, RuleData d) {
        access.admin();
        if (!store.product(d.productId()).eligible()) throw new IllegalArgumentException("Point rules require an eligible product.");
        if (d.activeUntil().isBefore(d.activeFrom()) || d.pointsPerSale() <= 0 || d.minimumEligibleAmount().signum() < 0)
            throw new IllegalArgumentException("Invalid point rule period or award.");
        var result = store.saveRule(id, d);
        audit.record(access.current().id(), "POINT_RULE_CHANGED", "POINT_RULE", result.id());
        return result;
    }
    @Transactional
    public Thresholds thresholds(Thresholds d) {
        access.admin();
        var result = store.saveThresholds(d);
        audit.record(access.current().id(), "GAMIFICATION_CHANGED", "GAMIFICATION", 1);
        return result;
    }
}
