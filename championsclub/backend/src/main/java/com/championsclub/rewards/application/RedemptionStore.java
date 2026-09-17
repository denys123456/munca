package com.championsclub.rewards.application;
import java.time.Instant;
import java.util.UUID;
import org.springframework.data.domain.*;
public interface RedemptionStore {
    Redemption issue(long advisorId, long rewardId, int points);
    Page<Redemption> history(Long advisorId, Pageable page);
    record Redemption(long id, long advisorId, long rewardId, int redeemedPoints, Instant redeemedAt,
                      UUID voucherCode, String status) {}
}
