package com.championsclub.rewards.application;
import com.championsclub.admin.application.ConfigurationStore;
import com.championsclub.audit.application.AuditLog;
import com.championsclub.common.application.BusinessRuleViolationException;
import com.championsclub.security.application.Access;
import com.championsclub.users.application.*;
import com.championsclub.users.domain.UserRole;
import org.junit.jupiter.api.Test;
import static org.mockito.Mockito.*;
import static org.assertj.core.api.Assertions.*;
class RedeemRewardCommandHandlerTest {
    @Test void rejectsInsufficientPointsBeforeIssuingVoucher() {
        var configuration=mock(ConfigurationStore.class);
        var points=mock(PointsLedger.class);
        var users=mock(UserStore.class);
        var redemptions=mock(RedemptionStore.class);
        var access=mock(Access.class);
        when(users.lock(1L)).thenReturn(new UserAccount(1L,"Jane","Doe","jane@example.test",UserRole.SALES_ADVISOR,1L,true,null,null));
        when(configuration.reward(2L,true)).thenReturn(new ConfigurationStore.RewardData(2L,"Voucher","Travel","Voucher",650,1,null,true));
        when(points.calculateAvailablePoints(1L)).thenReturn(200);
        var handler=new RedeemRewardCommandHandler(configuration,points,users,redemptions,access,mock(AuditLog.class));
        assertThatThrownBy(() -> handler.redeemReward(new RedeemRewardCommand(1L,2L)))
                .isInstanceOf(BusinessRuleViolationException.class).hasMessage("The advisor does not have enough points for this reward.");
        verify(access).self(1L);
        verifyNoInteractions(redemptions);
        verify(points,never()).append(any(),any(),anyInt(),anyLong(),anyString());
    }
}
