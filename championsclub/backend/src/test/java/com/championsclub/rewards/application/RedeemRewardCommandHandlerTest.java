package com.championsclub.rewards.application;

import com.championsclub.common.application.BusinessRuleViolationException;
import com.championsclub.rewards.domain.Reward;
import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThatThrownBy;

class RedeemRewardCommandHandlerTest {

    @Test
    void shouldRejectRewardRedemptionWhenAdvisorHasInsufficientPoints() {
        RedeemRewardCommandHandler handler = new RedeemRewardCommandHandler(new SingleRewardRepository(), new LowBalancePointsLedger());

        assertThatThrownBy(() -> handler.redeemReward(new RedeemRewardCommand(1L, 1L)))
                .isInstanceOf(BusinessRuleViolationException.class)
                .hasMessage("The advisor does not have enough points for this reward.");
    }

    private static class SingleRewardRepository implements RewardRepository {

        @Override
        public Reward save(Reward reward) {
            return reward;
        }

        @Override
        public Optional<Reward> findById(Long rewardId) {
            return Optional.of(Reward.builder()
                    .id(rewardId)
                    .name("Premium Fuel Voucher")
                    .category("Mobility")
                    .requiredPoints(650)
                    .build());
        }

        @Override
        public List<Reward> findActiveRewards() {
            return List.of();
        }
    }

    private static class LowBalancePointsLedger implements PointsLedger {

        @Override
        public int calculateAvailablePoints(Long advisorId) {
            return 200;
        }

        @Override
        public void recordRewardRedemption(Long advisorId, Long rewardId, int redeemedPoints) {
        }
    }
}
