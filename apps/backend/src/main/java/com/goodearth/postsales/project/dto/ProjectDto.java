package com.goodearth.postsales.project.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class ProjectDto {
    private UUID id;
    private String name;
    private String code;
    private String location;
    private int totalUnits;
    private int activeWorkflows;
    private String status;
    private String commencementDate;
}
