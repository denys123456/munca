package com.championsclub.ai.application;
public record PerformanceInsight(String summary, String whatChanged, String whyItMatters, String risk,
                                 String opportunity, String recommendedAction) {
    public boolean valid() {
        return validText(summary) && validText(whatChanged) && validText(whyItMatters)
                && validText(risk) && validText(opportunity) && validText(recommendedAction);
    }
    private boolean validText(String value) { return value != null && !value.isBlank() && value.length() <= 1200; }
}
