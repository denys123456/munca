package com.championsclub.demo.infrastructure;

import com.championsclub.dealerships.application.DealershipRepository;
import com.championsclub.dealerships.domain.Dealership;
import com.championsclub.points.application.PointRuleRepository;
import com.championsclub.points.domain.PointRule;
import com.championsclub.points.domain.PointTransactionType;
import com.championsclub.rewards.application.PointsLedger;
import com.championsclub.rewards.application.RewardRepository;
import com.championsclub.rewards.domain.Reward;
import com.championsclub.sales.application.FinancialProductRepository;
import com.championsclub.sales.application.SaleRepository;
import com.championsclub.sales.domain.FinancialProduct;
import com.championsclub.sales.domain.ProductAdvisorScope;
import com.championsclub.sales.domain.ProductCategory;
import com.championsclub.sales.domain.Sale;
import com.championsclub.targets.application.TargetStore;
import com.championsclub.users.application.UserAccount;
import com.championsclub.users.application.UserStore;
import com.championsclub.users.domain.AdvisorType;
import com.championsclub.users.domain.UserRole;
import java.math.BigDecimal;
import java.time.DayOfWeek;
import java.time.LocalDate;
import java.util.List;
import java.util.Locale;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
@ConditionalOnProperty(name = "championsclub.demo.enabled", havingValue = "true")
class DemoDataSeeder implements ApplicationRunner {
    private final UserStore users;
    private final DealershipRepository dealerships;
    private final FinancialProductRepository products;
    private final PointRuleRepository pointRules;
    private final RewardRepository rewards;
    private final SaleRepository sales;
    private final PointsLedger points;
    private final TargetStore targets;
    private final JdbcTemplate database;
    private final PasswordEncoder encoder;
    private final String password;

    DemoDataSeeder(
            UserStore users,
            DealershipRepository dealerships,
            FinancialProductRepository products,
            PointRuleRepository pointRules,
            RewardRepository rewards,
            SaleRepository sales,
            PointsLedger points,
            TargetStore targets,
            JdbcTemplate database,
            PasswordEncoder encoder,
            @Value("${championsclub.demo.password}") String password
    ) {
        this.users = users;
        this.dealerships = dealerships;
        this.products = products;
        this.pointRules = pointRules;
        this.rewards = rewards;
        this.sales = sales;
        this.points = points;
        this.targets = targets;
        this.database = database;
        this.encoder = encoder;
        this.password = password;
    }

    @Override
    @Transactional
    public void run(ApplicationArguments arguments) {
        database.execute("select pg_advisory_xact_lock(724315)");
        if (database.queryForObject("select count(*) from users", Long.class) > 0) {
            return;
        }
        int bytes = password.getBytes(java.nio.charset.StandardCharsets.UTF_8).length;
        if (bytes < 12 || bytes > 72) {
            throw new IllegalStateException("Demo password must contain between 12 and 72 UTF-8 bytes.");
        }
        String passwordHash = encoder.encode(password);
        var north = dealership("Apex North Motors", "NORTH", "Cluj-Napoca", "North West");
        var south = dealership("Apex Mobility Center", "SOUTH", "Bucharest", "South");
        var west = dealership("Apex Financial Hub West", "WEST", "Timisoara", "West");

        var northManager = account("Alex", "Smith", UserRole.MANAGER, null, north.id(), passwordHash);
        var southManager = account("Jordan", "Brown", UserRole.MANAGER, null, south.id(), passwordHash);
        var westManager = account("Taylor", "Wilson", UserRole.MANAGER, null, west.id(), passwordHash);
        var jane = account("Jane", "Doe", UserRole.ADVISOR, AdvisorType.SALES, north.id(), passwordHash);
        var john = account("John", "Doe", UserRole.ADVISOR, AdvisorType.SERVICE, north.id(), passwordHash);
        var emma = account("Emma", "Taylor", UserRole.ADVISOR, AdvisorType.SALES, north.id(), passwordHash);
        var morgan = account("Morgan", "Lee", UserRole.ADVISOR, AdvisorType.SERVICE, south.id(), passwordHash);
        var casey = account("Casey", "Miller", UserRole.ADVISOR, AdvisorType.SALES, west.id(), passwordHash);

        var financing = product("Classic Financing", "FINANCE", "Eligible vehicle financing", ProductCategory.FINANCING, ProductAdvisorScope.SALES);
        var leasing = product("Leasing Plus", "LEASE", "Eligible leasing agreements", ProductCategory.LEASING, ProductAdvisorScope.SALES);
        var protection = product("Service Protection", "PROTECT", "Eligible service protection", ProductCategory.SERVICE, ProductAdvisorScope.SERVICE);
        var flex = product("Mobility Care", "CARE", "Cross-functional mobility package", ProductCategory.SERVICE, ProductAdvisorScope.BOTH);
        var fleet = product("Fleet Advantage", "FLEET", "Eligible fleet financing package", ProductCategory.LEASING, ProductAdvisorScope.SALES);
        var productCatalog = List.of(financing, leasing, protection, flex, fleet);

        LocalDate today = LocalDate.now();
        for (var product : productCatalog) {
            int award = "FLEET".equals(product.code()) ? 230 : switch (product.advisorScope()) {
                case SALES -> 200;
                case SERVICE -> 140;
                case BOTH -> 170;
            };
            pointRules.save(
                    product.id(),
                    new PointRule(award, BigDecimal.valueOf(500), today.minusYears(2), today.plusYears(2), true)
            );
        }

        rewards.save(Reward.builder().name("Fuel Voucher").category("Mobility").description("Demo reward").requiredPoints(650).stock(50).build());
        rewards.save(Reward.builder().name("Technology Voucher").category("Lifestyle").description("Demo reward").requiredPoints(2200).stock(25).build());
        rewards.save(Reward.builder().name("Travel Voucher").category("Travel").description("Demo reward").requiredPoints(6000).stock(5).build());

        var advisors = List.of(jane, john, emma, morgan, casey);
        for (int index = 0; index < advisors.size(); index++) {
            var advisor = advisors.get(index);
            history(advisor, productCatalog, index, today);
            long targetAmount = advisor.advisorType() == AdvisorType.SALES ? 140000 + index * 15000L : 60000 + index * 5000L;
            long managerId = advisor.dealershipId().equals(north.id())
                    ? northManager.id()
                    : advisor.dealershipId().equals(south.id()) ? southManager.id() : westManager.id();
            target(advisor.id(), TargetStore.OwnerType.ADVISOR, BigDecimal.valueOf(targetAmount), managerId, today);
        }
        target(north.id(), TargetStore.OwnerType.DEALERSHIP, BigDecimal.valueOf(420000), northManager.id(), today);
        target(south.id(), TargetStore.OwnerType.DEALERSHIP, BigDecimal.valueOf(100000), southManager.id(), today);
        target(west.id(), TargetStore.OwnerType.DEALERSHIP, BigDecimal.valueOf(220000), westManager.id(), today);
    }

