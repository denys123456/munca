package com.championsclub.rewards.infrastructure;

import com.championsclub.rewards.application.RewardRepository;
import com.championsclub.rewards.domain.Reward;
import com.championsclub.rewards.domain.RewardStatus;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
class RewardPersistenceAdapter implements RewardRepository {
    public java.util.Optional<Reward> lock(Long id) { return jpaRewardRepository.lock(id).map(RewardEntity::toDomain); }
    public org.springframework.data.domain.Page<Reward> search(String search,org.springframework.data.domain.Pageable page) {
        return jpaRewardRepository.search(search,page).map(RewardEntity::toDomain);
    }

    private final JpaRewardRepository jpaRewardRepository;

    RewardPersistenceAdapter(JpaRewardRepository jpaRewardRepository) {
        this.jpaRewardRepository = jpaRewardRepository;
    }

    @Override
    public Reward save(Reward reward) {
        return jpaRewardRepository.save(RewardEntity.fromDomain(reward)).toDomain();
    }

    @Override
    public Optional<Reward> findById(Long rewardId) {
        return jpaRewardRepository.findById(rewardId).map(RewardEntity::toDomain);
    }

    @Override
    public List<Reward> findActiveRewards() {
        return jpaRewardRepository.findByStatusOrderByRequiredPointsAsc(RewardStatus.ACTIVE)
                .stream()
                .map(RewardEntity::toDomain)
                .toList();
    }
}
