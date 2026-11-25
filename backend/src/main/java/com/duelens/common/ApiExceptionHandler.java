package com.duelens.common;

import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.web.HttpRequestMethodNotSupportedException;
import org.springframework.web.HttpMediaTypeNotSupportedException;
import org.springframework.dao.ConcurrencyFailureException;

@RestControllerAdvice
public class ApiExceptionHandler {
    @ExceptionHandler(ApiException.class)
    ApiResponse<Void> domain(ApiException error, HttpServletResponse response) {
        if ("RATE_LIMITED".equals(error.code())) response.setHeader("Retry-After", "60");
        return ApiResponse.failure(error.code(), error.getMessage());
    }

    @ExceptionHandler(ConcurrencyFailureException.class)
    ApiResponse<Void> concurrentChange() {
        return ApiResponse.failure("REVISION_CONFLICT", "동시에 변경된 내용이 있습니다. 최신 내용을 확인해 주세요.");
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    ApiResponse<Void> validation() {
        return ApiResponse.failure("VALIDATION_FAILED", "학기와 요청 버전 정보를 확인해 주세요.");
    }

    @ExceptionHandler({HttpMessageNotReadableException.class, HttpRequestMethodNotSupportedException.class, HttpMediaTypeNotSupportedException.class})
    ApiResponse<Void> malformed() {
        return ApiResponse.failure("MALFORMED_REQUEST", "요청 JSON 형식과 허용된 항목을 확인해 주세요.");
    }

    @ExceptionHandler(Exception.class)
    ApiResponse<Void> unexpected() {
        return ApiResponse.failure("INTERNAL_ERROR", "요청을 처리하지 못했습니다. 잠시 후 다시 시도해 주세요.");
    }
}
