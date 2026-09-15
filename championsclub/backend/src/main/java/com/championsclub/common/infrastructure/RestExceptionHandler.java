package com.championsclub.common.infrastructure;
import com.championsclub.common.application.*;
import jakarta.servlet.http.HttpServletRequest;
import java.time.Instant;
import java.util.List;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.web.bind.*;
import org.springframework.web.bind.annotation.*;
@RestControllerAdvice
class RestExceptionHandler {
    @ExceptionHandler(ResourceNotFoundException.class)
    ResponseEntity<ErrorResponse> missing(ResourceNotFoundException exception,HttpServletRequest request) {
        return response(404,exception.code(),exception.getMessage(),request,List.of());
    }
    @ExceptionHandler(BusinessRuleViolationException.class)
    ResponseEntity<ErrorResponse> business(BusinessRuleViolationException exception,HttpServletRequest request) {
        return response(409,exception.code(),exception.getMessage(),request,List.of());
    }
    @ExceptionHandler(ExternalServiceUnavailableException.class)
    ResponseEntity<ErrorResponse> external(ExternalServiceUnavailableException exception,HttpServletRequest request) {
        return response(503,exception.code(),exception.getMessage(),request,List.of());
    }
    @ExceptionHandler(AccessDeniedException.class)
    ResponseEntity<ErrorResponse> forbidden(HttpServletRequest request) {
        return response(403,"ACCESS_DENIED","Access denied.",request,List.of());
    }
    @ExceptionHandler(BadCredentialsException.class)
    ResponseEntity<ErrorResponse> credentials(HttpServletRequest request) {
        return response(401,"INVALID_CREDENTIALS","Invalid email or password.",request,List.of());
    }
    @ExceptionHandler(MethodArgumentNotValidException.class)
    ResponseEntity<ErrorResponse> validation(MethodArgumentNotValidException exception,HttpServletRequest request) {
        var fields=exception.getBindingResult().getFieldErrors().stream()
                .map(e -> new FieldErrorResponse(e.getField(),e.getDefaultMessage())).toList();
        return response(400,"VALIDATION_FAILED","The request contains invalid values.",request,fields);
    }
    @ExceptionHandler({IllegalArgumentException.class,jakarta.validation.ConstraintViolationException.class,
            org.springframework.http.converter.HttpMessageNotReadableException.class,
            org.springframework.web.method.annotation.MethodArgumentTypeMismatchException.class,
            MissingServletRequestParameterException.class,org.springframework.web.method.annotation.HandlerMethodValidationException.class})
    ResponseEntity<ErrorResponse> invalid(Exception exception,HttpServletRequest request) {
        String message=exception.getClass() == IllegalArgumentException.class ? exception.getMessage() : "The request contains invalid values.";
        return response(400,"VALIDATION_FAILED",message,request,List.of());
    }
    @ExceptionHandler(DataIntegrityViolationException.class)
    ResponseEntity<ErrorResponse> constraint(DataIntegrityViolationException exception,HttpServletRequest request) {
        String detail=String.valueOf(exception.getMostSpecificCause().getMessage());
        String code=detail.contains("sales_external_reference") ? "SALE_ALREADY_EXISTS"
                : detail.contains("target_period_exclusion") ? "TARGET_OVERLAP"
                : detail.contains("point_rules") ? "POINT_RULE_CONFLICT"
                : detail.contains("users_email") ? "EMAIL_ALREADY_EXISTS" : "DATA_CONFLICT";
        return response(409,code,"The operation conflicts with existing data or a database constraint.",request,List.of());
    }
    @ExceptionHandler(org.springframework.web.servlet.resource.NoResourceFoundException.class)
    ResponseEntity<ErrorResponse> route(HttpServletRequest request) {
        return response(404,"ENDPOINT_NOT_FOUND","Endpoint not found.",request,List.of());
    }
    @ExceptionHandler(Exception.class)
    ResponseEntity<ErrorResponse> unexpected(Exception exception,HttpServletRequest request) {
        org.slf4j.LoggerFactory.getLogger(getClass()).error("Request failed: {} {}",request.getMethod(),request.getRequestURI(),exception);
        return response(500,"UNEXPECTED_ERROR","The request could not be completed.",request,List.of());
    }
    private ResponseEntity<ErrorResponse> response(int status,String code,String message,HttpServletRequest request,List<FieldErrorResponse> fields) {
        return ResponseEntity.status(status).body(new ErrorResponse(status,code,message,Instant.now(),request.getRequestURI(),fields));
    }
}
