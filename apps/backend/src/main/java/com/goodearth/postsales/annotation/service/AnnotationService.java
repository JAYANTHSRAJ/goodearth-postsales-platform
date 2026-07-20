package com.goodearth.postsales.annotation.service;

import com.goodearth.postsales.annotation.dto.AnnotationAttachmentDto;
import com.goodearth.postsales.annotation.dto.AnnotationCommentDto;
import com.goodearth.postsales.annotation.dto.AnnotationDetailDto;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

public interface AnnotationService {
    AnnotationDetailDto createAnnotation(UUID workflowId, UUID documentId, String workdriveFileId, UUID authorId, String authorRole, String annotationType, BigDecimal xCoordinate, BigDecimal yCoordinate, int pageNumber, String color, String title, String description);
    AnnotationDetailDto updateAnnotation(UUID id, String title, String description, BigDecimal xCoordinate, BigDecimal yCoordinate, int pageNumber, String color);
    void deleteAnnotation(UUID id);
    AnnotationDetailDto approveAnnotation(UUID id, UUID actorId, boolean spawnChangeRequest, String remarks);
    AnnotationDetailDto rejectAnnotation(UUID id, String remarks);
    AnnotationDetailDto resolveAnnotation(UUID id, String remarks);
    AnnotationCommentDto addComment(UUID annotationId, UUID authorId, String authorRole, String comment);
    AnnotationAttachmentDto uploadAttachmentMetadata(UUID annotationId, String workdriveFileId, String mediaType);
    List<AnnotationDetailDto> listAnnotationsByDocument(UUID documentId, String status);
    List<AnnotationDetailDto> listAnnotationsByWorkflow(UUID workflowId, String status);
    List<AnnotationDetailDto> listAllAnnotations();
}
