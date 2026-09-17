package com.championsclub.dashboard.application;
import com.championsclub.security.application.Access;
import com.championsclub.users.application.UserStore;
import org.junit.jupiter.api.Test;
import org.springframework.security.access.AccessDeniedException;
import static org.mockito.Mockito.*;
import static org.assertj.core.api.Assertions.*;
class GetAdvisorDashboardQueryHandlerTest {
    @Test void rejectsAccessBeforeReadingPerformance() {
        var access=mock(Access.class);
        var users=mock(UserStore.class);
        var assembler=mock(DashboardAssembler.class);
        doThrow(new AccessDeniedException("Access denied.")).when(access).advisor(2L);
        var handler=new GetAdvisorDashboardQueryHandler(access,users,assembler);
        assertThatThrownBy(() -> handler.getAdvisorDashboard(new GetAdvisorDashboardQuery(2L))).isInstanceOf(AccessDeniedException.class);
        verifyNoInteractions(users,assembler);
    }
}
