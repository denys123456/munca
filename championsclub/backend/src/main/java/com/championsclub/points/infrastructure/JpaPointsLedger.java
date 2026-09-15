package com.championsclub.points.infrastructure;
import com.championsclub.rewards.application.PointsLedger;
import com.championsclub.points.domain.PointTransactionType;
import org.springframework.stereotype.Repository;
@Repository
class JpaPointsLedger implements PointsLedger {
    private final JpaPointRepository repository;
    JpaPointsLedger(JpaPointRepository repository) { this.repository=repository; }
    public int calculateAvailablePoints(Long advisorId) { return Math.toIntExact(repository.balance(advisorId)); }
    public void append(Long advisorId, PointTransactionType type, int amount, long sourceId, String description) {
        if (amount != 0) repository.saveAndFlush(new PointTransactionEntity(advisorId, type, amount, sourceId, description));
    }
}
