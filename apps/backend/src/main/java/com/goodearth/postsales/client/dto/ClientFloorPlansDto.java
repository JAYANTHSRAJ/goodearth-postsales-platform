package com.goodearth.postsales.client.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class ClientFloorPlansDto {
    private ClientDrawingSummaryDto latestDrawing;
    private List<ClientDrawingSummaryDto> allPreviousVersions;
    private String previewUrl;
    private String downloadUrl;
    private List<ClientDrawingSummaryDto> revisionHistory;
}
