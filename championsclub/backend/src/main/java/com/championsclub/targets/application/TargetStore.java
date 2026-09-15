package com.championsclub.targets.application;
import jakarta.validation.constraints.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Optional;
import org.springframework.data.domain.*;
public interface TargetStore {
    enum OwnerType { ADVISOR, DEALERSHIP }
    TargetData get(long id);
    TargetData save(Long id, TargetData data, long actorId);
    Optional<TargetData> current(long ownerId, OwnerType type, LocalDate date);
    Page<TargetData> list(long ownerId, OwnerType type, Pageable page);
    record TargetData(Long id, @NotNull OwnerType ownerType, @Positive long ownerId,
                      @NotNull LocalDate periodStart, @NotNull LocalDate periodEnd,
                      @NotNull @DecimalMin("0.01") @Digits(integer=12, fraction=2) BigDecimal targetAmount,
                      @NotBlank String currency, boolean active) {}
}
