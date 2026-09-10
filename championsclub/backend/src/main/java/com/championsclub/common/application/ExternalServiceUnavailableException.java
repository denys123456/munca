package com.championsclub.common.application;

public class ExternalServiceUnavailableException extends RuntimeException {

    private final String code;

    public ExternalServiceUnavailableException(String code, String message) {
        super(message);
        this.code = code;
    }

    public String code() {
        return code;
    }
}

