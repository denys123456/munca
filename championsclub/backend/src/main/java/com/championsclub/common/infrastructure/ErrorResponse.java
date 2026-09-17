package com.championsclub.common.infrastructure;

import java.time.Instant;
import java.util.List;

public record ErrorResponse(
        int status,
        String code,
        String message,
        Instant timestamp,
        String path,
        List<FieldErrorResponse> fieldErrors
) {
}
