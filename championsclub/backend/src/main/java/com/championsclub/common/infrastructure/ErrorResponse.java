package com.championsclub.common.infrastructure;

import java.time.Instant;
import java.util.List;

public record ErrorResponse(
        String code,
        String message,
        Instant timestamp,
        List<FieldErrorResponse> fieldErrors
) {
}
