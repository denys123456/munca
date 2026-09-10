package com.championsclub.rewards.infrastructure;

import com.championsclub.rewards.application.GetRewardCatalogQuery;
import com.championsclub.rewards.application.GetRewardCatalogQueryHandler;
import com.championsclub.rewards.application.RedeemRewardCommand;
import com.championsclub.rewards.application.RedeemRewardCommandHandler;
import com.championsclub.rewards.application.RewardCatalogItem;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/rewards")
class RewardsController {

    private final GetRewardCatalogQueryHandler getRewardCatalogQueryHandler;
    private final RedeemRewardCommandHandler redeemRewardCommandHandler;

    RewardsController(
            GetRewardCatalogQueryHandler getRewardCatalogQueryHandler,
            RedeemRewardCommandHandler redeemRewardCommandHandler
    ) {
        this.getRewardCatalogQueryHandler = getRewardCatalogQueryHandler;
        this.redeemRewardCommandHandler = redeemRewardCommandHandler;
    }

    @GetMapping("/advisor/{advisorId}")
    @PreAuthorize("hasAnyRole('SALES_ADVISOR','MANAGER','ADMIN')")
    List<RewardCatalogItem> getRewardCatalog(@PathVariable Long advisorId) {
        return getRewardCatalogQueryHandler.getRewardCatalog(new GetRewardCatalogQuery(advisorId));
    }

    @PostMapping("/redemptions")
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasAnyRole('SALES_ADVISOR','ADMIN')")
    void redeemReward(@Valid @RequestBody RedeemRewardRequest request) {
        redeemRewardCommandHandler.redeemReward(new RedeemRewardCommand(request.advisorId(), request.rewardId()));
    }

    record RedeemRewardRequest(@NotNull @Positive Long advisorId, @NotNull @Positive Long rewardId) {
    }
}

