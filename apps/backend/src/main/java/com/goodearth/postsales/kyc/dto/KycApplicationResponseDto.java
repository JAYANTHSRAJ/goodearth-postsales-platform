package com.goodearth.postsales.kyc.dto;

import com.goodearth.postsales.document.dto.DocumentSlotDto;
import com.goodearth.postsales.kyc.entity.KycApplicationStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class KycApplicationResponseDto {

    private UUID kycApplicationId;
    private String bookingId;
    private KycApplicationStatus status;
    private Integer completionPercentage;
    private String clientNotes;
    private String applicationDate;
    private String consideringHomeLoan;
    private String hasCoApplicant;
    private String hasThirdApplicant;
    private LocalDateTime submittedAt;
    private LocalDateTime verifiedAt;
    private String verifiedBy;
    private LocalDateTime lastSavedAt;

    private String assignedTo;
    private LocalDateTime assignedAt;
    private String rejectionReason;
    private String editReason;
    private String internalNotes;
    private String priority;
    private Boolean canBuyerEdit;

    private ApplicantDto primaryApplicant;
    private List<ApplicantDto> jointApplicants;
    private List<DocumentSlotDto> documentSlots;
}
