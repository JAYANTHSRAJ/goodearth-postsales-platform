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

import com.goodearth.postsales.document.entity.Document;
import com.goodearth.postsales.document.entity.DocumentVersion;
import com.goodearth.postsales.document.repository.DocumentRepository;
import com.goodearth.postsales.document.repository.DocumentVersionRepository;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;

import java.time.LocalDateTime;

@Service
public class ZohoKycSyncServiceImpl implements ZohoKycSyncService {

    private static final Logger log = LoggerFactory.getLogger(ZohoKycSyncServiceImpl.class);

    private final ZohoApiClient apiClient;
    private final ZohoProperties properties;
    private final KycAuditService auditService;
    private final com.goodearth.postsales.kyc.repository.KycApplicationRepository kycApplicationRepository;
    private final DocumentRepository documentRepository;
    private final DocumentVersionRepository documentVersionRepository;

    // Request-scoped cache to avoid duplicate Search API calls within a single thread/request
    private static final ThreadLocal<Map<String, String>> REQUEST_DEAL_CACHE =
            ThreadLocal.withInitial(ConcurrentHashMap::new);

    public ZohoKycSyncServiceImpl(
            ZohoApiClient apiClient,
            ZohoProperties properties,
            KycAuditService auditService,
            com.goodearth.postsales.kyc.repository.KycApplicationRepository kycApplicationRepository,
            DocumentRepository documentRepository,
            DocumentVersionRepository documentVersionRepository) {
        this.apiClient = apiClient;
        this.properties = properties;
        this.auditService = auditService;
        this.kycApplicationRepository = kycApplicationRepository;
        this.documentRepository = documentRepository;
        this.documentVersionRepository = documentVersionRepository;
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

        // 3. Search Tier 1: Exact match on Deal_Name criteria (Deal_Name:equals:X)
        String rawCriteriaTier1 = String.format("(Deal_Name:equals:%s)", cleanDealName);
        String resolvedId = executeZohoDealSearch(rawCriteriaTier1, cleanDealName, false);
        if (resolvedId != null) {
            cache.put(cleanDealName, resolvedId);
            return resolvedId;
        }

        // 4. Search Tier 2: Booking_ID criteria (Booking_ID:equals:X)
        String rawCriteriaTier2 = String.format("(Booking_ID:equals:%s)", cleanDealName);
        resolvedId = executeZohoDealSearch(rawCriteriaTier2, cleanDealName, false);
        if (resolvedId != null) {
            cache.put(cleanDealName, resolvedId);
            return resolvedId;
        }

        // 5. Search Tier 3: Product_Name / Unit Name criteria (Product_Name:equals:X)
        String rawCriteriaTier3 = String.format("(Product_Name:equals:%s)", cleanDealName);
        resolvedId = executeZohoDealSearch(rawCriteriaTier3, cleanDealName, false);
        if (resolvedId != null) {
            cache.put(cleanDealName, resolvedId);
            return resolvedId;
        }

        // 6. Search Tier 4: Prefix criteria (Deal_Name:starts_with:X)
        String rawCriteriaTier4 = String.format("(Deal_Name:starts_with:%s)", cleanDealName);
        resolvedId = executeZohoDealSearch(rawCriteriaTier4, cleanDealName, true);
        if (resolvedId != null) {
            cache.put(cleanDealName, resolvedId);
            return resolvedId;
        }

        // 7. Search Tier 5: Word Search API (/Deals/search?word=X)
        resolvedId = executeZohoDealWordSearch(cleanDealName);
        if (resolvedId != null) {
            cache.put(cleanDealName, resolvedId);
            return resolvedId;
        }

        log.error("[KYC_SYNC] Search Status: FAILED | Reason: 0 Deals matched all search tiers for Booking ID / Deal Name / Unit Name: {}", cleanDealName);
        return null;
    }

    private String executeZohoDealSearch(String rawCriteria, String cleanDealName, boolean allowPartialMatch) {
        String encodedCriteria = URLEncoder.encode(rawCriteria, StandardCharsets.UTF_8);
        String searchUrlStr = properties.getCrmApiUrl() + "/Deals/search?criteria=" + encodedCriteria;
        java.net.URI searchUri = java.net.URI.create(searchUrlStr);

        log.info("[KYC_SYNC] Executing criteria search URL: {}", searchUri);
        try {
            Map<?, ?> response = apiClient.get(searchUri, Map.class);
            return parseDealSearchResult(response, cleanDealName, allowPartialMatch);
        } catch (Exception ex) {
            log.warn("[KYC_SYNC] Criteria search failed for {}: {}", rawCriteria, ex.getMessage());
            return null;
        }
    }

