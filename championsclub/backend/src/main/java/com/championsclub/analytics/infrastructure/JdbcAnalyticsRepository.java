package com.championsclub.analytics.infrastructure;

import com.championsclub.analytics.application.AnalyticsRepository;
import com.championsclub.analytics.application.MlForecastClient;
import com.championsclub.sales.domain.ProductCategory;
import com.championsclub.targets.application.TargetStore.OwnerType;
import java.time.LocalDate;
import java.util.List;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

@Repository
class JdbcAnalyticsRepository implements AnalyticsRepository {
    private static final String RECORDED = "RECORDED";
    private static final String CANCELLED = "CANCELLED";
    private final JdbcTemplate database;

    JdbcAnalyticsRepository(JdbcTemplate database) {
        this.database = database;
    }

    @Override
    public List<MlForecastClient.DailySale> daily(long id, OwnerType type, LocalDate start, LocalDate end) {
        String ownerColumn = ownerColumn(type);
        return database.query(
                "select day::date, coalesce(sum(s.contract_amount), 0) amount "
                        + "from generate_series(?::date, ?::date, interval '1 day') day "
                        + "left join sales s on s.sale_date=day::date and s.status=? and s." + ownerColumn + "=? "
                        + "group by day order by day",
                (result, row) -> new MlForecastClient.DailySale(
                        result.getDate(1).toLocalDate(),
                        result.getBigDecimal(2)
                ),
                start,
                end,
                RECORDED,
                id
        );
    }

    @Override
    public PeriodSummary periodSummary(long id, OwnerType type, LocalDate start, LocalDate end) {
        String ownerColumn = ownerColumn(type);
        return database.queryForObject(
                "select "
                        + "coalesce(sum(contract_amount) filter(where status=?),0) sales, "
                        + "count(*) filter(where status=?) recorded_contracts, "
                        + "count(*) filter(where status=?) cancelled_contracts, "
                        + "coalesce(avg(contract_amount) filter(where status=?),0) average_contract_amount "
                        + "from sales where " + ownerColumn + "=? and sale_date between ? and ?",
                (result, row) -> new PeriodSummary(
                        result.getBigDecimal("sales"),
                        result.getLong("recorded_contracts"),
                        result.getLong("cancelled_contracts"),
                        result.getBigDecimal("average_contract_amount")
                ),
                RECORDED,
                RECORDED,
                CANCELLED,
                RECORDED,
                id,
                start,
                end
        );
    }

    @Override
    public List<ProductMix> productMix(long id, OwnerType type, LocalDate start, LocalDate end) {
        String ownerColumn = ownerColumn(type);
        return database.query(
                "select p.id, p.code, p.name, p.category, sum(s.contract_amount) amount, count(*) transactions "
                        + "from sales s join financial_products p on p.id=s.product_id "
                        + "where s.status=? and s.sale_date between ? and ? and s." + ownerColumn + "=? "
                        + "group by p.id, p.code, p.name, p.category order by amount desc, p.id",
                (result, row) -> new ProductMix(
                        result.getLong("id"),
                        result.getString("code"),
                        result.getString("name"),
                        ProductCategory.valueOf(result.getString("category")),
                        result.getBigDecimal("amount"),
                        result.getLong("transactions")
                ),
                RECORDED,
                start,
                end,
                id
        );
    }

    @Override
    public List<DimensionMix> productCategoryMix(long id, OwnerType type, LocalDate start, LocalDate end) {
        String ownerColumn = ownerColumn(type);
        return database.query(
                "select p.category value, sum(s.contract_amount) sales, count(*) transactions "
                        + "from sales s join financial_products p on p.id=s.product_id "
                        + "where s.status=? and s.sale_date between ? and ? and s." + ownerColumn + "=? "
                        + "group by p.category order by transactions desc, value",
                this::mapDimension,
                RECORDED,
                start,
                end,
                id
        );
    }

    @Override
    public List<DimensionMix> powertrainMix(long id, OwnerType type, LocalDate start, LocalDate end) {
        return dimensionMix(id, type, start, end, "vehicle_powertrain");
    }

    @Override
    public List<DimensionMix> vehicleConditionMix(long id, OwnerType type, LocalDate start, LocalDate end) {
        return dimensionMix(id, type, start, end, "vehicle_condition");
    }

    @Override
    public List<DimensionMix> customerSegmentMix(long id, OwnerType type, LocalDate start, LocalDate end) {
        return dimensionMix(id, type, start, end, "customer_segment");
    }

    private List<DimensionMix> dimensionMix(
            long id,
            OwnerType type,
            LocalDate start,
            LocalDate end,
            String column
    ) {
        String ownerColumn = ownerColumn(type);
        String value = "coalesce(" + column + ", 'UNKNOWN')";
        return database.query(
                "select " + value + " value, sum(contract_amount) sales, count(*) transactions "
                        + "from sales where status=? and sale_date between ? and ? and " + ownerColumn + "=? "
                        + "group by " + value + " order by transactions desc, value",
                this::mapDimension,
                RECORDED,
                start,
                end,
                id
        );
    }

    private DimensionMix mapDimension(java.sql.ResultSet result, int row) throws java.sql.SQLException {
        return new DimensionMix(
                result.getString("value"),
                result.getBigDecimal("sales"),
                result.getLong("transactions")
        );
    }

    private String ownerColumn(OwnerType type) {
        return type == OwnerType.ADVISOR ? "advisor_id" : "dealership_id";
    }
}
