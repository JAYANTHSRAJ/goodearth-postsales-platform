package com.goodearth.postsales.project.entity;

import com.goodearth.postsales.audit.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "projects")
@Getter
@Setter
@NoArgsConstructor
public class Project extends BaseEntity {

    @Column(name = "zoho_deal_id", unique = true, nullable = false)
    private String zohoDealId;

    @Column(name = "project_name", nullable = false)
    private String projectName;

    @Column(name = "project_code")
    private String projectCode;

    @Column(name = "location")
    private String location;

    @Column(name = "status")
    private String status;
}
