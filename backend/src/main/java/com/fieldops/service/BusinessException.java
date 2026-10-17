package com.fieldops.service;

import java.util.Map;
import org.springframework.http.HttpStatus;

public class BusinessException extends RuntimeException {
    private final HttpStatus status;
    private final Map<String, String> fieldErrors;

    private BusinessException(HttpStatus status, String message, Map<String, String> fieldErrors) {
        super(message);
        this.status = status;
        this.fieldErrors = Map.copyOf(fieldErrors);
    }

    public static BusinessException notFound(String message) {
        return new BusinessException(HttpStatus.NOT_FOUND, message, Map.of());
    }

    public static BusinessException conflict(String message) {
        return new BusinessException(HttpStatus.CONFLICT, message, Map.of());
    }

    public static BusinessException invalid(String field, String message) {
        return new BusinessException(HttpStatus.BAD_REQUEST, message, Map.of(field, message));
    }

    public HttpStatus getStatus() { return status; }
    public Map<String, String> getFieldErrors() { return fieldErrors; }
}
