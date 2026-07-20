package com.goodearth.postsales.annotation.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.UUID;

@Entity
@Table(name = "annotation_attachments")
@Getter
@Setter
@NoArgsConstructor
public class AnnotationAttachment {

    @Id
    private UUID id = UUID.randomUUID();

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "annotation_id", nullable = false)
    private Annotation annotation;

    @Column(name = "workdrive_file_id", nullable = false)
    private String workdriveFileId;

    @Column(name = "media_type", nullable = false, length = 50)
    private String mediaType;
}
