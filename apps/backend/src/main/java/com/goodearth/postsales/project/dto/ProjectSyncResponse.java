package com.goodearth.postsales.project.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class ProjectSyncResponse {
    private int totalFetched;
    private int created;
    private int updated;
    private int skipped;
}
