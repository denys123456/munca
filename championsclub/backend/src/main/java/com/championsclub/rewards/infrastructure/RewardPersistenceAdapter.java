package com.championsclub.rewards.infrastructure;

import com.championsclub.rewards.application.RewardRepository;
import com.championsclub.rewards.domain.Reward;
import com.championsclub.rewards.domain.RewardStatus;
import java.util.List;
import java.util.Optional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

@Repository
class RewardPersistenceAdapter implements RewardRepository {
    private final JpaRewardRepository repository;
    private final JdbcTemplate database;

    RewardPersistenceAdapter(JpaRewardRepository repository, JdbcTemplate database) {
        this.repository = repository;
        this.database = database;
    }

    public Reward save(Reward reward) {
        return repository.save(RewardEntity.fromDomain(reward)).toDomain();
    }

    public Optional<Reward> findById(Long rewardId) {
        return repository.findById(rewardId).map(RewardEntity::toDomain);
    }

    public Optional<Reward> lock(Long rewardId) {
        return repository.lock(rewardId).map(RewardEntity::toDomain);
    }

    public Page<Reward> search(String search, Pageable page) {
        return repository.search(search, page).map(RewardEntity::toDomain);
    }

    public List<Reward> findActiveRewards() {
        return repository.findByStatusOrderByRequiredPointsAsc(RewardStatus.ACTIVE)
                .stream()
                .map(RewardEntity::toDomain)
                .toList();
    }

    public RewardSummary summary(int availablePoints) {
        return database.queryForObject(
                "select count(*), count(*) filter(where required_points<=?), min(required_points-?) filter(where required_points>?) from rewards where status='ACTIVE' and (stock is null or stock>0)",
                (result, row) -> new RewardSummary(
                        result.getLong(1),
                        result.getLong(2),
                        (Integer) result.getObject(3)
                ),
                availablePoints,
                availablePoints,
                availablePoints
        );
    }
}
