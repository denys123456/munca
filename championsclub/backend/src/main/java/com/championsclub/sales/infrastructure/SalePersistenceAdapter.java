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
    public java.util.Optional<Sale> find(long id) { return jpaSaleRepository.findById(id).map(SaleEntity::toDomain); }
    public java.util.Optional<Sale> lock(long id) { return jpaSaleRepository.lock(id).map(SaleEntity::toDomain); }
    public boolean existsExternalReference(String reference) { return jpaSaleRepository.existsByExternalReference(reference); }
    public org.springframework.data.domain.Page<com.championsclub.sales.application.SaleResponse> history(
            SaleRepository.SalesFilter filter, org.springframework.data.domain.Pageable page) {
        return jpaSaleRepository.findAll((root, query, builder) -> {
            var predicates = new java.util.ArrayList<jakarta.persistence.criteria.Predicate>();
            if (filter.advisorId() != null) predicates.add(builder.equal(root.get("advisorId"), filter.advisorId()));
            if (filter.dealershipId() != null) predicates.add(builder.equal(root.get("dealershipId"), filter.dealershipId()));
            if (filter.productId() != null) predicates.add(builder.equal(root.get("productId"), filter.productId()));
            if (filter.status() != null) predicates.add(builder.equal(root.get("status"), filter.status()));
            if (filter.from() != null) predicates.add(builder.greaterThanOrEqualTo(root.get("saleDate"), filter.from()));
            if (filter.to() != null) predicates.add(builder.lessThanOrEqualTo(root.get("saleDate"), filter.to()));
            return builder.and(predicates.toArray(jakarta.persistence.criteria.Predicate[]::new));
        }, page).map(entity -> com.championsclub.sales.application.SaleResponse.from(entity.toDomain()));
    }

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
