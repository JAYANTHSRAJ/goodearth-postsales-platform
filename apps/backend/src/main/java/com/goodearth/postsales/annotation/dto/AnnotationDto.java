package com.goodearth.postsales.annotation.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class AnnotationDto {
    private UUID id;
    private UUID workflowId;
    private UUID documentId;
    private String workdriveFileId;
    private UUID authorId;
    private String authorEmail;
    private String authorRole;
    private String annotationType;
    private BigDecimal xCoordinate;
    private BigDecimal yCoordinate;
    private int pageNumber;
    private String color;
    private String title;
    private String description;
    private String status;
    private LocalDateTime createdAt;
}
