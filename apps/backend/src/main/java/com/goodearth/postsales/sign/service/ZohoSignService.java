package com.goodearth.postsales.sign.service;

import com.goodearth.postsales.sign.dto.ZohoSignCreateRequest;
import com.goodearth.postsales.sign.dto.ZohoSignDto;

import java.util.List;
import java.util.Map;
import java.util.UUID;

public interface ZohoSignService {
    ZohoSignDto createSignRequest(ZohoSignCreateRequest request);
    ZohoSignDto getSignRequestStatus(String requestId);
    ZohoSignDto getSignRequestForBooking(String dealIdOrBookingId);
    List<ZohoSignDto> getSignRequestsForWorkflow(UUID workflowId);
    byte[] downloadSignedDocument(String requestId);
    void handleSignWebhook(Map<String, Object> webhookPayload);
    ZohoSignDto reconstructPointerFromZohoSign(String dealRecordId, String bookingId);
}
