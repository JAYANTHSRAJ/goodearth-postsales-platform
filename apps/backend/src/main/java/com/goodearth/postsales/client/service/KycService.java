package com.goodearth.postsales.client.service;

import com.goodearth.postsales.client.dto.*;

import java.util.List;
import java.util.UUID;

public interface KycService {

    // Phase 2 Core Methods
    KycDraftDto saveDraft(UUID userId, KycDraftDto draftDto);
    KycReviewSummaryDto submitKyc(UUID userId, SubmitKycRequestDto submitDto);
    KycReviewSummaryDto getKycByWorkflowId(UUID userId, UUID workflowId);
    KycReviewSummaryDto getKycById(UUID userId, UUID kycId);
    KycStatusResponseDto getKycStatus(UUID workflowId);
    KycReviewSummaryDto adminReview(UUID adminUserId, UUID kycId, AdminReviewRequestDto reviewDto);
    List<KycAuditLogDto> getAuditLogs(UUID kycId);

    // Client Portal Adapter Methods
    KycApplicationDto getKycApplication(String username, UUID workflowId);
    KycApplicationDto saveKycDraft(String username, UUID workflowId, String draftDataJson);
    KycApplicationDto submitKycApplication(String username, UUID workflowId, String formPayloadJson);
    KycApplicationDto reuseKycApplication(String username, UUID targetWorkflowId, UUID sourceKycId);
    KycModificationRequestDto requestKycModification(String username, UUID workflowId, String reason);
}
