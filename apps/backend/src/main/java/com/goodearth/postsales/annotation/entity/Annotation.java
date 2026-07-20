package com.goodearth.postsales.annotation.entity;

import com.goodearth.postsales.audit.BaseEntity;
import com.goodearth.postsales.auth.entity.User;
import com.goodearth.postsales.document.entity.Document;
import com.goodearth.postsales.workflow.entity.Workflow;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;

@Entity
@Table(name = "annotations")
@Getter
@Setter
@NoArgsConstructor
public class Annotation extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "workflow_id", nullable = false)
    private Workflow workflow;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "document_id", nullable = false)
    private Document document;

    @Column(name = "workdrive_file_id", nullable = false)
    private String workdriveFileId;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "author_id", nullable = false)
    private User author;

    @Column(name = "author_role", nullable = false, length = 50)
    private String authorRole;

    @Enumerated(EnumType.STRING)
    @Column(name = "annotation_type", nullable = false, length = 50)
    private AnnotationType annotationType;

    @Column(name = "x_coordinate", nullable = false, precision = 8, scale = 2)
    private BigDecimal xCoordinate;

    @Column(name = "y_coordinate", nullable = false, precision = 8, scale = 2)
    private BigDecimal yCoordinate;

    @Column(name = "page_number", nullable = false)
    private int pageNumber = 1;

    @Column(name = "color", nullable = false, length = 20)
    private String color = "#FF0000";

    @Column(name = "title", nullable = false)
    private String title;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 50)
    private AnnotationStatus status = AnnotationStatus.OPEN;
}
