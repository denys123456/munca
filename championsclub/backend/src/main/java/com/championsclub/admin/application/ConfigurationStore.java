package com.championsclub.admin.application;
import java.math.BigDecimal;
import java.time.LocalDate;
import org.springframework.data.domain.*;
import jakarta.validation.constraints.*;
public interface ConfigurationStore {
    DealershipData dealership(long id);
    DealershipData saveDealership(Long id, DealershipData data);
    Page<DealershipData> dealerships(String search, Pageable page);
    ProductData product(long id);
    ProductData saveProduct(Long id, ProductData data);
    Page<ProductData> products(String search, Pageable page);
    RewardData reward(long id, boolean lock);
    RewardData saveReward(Long id, RewardData data);
    Page<RewardData> rewards(String search, Pageable page);
    RuleData rule(long id);
    RuleData saveRule(Long id, RuleData data);
    Page<RuleData> rules(Pageable page);
    java.util.Optional<RuleData> activeRule(long productId, LocalDate date);
    Thresholds thresholds();
    Thresholds saveThresholds(Thresholds data);
    RewardSummary rewardSummary(int balance);
    record RewardSummary(long activeRewards, long affordableRewards, Integer pointsForNextReward) {}
    record DealershipData(Long id, @NotBlank @Size(max=160) String name, @NotBlank @Size(max=40) String code,
                          @NotBlank @Size(max=120) String city, @NotBlank @Size(max=120) String region, boolean active) {}
    record ProductData(Long id, @NotBlank @Size(max=160) String name, @NotBlank @Size(max=40) String code,
                       @NotNull @Size(max=1000) String description, boolean eligible, boolean active) {
        public com.championsclub.sales.domain.FinancialProduct toDomain() {
            return com.championsclub.sales.domain.FinancialProduct.builder().id(id).name(name).code(code)
                    .description(description).eligible(eligible).active(active).build();
        }
        public static ProductData from(com.championsclub.sales.domain.FinancialProduct product) {
            return new ProductData(product.id(),product.name(),product.code(),product.description(),product.isEligible(),product.active());
        }
    }
    record RewardData(Long id, @NotBlank @Size(max=160) String name, @NotBlank @Size(max=120) String category,
                      @NotNull @Size(max=1000) String description, @Positive int requiredPoints,
                      @PositiveOrZero Integer stock, @Size(max=500) String imageReference, boolean active) {
        public com.championsclub.rewards.domain.Reward toDomain() {
            return com.championsclub.rewards.domain.Reward.builder().id(id).name(name).category(category).description(description)
                    .requiredPoints(requiredPoints).stock(stock).imageReference(imageReference)
                    .status(active ? com.championsclub.rewards.domain.RewardStatus.ACTIVE : com.championsclub.rewards.domain.RewardStatus.INACTIVE).build();
        }
        public static RewardData from(com.championsclub.rewards.domain.Reward reward) {
            return new RewardData(reward.id(),reward.name(),reward.category(),reward.description(),reward.requiredPoints(),
                    reward.stock(),reward.imageReference(),reward.status() == com.championsclub.rewards.domain.RewardStatus.ACTIVE);
        }
    }
    record RuleData(Long id, @Positive long productId, @Positive int pointsPerSale,
                    @NotNull @DecimalMin("0") BigDecimal minimumEligibleAmount,
                    @NotNull LocalDate activeFrom, @NotNull LocalDate activeUntil, boolean active) {
        public com.championsclub.points.domain.PointRule toDomain() {
            return new com.championsclub.points.domain.PointRule(pointsPerSale,minimumEligibleAmount,activeFrom,activeUntil,active);
        }
    }
    record Thresholds(int bronze, int silver, int gold) {
        public Thresholds {
            if (bronze != 0 || silver <= bronze || gold <= silver)
                throw new IllegalArgumentException("Thresholds must start at zero and increase strictly.");
        }
    }
}
