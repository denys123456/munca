package com.championsclub.points.infrastructure;
import org.springframework.data.jpa.repository.*;
interface JpaPointRepository extends JpaRepository<PointTransactionEntity, Long> {
    @Query("select coalesce(sum(p.amount), 0) from PointTransactionEntity p where p.advisorId = :advisorId")
    long balance(Long advisorId);
}
