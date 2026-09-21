package com.championsclub.points.application;

import com.championsclub.points.domain.PointRule;
import java.time.LocalDate;
import java.util.Optional;

public interface PointRuleRepository {
    Optional<PointRule> activeRule(long productId, LocalDate date);
    void save(long productId, PointRule rule);
}
