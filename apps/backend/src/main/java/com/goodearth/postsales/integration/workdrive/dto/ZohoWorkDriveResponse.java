package com.goodearth.postsales.integration.workdrive.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Getter;
import lombok.Setter;
import java.util.List;

@Getter
@Setter
public class ZohoWorkDriveResponse {
    private List<WorkDriveItem> data;

    @Getter
    @Setter
    public static class WorkDriveItem {
        private String id;
        private String type;
        private WorkDriveAttributes attributes;
      
        public String getResolvedMimeType() {
            return (attributes != null && attributes.getMimeType() != null) ? attributes.getMimeType() : "application/octet-stream";
        }
    }

    @Getter
    @Setter
    public static class WorkDriveAttributes {
        private String name;
        @JsonProperty("mime_type")
        private String mimeType;
        private String status;
        private Long size;
        @JsonProperty("preview_url")
        private String previewUrl;
        @JsonProperty("download_url")
        private String downloadUrl;
        @JsonProperty("uploaded_by")
        private String uploadedBy;
        @JsonProperty("uploaded_at")
        private String uploadedAt;
    }
}
