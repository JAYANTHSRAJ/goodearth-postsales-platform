package com.goodearth.postsales.annotation.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class AnnotationDetailDto {
    private AnnotationDto annotation;
    private List<AnnotationCommentDto> comments;
    private List<AnnotationAttachmentDto> attachments;
}
