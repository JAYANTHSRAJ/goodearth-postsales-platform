package com.goodearth.postsales.kyc.mapper;

import com.goodearth.postsales.document.dto.DocumentSlotDto;
import com.goodearth.postsales.document.entity.Document;
import com.goodearth.postsales.document.entity.DocumentVersion;
import com.goodearth.postsales.document.mapper.DocumentVersionMapper;
import com.goodearth.postsales.kyc.dto.AddressDto;
import com.goodearth.postsales.kyc.dto.ApplicantDto;
import com.goodearth.postsales.kyc.dto.KycApplicationResponseDto;
import com.goodearth.postsales.kyc.entity.ApplicantType;
import com.goodearth.postsales.kyc.entity.KycApplicant;
import com.goodearth.postsales.kyc.entity.KycApplication;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Component
public class KycApplicationMapper {

    private final DocumentVersionMapper documentVersionMapper;

    public KycApplicationMapper(DocumentVersionMapper documentVersionMapper) {
        this.documentVersionMapper = documentVersionMapper;
    }

    public KycApplicationResponseDto toResponseDto(KycApplication application, List<Document> documents) {
        if (application == null) {
            return null;
        }

        ApplicantDto primaryDto = null;
        List<ApplicantDto> jointDtos = new ArrayList<>();

        if (application.getApplicants() != null) {
            for (KycApplicant applicant : application.getApplicants()) {
                ApplicantDto dto = toApplicantDto(applicant);
                if (applicant.getApplicantType() == ApplicantType.PRIMARY) {
                    primaryDto = dto;
                } else {
                    jointDtos.add(dto);
                }
            }
        }

        List<DocumentSlotDto> slotDtos = new ArrayList<>();
        if (documents != null) {
            slotDtos = documents.stream()
                    .map(this::toSlotDto)
                    .collect(Collectors.toList());
        }

        return KycApplicationResponseDto.builder()
                .kycApplicationId(application.getId())
                .bookingId(application.getBookingId())
                .status(application.getStatus())
                .completionPercentage(application.getCompletionPercentage())
                .clientNotes(application.getClientNotes())
                .applicationDate(application.getApplicationDate())
                .consideringHomeLoan(application.getConsideringHomeLoan())
                .hasCoApplicant(application.getHasCoApplicant())
                .hasThirdApplicant(application.getHasThirdApplicant())
                .submittedAt(application.getSubmittedAt())
                .verifiedAt(application.getVerifiedAt())
                .verifiedBy(application.getVerifiedBy())
                .lastSavedAt(application.getUpdatedAt())
                .primaryApplicant(primaryDto)
                .jointApplicants(jointDtos)
                .documentSlots(slotDtos)
                .build();
    }

    public ApplicantDto toApplicantDto(KycApplicant applicant) {
        if (applicant == null) {
            return null;
        }
        AddressDto address = AddressDto.builder()
                .street(applicant.getAddressStreet())
                .addressLine2(applicant.getAddressLine2())
                .city(applicant.getAddressCity())
                .state(applicant.getAddressState())
                .pincode(applicant.getAddressPincode())
                .country(applicant.getAddressCountry())
                .build();

        String rawAadhaar = applicant.getAadhaarNumber();
        String maskedAadhaar = maskAadhaar(rawAadhaar);

        return ApplicantDto.builder()
                .id(applicant.getId())
                .applicantType(applicant.getApplicantType())
                .fullName(applicant.getFullName())
                .salutation(applicant.getSalutation())
                .firstName(applicant.getFirstName())
                .lastName(applicant.getLastName())
                .guardianRelation(applicant.getGuardianRelation())
                .guardianSalutation(applicant.getGuardianSalutation())
                .guardianFirstName(applicant.getGuardianFirstName())
                .guardianLastName(applicant.getGuardianLastName())
                .guardianName(applicant.getGuardianName())
                .dateOfBirth(applicant.getDateOfBirth())
                .occupation(applicant.getOccupation())
                .addressSameAsPrimary(applicant.getAddressSameAsPrimary())
                .addressSameAsSecondary(applicant.getAddressSameAsSecondary())
                .email(applicant.getEmail())
                .phone(applicant.getPhone())
                .relation(applicant.getRelation())
                .panNumber(applicant.getPanNumber())
                .aadhaarNumber(rawAadhaar)
                .maskedAadhaarNumber(maskedAadhaar)
                .address(address)
                .build();
    }

    public DocumentSlotDto toSlotDto(Document document) {
        if (document == null) {
            return null;
        }

        DocumentVersion activeVersion = null;
        if (document.getVersions() != null && !document.getVersions().isEmpty()) {
            activeVersion = document.getVersions().stream()
                    .filter(v -> Boolean.TRUE.equals(v.getIsCurrent()))
                    .findFirst()
                    .orElse(document.getVersions().get(document.getVersions().size() - 1));
        }

        return DocumentSlotDto.builder()
                .documentId(document.getId())
                .documentCategory(document.getCategory())
                .documentType(document.getDocumentType())
                .applicantType(document.getApplicantType())
                .isRequired(document.getIsRequired())
                .status(document.getStatus() != null ? document.getStatus().name() : "PENDING")
                .currentVersion(documentVersionMapper.toDto(activeVersion))
                .build();
    }

    private String maskAadhaar(String aadhaar) {
        if (aadhaar == null || aadhaar.trim().length() < 12) {
            return aadhaar;
        }
        String digits = aadhaar.trim();
        return "XXXX-XXXX-" + digits.substring(digits.length() - 4);
    }
}
