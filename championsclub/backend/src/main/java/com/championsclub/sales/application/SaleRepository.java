package com.championsclub.sales.application;

import com.championsclub.sales.domain.Sale;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

public interface SaleRepository {

    Sale save(Sale sale);

    BigDecimal sumRecordedSalesForAdvisor(Long advisorId, LocalDate fromDate, LocalDate toDate);

    BigDecimal sumRecordedSalesForDealership(Long dealershipId, LocalDate fromDate, LocalDate toDate);

    List<BigDecimal> findMonthlySalesSeriesForAdvisor(Long advisorId, int months);
}

