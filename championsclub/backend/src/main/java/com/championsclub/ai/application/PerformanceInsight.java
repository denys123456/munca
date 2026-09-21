package com.championsclub.ai.application;

public record PerformanceInsight(
        String summary,
        String whatChanged,
        String whyItMatters,
        String risk,
        String opportunity,
        String recommendedAction,
        String generationSource,
        String provider,
        String model
) {
    public PerformanceInsight(
            String summary,
            String whatChanged,
            String whyItMatters,
            String risk,
            String opportunity,
            String recommendedAction
    ) {
        this(summary, whatChanged, whyItMatters, risk, opportunity, recommendedAction, null, null, null);
    }

    public PerformanceInsight withGenerationMetadata(String generationSource, String provider, String model) {
        return new PerformanceInsight(
                summary,
                whatChanged,
                whyItMatters,
                risk,
                opportunity,
                recommendedAction,
                generationSource,
                provider,
                model == null || model.isBlank() ? null : model
        );
    }

    public boolean valid() {
        return validText(summary) && validText(whatChanged) && validText(whyItMatters)
                && validText(risk) && validText(opportunity) && validText(recommendedAction);
    }

    private boolean validText(String value) {
        return value != null && !value.isBlank() && value.length() <= 1200;
    }
}
