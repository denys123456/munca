package com.championsclub.rewards.application;

import com.championsclub.audit.application.AuditLog;
import com.championsclub.common.application.BusinessRuleViolationException;
import com.championsclub.rewards.domain.Reward;
import com.championsclub.security.application.Access;
import com.championsclub.users.application.UserAccount;
import com.championsclub.users.application.UserStore;
import com.championsclub.users.domain.AdvisorType;
import com.championsclub.users.domain.UserRole;
import java.util.Optional;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

class RedeemRewardCommandHandlerTest {
    @Test
    void rejectsInsufficientPointsBeforeIssuingVoucher() {
        var rewards = mock(RewardRepository.class);
        var points = mock(PointsLedger.class);
        var users = mock(UserStore.class);
        var redemptions = mock(RedemptionStore.class);
        var access = mock(Access.class);

        when(users.lock(1L)).thenReturn(new UserAccount(
                1L,
                "Jane",
                "Doe",
                "jane@example.test",
                UserRole.ADVISOR,
                AdvisorType.SALES,
                1L,
                true,
                null,
                null
        ));
        when(rewards.lock(2L)).thenReturn(Optional.of(Reward.builder()
                .id(2L)
                .name("Voucher")
                .category("Travel")
                .description("Voucher")
                .requiredPoints(650)
                .stock(1)
                .build()));
        when(points.calculateAvailablePoints(1L)).thenReturn(200);

        var handler = new RedeemRewardCommandHandler(
                rewards,
                points,
                users,
                redemptions,
                access,
                mock(AuditLog.class)
        );

        assertThatThrownBy(() -> handler.redeemReward(new RedeemRewardCommand(1L, 2L)))
                .isInstanceOf(BusinessRuleViolationException.class)
                .hasMessage("The advisor does not have enough available points for this reward.");
        verify(access).self(1L);
        verifyNoInteractions(redemptions);
        verify(points, never()).append(anyLong(), any(), anyInt(), anyLong(), anyString());
    }
}
