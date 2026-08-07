package com.goodearth.postsales.buyer.service;

import com.goodearth.postsales.integration.zoho.dto.ZohoDealResponse;

import java.util.Map;

public interface ZohoBuyerSyncService {
    Map<String, Object> syncBuyers();
    Map<String, Object> syncSingleDeal(String dealId);
    void processSingleDeal(ZohoDealResponse.ZohoDeal crmDeal, Map<String, Object> summary);
}
