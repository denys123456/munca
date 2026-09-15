package com.championsclub.common.application;
import org.springframework.data.domain.*;
public final class Pages {
    private Pages() {}
    public static Pageable of(int page, int size) {
        if (page < 0 || size < 1 || size > 100) throw new IllegalArgumentException("Page must be nonnegative and size must be between 1 and 100.");
        return PageRequest.of(page, size, Sort.by("id").descending());
    }
}
