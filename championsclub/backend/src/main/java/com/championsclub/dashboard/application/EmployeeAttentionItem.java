package com.championsclub.dashboard.application;

public record EmployeeAttentionItem(
        Long advisorId,
        String advisorName,
        String reason,
        int targetProgressPercentage
) {
}

