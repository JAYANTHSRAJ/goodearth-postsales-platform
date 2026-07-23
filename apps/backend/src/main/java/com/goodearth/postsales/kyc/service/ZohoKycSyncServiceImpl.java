package com.goodearth.postsales.kyc.service;

import com.goodearth.postsales.integration.zoho.ZohoApiClient;
import com.goodearth.postsales.integration.zoho.ZohoProperties;
import com.goodearth.postsales.kyc.entity.KycApplication;
import com.goodearth.postsales.kyc.entity.KycAuditEventType;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class ZohoKycSyncServiceImpl implements ZohoKycSyncService {

    private static final Logger log = LoggerFactory.getLogger(ZohoKycSyncServiceImpl.class);

    private final ZohoApiClient apiClient;
    private final ZohoProperties properties;
    private final KycAuditService auditService;
    private final com.goodearth.postsales.buyer.repository.BuyerRepository buyerRepository;

    public ZohoKycSyncServiceImpl(
            ZohoApiClient apiClient,
            ZohoProperties properties,
            KycAuditService auditService,
            com.goodearth.postsales.buyer.repository.BuyerRepository buyerRepository) {
        this.apiClient = apiClient;
        this.properties = properties;
        this.auditService = auditService;
        this.buyerRepository = buyerRepository;
    }

    private String resolveZohoDealId(String bookingId) {
        if (bookingId == null || bookingId.trim().isEmpty()) {
            log.error("Zoho Deal ID resolution failed: bookingId parameter is null or empty.");
            return null;
        }

        // 1. If bookingId is already a numeric Zoho Deal ID (15-22 digits, e.g. 6638590000146940001)
        if (bookingId.matches("^\\d{15,22}$")) {
            log.info("Booking ID '{}' is directly a valid numeric Zoho Deal ID.", bookingId);
            return bookingId;
        }

        // 2. Lookup in buyers repository by zohoDealId = bookingId
        if (buyerRepository != null) {
            java.util.Optional<com.goodearth.postsales.buyer.entity.Buyer> buyerByDeal = buyerRepository.findByZohoDealId(bookingId);
            if (buyerByDeal.isPresent() && buyerByDeal.get().getZohoDealId() != null) {
                log.info("Resolved zoho_deal_id '{}' for bookingId '{}' via Buyer.zohoDealId lookup.",
                        buyerByDeal.get().getZohoDealId(), bookingId);
                return buyerByDeal.get().getZohoDealId();
            }

            // 3. Lookup via currently authenticated User email -> Buyer -> zohoDealId
            try {
                org.springframework.security.core.Authentication auth =
                        org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
                if (auth != null && auth.getName() != null && !auth.getName().equals("anonymousUser")) {
                    String currentUserEmail = auth.getName();
                    java.util.Optional<com.goodearth.postsales.buyer.entity.Buyer> buyerByEmail = buyerRepository.findByEmailIgnoreCase(currentUserEmail);
                    if (buyerByEmail.isPresent() && buyerByEmail.get().getZohoDealId() != null) {
                        log.info("Resolved zoho_deal_id '{}' for bookingId '{}' via authenticated buyer email '{}'.",
                                buyerByEmail.get().getZohoDealId(), bookingId, currentUserEmail);
                        return buyerByEmail.get().getZohoDealId();
                    }
                }
            } catch (Exception ex) {
                log.warn("Could not inspect SecurityContext for buyer email resolution: {}", ex.getMessage());
            }
        }

        // 4. Lookup failed - log error and return null so sync is safely skipped
        log.error("CRITICAL: Failed to deterministically resolve Zoho Deal ID for bookingId '{}'. Aborting CRM sync to prevent modifying another customer's Deal.", bookingId);
        return null;
    }

    @Override
    public boolean verifyDealExists(String dealIdOrBookingId) {
        if (dealIdOrBookingId == null || dealIdOrBookingId.trim().isEmpty()) {
            return false;
        }

        String targetDealId = resolveZohoDealId(dealIdOrBookingId);
        try {
            String url = properties.getCrmApiUrl() + "/Deals/" + targetDealId;
            Map<?, ?> response = apiClient.get(url, Map.class);
            return response != null && response.containsKey("data");
        } catch (Exception e) {
            log.warn("Zoho CRM Deal lookup failed for ID: {} - {}", targetDealId, e.getMessage());
            return true;
        }
    }

    @Override
    public boolean syncKycStatusToCrm(KycApplication application, String milestoneNoteTitle, String milestoneNoteContent) {
        if (application == null || application.getBookingId() == null) {
            log.warn("Cannot sync KYC status to Zoho CRM: Missing application or booking ID");
            return false;
        }

        log.info("Initiating Zoho CRM Note sync for Booking ID: {}, Event: {}", application.getBookingId(), milestoneNoteTitle);

        try {
            // Standard Zoho CRM Note payload targeting standard Deals module
            Map<String, Object> noteData = new HashMap<>();
            noteData.put("Note_Title", "KYC: " + milestoneNoteTitle);
            noteData.put("Note_Content", String.format(
                    "%s\n\nCurrent KYC Status: %s\nBooking Reference: %s\nCompletion: %d%%\nTimestamp: %s",
                    milestoneNoteContent != null ? milestoneNoteContent : "Milestone updated",
                    application.getStatus(),
                    application.getBookingId(),
                    application.getCompletionPercentage() != null ? application.getCompletionPercentage() : 0,
                    java.time.LocalDateTime.now()
            ));
            String targetDealId = resolveZohoDealId(application.getBookingId());
            if (targetDealId == null) {
                log.error("Aborting CRM Note sync for Booking ID {}: Unable to resolve target Zoho Deal ID.", application.getBookingId());
                return false;
            }
            noteData.put("Parent_Id", targetDealId);
            noteData.put("$se_module", "Deals");

            Map<String, Object> requestBody = new HashMap<>();
            requestBody.put("data", List.of(noteData));

            String url = properties.getCrmApiUrl() + "/Notes";
            
            // Execute HTTP REST API call outside DB transaction
            try {
                log.info("Sending POST request to Zoho CRM Notes URL: {} for Deal ID: {}", url, targetDealId);
                apiClient.post(url, requestBody, Map.class);
                log.info("Successfully posted CRM Note for Deal ID: {}", targetDealId);
            } catch (Exception apiEx) {
                log.warn("Zoho CRM API Notes exception for Deal ID {}: {}", targetDealId, apiEx.getMessage());
            }

            // Write local audit log
            auditService.logEvent(application, KycAuditEventType.DRAFT_SAVED, "SYSTEM_SYNC", "ZOHO_CRM",
                    "Synchronized CRM note: " + milestoneNoteTitle, null);

            return true;
        } catch (Exception ex) {
            log.error("Failed to sync KYC status to Zoho CRM for booking: {}", application.getBookingId(), ex);
            return false;
        }
    }

    @Override
    public boolean syncKycDealFieldsToCrm(KycApplication application) {
        if (application == null || application.getBookingId() == null) {
            log.warn("Cannot sync KYC Deal fields to Zoho CRM: Missing application or booking ID");
            return false;
        }

        log.info("Initiating Zoho CRM Deal fields update for Booking ID: {}", application.getBookingId());

        try {
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

            String targetDealId = resolveZohoDealId(application.getBookingId());
            if (targetDealId == null) {
                log.error("Aborting CRM Deal fields sync for Booking ID {}: Unable to resolve target Zoho Deal ID.", application.getBookingId());
                return false;
            }
            String url = properties.getCrmApiUrl() + "/Deals/" + targetDealId;

            try {
                log.info("Sending PUT request to Zoho CRM URL: {} for Deal ID: {} with payload: {}", url, targetDealId, requestBody);
                Map<?, ?> response = apiClient.put(url, requestBody, Map.class);
                log.info("Zoho CRM Deal update response for Deal ID {}: {}", targetDealId, response);
            } catch (Exception apiEx) {
                log.warn("Zoho CRM API PUT /Deals exception for Deal ID {}: {}", targetDealId, apiEx.getMessage());
            }

            return true;
        } catch (Exception ex) {
            log.error("Failed to sync KYC Deal fields to Zoho CRM for booking: {}", application.getBookingId(), ex);
            return false;
        }
    }

    private String buildFullAddress(com.goodearth.postsales.kyc.entity.KycApplicant app) {
        StringBuilder sb = new StringBuilder();
        if (app.getAddressStreet() != null) sb.append(app.getAddressStreet());
        if (app.getAddressLine2() != null && !app.getAddressLine2().isEmpty()) {
            if (sb.length() > 0) sb.append(", ");
            sb.append(app.getAddressLine2());
        }
        if (app.getAddressCity() != null && !app.getAddressCity().isEmpty()) {
            if (sb.length() > 0) sb.append(", ");
            sb.append(app.getAddressCity());
        }
        if (app.getAddressState() != null && !app.getAddressState().isEmpty()) {
            if (sb.length() > 0) sb.append(", ");
            sb.append(app.getAddressState());
        }
        if (app.getAddressPincode() != null && !app.getAddressPincode().isEmpty()) {
            if (sb.length() > 0) sb.append(" - ");
            sb.append(app.getAddressPincode());
        }
        if (app.getAddressCountry() != null && !app.getAddressCountry().isEmpty()) {
            if (sb.length() > 0) sb.append(", ");
            sb.append(app.getAddressCountry());
        }
        return sb.toString();
    }
}
