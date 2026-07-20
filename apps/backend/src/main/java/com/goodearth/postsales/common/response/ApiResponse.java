package com.goodearth.postsales.common.response;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
public class ApiResponse<T> {

    private boolean success = true;
    private T data;
    private LocalDateTime timestamp = LocalDateTime.now();

    public ApiResponse(T data) {
        this.data = data;
    }
}
