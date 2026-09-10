package com.championsclub.sales.infrastructure;

import com.championsclub.sales.domain.SaleStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

interface JpaSaleRepository extends JpaRepository<SaleEntity, Long> {

    @Query("""
            select coalesce(sum(s.financedAmount), 0)
            from SaleEntity s
            where s.advisorId = :advisorId
            and s.status = :status
            and s.saleDate between :fromDate and :toDate
            """)
    BigDecimal sumRecordedSalesForAdvisor(
            @Param("advisorId") Long advisorId,
            @Param("status") SaleStatus status,
            @Param("fromDate") LocalDate fromDate,
            @Param("toDate") LocalDate toDate
    );

    @Query("""
            select coalesce(sum(s.financedAmount), 0)
            from SaleEntity s
            where s.dealershipId = :dealershipId
            and s.status = :status
            and s.saleDate between :fromDate and :toDate
            """)
    BigDecimal sumRecordedSalesForDealership(
            @Param("dealershipId") Long dealershipId,
            @Param("status") SaleStatus status,
            @Param("fromDate") LocalDate fromDate,
            @Param("toDate") LocalDate toDate
    );

    @Query("""
            select coalesce(sum(s.financedAmount), 0)
            from SaleEntity s
            where s.advisorId = :advisorId
            and s.status = :status
            and s.saleDate between :fromDate and :toDate
            group by year(s.saleDate), month(s.saleDate)
            order by year(s.saleDate), month(s.saleDate)
            """)
    List<BigDecimal> findMonthlySalesSeriesForAdvisor(
            @Param("advisorId") Long advisorId,
            @Param("status") SaleStatus status,
            @Param("fromDate") LocalDate fromDate,
            @Param("toDate") LocalDate toDate
    );
}

