package com.goodearth.postsales.projectupdate.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class ProjectUpdateSummaryDto {
    private ProjectUpdateDto update;
    private List<ProjectUpdateMediaDto> media;
}
