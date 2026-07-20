package com.goodearth.postsales.projectupdate.entity;

import com.goodearth.postsales.audit.BaseEntity;
import com.goodearth.postsales.stage.entity.Stage;
import com.goodearth.postsales.workflow.entity.Workflow;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "project_updates")
@Getter
@Setter
@NoArgsConstructor
public class ProjectUpdate extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "workflow_id", nullable = false)
    private Workflow workflow;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "stage_id", nullable = false)
    private Stage stage;

    @Column(name = "title", nullable = false)
    private String title;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(name = "update_type", nullable = false, length = 50)
    private UpdateType updateType;

    @Column(name = "progress_percentage", precision = 5, scale = 2)
    private BigDecimal progressPercentage;

    @Column(name = "published_by")
    private String publishedBy;

    @Column(name = "published_at")
    private LocalDateTime publishedAt;

    @Column(name = "is_visible_to_client", nullable = false)
    private boolean isVisibleToClient = false;

    @Column(name = "location")
    private String location;
}