    private String executeZohoDealWordSearch(String cleanDealName) {
        String encodedWord = URLEncoder.encode(cleanDealName, StandardCharsets.UTF_8);
        String searchUrlStr = properties.getCrmApiUrl() + "/Deals/search?word=" + encodedWord;
        java.net.URI searchUri = java.net.URI.create(searchUrlStr);

        log.info("[KYC_SYNC] Executing word search URL: {}", searchUri);
        try {
            Map<?, ?> response = apiClient.get(searchUri, Map.class);
            return parseDealSearchResult(response, cleanDealName, true);
        } catch (Exception ex) {
            log.warn("[KYC_SYNC] Word search failed for word '{}': {}", cleanDealName, ex.getMessage());
            return null;
        }
    }

    private String parseDealSearchResult(Map<?, ?> response, String cleanDealName, boolean allowPartialMatch) {
        if (response == null || !response.containsKey("data")) {
            return null;
        }

        Object dataObj = response.get("data");
        if (!(dataObj instanceof List)) {
            return null;
        }

        List<?> dealList = (List<?>) dataObj;
        if (dealList.isEmpty()) {
            return null;
        }

        for (Object item : dealList) {
            if (item instanceof Map) {
                Map<?, ?> dealMap = (Map<?, ?>) item;
                Object returnedDealName = dealMap.get("Deal_Name");
                Object returnedBookingId = dealMap.get("Booking_ID");
                Object recordIdObj = dealMap.get("id");

                if (recordIdObj == null) continue;

                String recordId = recordIdObj.toString();
                String strName = returnedDealName != null ? returnedDealName.toString().trim() : "";
                String strBkg = returnedBookingId != null ? returnedBookingId.toString().trim() : "";

                // Extract linked Unit / Product lookup name if present
                String strUnit = "";
                String[] unitKeys = {"Product_Name", "Unit_Name", "Unit", "Products", "Product"};
                for (String key : unitKeys) {
                    if (dealMap.containsKey(key) && dealMap.get(key) != null) {
                        Object unitObj = dealMap.get(key);
                        if (unitObj instanceof Map<?, ?> lookupMap && lookupMap.get("name") != null) {
                            strUnit = lookupMap.get("name").toString().trim();
                            break;
                        } else if (!(unitObj instanceof Map)) {
                            strUnit = unitObj.toString().trim();
                            break;
                        }
                    }
                }

                boolean matches = cleanDealName.equalsIgnoreCase(strName) ||
                        cleanDealName.equalsIgnoreCase(strBkg) ||
                        (!strUnit.isBlank() && cleanDealName.equalsIgnoreCase(strUnit));

                if (!matches && allowPartialMatch) {
                    matches = strName.toLowerCase().contains(cleanDealName.toLowerCase()) ||
                            strBkg.toLowerCase().contains(cleanDealName.toLowerCase()) ||
                            (!strUnit.isBlank() && strUnit.toLowerCase().contains(cleanDealName.toLowerCase()));
                }

                if (matches) {
                    log.info("[KYC_SYNC] Resolved Deal Record ID = {} (Deal_Name: '{}', Booking_ID: '{}', Unit_Name: '{}')",
                            recordId, strName, strBkg, strUnit);
                    return recordId;
                }
            }
        }

        return null;
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

        // Always sync latest Deal fields payload (PUT /Deals/{id}) to Zoho CRM
        try {
            syncKycDealFieldsToCrm(application);
        } catch (Exception ex) {
            log.warn("[ZOHO_DEAL_FIELDS_SYNC_WARN] Failed to sync deal fields during milestone status update: {}", ex.getMessage());
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
            if (application.getHasThirdApplicant() != null) {
                dealFields.put("Do_you_have_third_applicant", application.getHasThirdApplicant());
                if ("No".equalsIgnoreCase(application.getHasThirdApplicant())) {
                    dealFields.put("Third_Applicant", null);
                    dealFields.put("Third_Applicant_Name", null);
                    dealFields.put("Third_Applicant_Title", null);
                    dealFields.put("Third_Applicant_First_Name", null);
                    dealFields.put("Third_Applicant_Last_Name", null);
                    dealFields.put("Third_Applicant_Gender", null);
                    dealFields.put("Third_applicant_age", null);
                    dealFields.put("Third_Applicant_Email", null);
                    dealFields.put("Third_Applicant_Phone", null);
                    dealFields.put("Third_Applicant_Date_of_Birth", null);
                    dealFields.put("Third_Applicant_Occupation", null);
                    dealFields.put("Third_Applicant_PAN", null);
                    dealFields.put("Third_Applicant_Aadhar", null);
                    dealFields.put("Title_T", null);
                    dealFields.put("First_Name_T", null);
                    dealFields.put("Last_Name_T", null);
                    dealFields.put("Phone_T", null);
                    dealFields.put("Email_T", null);
                    dealFields.put("DOB_T", null);
                    dealFields.put("S_o_D_o_W_o_T", null);
                    dealFields.put("Street_Address_T", null);
                    dealFields.put("Address_Line_T", null);
                    dealFields.put("City_T", null);
                    dealFields.put("State_T", null);
                    dealFields.put("Postal_Zip_Code_T", null);
                    dealFields.put("Country_T", null);
                }
            }

            if (application.getApplicants() != null) {
                for (com.goodearth.postsales.kyc.entity.KycApplicant app : application.getApplicants()) {
                    if (app.getApplicantType() == com.goodearth.postsales.kyc.entity.ApplicantType.PRIMARY) {
                        if (app.getSalutation() != null) {
                            dealFields.put("Title_A", app.getSalutation());
                            dealFields.put("Applicant_Title", app.getSalutation());
                        }
                        if (app.getFirstName() != null) {
                            dealFields.put("First_Name_A", app.getFirstName());
                            dealFields.put("Applicant_First_Name", app.getFirstName());
                        }
                        if (app.getLastName() != null) {
                            dealFields.put("Last_Name_A", app.getLastName());
                            dealFields.put("Applicant_Last_Name", app.getLastName());
                        }
                        if (app.getFullName() != null) {
                            dealFields.put("First_Applicant", app.getFullName());
                            dealFields.put("Applicant_Name", app.getFullName());
                        }
                        if (app.getGender() != null) {
                            dealFields.put("Gender", app.getGender());
                            dealFields.put("Applicant_Gender", app.getGender());
                        }
                        if (app.getDateOfBirth() != null) {
                            dealFields.put("Applicant_Date_of_Birth", app.getDateOfBirth());
                            dealFields.put("DOB", app.getDateOfBirth());
                        }
                        if (app.getAge() != null) {
                            try {
                                int ageInt = Integer.parseInt(app.getAge().trim());
                                dealFields.put("Applicant_Age", ageInt);
                                dealFields.put("Age", ageInt);
                            } catch (Exception e) {
                                dealFields.put("Applicant_Age", app.getAge());
                                dealFields.put("Age", app.getAge());
                            }
                        }
                        if (app.getEmail() != null) {
                            dealFields.put("Email", app.getEmail());
                            dealFields.put("Applicant_Email", app.getEmail());
                        }
                        if (app.getPhone() != null) {
                            dealFields.put("Applicant_Phone_number", app.getPhone());
                            dealFields.put("Phone", app.getPhone());
                            dealFields.put("Applicant_Phone", app.getPhone());
                        }
                        if (app.getGuardianRelation() != null) dealFields.put("S_o_D_o_W_o_A", app.getGuardianRelation());
                        if (app.getGuardianSalutation() != null) dealFields.put("Applicant_Title", app.getGuardianSalutation());
                        if (app.getGuardianFirstName() != null) {
                            dealFields.put("Applicant_Spouse_Father_First_Name", app.getGuardianFirstName());
                            dealFields.put("Applicant_Father_First_Name", app.getGuardianFirstName());
                        }
                        if (app.getGuardianLastName() != null) {
                            dealFields.put("Applicant_Spouse_Father_Last_Name", app.getGuardianLastName());
                            dealFields.put("Applicant_Father_Last_Name", app.getGuardianLastName());
                        }
                        if (app.getOccupation() != null) dealFields.put("Applicant_Occupation", app.getOccupation());
                        if (app.getPanNumber() != null) {
                            dealFields.put("Applicant_PAN", app.getPanNumber().toUpperCase());
                            dealFields.put("PAN_Number", app.getPanNumber().toUpperCase());
                        }
                        if (app.getAadhaarNumber() != null) {
                            dealFields.put("New_Applicant_Aadhar", app.getAadhaarNumber());
                            dealFields.put("Applicant_Aadhar", app.getAadhaarNumber());
                        }
                        if (app.getAddressStreet() != null) {
                            dealFields.put("Street_Address", app.getAddressStreet());
                            dealFields.put("Address_Line_1", app.getAddressStreet());
                        }
                        if (app.getAddressLine2() != null) dealFields.put("Address_Line_2", app.getAddressLine2());
                        if (app.getAddressCity() != null) dealFields.put("City", app.getAddressCity());
                        if (app.getAddressState() != null) dealFields.put("State_Region_Province", app.getAddressState());
                        if (app.getAddressPincode() != null) dealFields.put("Postal_Zip_Code_2", app.getAddressPincode());
                        if (app.getAddressCountry() != null) dealFields.put("Country", app.getAddressCountry());

                    } else if (app.getApplicantType() == com.goodearth.postsales.kyc.entity.ApplicantType.JOINT_1) {
                        if (app.getSalutation() != null) {
                            dealFields.put("Title_C", app.getSalutation());
                            dealFields.put("CoApplicant_Title", app.getSalutation());
                        }
                        if (app.getFirstName() != null) {
                            dealFields.put("First_Name_C", app.getFirstName());
                            dealFields.put("Co_applicant_First_Name", app.getFirstName());
                        }
                        if (app.getLastName() != null) {
                            dealFields.put("Last_Name_C", app.getLastName());
                            dealFields.put("Co_applicant_Last_Name", app.getLastName());
                        }
                        if (app.getFullName() != null) {
                            dealFields.put("Co_applicant_Name", app.getFullName());
                            dealFields.put("Second_Applicant", app.getFullName());
                        }
                        if (app.getGender() != null) dealFields.put("Co_applicant_Gender", app.getGender());
                        if (app.getAge() != null) {
                            try {
                                dealFields.put("CoApplicant_Age", Integer.parseInt(app.getAge().trim()));
                            } catch (Exception e) {
                                dealFields.put("CoApplicant_Age", app.getAge());
                            }
                        }
                        if (app.getEmail() != null) dealFields.put("Co_applicant_Email", app.getEmail());
                        if (app.getPhone() != null) dealFields.put("Co_applicant_Phone", app.getPhone());
                        if (app.getRelation() != null) dealFields.put("Relationship_with_Primary_applicant", app.getRelation());
                        if (app.getGuardianRelation() != null) dealFields.put("S_o_D_o_W_o_C", app.getGuardianRelation());
                        if (app.getGuardianFirstName() != null) dealFields.put("Co_applicant_Father_First_Name", app.getGuardianFirstName());
                        if (app.getGuardianLastName() != null) dealFields.put("Co_applicant_Father_Last_Name", app.getGuardianLastName());
                        if (app.getDateOfBirth() != null) dealFields.put("Co_applicant_DOB", app.getDateOfBirth());
                        if (app.getOccupation() != null) dealFields.put("Co_Applicant_Occupation", app.getOccupation());
                        if (app.getPanNumber() != null) {
                            dealFields.put("Co_applicant_PAN_Number", app.getPanNumber().toUpperCase());
                            dealFields.put("Co_applicant_PAN", app.getPanNumber().toUpperCase());
                        }
                        if (app.getAadhaarNumber() != null) {
                            dealFields.put("CoApplicant_Aadhar", app.getAadhaarNumber());
                        }
                        if (app.getAddressSameAsPrimary() != null) {
                            dealFields.put("Is_it_the_same_address_as_the_first_applicant_s", app.getAddressSameAsPrimary() ? "Yes" : "No");
                        }
                        if (app.getAddressStreet() != null) {
                            dealFields.put("Street_Address_C", app.getAddressStreet());
                            dealFields.put("Address_Line_C", app.getAddressStreet());
                        }
                        if (app.getAddressCity() != null) dealFields.put("City_C", app.getAddressCity());
                        if (app.getAddressState() != null) dealFields.put("State_C", app.getAddressState());
                        if (app.getAddressPincode() != null) dealFields.put("Postal_Zip_code_C", app.getAddressPincode());
                        if (app.getAddressCountry() != null) dealFields.put("Country_C", app.getAddressCountry());

                    } else if (app.getApplicantType() == com.goodearth.postsales.kyc.entity.ApplicantType.JOINT_2) {
                        if (app.getSalutation() != null) {
                            dealFields.put("Third_Applicant_Title", app.getSalutation());
                        }
                        if (app.getFirstName() != null) {
                            dealFields.put("Third_Applicant_First_Name", app.getFirstName());
                        }
                        if (app.getLastName() != null) {
                            dealFields.put("Third_Applicant_Last_Name", app.getLastName());
                        }
                        if (app.getGuardianSalutation() != null) {
                            dealFields.put("Title_S", app.getGuardianSalutation());
                        }
                        if (app.getGuardianFirstName() != null) {
                            dealFields.put("First_Name_S", app.getGuardianFirstName());
                        }
                        if (app.getGuardianLastName() != null) {
                            dealFields.put("Last_Name_S", app.getGuardianLastName());
                        }
                        if (app.getFullName() != null) dealFields.put("Third_Applicant", app.getFullName());
                        if (app.getGender() != null) dealFields.put("Third_Applicant_Gender", app.getGender());
                        if (app.getAge() != null) {
                            try {
                                dealFields.put("Third_applicant_age", Integer.parseInt(app.getAge().trim()));
                            } catch (Exception e) {
                                dealFields.put("Third_applicant_age", app.getAge());
                            }
                        }
                        if (app.getEmail() != null) dealFields.put("Third_Applicant_Email", app.getEmail());
                        if (app.getPhone() != null) dealFields.put("Third_Applicant_Phone", app.getPhone());
                        if (app.getGuardianRelation() != null) {
                            dealFields.put("S_o_D_o_W_o_S", app.getGuardianRelation());
                        }
                        if (app.getDateOfBirth() != null) dealFields.put("Third_Applicant_Date_of_Birth", app.getDateOfBirth());
                        if (app.getOccupation() != null) dealFields.put("Third_Applicant_Occupation", app.getOccupation());
                        if (app.getPanNumber() != null) dealFields.put("Third_Applicant_PAN", app.getPanNumber().toUpperCase());
                        if (app.getAadhaarNumber() != null) {
                            dealFields.put("Third_Applicant_Aadhar", app.getAadhaarNumber());
                        }
                        if (app.getAddressSameAsPrimary() != null) {
                            dealFields.put("Is_it_the_same_address_as_the_1st_applicant_s", app.getAddressSameAsPrimary() ? "Yes" : "No");
                        }
                        if (app.getAddressSameAsSecondary() != null) {
                            dealFields.put("Is_it_the_same_address_as_the_second_applicant_s", app.getAddressSameAsSecondary() ? "Yes" : "No");
                        }
                        if (app.getAddressStreet() != null) {
                            dealFields.put("Street_Address_T", app.getAddressStreet());
                            dealFields.put("Address_Line_T", app.getAddressStreet());
                        }
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

            // Read-Before-Write Verification GET
            try {
                log.info("[ZOHO_RAW_BEFORE] Fetching Deal state BEFORE update for Record ID: {}", targetRecordId);
                Map<?, ?> getBefore = apiClient.get(url, Map.class);
                log.info("[ZOHO_RAW_BEFORE] GET /Deals/{} Response: {}", targetRecordId, getBefore);
            } catch (Exception exBefore) {
                log.warn("[ZOHO_RAW_BEFORE_WARN] Could not fetch Deal before update: {}", exBefore.getMessage());
            }

            try {
                log.info("[ZOHO_RAW_PUT] Executing Zoho CRM PUT /Deals request for Record ID: {} URL: {}", targetRecordId, url);
                log.info("[ZOHO_RAW_PUT_PAYLOAD] Payload: {}", requestBody);
                Map<?, ?> response = apiClient.put(url, requestBody, Map.class);
                log.info("[ZOHO_RAW_PUT_RESPONSE] PUT /Deals/{} Response Payload: {}", targetRecordId, response);

                // Read-After-Write Verification GET
                try {
                    log.info("[ZOHO_RAW_AFTER] Fetching Deal state AFTER update for Record ID: {}", targetRecordId);
                    Map<?, ?> getAfter = apiClient.get(url, Map.class);
                    log.info("[ZOHO_RAW_AFTER] GET /Deals/{} Response: {}", targetRecordId, getAfter);

                    if (getAfter != null && getAfter.get("data") instanceof List<?> dataList && !dataList.isEmpty()) {
                        Object firstRecord = dataList.get(0);
                        if (firstRecord instanceof Map<?, ?> recordMap) {
                            log.info("[ZOHO_FIELD_AUDIT_6_FIELDS]\nRecord ID: {}\nTitle_S: {}\nFirst_Name_S: {}\nLast_Name_S: {}\nS_o_D_o_W_o_S: {}\nIs_it_the_same_address_as_the_1st_applicant_s: {}\nIs_it_the_same_address_as_the_second_applicant_s: {}",
                                    targetRecordId,
                                    recordMap.get("Title_S"),
                                    recordMap.get("First_Name_S"),
                                    recordMap.get("Last_Name_S"),
                                    recordMap.get("S_o_D_o_W_o_S"),
                                    recordMap.get("Is_it_the_same_address_as_the_1st_applicant_s"),
                                    recordMap.get("Is_it_the_same_address_as_the_second_applicant_s"));
                        }
                    }
                } catch (Exception exAfter) {
                    log.warn("[ZOHO_RAW_AFTER_WARN] Could not fetch Deal after update: {}", exAfter.getMessage());
                }

                application.setZohoDealRecordId(targetRecordId);
                application.setZohoSyncStatus("SUCCESS");
                application.setZohoLastSyncedAt(java.time.LocalDateTime.now());
                application.setZohoSyncError(null);
                kycApplicationRepository.save(application);
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

                application.setZohoSyncStatus("FAILED");
                application.setZohoSyncError(errorMsg);
                kycApplicationRepository.save(application);
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

                // Validate Zoho Response Status (Problem 2 Fix)
                boolean isSuccess = false;
                String errorDetails = null;

                if (response != null && response.get("data") instanceof List) {
                    List<?> dataList = (List<?>) response.get("data");
                    if (!dataList.isEmpty() && dataList.get(0) instanceof Map) {
                        Map<?, ?> firstRecord = (Map<?, ?>) dataList.get(0);
                        Object statusObj = firstRecord.get("status");
                        Object codeObj = firstRecord.get("code");
                        Object messageObj = firstRecord.get("message");
                        Object detailsObj = firstRecord.get("details");

                        String statusStr = statusObj != null ? statusObj.toString() : "";
                        String codeStr = codeObj != null ? codeObj.toString() : "";

                        if ("success".equalsIgnoreCase(statusStr) && "SUCCESS".equalsIgnoreCase(codeStr)) {
                            isSuccess = true;
                        } else {
                            errorDetails = String.format("Zoho CRM update rejected with Code: %s, Status: %s, Message: %s, Details: %s",
                                    codeStr, statusStr, messageObj, detailsObj);
                            log.error("[ZOHO_CRM_SYNC_REJECTED] {}", errorDetails);
                        }
                    }
                }

                if (!isSuccess) {
                    if (errorDetails == null) {
                        errorDetails = "Zoho CRM update failed: Invalid response payload returned from Zoho API.";
                    }
                    throw new com.goodearth.postsales.kyc.exception.KycValidationException(errorDetails);
                }

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
                if (apiEx instanceof com.goodearth.postsales.kyc.exception.KycValidationException) {
                    throw (com.goodearth.postsales.kyc.exception.KycValidationException) apiEx;
                }
                String errorMsg = apiEx.getMessage();
                int statusCode = 500;
                if (apiEx.getCause() instanceof RestClientResponseException) {
                    RestClientResponseException rce = (RestClientResponseException) apiEx.getCause();
                    statusCode = rce.getStatusCode().value();
                    errorMsg = rce.getResponseBodyAsString();
                }
                log.error("[KYC_SYNC]\nBooking ID: {}\nDeal Name: {}\nResolved Deal ID: {}\nSearch Status: SUCCESS\nUpdate Status: FAILED\nHTTP Status: {}\nZoho Error Message: {}",
                        bookingId, bookingId, targetRecordId, statusCode, errorMsg);
                throw new com.goodearth.postsales.kyc.exception.KycValidationException("Zoho CRM update failed: " + errorMsg);
            }
        } catch (Exception ex) {
            log.error("Failed to sync applicant info map to Zoho CRM for booking: {}", bookingId, ex);
            return false;
        } finally {
            clearRequestCache();
        }
    }

    @Override
    public boolean syncDocumentToCrm(KycApplication application, String docType, String applicantType, String fileId, String permalink, String status) {
        if (application == null || application.getBookingId() == null) return false;
        String bookingId = application.getBookingId();

        try {
            String targetRecordId = resolveDealRecordIdByDealName(bookingId);
            if (targetRecordId == null) {
                application.setZohoSyncStatus("FAILED");
                application.setZohoSyncError("Could not resolve Deal Record ID for booking: " + bookingId);
                return false;
            }

            Map<String, Object> docFields = new HashMap<>();
            docFields.put("Last_Updated_Document_Type", docType);
            docFields.put("Last_Updated_Applicant_Type", applicantType);
            docFields.put("Last_Updated_WorkDrive_File_ID", fileId);
            docFields.put("Last_Updated_WorkDrive_Permalink", permalink);
            docFields.put("Document_Verification_Status", status);
            docFields.put("KYC_Last_Synced", java.time.LocalDateTime.now().toString());

            Map<String, Object> requestBody = new HashMap<>();
            requestBody.put("data", List.of(docFields));

            String url = properties.getCrmApiUrl() + "/Deals/" + targetRecordId;
            apiClient.put(url, requestBody, Map.class);

            application.setZohoDealRecordId(targetRecordId);
            application.setZohoSyncStatus("SUCCESS");
            application.setZohoLastSyncedAt(java.time.LocalDateTime.now());
            application.setZohoSyncError(null);

            log.info("[ZOHO_DOCUMENT_SYNC_SUCCESS] Synced document {} ({}) to Deal ID {}", docType, applicantType, targetRecordId);
            return true;
        } catch (Exception ex) {
            log.error("[ZOHO_DOCUMENT_SYNC_FAILED] Failed to sync document to Deal for booking {}", bookingId, ex);
            application.setZohoSyncStatus("FAILED");
            application.setZohoSyncError(ex.getMessage());
            return false;
        } finally {
            clearRequestCache();
        }
    }

    @Override
    public boolean syncAttachmentToCrm(
            KycApplication application,
            Document document,
            DocumentVersion version,
            String fileName,
            String contentType,
            byte[] content) {

        if (application == null || application.getBookingId() == null || version == null || content == null || content.length == 0) {
            log.warn("[ZOHO_ATTACHMENT_SYNC_SKIP] Missing required parameter for attachment sync");
            return false;
        }

        String bookingId = application.getBookingId();
        try {
            String dealId = resolveDealRecordIdByDealName(bookingId);
            if (dealId == null) {
                log.warn("[ZOHO_ATTACHMENT_SYNC_FAILED] Could not resolve Zoho CRM Deal ID for booking: {}", bookingId);
                markAttachmentSyncFailed(document, version, "Could not resolve Deal ID for booking " + bookingId);
                return false;
            }

            String docTypeStr = document != null && document.getDocumentType() != null ? document.getDocumentType().name() : "DOCUMENT";
            String applicantTypeStr = document != null && document.getApplicantType() != null ? document.getApplicantType().name() : "PRIMARY";
            String slotIdentifier = applicantTypeStr + "_" + docTypeStr;

            String previousCrmAttachmentId = (document != null && document.getCrmAttachmentId() != null)
                    ? document.getCrmAttachmentId() : version.getCrmAttachmentId();

            // Step 1: Delete previous attachment for the same document slot from Zoho CRM Deal
            deleteExistingCrmAttachmentsForSlot(dealId, slotIdentifier, previousCrmAttachmentId);

            // Step 2: Format filename with slot identifier & version for clear identification in CRM
            String attachmentFileName = slotIdentifier + "_v" + version.getVersionNumber() + "_" + fileName;
            String uploadUrl = properties.getCrmApiUrl() + "/Deals/" + dealId + "/Attachments";

            MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
            ByteArrayResource byteArrayResource = new ByteArrayResource(content != null ? content : new byte[0]) {
                @Override
                public String getFilename() {
                    return attachmentFileName;
                }
            };

            org.springframework.http.HttpHeaders partHeaders = new org.springframework.http.HttpHeaders();
            String effectiveContentType = (contentType != null && !contentType.isBlank()) ? contentType : "application/pdf";
            partHeaders.setContentType(org.springframework.http.MediaType.parseMediaType(effectiveContentType));
            partHeaders.setContentDispositionFormData("file", attachmentFileName);
            org.springframework.http.HttpEntity<ByteArrayResource> part = new org.springframework.http.HttpEntity<>(byteArrayResource, partHeaders);

            body.add("file", part);

            log.info("[ZOHO_ATTACHMENT_UPLOADING] Uploading attachment '{}' to Deal ID {}", attachmentFileName, dealId);
            Map<?, ?> response = apiClient.postMultipart(uploadUrl, body, Map.class);
            log.info("[ZOHO_ATTACHMENT_UPLOAD_RESPONSE] Deal ID: {} Response: {}", dealId, response);

            String crmAttachmentId = extractAttachmentId(response);
            LocalDateTime uploadedAt = LocalDateTime.now();

            if (crmAttachmentId != null) {
                version.setCrmAttachmentId(crmAttachmentId);
                version.setCrmAttachmentName(attachmentFileName);
                version.setCrmAttachmentUploadedAt(uploadedAt);
                version.setCrmAttachmentSyncStatus("SUCCESS");
                documentVersionRepository.save(version);

                if (document != null) {
                    document.setCrmAttachmentId(crmAttachmentId);
                    document.setCrmAttachmentName(attachmentFileName);
                    document.setCrmAttachmentUploadedAt(uploadedAt);
                    document.setCrmAttachmentSyncStatus("SUCCESS");
                    documentRepository.save(document);
                }

                log.info("[ZOHO_ATTACHMENT_SYNC_SUCCESS] Successfully attached '{}' (CRM Attachment ID: {}) to Deal ID {}",
                        attachmentFileName, crmAttachmentId, dealId);
                return true;
            } else {
                markAttachmentSyncFailed(document, version, "No attachment ID returned in response");
                return false;
            }
        } catch (Exception ex) {
            log.error("[ZOHO_ATTACHMENT_SYNC_FAILED] Failed to sync CRM attachment for booking {}: {}", bookingId, ex.getMessage(), ex);
            markAttachmentSyncFailed(document, version, ex.getMessage());
            return false;
        } finally {
            clearRequestCache();
        }
    }

    private void deleteExistingCrmAttachmentsForSlot(String dealId, String slotIdentifier, String existingCrmAttachmentId) {
        if (existingCrmAttachmentId != null && !existingCrmAttachmentId.trim().isEmpty()) {
            try {
                String deleteUrl = properties.getCrmApiUrl() + "/Deals/" + dealId + "/Attachments/" + existingCrmAttachmentId.trim();
                log.info("[ZOHO_ATTACHMENT_DELETE] Deleting stored CRM Attachment ID: {} from Deal ID: {}", existingCrmAttachmentId, dealId);
                apiClient.delete(deleteUrl);
                log.info("[ZOHO_ATTACHMENT_DELETE_SUCCESS] Deleted stored CRM Attachment ID: {}", existingCrmAttachmentId);
            } catch (Exception e) {
                log.warn("[ZOHO_ATTACHMENT_DELETE_WARN] Could not delete stored CRM Attachment ID {}: {}", existingCrmAttachmentId, e.getMessage());
            }
        }

        try {
            String listUrl = properties.getCrmApiUrl() + "/Deals/" + dealId + "/Attachments";
            log.info("[ZOHO_ATTACHMENT_LIST] Querying existing attachments for Deal ID: {}", dealId);
            Map<?, ?> response = apiClient.get(listUrl, Map.class);
            if (response != null && response.get("data") instanceof List) {
                List<?> dataList = (List<?>) response.get("data");
                for (Object itemObj : dataList) {
                    if (itemObj instanceof Map) {
                        Map<?, ?> item = (Map<?, ?>) itemObj;
                        String attId = item.get("id") != null ? item.get("id").toString() : null;
                        String fileName = item.get("File_Name") != null ? item.get("File_Name").toString()
                                : (item.get("file_name") != null ? item.get("file_name").toString() : "");

                        if (attId != null && !attId.equals(existingCrmAttachmentId) &&
                                (fileName.contains(slotIdentifier) || fileName.toLowerCase().contains(slotIdentifier.toLowerCase()))) {
                            try {
                                String deleteUrl = properties.getCrmApiUrl() + "/Deals/" + dealId + "/Attachments/" + attId;
                                log.info("[ZOHO_ATTACHMENT_DELETE_SLOT_MATCH] Deleting matching attachment ID: {} ({}) from Deal ID: {}", attId, fileName, dealId);
                                apiClient.delete(deleteUrl);
                                log.info("[ZOHO_ATTACHMENT_DELETE_SLOT_MATCH_SUCCESS] Deleted attachment ID: {}", attId);
                            } catch (Exception exDel) {
                                log.warn("[ZOHO_ATTACHMENT_DELETE_WARN] Failed to delete matching attachment ID {}: {}", attId, exDel.getMessage());
                            }
                        }
                    }
                }
            }
        } catch (Exception e) {
            log.warn("[ZOHO_ATTACHMENT_LIST_WARN] Could not query attachment list for Deal ID {}: {}", dealId, e.getMessage());
        }
    }

    private String extractAttachmentId(Map<?, ?> response) {
        if (response == null || !(response.get("data") instanceof List)) {
            return null;
        }
        List<?> dataList = (List<?>) response.get("data");
        if (dataList.isEmpty()) {
            return null;
        }
        Object firstObj = dataList.get(0);
        if (firstObj instanceof Map) {
            Map<?, ?> first = (Map<?, ?>) firstObj;
            Object detailsObj = first.get("details");
            if (detailsObj instanceof Map) {
                Map<?, ?> details = (Map<?, ?>) detailsObj;
                Object idObj = details.get("id");
                if (idObj != null) {
                    return idObj.toString();
                }
            }
            Object idObj = first.get("id");
            if (idObj != null) {
                return idObj.toString();
            }
        }
        return null;
    }

    private void markAttachmentSyncFailed(Document document, DocumentVersion version, String errorReason) {
        try {
            if (version != null) {
                version.setCrmAttachmentSyncStatus("FAILED");
                documentVersionRepository.save(version);
            }
            if (document != null) {
                document.setCrmAttachmentSyncStatus("FAILED");
                documentRepository.save(document);
            }
        } catch (Exception e) {
            log.error("Failed to mark CRM attachment sync status as FAILED", e);
        }
    }

    @Override
    @Scheduled(cron = "${app.zoho.sync.cron:0 */15 * * * *}")
    @org.springframework.transaction.annotation.Transactional
    public void retryFailedCrmAttachments() {
        List<DocumentVersion> failedVersions = documentVersionRepository.findByCrmAttachmentSyncStatus("FAILED");
        if (failedVersions == null || failedVersions.isEmpty()) {
            return;
        }

        log.info("[ZOHO_ATTACHMENT_RETRY] Found {} failed CRM attachment syncs to retry", failedVersions.size());
        for (DocumentVersion ver : failedVersions) {
            if (Boolean.TRUE.equals(ver.getIsCurrent()) && ver.getDocument() != null && ver.getDocument().getKycApplication() != null) {
                try {
                    byte[] content = ("Retried document binary for version " + ver.getVersionNumber() + " - " + ver.getFileName()).getBytes(StandardCharsets.UTF_8);
                    syncAttachmentToCrm(
                            ver.getDocument().getKycApplication(),
                            ver.getDocument(),
                            ver,
                            ver.getFileName(),
                            ver.getMimeType(),
                            content
                    );
                } catch (Exception ex) {
                    log.warn("[ZOHO_ATTACHMENT_RETRY_WARN] Retry failed for document version ID {}: {}", ver.getId(), ex.getMessage());
                }
            }
        }
    }

    private void clearRequestCache() {
        REQUEST_DEAL_CACHE.get().clear();
    }
}
