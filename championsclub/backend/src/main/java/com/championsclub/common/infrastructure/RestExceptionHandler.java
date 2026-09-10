package com.championsclub.common.infrastructure;

import com.championsclub.common.application.BusinessRuleViolationException;
import com.championsclub.common.application.ExternalServiceUnavailableException;
import com.championsclub.common.application.ResourceNotFoundException;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.time.Instant;
import java.util.List;

@RestControllerAdvice
class RestExceptionHandler {

    @ExceptionHandler(ResourceNotFoundException.class)
    @ResponseStatus(HttpStatus.NOT_FOUND)
    ErrorResponse handleResourceNotFound(ResourceNotFoundException exception) {
        return errorResponse(exception.code(), exception.getMessage(), List.of());
    }

    @ExceptionHandler(BusinessRuleViolationException.class)
    @ResponseStatus(HttpStatus.CONFLICT)
    ErrorResponse handleBusinessRuleViolation(BusinessRuleViolationException exception) {
        return errorResponse(exception.code(), exception.getMessage(), List.of());
    }

    @ExceptionHandler(ExternalServiceUnavailableException.class)
    @ResponseStatus(HttpStatus.SERVICE_UNAVAILABLE)
    ErrorResponse handleExternalServiceUnavailable(ExternalServiceUnavailableException exception) {
        return errorResponse(exception.code(), exception.getMessage(), List.of());
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    ErrorResponse handleValidationFailure(MethodArgumentNotValidException exception) {
        List<FieldErrorResponse> fieldErrors = exception.getBindingResult().getFieldErrors()
                .stream()
                .map(error -> new FieldErrorResponse(error.getField(), error.getDefaultMessage()))
                .toList();
        return errorResponse("VALIDATION_FAILED", "The request contains invalid values.", fieldErrors);
    }

    @ExceptionHandler(Exception.class)
    @ResponseStatus(HttpStatus.INTERNAL_SERVER_ERROR)
    ErrorResponse handleUnexpectedException(Exception exception) {
        return errorResponse("UNEXPECTED_ERROR", "The request could not be completed.", List.of());
    }

    private ErrorResponse errorResponse(String code, String message, List<FieldErrorResponse> fieldErrors) {
        return new ErrorResponse(code, message, Instant.now(), fieldErrors);
    }
}

