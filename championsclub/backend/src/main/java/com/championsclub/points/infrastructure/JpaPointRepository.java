package com.championsclub.points.infrastructure;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

interface JpaPointRepository extends JpaRepository<PointTransactionEntity, Long> {
    @Query("select coalesce(sum(p.amount), 0) from PointTransactionEntity p where p.advisorId=:advisorId")
    long balance(@Param("advisorId") Long advisorId);

    @Query(value = "select coalesce(sum(amount), 0) from point_transactions where advisor_id=:advisorId and type in ('SALE_EARNED','SALE_REVERSAL')", nativeQuery = true)
    long lifetimeEarned(@Param("advisorId") Long advisorId);
}