    private Dealership dealership(String name, String code, String city, String region) {
        return dealerships.save(Dealership.builder().name(name).code(code).city(city).region(region).active(true).build());
    }

    private FinancialProduct product(
            String name,
            String code,
            String description,
            ProductCategory category,
            ProductAdvisorScope scope
    ) {
        return products.save(FinancialProduct.builder()
                .name(name)
                .code(code)
                .description(description)
                .category(category)
                .advisorScope(scope)
                .eligible(true)
                .active(true)
                .build());
    }

    private UserAccount account(
            String firstName,
            String lastName,
            UserRole role,
            AdvisorType advisorType,
            Long dealershipId,
            String passwordHash
    ) {
        return users.save(
                null,
                new UserStore.UserChange(
                        firstName,
                        lastName,
                        (firstName + "." + lastName + "@championsclub.example").toLowerCase(Locale.ROOT),
                        role,
                        advisorType,
                        dealershipId,
                        true,
                        null
                ),
                passwordHash
        );
    }

    private void target(long id, TargetStore.OwnerType type, BigDecimal amount, long actorId, LocalDate today) {
        LocalDate start = today.withDayOfMonth(1);
        targets.save(
                null,
                new TargetStore.TargetData(
                        null,
                        type,
                        id,
                        start,
                        start.plusMonths(1).minusDays(1),
                        amount,
                        "EUR",
                        true
                ),
                actorId
        );
    }

    private void history(UserAccount advisor, List<FinancialProduct> products, int index, LocalDate today) {
        var eligibleProducts = products.stream()
                .filter(product -> product.acceptsSale(advisor.advisorType()))
                .toList();
        for (int day = 119; day >= 0; day--) {
            LocalDate date = today.minusDays(day);
            if (date.getDayOfWeek() == DayOfWeek.SATURDAY || date.getDayOfWeek() == DayOfWeek.SUNDAY) {
                continue;
            }
            if (index == 2 && day < 12 && day % 3 != 0) {
                continue;
            }
            var product = eligibleProducts.get(Math.floorMod(day + index, eligibleProducts.size()));
            long baseAmount = advisor.advisorType() == AdvisorType.SALES ? 9000 : 1800;
            long amount = baseAmount + index * 600L + (119 - day) * 17L + date.getDayOfWeek().getValue() * 190L;
            if (day > 35 && day < 49) {
                amount = amount * 7 / 10;
            }
            BigDecimal contractAmount = BigDecimal.valueOf(amount);
            int award = pointRules.activeRule(product.id(), date)
                    .map(rule -> rule.award(product.isEligible(), contractAmount, date))
                    .orElse(0);
            var sale = sales.save(Sale.builder()
                    .advisorId(advisor.id())
                    .dealershipId(advisor.dealershipId())
                    .productId(product.id())
                    .externalReference("SYNTHETIC-" + advisor.id() + "-" + date)
                    .currency("EUR")
                    .contractAmount(contractAmount)
                    .saleDate(date)
                    .awardedPoints(award)
                    .build());
            points.append(advisor.id(), PointTransactionType.SALE_EARNED, award, sale.id(), "Synthetic historical sale award");
        }
    }
}
