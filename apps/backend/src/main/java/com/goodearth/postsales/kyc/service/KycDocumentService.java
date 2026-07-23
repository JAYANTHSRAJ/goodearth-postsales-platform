package com.goodearth.postsales.kyc.service;

import com.goodearth.postsales.document.dto.DocumentDownloadResponseDto;
import com.goodearth.postsales.document.dto.DocumentUploadResponseDto;
import com.goodearth.postsales.document.entity.DocumentCategory;
import com.goodearth.postsales.document.entity.DocumentType;
import com.goodearth.postsales.kyc.dto.KycDocumentStreamDto;
import com.goodearth.postsales.kyc.entity.ApplicantType;

import java.util.UUID;

public interface KycDocumentService {
    DocumentUploadResponseDto uploadKycDocument(
            UUID kycApplicationId,
            DocumentCategory category,
            DocumentType docType,
            ApplicantType applicantType,
            String fileName,
            String contentType,
            long size,
            byte[] content,
            String uploadedBy
    );

    boolean deleteKycDocument(UUID documentId, String actorId);

    DocumentDownloadResponseDto generateDownloadUrl(UUID documentId, Integer versionNumber, String actorId);

    KycDocumentStreamDto streamKycDocumentFile(UUID documentId, Integer versionNumber, String actorId);
}
