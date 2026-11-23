package org.monithub.zerotable;

import jakarta.validation.ConstraintViolationException;
import java.time.Instant;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.HandlerMethodValidationException;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
import org.springframework.web.servlet.resource.NoResourceFoundException;

@RestControllerAdvice
public class ApiErrors {
    private static final Logger log=LoggerFactory.getLogger(ApiErrors.class);
    @ExceptionHandler(ApiException.class)
    ResponseEntity<Models.Error> api(ApiException e) {
        var response=ResponseEntity.status(e.status());
        if(e.status()==429) response.header("Retry-After","60");
        return response.body(new Models.Error(e.code(),e.getMessage(),Instant.now().toString()));
    }
    @ExceptionHandler({ConstraintViolationException.class,MethodArgumentTypeMismatchException.class,HandlerMethodValidationException.class,
        MethodArgumentNotValidException.class,HttpMessageNotReadableException.class})
    ResponseEntity<Models.Error> invalid(Exception e) {
        return ResponseEntity.badRequest().body(new Models.Error("INVALID_REQUEST","요청 값의 형식과 허용 범위를 확인하세요.",Instant.now().toString()));
    }
    @ExceptionHandler(NoResourceFoundException.class)
    ResponseEntity<Models.Error> missing(Exception e) {
        return ResponseEntity.status(404).body(new Models.Error("NOT_FOUND","경로를 찾을 수 없습니다.",Instant.now().toString()));
    }
    @ExceptionHandler(Exception.class)
    ResponseEntity<Models.Error> unexpected(Exception e) {
        log.error("요청 처리 실패: {}",e.getClass().getSimpleName());
        return ResponseEntity.internalServerError().body(new Models.Error("INTERNAL_ERROR","서버 처리 중 오류가 발생했습니다.",Instant.now().toString()));
    }
}
