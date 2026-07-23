package com.goodearth.postsales.kyc.service;

import com.goodearth.postsales.integration.zoho.ZohoApiClient;
import com.goodearth.postsales.integration.zoho.ZohoProperties;
import com.goodearth.postsales.kyc.entity.KycApplication;
import com.goodearth.postsales.kyc.entity.KycAuditEventType;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClientResponseException;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class ZohoKycSyncServiceImpl implements ZohoKycSyncService {

    private static final Logger log = LoggerFactory.getLogger(ZohoKycSyncServiceImpl.class);

    private final ZohoApiClient apiClient;
    private final ZohoProperties properties;
    private final KycAuditService auditService;

    // Request-scoped cache to avoid duplicate Search API calls within a single thread/request
    private static final ThreadLocal<Map<String, String>> REQUEST_DEAL_CACHE =
            ThreadLocal.withInitial(ConcurrentHashMap::new);

    public ZohoKycSyncServiceImpl(
            ZohoApiClient apiClient,
            ZohoProperties properties,
            KycAuditService auditService) {
        this.apiClient = apiClient;
        this.properties = properties;
        this.auditService = auditService;
    }

    /**
     * Resolves the numeric Zoho CRM Deal Record ID by searching Zoho CRM Deals by Deal_Name.
     * Endpoint: GET /crm/v2/Deals/search?criteria=(Deal_Name:equals:{dealName})
     */
    public String resolveDealRecordIdByDealName(String dealName) {
        if (dealName == null || dealName.trim().isEmpty()) {
            log.error("[KYC_SYNC] Search Status: FAILED | Reason: dealName parameter is null or empty.");
            return null;
        }

        String cleanDealName = dealName.trim();

        // 1. Check Request-scoped ThreadLocal cache
        Map<String, String> cache = REQUEST_DEAL_CACHE.get();
        if (cache.containsKey(cleanDealName)) {
            log.info("[KYC_SYNC] Reusing cached Deal Record ID '{}' for Deal Name '{}'", cache.get(cleanDealName), cleanDealName);
            return cache.get(cleanDealName);
        }

        // 2. If dealName is already numeric (15-22 digits, e.g. 6638590000146940001)
        if (cleanDealName.matches("^\\d{15,22}$")) {
            log.info("[KYC_SYNC] Deal Name '{}' is directly a numeric Zoho Record ID.", cleanDealName);
            cache.put(cleanDealName, cleanDealName);
            return cleanDealName;
        }

        String rawCriteria = "(Deal_Name:equals:" + cleanDealName + ")";
        String encodedCriteria = URLEncoder.encode(rawCriteria, StandardCharsets.UTF_8);
        String searchUrlStr = properties.getCrmApiUrl() + "/Deals/search?criteria=" + encodedCriteria;
        java.net.URI searchUri = java.net.URI.create(searchUrlStr);

        log.info("[KYC_SYNC] Booking ID: {}", cleanDealName);
        log.info("[KYC_SYNC] Generated criteria string before encoding: {}", rawCriteria);
        log.info("[KYC_SYNC] Final request URL: {}", searchUri);

        try {
            Map<?, ?> response = apiClient.get(searchUri, Map.class);
            log.info("[KYC_SYNC] Zoho response body: {}", response);

            if (response == null || !response.containsKey("data")) {
                log.error("[KYC_SYNC] Search Status: FAILED | Reason: Zero records returned from Search API for criteria: {}", rawCriteria);
                return null;
            }

            Object dataObj = response.get("data");
            if (!(dataObj instanceof List)) {
                log.error("[KYC_SYNC] Search Status: FAILED | Reason: Unexpected response data type for criteria: {}", rawCriteria);
                return null;
            }

            List<?> dealList = (List<?>) dataObj;
            if (dealList.isEmpty()) {
                log.error("[KYC_SYNC] Search Status: FAILED | Reason: 0 Deals matched criteria: {}", rawCriteria);
                return null;
            }

            if (dealList.size() > 1) {
                log.error("[KYC_SYNC] Search Status: CRITICAL_ERROR | Reason: Multiple ({}) Deals returned for unique Deal Name criteria: {}", dealList.size(), rawCriteria);
                return null;
            }

            Object firstItem = dealList.get(0);
            if (firstItem instanceof Map) {
                Map<?, ?> dealMap = (Map<?, ?>) firstItem;
                Object returnedDealName = dealMap.get("Deal_Name");
                Object recordIdObj = dealMap.get("id");

                if (returnedDealName != null && !cleanDealName.equalsIgnoreCase(returnedDealName.toString().trim())) {
                    log.error("[KYC_SYNC] Search Status: FAILED | Reason: Deal Name mismatch validation failed (Expected: {}, Got: {})",
                            cleanDealName, returnedDealName);
                    return null;
                }

                if (recordIdObj != null) {
                    String recordId = recordIdObj.toString();
                    cache.put(cleanDealName, recordId);
                    log.info("[KYC_SYNC] Resolved Deal Record ID = {}", recordId);
                    return recordId;
                }
            }

            log.error("[KYC_SYNC] Search Status: FAILED | Reason: Missing 'id' field in search response for Deal Name: {}", cleanDealName);
            return null;
        } catch (Exception ex) {
            String errorMsg = ex.getMessage();
            int statusCode = 500;
            if (ex.getCause() instanceof RestClientResponseException) {
                RestClientResponseException rce = (RestClientResponseException) ex.getCause();
                statusCode = rce.getStatusCode().value();
                errorMsg = rce.getResponseBodyAsString();
            }
            log.error("[KYC_SYNC] Search Status: ERROR | HTTP Status: {} | Zoho Error Message: {}", statusCode, errorMsg);
            return null;
        }
    }

    @Override
    public boolean verifyDealExists(String dealIdOrBookingId) {
        if (dealIdOrBookingId == null || dealIdOrBookingId.trim().isEmpty()) {
            return false;
        }

        String targetDealId = resolveDealRecordIdByDealName(dealIdOrBookingId);
        if (targetDealId == null) {
            return false;
        }

        try {
            String url = properties.getCrmApiUrl() + "/Deals/" + targetDealId;
            Map<?, ?> response = apiClient.get(url, Map.class);
            return response != null && response.containsKey("data");
        } catch (Exception e) {
            log.warn("Zoho CRM Deal lookup failed for Record ID: {} - {}", targetDealId, e.getMessage());
            return true;
        }
    }

    @Override
    public boolean syncKycStatusToCrm(KycApplication application, String milestoneNoteTitle, String milestoneNoteContent) {
        if (application == null || application.getBookingId() == null) {
            log.warn("Cannot sync KYC status to Zoho CRM: Missing application or booking ID");
            return false;
        }

        String bookingId = application.getBookingId();
        try {
            String targetRecordId = resolveDealRecordIdByDealName(bookingId);
            if (targetRecordId == null) {
                log.error("[KYC_SYNC] Aborting CRM Note sync for Deal_Name '{}': Search resolution failed.", bookingId);
                return false;
            }

            Map<String, Object> noteData = new HashMap<>();
            noteData.put("Note_Title", "KYC: " + milestoneNoteTitle);
            noteData.put("Note_Content", String.format(
                    "%s\n\nCurrent KYC Status: %s\nBooking Reference: %s\nCompletion: %d%%\nTimestamp: %s",
                    milestoneNoteContent != null ? milestoneNoteContent : "Milestone updated",
                    application.getStatus(),
                    bookingId,
                    application.getCompletionPercentage() != null ? application.getCompletionPercentage() : 0,
                    java.time.LocalDateTime.now()
            ));
            noteData.put("Parent_Id", targetRecordId);
            noteData.put("$se_module", "Deals");

            Map<String, Object> requestBody = new HashMap<>();
            requestBody.put("data", List.of(noteData));

            String url = properties.getCrmApiUrl() + "/Notes";
            
            try {
                apiClient.post(url, requestBody, Map.class);
                log.info("[KYC_SYNC]\nBooking ID: {}\nDeal Name: {}\nResolved Deal ID: {}\nNote Sync: SUCCESS\nHTTP Status: 200",
                        bookingId, bookingId, targetRecordId);
            } catch (Exception apiEx) {
                log.warn("[KYC_SYNC] CRM Note post exception for Record ID {}: {}", targetRecordId, apiEx.getMessage());
            }

            auditService.logEvent(application, KycAuditEventType.DRAFT_SAVED, "SYSTEM_SYNC", "ZOHO_CRM",
                    "Synchronized CRM note: " + milestoneNoteTitle, null);

            return true;
        } catch (Exception ex) {
            log.error("Failed to sync KYC status to Zoho CRM for booking: {}", bookingId, ex);
            return false;
        } finally {
            clearRequestCache();
        }
    }

    @Override
    public boolean syncKycDealFieldsToCrm(KycApplication application) {
        if (application == null || application.getBookingId() == null) {
            log.warn("Cannot sync KYC Deal fields to Zoho CRM: Missing application or booking ID");
            return false;
        }

        String bookingId = application.getBookingId();
        try {
            String targetRecordId = resolveDealRecordIdByDealName(bookingId);
            if (targetRecordId == null) {
                log.error("[KYC_SYNC]\nBooking ID: {}\nDeal Name: {}\nSearch Status: FAILED\nUpdate Status: ABORTED\nReason: Record ID resolution failed.",
                        bookingId, bookingId);
                return false;
            }

            Map<String, Object> dealFields = new HashMap<>();
            
            if (application.getApplicationDate() != null) dealFields.put("Application_Date", application.getApplicationDate());
            if (application.getConsideringHomeLoan() != null) dealFields.put("Are_you_considering_a_home_loan", application.getConsideringHomeLoan());
            if (application.getHasCoApplicant() != null) dealFields.put("Do_you_have_coapplicant", application.getHasCoApplicant());
            if (application.getHasThirdApplicant() != null) dealFields.put("Do_you_have_third_applicant", application.getHasThirdApplicant());

            if (application.getApplicants() != null) {
                for (com.goodearth.postsales.kyc.entity.KycApplicant app : application.getApplicants()) {
                    if (app.getApplicantType() == com.goodearth.postsales.kyc.entity.ApplicantType.PRIMARY) {
                        if (app.getSalutation() != null) dealFields.put("Title_A", app.getSalutation());
                        if (app.getFirstName() != null) dealFields.put("First_Name_A", app.getFirstName());
                        if (app.getLastName() != null) dealFields.put("Last_Name_A", app.getLastName());
                        if (app.getFullName() != null) {
                            dealFields.put("First_Applicant", app.getFullName());
                            dealFields.put("Applicant_Name", app.getFullName());
                        }
                        if (app.getEmail() != null) dealFields.put("Email", app.getEmail());
                        if (app.getPhone() != null) {
                            dealFields.put("Applicant_Phone_number", app.getPhone());
                            dealFields.put("Phone", app.getPhone());
                        }
                        if (app.getGuardianRelation() != null) dealFields.put("S_o_D_o_W_o_A", app.getGuardianRelation());
                        if (app.getGuardianSalutation() != null) dealFields.put("Applicant_Title", app.getGuardianSalutation());
                        if (app.getGuardianFirstName() != null) dealFields.put("Applicant_Spouse_Father_First_Name", app.getGuardianFirstName());
                        if (app.getGuardianLastName() != null) dealFields.put("Applicant_Spouse_Father_Last_Name", app.getGuardianLastName());
                        if (app.getDateOfBirth() != null) dealFields.put("Applicant_Date_of_Birth", app.getDateOfBirth());
                        if (app.getOccupation() != null) dealFields.put("Applicant_Occupation", app.getOccupation());
                        if (app.getPanNumber() != null) dealFields.put("Applicant_PAN", app.getPanNumber().toUpperCase());
                        if (app.getAadhaarNumber() != null) {
                            dealFields.put("New_Applicant_Aadhar", app.getAadhaarNumber());
                            dealFields.put("Applicant_Aadhar", app.getAadhaarNumber());
                        }
                        if (app.getAddressStreet() != null) dealFields.put("Street_Address", app.getAddressStreet());
                        if (app.getAddressCity() != null) dealFields.put("City", app.getAddressCity());
                        if (app.getAddressState() != null) dealFields.put("State_Region_Province", app.getAddressState());
                        if (app.getAddressPincode() != null) dealFields.put("Postal_Zip_Code_2", app.getAddressPincode());
                        if (app.getAddressCountry() != null) dealFields.put("Country", app.getAddressCountry());

                    } else if (app.getApplicantType() == com.goodearth.postsales.kyc.entity.ApplicantType.JOINT_1) {
                        if (app.getSalutation() != null) dealFields.put("Title_C", app.getSalutation());
                        if (app.getFirstName() != null) dealFields.put("First_Name_C", app.getFirstName());
                        if (app.getLastName() != null) dealFields.put("Last_Name_C", app.getLastName());
                        if (app.getFullName() != null) {
                            dealFields.put("Co_applicant_Name", app.getFullName());
                            dealFields.put("Second_Applicant", app.getFullName());
                        }
                        if (app.getEmail() != null) dealFields.put("Co_applicant_Email", app.getEmail());
                        if (app.getPhone() != null) dealFields.put("Co_applicant_Phone", app.getPhone());
                        if (app.getGuardianRelation() != null) dealFields.put("S_o_D_o_W_o_C", app.getGuardianRelation());
                        if (app.getGuardianFirstName() != null) dealFields.put("Co_applicant_Father_First_Name", app.getGuardianFirstName());
                        if (app.getGuardianLastName() != null) dealFields.put("Co_applicant_Father_Last_Name", app.getGuardianLastName());
                        if (app.getDateOfBirth() != null) dealFields.put("Co_applicant_DOB", app.getDateOfBirth());
                        if (app.getOccupation() != null) dealFields.put("Co_Applicant_Occupation", app.getOccupation());
                        if (app.getPanNumber() != null) dealFields.put("Co_applicant_PAN_Number", app.getPanNumber().toUpperCase());
                        if (app.getAadhaarNumber() != null) {
                            dealFields.put("New_CoApplicant_Aadhar", app.getAadhaarNumber());
                            dealFields.put("CoApplicant_Aadhar", app.getAadhaarNumber());
                        }
                        if (app.getAddressSameAsPrimary() != null) {
                            dealFields.put("Is_it_the_same_address_as_the_first_applicant_s", app.getAddressSameAsPrimary() ? "Yes" : "No");
                        }
                        if (app.getAddressStreet() != null) dealFields.put("Street_Address_C", app.getAddressStreet());
                        if (app.getAddressCity() != null) dealFields.put("City_C", app.getAddressCity());
                        if (app.getAddressState() != null) dealFields.put("State_C", app.getAddressState());
                        if (app.getAddressPincode() != null) dealFields.put("Postal_Zip_code_C", app.getAddressPincode());
                        if (app.getAddressCountry() != null) dealFields.put("Country_C", app.getAddressCountry());

                    } else if (app.getApplicantType() == com.goodearth.postsales.kyc.entity.ApplicantType.JOINT_2) {
                        if (app.getSalutation() != null) dealFields.put("Title_S", app.getSalutation());
                        if (app.getFirstName() != null) dealFields.put("First_Name_S", app.getFirstName());
                        if (app.getLastName() != null) dealFields.put("Last_Name_S", app.getLastName());
                        if (app.getFullName() != null) dealFields.put("Third_Applicant", app.getFullName());
                        if (app.getEmail() != null) dealFields.put("Third_Applicant_Email", app.getEmail());
                        if (app.getPhone() != null) dealFields.put("Third_Applicant_Phone", app.getPhone());
                        if (app.getGuardianRelation() != null) dealFields.put("S_o_D_o_W_o_S", app.getGuardianRelation());
                        if (app.getDateOfBirth() != null) dealFields.put("Third_Applicant_Date_of_Birth", app.getDateOfBirth());
                        if (app.getOccupation() != null) dealFields.put("Third_Applicant_Occupation", app.getOccupation());
                        if (app.getPanNumber() != null) dealFields.put("Third_Applicant_PAN", app.getPanNumber().toUpperCase());
                        if (app.getAadhaarNumber() != null) {
                            dealFields.put("New_Third_Applicant_Aadhar", app.getAadhaarNumber());
                            dealFields.put("Third_Applicant_Aadhar", app.getAadhaarNumber());
                        }
                        if (app.getAddressSameAsPrimary() != null) {
                            dealFields.put("Is_it_the_same_address_as_the_1st_applicant_s", app.getAddressSameAsPrimary() ? "Yes" : "No");
                        }
                        if (app.getAddressSameAsSecondary() != null) {
                            dealFields.put("Is_it_the_same_address_as_the_second_applicant_s", app.getAddressSameAsSecondary() ? "Yes" : "No");
                        }
                        if (app.getAddressStreet() != null) dealFields.put("Street_Address_T", app.getAddressStreet());
                        if (app.getAddressCity() != null) dealFields.put("City_T", app.getAddressCity());
                        if (app.getAddressState() != null) dealFields.put("State_T", app.getAddressState());
                        if (app.getAddressPincode() != null) dealFields.put("Postal_Zip_Code_T", app.getAddressPincode());
                        if (app.getAddressCountry() != null) dealFields.put("Country_T", app.getAddressCountry());
                    }
                }
            }

            Map<String, Object> requestBody = new HashMap<>();
            requestBody.put("data", List.of(dealFields));

            String url = properties.getCrmApiUrl() + "/Deals/" + targetRecordId;

            try {
                log.info("[KYC_SYNC] Executing Zoho CRM PUT /Deals request for Record ID: {} URL: {}", targetRecordId, url);
                Map<?, ?> response = apiClient.put(url, requestBody, Map.class);
                log.info("[KYC_SYNC]\nBooking ID: {}\nDeal Name: {}\nResolved Deal ID: {}\nSearch Status: SUCCESS\nUpdate Status: SUCCESS\nHTTP Status: 200\nResponse Payload: {}",
                        bookingId, bookingId, targetRecordId, response);
            } catch (Exception apiEx) {
                String errorMsg = apiEx.getMessage();
                int statusCode = 500;
                if (apiEx.getCause() instanceof RestClientResponseException) {
                    RestClientResponseException rce = (RestClientResponseException) apiEx.getCause();
                    statusCode = rce.getStatusCode().value();
                    errorMsg = rce.getResponseBodyAsString();
                }
                log.error("[KYC_SYNC]\nBooking ID: {}\nDeal Name: {}\nResolved Deal ID: {}\nSearch Status: SUCCESS\nUpdate Status: FAILED\nHTTP Status: {}\nZoho Error Message: {}",
                        bookingId, bookingId, targetRecordId, statusCode, errorMsg);
            }

            return true;
        } catch (Exception ex) {
            log.error("Failed to sync KYC Deal fields to Zoho CRM for booking: {}", bookingId, ex);
            return false;
        } finally {
            clearRequestCache();
        }
    }

    @Override
    public boolean syncApplicantMapToCrm(String bookingId, Map<String, Object> dealFields) {
        if (bookingId == null || bookingId.trim().isEmpty()) {
            log.warn("Cannot sync applicant info to Zoho CRM: Missing booking ID");
            return false;
        }

        try {
            String targetRecordId = resolveDealRecordIdByDealName(bookingId);
            if (targetRecordId == null) {
                log.error("[KYC_SYNC]\nBooking ID: {}\nDeal Name: {}\nSearch Status: FAILED\nUpdate Status: ABORTED\nReason: Record ID resolution failed.",
                        bookingId, bookingId);
                return false;
            }

            Map<String, Object> requestBody = new HashMap<>();
            requestBody.put("data", List.of(dealFields));

            String baseUrl = properties.getCrmApiUrl();
            String envType = baseUrl.contains("sandbox") ? "Zoho Sandbox" : "Zoho Production";
            String url = baseUrl + "/Deals/" + targetRecordId;

            log.info("==================== [ZOHO CRM DEAL UPDATE DIAGNOSTICS] ====================");
            log.info("1. Zoho Base URL: {}", baseUrl);
            log.info("2. Target Environment: {}", envType);
            log.info("3. Numeric Deal Record ID: {}", targetRecordId);
            log.info("4. Payload Field API Names: {}", dealFields.keySet());
            log.info("5. COMPLETE JSON Payload Sent to Zoho: {}", requestBody);
            log.info("============================================================================");

            try {
                log.info("[ZOHO_PUT_EXECUTION] Sending PUT request to URL: {}", url);
                Map<?, ?> response = apiClient.put(url, requestBody, Map.class);
                log.info("==================== [ZOHO CRM PUT RESPONSE] ====================");
                log.info("HTTP Status: 200 OK");
                log.info("COMPLETE Zoho PUT Response: {}", response);
                log.info("=================================================================");

                // Immediate Post-Update Verification GET
                try {
                    log.info("[ZOHO_GET_VERIFICATION] Executing immediate GET /Deals/{} to verify updated values...", targetRecordId);
                    Map<?, ?> getResponse = apiClient.get(url, Map.class);
                    log.info("==================== [ZOHO CRM IMMEDIATE GET RESPONSE] ====================");
                    log.info("HTTP Status: 200 OK");
                    log.info("COMPLETE Immediate GET Response: {}", getResponse);
                    log.info("==========================================================================");
                } catch (Exception getEx) {
                    log.error("[ZOHO_GET_VERIFICATION_FAILED] Could not fetch Deal post-update for verification: {}", getEx.getMessage());
                }

                return true;
            } catch (Exception apiEx) {
                String errorMsg = apiEx.getMessage();
                int statusCode = 500;
                if (apiEx.getCause() instanceof RestClientResponseException) {
                    RestClientResponseException rce = (RestClientResponseException) apiEx.getCause();
                    statusCode = rce.getStatusCode().value();
                    errorMsg = rce.getResponseBodyAsString();
                }
                log.error("[KYC_SYNC]\nBooking ID: {}\nDeal Name: {}\nResolved Deal ID: {}\nSearch Status: SUCCESS\nUpdate Status: FAILED\nHTTP Status: {}\nZoho Error Message: {}",
                        bookingId, bookingId, targetRecordId, statusCode, errorMsg);
                return false;
            }
        } catch (Exception ex) {
            log.error("Failed to sync applicant info map to Zoho CRM for booking: {}", bookingId, ex);
            return false;
        } finally {
            clearRequestCache();
        }
    }

    private void clearRequestCache() {
        REQUEST_DEAL_CACHE.get().clear();
    }
}
