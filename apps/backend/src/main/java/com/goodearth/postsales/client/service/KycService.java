package com.goodearth.postsales.client.service;

import com.goodearth.postsales.client.dto.KycApplicationDto;

public interface KycService {
    KycApplicationDto getKycApplication(String email);
    KycApplicationDto saveKycDraft(String email, String draftData);
    KycApplicationDto submitKycApplication(String email, String finalData);
}
