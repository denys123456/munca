package com.championsclub.common.infrastructure;
import java.util.List;
import org.springframework.core.MethodParameter;
import org.springframework.data.domain.Page;
import org.springframework.http.MediaType;
import org.springframework.http.converter.HttpMessageConverter;
import org.springframework.http.server.*;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.servlet.mvc.method.annotation.ResponseBodyAdvice;
@RestControllerAdvice
class PageResponseAdvice implements ResponseBodyAdvice<Object> {
    public boolean supports(MethodParameter method,Class<? extends HttpMessageConverter<?>> converter) {
        return Page.class.isAssignableFrom(method.getParameterType());
    }
    public Object beforeBodyWrite(Object body,MethodParameter method,MediaType mediaType,
                                  Class<? extends HttpMessageConverter<?>> converter,ServerHttpRequest request,ServerHttpResponse response) {
        if (!(body instanceof Page<?> page)) return body;
        return new PageResponse(page.getContent(),page.getNumber(),page.getSize(),page.getTotalElements(),page.getTotalPages(),page.hasNext());
    }
    record PageResponse(List<?> content,int number,int size,long totalElements,int totalPages,boolean hasNext) {}
}
