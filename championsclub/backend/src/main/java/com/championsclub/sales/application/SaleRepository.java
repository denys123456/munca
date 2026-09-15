package com.championsclub.sales.application;

import com.championsclub.sales.domain.Sale;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

public interface SaleRepository {

    Sale save(Sale sale);
    java.util.Optional<Sale> find(long id);
    java.util.Optional<Sale> lock(long id);
    boolean existsExternalReference(String reference);
    org.springframework.data.domain.Page<SaleResponse> history(SalesFilter filter, org.springframework.data.domain.Pageable page);
    record SalesFilter(Long advisorId, Long dealershipId, Long productId, com.championsclub.sales.domain.SaleStatus status,
                       LocalDate from, LocalDate to) {}

    BigDecimal sumRecordedSalesForAdvisor(Long advisorId, LocalDate fromDate, LocalDate toDate);

    BigDecimal sumRecordedSalesForDealership(Long dealershipId, LocalDate fromDate, LocalDate toDate);

    List<BigDecimal> findMonthlySalesSeriesForAdvisor(Long advisorId, int months);
}
