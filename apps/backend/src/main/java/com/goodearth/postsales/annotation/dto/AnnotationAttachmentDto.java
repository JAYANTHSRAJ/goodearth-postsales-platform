package com.goodearth.postsales.annotation.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class AnnotationAttachmentDto {
    private UUID id;
    private UUID annotationId;
    private String workdriveFileId;
    private String mediaType;
}
