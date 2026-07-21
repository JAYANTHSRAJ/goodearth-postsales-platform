package com.goodearth.postsales.client.service;

import com.goodearth.postsales.client.dto.KycApplicationDto;
import com.goodearth.postsales.client.dto.KycModificationRequestDto;

import java.util.UUID;

public interface KycService {
    KycApplicationDto getKycApplication(String email, UUID workflowId);
    KycApplicationDto saveKycDraft(String email, UUID workflowId, String draftData);
    KycApplicationDto submitKycApplication(String email, UUID workflowId, String finalData);
    KycApplicationDto reuseKycApplication(String email, UUID workflowId, UUID sourceKycId);
    KycModificationRequestDto requestKycModification(String email, UUID workflowId, String reason);
}
