package com.goodearth.postsales.annotation.event;

import java.util.UUID;

public final class AnnotationEvents {

    private AnnotationEvents() {}

    public static record AnnotationCreatedEvent(
            UUID annotationId,
            String authorName,
            UUID workflowId
    ) {}

    public static record AnnotationUpdatedEvent(
            UUID annotationId,
            UUID workflowId
    ) {}

    public static record AnnotationResolvedEvent(
            UUID annotationId,
            UUID workflowId
    ) {}

    public static record AnnotationApprovedEvent(
            UUID annotationId,
            UUID workflowId,
            UUID changeRequestId // Nullable if no change request is spawned
    ) {}

    public static record AnnotationRejectedEvent(
            UUID annotationId,
            UUID workflowId
    ) {}
}
