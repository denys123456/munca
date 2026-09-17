package com.championsclub.rewards.infrastructure;

import com.championsclub.rewards.domain.RewardStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

interface JpaRewardRepository extends JpaRepository<RewardEntity, Long> {
    @org.springframework.data.jpa.repository.Query("select r from RewardEntity r where locate(lower(:search),lower(r.name))>0")
    org.springframework.data.domain.Page<RewardEntity> search(String search,org.springframework.data.domain.Pageable page);
    @org.springframework.data.jpa.repository.Lock(jakarta.persistence.LockModeType.PESSIMISTIC_WRITE)
    @org.springframework.data.jpa.repository.Query("select r from RewardEntity r where r.id=:id")
    java.util.Optional<RewardEntity> lock(Long id);

    List<RewardEntity> findByStatusOrderByRequiredPointsAsc(RewardStatus status);
}
