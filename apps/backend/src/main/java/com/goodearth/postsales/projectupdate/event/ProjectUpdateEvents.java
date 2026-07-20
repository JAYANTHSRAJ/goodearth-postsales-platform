package com.goodearth.postsales.projectupdate.event;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

public final class ProjectUpdateEvents {

    private ProjectUpdateEvents() {}

    public static record ProjectUpdateCreatedEvent(
            UUID updateId,
            String title,
            UUID workflowId
    ) {}

    public static record ProjectUpdatePublishedEvent(
            UUID updateId,
            String title,
            String description,
            UUID workflowId,
            UUID stageId,
            boolean isVisibleToClient,
            BigDecimal progressPercentage,
            String publishedBy,
            LocalDateTime publishedAt
    ) {}

    public static record ProjectUpdateHiddenEvent(
            UUID updateId,
            UUID workflowId
    ) {}
}
