package com.goodearth.postsales.document.config;

import com.goodearth.postsales.document.entity.DocumentType;
import com.goodearth.postsales.kyc.entity.ApplicantType;
import lombok.Builder;
import lombok.Data;

import java.util.Map;
import java.util.Set;

@Data
@Builder
public class DocumentSlotConfig {

    private DocumentType documentType;
    private ApplicantType applicantType;
    private boolean required;
    private long maxSizeBytes;
    private Set<String> allowedMimeTypes;
    private boolean allowMultiple;

    public static final Set<String> DEFAULT_ALLOWED_MIME_TYPES = Set.of(
            "application/pdf",
            "image/jpeg",
            "image/jpg",
            "image/png"
    );

    private static final Map<String, DocumentSlotConfig> SLOT_CONFIGS = Map.ofEntries(
            // Primary Applicant Slots
            Map.entry("PRIMARY_AADHAAR_CARD", DocumentSlotConfig.builder()
                    .documentType(DocumentType.AADHAAR_CARD)
                    .applicantType(ApplicantType.PRIMARY)
                    .required(true)
                    .maxSizeBytes(5 * 1024 * 1024L) // 5MB
                    .allowedMimeTypes(DEFAULT_ALLOWED_MIME_TYPES)
                    .allowMultiple(false)
                    .build()),

            Map.entry("PRIMARY_PAN_CARD", DocumentSlotConfig.builder()
                    .documentType(DocumentType.PAN_CARD)
                    .applicantType(ApplicantType.PRIMARY)
                    .required(true)
                    .maxSizeBytes(5 * 1024 * 1024L) // 5MB
                    .allowedMimeTypes(DEFAULT_ALLOWED_MIME_TYPES)
                    .allowMultiple(false)
                    .build()),

            Map.entry("PRIMARY_ADDRESS_PROOF", DocumentSlotConfig.builder()
                    .documentType(DocumentType.ADDRESS_PROOF)
                    .applicantType(ApplicantType.PRIMARY)
                    .required(true)
                    .maxSizeBytes(5 * 1024 * 1024L) // 5MB
                    .allowedMimeTypes(DEFAULT_ALLOWED_MIME_TYPES)
                    .allowMultiple(true)
                    .build()),

            Map.entry("PRIMARY_VOTER_ID", DocumentSlotConfig.builder()
                    .documentType(DocumentType.VOTER_ID)
                    .applicantType(ApplicantType.PRIMARY)
                    .required(false)
                    .maxSizeBytes(5 * 1024 * 1024L) // 5MB
                    .allowedMimeTypes(DEFAULT_ALLOWED_MIME_TYPES)
                    .allowMultiple(false)
                    .build()),

            // Co-Applicant Slots (JOINT_1)
            Map.entry("JOINT_1_AADHAAR_CARD", DocumentSlotConfig.builder()
                    .documentType(DocumentType.AADHAAR_CARD)
                    .applicantType(ApplicantType.JOINT_1)
                    .required(true)
                    .maxSizeBytes(5 * 1024 * 1024L) // 5MB
                    .allowedMimeTypes(DEFAULT_ALLOWED_MIME_TYPES)
                    .allowMultiple(false)
                    .build()),

            Map.entry("JOINT_1_PAN_CARD", DocumentSlotConfig.builder()
                    .documentType(DocumentType.PAN_CARD)
                    .applicantType(ApplicantType.JOINT_1)
                    .required(true)
                    .maxSizeBytes(5 * 1024 * 1024L) // 5MB
                    .allowedMimeTypes(DEFAULT_ALLOWED_MIME_TYPES)
                    .allowMultiple(false)
                    .build()),

            Map.entry("JOINT_1_ADDRESS_PROOF", DocumentSlotConfig.builder()
                    .documentType(DocumentType.ADDRESS_PROOF)
                    .applicantType(ApplicantType.JOINT_1)
                    .required(true)
                    .maxSizeBytes(5 * 1024 * 1024L) // 5MB
                    .allowedMimeTypes(DEFAULT_ALLOWED_MIME_TYPES)
                    .allowMultiple(true)
                    .build()),

            Map.entry("JOINT_1_VOTER_ID", DocumentSlotConfig.builder()
                    .documentType(DocumentType.VOTER_ID)
                    .applicantType(ApplicantType.JOINT_1)
                    .required(false)
                    .maxSizeBytes(5 * 1024 * 1024L) // 5MB
                    .allowedMimeTypes(DEFAULT_ALLOWED_MIME_TYPES)
                    .allowMultiple(false)
                    .build()),

            // Third Applicant Slots (JOINT_2)
            Map.entry("JOINT_2_AADHAAR_CARD", DocumentSlotConfig.builder()
                    .documentType(DocumentType.AADHAAR_CARD)
                    .applicantType(ApplicantType.JOINT_2)
                    .required(true)
                    .maxSizeBytes(5 * 1024 * 1024L) // 5MB
                    .allowedMimeTypes(DEFAULT_ALLOWED_MIME_TYPES)
                    .allowMultiple(false)
                    .build()),

            Map.entry("JOINT_2_PAN_CARD", DocumentSlotConfig.builder()
                    .documentType(DocumentType.PAN_CARD)
                    .applicantType(ApplicantType.JOINT_2)
                    .required(true)
                    .maxSizeBytes(5 * 1024 * 1024L) // 5MB
                    .allowedMimeTypes(DEFAULT_ALLOWED_MIME_TYPES)
                    .allowMultiple(false)
                    .build()),

            Map.entry("JOINT_2_ADDRESS_PROOF", DocumentSlotConfig.builder()
                    .documentType(DocumentType.ADDRESS_PROOF)
                    .applicantType(ApplicantType.JOINT_2)
                    .required(true)
                    .maxSizeBytes(5 * 1024 * 1024L) // 5MB
                    .allowedMimeTypes(DEFAULT_ALLOWED_MIME_TYPES)
                    .allowMultiple(true)
                    .build()),

            Map.entry("JOINT_2_VOTER_ID", DocumentSlotConfig.builder()
                    .documentType(DocumentType.VOTER_ID)
                    .applicantType(ApplicantType.JOINT_2)
                    .required(false)
                    .maxSizeBytes(2 * 1024 * 1024L) // 2MB
                    .allowedMimeTypes(DEFAULT_ALLOWED_MIME_TYPES)
                    .allowMultiple(false)
                    .build())
    );

    public static DocumentSlotConfig getConfig(ApplicantType applicantType, DocumentType documentType) {
        String key = (applicantType != null ? applicantType.name() : "PRIMARY") + "_" + (documentType != null ? documentType.name() : "OTHER");
        return SLOT_CONFIGS.getOrDefault(key, DocumentSlotConfig.builder()
                .documentType(documentType)
                .applicantType(applicantType)
                .required(false)
                .maxSizeBytes(5 * 1024 * 1024L)
                .allowedMimeTypes(DEFAULT_ALLOWED_MIME_TYPES)
                .allowMultiple(false)
                .build());
    }
}
