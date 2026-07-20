package com.goodearth.postsales.buyer.service;

import java.util.Map;

public interface ZohoBuyerSyncService {
    Map<String, Object> syncBuyers();
    Map<String, Object> syncSingleDeal(String dealId);
}
