package com.championsclub.admin.infrastructure;
import com.championsclub.admin.application.ConfigurationStore;
import com.championsclub.common.application.ResourceNotFoundException;
import java.math.BigDecimal;
import java.time.LocalDate;
import org.springframework.data.domain.*;
import org.springframework.jdbc.core.*;
import org.springframework.stereotype.Repository;
@Repository
class JdbcConfigurationStore implements ConfigurationStore {
    private final JdbcTemplate database;
    private final com.championsclub.sales.application.FinancialProductRepository products;
    private final com.championsclub.rewards.application.RewardRepository rewards;
    private final RowMapper<DealershipData> dealershipMapper = (r, n) -> new DealershipData(r.getLong("id"), r.getString("name"),
            r.getString("code"), r.getString("city"), r.getString("region"), r.getBoolean("active"));
    private final RowMapper<ProductData> productMapper = (r, n) -> new ProductData(r.getLong("id"), r.getString("name"),
            r.getString("code"), r.getString("description"), r.getBoolean("eligible"), r.getBoolean("active"));
    private final RowMapper<RewardData> rewardMapper = (r, n) -> new RewardData(r.getLong("id"), r.getString("name"),
            r.getString("category"), r.getString("description"), r.getInt("required_points"), (Integer) r.getObject("stock"),
            r.getString("image_reference"), "ACTIVE".equals(r.getString("status")));
    private final RowMapper<RuleData> ruleMapper = (r, n) -> new RuleData(r.getLong("id"), r.getLong("product_id"),
            r.getInt("points_per_sale"), r.getBigDecimal("minimum_eligible_amount"), r.getDate("active_from").toLocalDate(),
            r.getDate("active_until").toLocalDate(), r.getBoolean("active"));
    JdbcConfigurationStore(JdbcTemplate database,com.championsclub.sales.application.FinancialProductRepository products,
                           com.championsclub.rewards.application.RewardRepository rewards) {
        this.database = database; this.products=products; this.rewards=rewards;
    }
    public DealershipData dealership(long id) { return one("select * from dealerships where id = ?", dealershipMapper, id); }
    public ProductData product(long id) {
        return products.findById(id).map(ProductData::from)
                .orElseThrow(() -> new ResourceNotFoundException("PRODUCT_NOT_FOUND","Financial product not found."));
    }
    public RewardData reward(long id, boolean lock) {
        return (lock ? rewards.lock(id) : rewards.findById(id)).map(RewardData::from)
                .orElseThrow(() -> new ResourceNotFoundException("REWARD_NOT_FOUND","Reward not found."));
    }
    public RuleData rule(long id) { return one("select * from point_rules where id = ?", ruleMapper, id); }
    public Page<DealershipData> dealerships(String search, Pageable page) { return page("dealerships", search, page, dealershipMapper); }
    public Page<ProductData> products(String search, Pageable page) { return products.search(search,page).map(ProductData::from); }
    public Page<RewardData> rewards(String search, Pageable page) { return rewards.search(search,page).map(RewardData::from); }
    public Page<RuleData> rules(Pageable page) {
        return new PageImpl<>(database.query("select * from point_rules order by id desc limit ? offset ?", ruleMapper,
                page.getPageSize(), page.getOffset()), page, database.queryForObject("select count(*) from point_rules", Long.class));
    }
    public DealershipData saveDealership(Long id, DealershipData d) {
        if (id == null) id = database.queryForObject("""
                insert into dealerships(name, code, city, region, active) values(?, ?, ?, ?, ?) returning id
                """, Long.class, d.name(), d.code(), d.city(), d.region(), d.active());
        else { dealership(id); database.update("update dealerships set name=?, code=?, city=?, region=?, active=?, updated_at=now() where id=?",
                d.name(), d.code(), d.city(), d.region(), d.active(), id); }
        return dealership(id);
    }
    public ProductData saveProduct(Long id, ProductData d) {
        if (id != null) product(id);
        var product=new ProductData(id,d.name(),d.code(),d.description(),d.eligible(),d.active()).toDomain();
        return ProductData.from(products.save(product));
    }
    public RewardData saveReward(Long id, RewardData d) {
        if (id != null) reward(id,true);
        var reward=new RewardData(id,d.name(),d.category(),d.description(),d.requiredPoints(),d.stock(),d.imageReference(),d.active()).toDomain();
        return RewardData.from(rewards.save(reward));
    }
    public RuleData saveRule(Long id, RuleData d) {
        if (id == null) id = database.queryForObject("""
                insert into point_rules(product_id, points_per_sale, minimum_eligible_amount, active_from, active_until, active)
                values(?, ?, ?, ?, ?, ?) returning id
                """, Long.class, d.productId(), d.pointsPerSale(), d.minimumEligibleAmount(), d.activeFrom(), d.activeUntil(), d.active());
        else { rule(id); database.update("""
                update point_rules set product_id=?, points_per_sale=?, minimum_eligible_amount=?, active_from=?,
                active_until=?, active=?, updated_at=now() where id=?
                """, d.productId(), d.pointsPerSale(), d.minimumEligibleAmount(), d.activeFrom(), d.activeUntil(), d.active(), id); }
        return rule(id);
    }
    public java.util.Optional<RuleData> activeRule(long productId, LocalDate date) {
        return database.query("""
                select * from point_rules where product_id=? and active and ? between active_from and active_until
                """, ruleMapper, productId, date).stream().findFirst();
    }
    public Thresholds thresholds() {
        return database.queryForObject("select * from gamification_configuration where id=1",
                (r, n) -> new Thresholds(r.getInt("bronze"), r.getInt("silver"), r.getInt("gold")));
    }
    public RewardSummary rewardSummary(int balance) {
        return database.queryForObject("""
                select count(*),count(*) filter(where required_points<=?),min(required_points-?) filter(where required_points>?)
                from rewards where status='ACTIVE' and (stock is null or stock>0)
                """,(r,n) -> new RewardSummary(r.getLong(1),r.getLong(2),(Integer)r.getObject(3)),balance,balance,balance);
    }
    public Thresholds saveThresholds(Thresholds d) {
        database.update("update gamification_configuration set bronze=?, silver=?, gold=?, updated_at=now() where id=1",
                d.bronze(), d.silver(), d.gold());
        return thresholds();
    }
    private <T> T one(String sql, RowMapper<T> mapper, long id) {
        return database.query(sql, mapper, id).stream().findFirst()
                .orElseThrow(() -> new ResourceNotFoundException("RESOURCE_NOT_FOUND", "The requested configuration could not be found."));
    }
    private <T> Page<T> page(String table, String search, Pageable page, RowMapper<T> mapper) {
        String predicate = " where position(lower(?) in lower(name)) > 0";
        return new PageImpl<>(database.query("select * from " + table + predicate + " order by id desc limit ? offset ?",
                mapper, search, page.getPageSize(), page.getOffset()), page,
                database.queryForObject("select count(*) from " + table + predicate, Long.class, search));
    }
}
