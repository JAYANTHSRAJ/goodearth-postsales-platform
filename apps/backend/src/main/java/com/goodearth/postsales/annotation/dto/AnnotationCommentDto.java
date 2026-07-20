package com.goodearth.postsales.annotation.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class AnnotationCommentDto {
    private UUID id;
    private UUID annotationId;
    private UUID authorId;
    private String authorEmail;
    private String authorRole;
    private String comment;
    private LocalDateTime createdAt;
}
