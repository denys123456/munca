package com.championsclub.sales.infrastructure;

import com.championsclub.sales.application.SaleRepository;
import com.championsclub.sales.domain.Sale;
import com.championsclub.sales.domain.SaleStatus;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Repository
class SalePersistenceAdapter implements SaleRepository {

    private final JpaSaleRepository jpaSaleRepository;

    SalePersistenceAdapter(JpaSaleRepository jpaSaleRepository) {
        this.jpaSaleRepository = jpaSaleRepository;
    }

    @Override
    public Sale save(Sale sale) {
        return jpaSaleRepository.save(SaleEntity.fromDomain(sale)).toDomain();
    }

    @Override
    public BigDecimal sumRecordedSalesForAdvisor(Long advisorId, LocalDate fromDate, LocalDate toDate) {
        return jpaSaleRepository.sumRecordedSalesForAdvisor(advisorId, SaleStatus.RECORDED, fromDate, toDate);
    }

    @Override
    public BigDecimal sumRecordedSalesForDealership(Long dealershipId, LocalDate fromDate, LocalDate toDate) {
        return jpaSaleRepository.sumRecordedSalesForDealership(dealershipId, SaleStatus.RECORDED, fromDate, toDate);
    }

    @Override
    public List<BigDecimal> findMonthlySalesSeriesForAdvisor(Long advisorId, int months) {
        LocalDate toDate = LocalDate.now();
        LocalDate fromDate = toDate.minusMonths(months - 1).withDayOfMonth(1);
        return jpaSaleRepository.findMonthlySalesSeriesForAdvisor(advisorId, SaleStatus.RECORDED, fromDate, toDate);
    }
}

