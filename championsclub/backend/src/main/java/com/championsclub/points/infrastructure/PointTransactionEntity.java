package com.championsclub.points.infrastructure;
import com.championsclub.points.domain.PointTransactionType;
import jakarta.persistence.*;
import java.time.Instant;
@Entity
@Table(name="point_transactions")
class PointTransactionEntity {
    @Id @GeneratedValue(strategy=GenerationType.IDENTITY)
    Long id;
    Long advisorId;
    @Enumerated(EnumType.STRING)
    PointTransactionType type;
    int amount;
    long sourceId;
    String description;
    Instant createdAt;
    protected PointTransactionEntity() {}
    PointTransactionEntity(Long advisorId, PointTransactionType type, int amount, long sourceId, String description) {
        this.advisorId=advisorId; this.type=type; this.amount=amount; this.sourceId=sourceId;
        this.description=description; this.createdAt=Instant.now();
    }
}
