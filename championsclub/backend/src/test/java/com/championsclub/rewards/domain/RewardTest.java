package com.championsclub.rewards.domain;
import org.junit.jupiter.api.Test;
import static org.assertj.core.api.Assertions.*;
class RewardTest {
    @Test void requiresBalanceAndInventory() {
        var reward=Reward.builder().name("Voucher").category("Travel").requiredPoints(650).stock(1).build();
        assertThat(reward.canBeRedeemedWith(650)).isTrue();
        assertThat(reward.canBeRedeemedWith(649)).isFalse();
        assertThat(Reward.builder().name("Voucher").category("Travel").requiredPoints(650).stock(0).build().available()).isFalse();
    }
}
