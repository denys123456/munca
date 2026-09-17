package com.championsclub.alerts.infrastructure;
import com.championsclub.alerts.application.*;
import com.championsclub.common.application.Pages;
import com.championsclub.users.application.*;
import org.slf4j.*;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.*;
import org.springframework.transaction.event.*;
@Configuration
@EnableScheduling
@EnableAsync
@ConditionalOnProperty(name="championsclub.scheduling.enabled",havingValue="true",matchIfMissing=true)
class PerformanceSchedule {
    private static final Logger log=LoggerFactory.getLogger(PerformanceSchedule.class);
    private final UserStore users;
    private final PerformanceRefresh refresh;
    private final boolean demo;
    PerformanceSchedule(UserStore users,PerformanceRefresh refresh,
                        @org.springframework.beans.factory.annotation.Value("${championsclub.demo.enabled:false}") boolean demo) {
        this.users=users; this.refresh=refresh; this.demo=demo;
    }
    @Async
    @org.springframework.context.event.EventListener(org.springframework.boot.context.event.ApplicationReadyEvent.class)
    public void ready() { if (demo) daily(); }
    @Scheduled(cron="${championsclub.scheduling.cron:0 0 6 * * *}",zone="UTC")
    public void daily() {
        int page=0;
        org.springframework.data.domain.Page<UserAccount> accounts;
        do {
            accounts=users.search("",null,null,Pages.of(page++,50));
            for (var account : accounts) {
                try { refresh.user(account); }
                catch (RuntimeException exception) { log.error("Scheduled performance refresh failed for user {}",account.id()); }
            }
        } while (accounts.hasNext());
    }
    @Async
    @TransactionalEventListener(phase=TransactionPhase.AFTER_COMMIT)
    public void saleChanged(SaleChanged event) {
        try { refresh.dealership(event.advisorId(),event.dealershipId()); }
        catch (RuntimeException exception) { log.error("Performance refresh failed for advisor {}",event.advisorId()); }
    }
}
