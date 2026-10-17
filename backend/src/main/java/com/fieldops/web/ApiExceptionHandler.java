package com.fieldops.web;

import com.fieldops.service.BusinessException;
import jakarta.validation.ConstraintViolationException;
import java.util.LinkedHashMap;
import java.util.Map;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.dao.PessimisticLockingFailureException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.ErrorResponse;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;

@RestControllerAdvice
public class ApiExceptionHandler {
    private static final Logger LOG = LoggerFactory.getLogger(ApiExceptionHandler.class);

    @ExceptionHandler(BusinessException.class)
    ProblemDetail business(BusinessException exception) {
        return problem(exception.getStatus(), exception.getMessage(), exception.getFieldErrors());
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    ProblemDetail validation(MethodArgumentNotValidException exception) {
        Map<String, String> fields = new LinkedHashMap<>();
        exception.getBindingResult().getFieldErrors()
                .forEach(error -> fields.putIfAbsent(error.getField(), error.getDefaultMessage()));
        return problem(HttpStatus.BAD_REQUEST, "Revise os campos informados.", fields);
    }

    @ExceptionHandler(ConstraintViolationException.class)
    ProblemDetail validation(ConstraintViolationException exception) {
        Map<String, String> fields = new LinkedHashMap<>();
        exception.getConstraintViolations().forEach(violation -> {
            String path = violation.getPropertyPath().toString();
            fields.putIfAbsent(path.substring(path.lastIndexOf('.') + 1), violation.getMessage());
        });
        return problem(HttpStatus.BAD_REQUEST, "Revise os campos informados.", fields);
    }

    @ExceptionHandler({HttpMessageNotReadableException.class, MethodArgumentTypeMismatchException.class})
    ProblemDetail malformed(Exception exception) {
        return problem(HttpStatus.BAD_REQUEST,
                "Dados inválidos. Verifique o formato JSON, os identificadores, status, prioridades e datas (AAAA-MM-DD).", Map.of());
    }

    @ExceptionHandler(DataIntegrityViolationException.class)
    ProblemDetail integrity(DataIntegrityViolationException exception) {
        return problem(HttpStatus.CONFLICT, "A operação conflita com um registro existente ou vinculado. Atualize os dados e tente novamente.", Map.of());
    }

    @ExceptionHandler(PessimisticLockingFailureException.class)
    ProblemDetail concurrentUpdate(PessimisticLockingFailureException exception) {
        return problem(HttpStatus.CONFLICT, "Este registro está sendo atualizado. Aguarde um instante e tente novamente.", Map.of());
    }

    @ExceptionHandler(Exception.class)
    ProblemDetail unexpected(Exception exception) {
        if (exception instanceof ErrorResponse response) {
            HttpStatus status = HttpStatus.valueOf(response.getStatusCode().value());
            String detail = switch (status) {
                case NOT_FOUND -> "O recurso solicitado não foi encontrado.";
                case METHOD_NOT_ALLOWED -> "Este método HTTP não é permitido para o recurso solicitado.";
                case BAD_REQUEST -> "Verifique os parâmetros da requisição.";
                case UNSUPPORTED_MEDIA_TYPE -> "Envie o corpo da requisição como application/json.";
                default -> "Não foi possível processar a requisição.";
            };
            return problem(status, detail, Map.of());
        }
        LOG.error("Falha inesperada ao processar operação", exception);
        return problem(HttpStatus.INTERNAL_SERVER_ERROR, "Não foi possível concluir a operação. Tente novamente.", Map.of());
    }

    private ProblemDetail problem(HttpStatus status, String detail, Map<String, String> fields) {
        ProblemDetail problem = ProblemDetail.forStatusAndDetail(status, detail);
        problem.setTitle(switch (status) {
            case BAD_REQUEST -> "Dados inválidos";
            case NOT_FOUND -> "Registro não encontrado";
            case CONFLICT -> "Operação não permitida";
            default -> "Falha ao processar a operação";
        });
        if (!fields.isEmpty()) problem.setProperty("fieldErrors", fields);
        return problem;
    }
}
