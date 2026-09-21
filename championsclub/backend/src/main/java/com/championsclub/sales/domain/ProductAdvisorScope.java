package com.championsclub.sales.domain;

import com.championsclub.users.domain.AdvisorType;

public enum ProductAdvisorScope {
    SALES,
    SERVICE,
    BOTH;

    public boolean supports(AdvisorType advisorType) {
        return this == BOTH || name().equals(advisorType.name());
    }
}
