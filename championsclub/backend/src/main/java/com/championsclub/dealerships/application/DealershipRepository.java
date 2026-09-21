package com.championsclub.dealerships.application;

import com.championsclub.dealerships.domain.Dealership;

public interface DealershipRepository {
    Dealership get(long id);
    Dealership save(Dealership dealership);
}
