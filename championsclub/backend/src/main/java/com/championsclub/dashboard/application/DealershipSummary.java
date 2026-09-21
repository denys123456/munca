package com.championsclub.dashboard.application;

import com.championsclub.dealerships.domain.Dealership;

public record DealershipSummary(
        Long id,
        String name,
        String code,
        String city,
        String region,
        boolean active
) {
    public static DealershipSummary from(Dealership dealership) {
        return new DealershipSummary(
                dealership.id(),
                dealership.name(),
                dealership.code(),
                dealership.city(),
                dealership.region(),
                dealership.active()
        );
    }
}
