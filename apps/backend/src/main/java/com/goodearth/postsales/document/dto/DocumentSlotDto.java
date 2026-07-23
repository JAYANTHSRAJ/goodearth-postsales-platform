package com.goodearth.postsales.document.dto;

import com.goodearth.postsales.document.entity.DocumentCategory;
import com.goodearth.postsales.document.entity.DocumentType;
import com.goodearth.postsales.kyc.entity.ApplicantType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DocumentSlotDto {

    private UUID documentId;
    private DocumentCategory documentCategory;
    private DocumentType documentType;
    private ApplicantType applicantType;
    private Boolean isRequired;
    private String status;
    private DocumentVersionDto currentVersion;
}
