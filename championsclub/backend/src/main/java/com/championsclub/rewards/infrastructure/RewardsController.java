package com.championsclub.rewards.infrastructure;
import com.championsclub.rewards.application.*;
import com.championsclub.common.application.Pages;
import com.championsclub.security.application.Access;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import org.springframework.data.domain.Page;
import org.springframework.web.bind.annotation.*;
@RestController
class RewardsController {
    private final RewardQueries queries;
    private final RedeemRewardCommandHandler commands;
    private final Access access;
    RewardsController(RewardQueries queries, RedeemRewardCommandHandler commands, Access access) {
        this.queries=queries; this.commands=commands; this.access=access;
    }
    @GetMapping("/api/rewards/advisor/{advisorId}")
    Page<RewardQueries.RewardEligibility> catalog(@PathVariable long advisorId, @RequestParam(defaultValue="") String search,
                                                @RequestParam(defaultValue="0") int page, @RequestParam(defaultValue="20") int size) {
        return queries.catalog(advisorId, search, Pages.of(page, size));
    }
    @PostMapping("/api/rewards/redemptions")
    @ResponseStatus(org.springframework.http.HttpStatus.CREATED)
    RedemptionStore.Redemption redeem(@Valid @RequestBody RedeemRequest request) {
        return commands.redeemReward(new RedeemRewardCommand(request.advisorId() == null ? access.current().id() : request.advisorId(), request.rewardId()));
    }
    @GetMapping("/api/redemptions")
    Page<RedemptionStore.Redemption> history(@RequestParam(required=false) Long advisorId,
                                            @RequestParam(defaultValue="0") int page, @RequestParam(defaultValue="20") int size) {
        return queries.history(advisorId, Pages.of(page, size));
    }
    record RedeemRequest(@Positive Long advisorId, @NotNull @Positive Long rewardId) {}
}
