package com.goodearth.postsales.offerletter.service;

import com.goodearth.postsales.common.exception.CustomException;
import com.goodearth.postsales.integration.zoho.ZohoApiClient;
import com.goodearth.postsales.integration.zoho.ZohoProperties;
import com.goodearth.postsales.kyc.dto.KycDocumentStreamDto;
import com.goodearth.postsales.kyc.service.ZohoKycSyncService;
import com.goodearth.postsales.offerletter.dto.OfferLetterApplicantDto;
import com.goodearth.postsales.offerletter.dto.OfferLetterBankDetailsDto;
import com.goodearth.postsales.offerletter.dto.OfferLetterDto;
import com.goodearth.postsales.offerletter.dto.OfferLetterMilestoneDto;
import com.goodearth.postsales.offerletter.dto.OfferLetterStatusDto;
import com.goodearth.postsales.offerletter.util.IndianCurrencyFormatter;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

import com.goodearth.postsales.notification.service.EmailService;
import com.goodearth.postsales.offerletter.entity.OfferLetterAudit;
import com.goodearth.postsales.offerletter.repository.OfferLetterAuditRepository;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import java.time.LocalDateTime;
import java.util.Optional;

@Service
public class OfferLetterServiceImpl implements OfferLetterService {

    private static final Logger log = LoggerFactory.getLogger(OfferLetterServiceImpl.class);

    private final ZohoApiClient apiClient;
    private final ZohoProperties properties;
    private final ZohoKycSyncService zohoKycSyncService;
    private final OfferLetterPdfGenerator pdfGenerator;
    private final OfferLetterAuditRepository auditRepository;
    private final EmailService emailService;

    public OfferLetterServiceImpl(
            ZohoApiClient apiClient,
            ZohoProperties properties,
            ZohoKycSyncService zohoKycSyncService,
            OfferLetterPdfGenerator pdfGenerator,
            OfferLetterAuditRepository auditRepository,
            EmailService emailService) {
        this.apiClient = apiClient;
        this.properties = properties;
        this.zohoKycSyncService = zohoKycSyncService;
        this.pdfGenerator = pdfGenerator;
        this.auditRepository = auditRepository;
        this.emailService = emailService;
    }

    @Override
    public OfferLetterStatusDto getOfferLetterStatus(String dealIdOrBookingId) {
        if (dealIdOrBookingId == null || dealIdOrBookingId.trim().isEmpty()) {
            throw new CustomException("Deal ID or Booking Reference is required.", HttpStatus.BAD_REQUEST);
        }

        String cleanIdentifier = dealIdOrBookingId.trim();
        String targetRecordId = zohoKycSyncService.resolveDealRecordIdByDealName(cleanIdentifier);
        if (targetRecordId == null) {
            log.warn("[OFFER_LETTER] Deal record ID resolution failed for identifier: {}", cleanIdentifier);
            return new OfferLetterStatusDto(
                    false,
                    false,
                    null,
                    null,
                    "Offer Letter is not available as Deal record was not found.",
                    null,
                    null,
                    cleanIdentifier
            );
        }

        Optional<OfferLetterAudit> auditOpt = auditRepository.findByBookingIdOrDealRecordId(cleanIdentifier, targetRecordId);
        boolean isSent = auditOpt.map(OfferLetterAudit::isSent).orElse(false);
        String sentAtStr = auditOpt.map(a -> a.getSentAt() != null ? a.getSentAt().toString() : null).orElse(null);
        String sentByStr = auditOpt.map(OfferLetterAudit::getSentBy).orElse(null);

        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        Set<String> allowedAdminRoles = Set.of(
                "ROLE_SUPER_ADMIN", "SUPER_ADMIN",
                "ROLE_CRM", "CRM",
                "ROLE_ADMIN", "ADMIN",
                "ROLE_FINANCE", "FINANCE",
                "ROLE_DESIGN_STUDIO", "DESIGN_STUDIO",
                "ROLE_PROJECT_MANAGER", "PROJECT_MANAGER"
        );
        boolean isAdmin = auth != null && auth.getAuthorities().stream()
                .anyMatch(a -> allowedAdminRoles.contains(a.getAuthority().toUpperCase()));

        String fileUrl = "/api/v1/deals/" + cleanIdentifier + "/offer-letter/file";
        String fileName = "Offer_Letter_" + cleanIdentifier + ".pdf";

        if (!isSent && !isAdmin) {
            return new OfferLetterStatusDto(
                    false,
                    false,
                    null,
                    null,
                    "Your Offer Letter has not been shared yet.",
                    fileUrl,
                    fileName,
                    targetRecordId
            );
        }

        return new OfferLetterStatusDto(
                true,
                isSent,
                sentAtStr,
                sentByStr,
                isSent ? "Offer Letter is shared and available for viewing." : "Offer Letter is generated and ready for preview.",
                fileUrl,
                fileName,
                targetRecordId
        );
    }

    @Override
    public OfferLetterStatusDto sendOfferLetter(String dealIdOrBookingId, String actorId) {
        log.info("[SEND_OFFER_LETTER] Initiating send offer letter for: {} by actor: {}", dealIdOrBookingId, actorId);
        if (dealIdOrBookingId == null || dealIdOrBookingId.trim().isEmpty()) {
            throw new CustomException("Deal ID or Booking Reference is required.", HttpStatus.BAD_REQUEST);
        }

        String cleanIdentifier = dealIdOrBookingId.trim();
        OfferLetterDto dto = buildOfferLetterDto(cleanIdentifier);
        if (dto == null || dto.getApplicants() == null || dto.getApplicants().isEmpty()) {
            throw new CustomException("Unable to build Offer Letter details for identifier: " + cleanIdentifier, HttpStatus.BAD_REQUEST);
        }

        OfferLetterApplicantDto primaryApplicant = dto.getApplicants().get(0);
        String buyerEmail = primaryApplicant.getEmail();
        String buyerName = primaryApplicant.getFullName();

        if (buyerEmail == null || buyerEmail.trim().isEmpty()) {
            log.error("[SEND_OFFER_LETTER] Buyer email is missing in CRM Deal details for identifier: {}", cleanIdentifier);
            throw new CustomException("Buyer email address is missing in CRM deal details. Unable to send Offer Letter email.", HttpStatus.BAD_REQUEST);
        }

        byte[] pdfBytes = pdfGenerator.generatePdf(dto);
        if (pdfBytes == null || pdfBytes.length == 0) {
            throw new CustomException("Failed to generate Offer Letter PDF binary.", HttpStatus.INTERNAL_SERVER_ERROR);
        }

        String fileName = "Offer_Letter_" + cleanIdentifier + ".pdf";

        String subject = "GoodEarth Offer Letter";
        String body = String.format(
                "Dear %s,\n\n" +
                "Your Offer Letter has been shared by the GoodEarth team.\n" +
                "The Offer Letter is attached to this email.\n" +
                "You can also view and download it from your Buyer Portal.\n\n" +
                "Regards,\n" +
                "GoodEarth Team",
                buyerName != null && !buyerName.isBlank() ? buyerName : "Buyer"
        );

        log.info("[SEND_OFFER_LETTER] Sending email with attached PDF to buyer: {} for deal: {}", buyerEmail, cleanIdentifier);
        try {
            emailService.sendEmailWithAttachment(buyerEmail, subject, body, fileName, pdfBytes, "application/pdf");
        } catch (Exception ex) {
            log.error("[SEND_OFFER_LETTER] Email delivery failed for {}: {}", buyerEmail, ex.getMessage(), ex);
            throw new CustomException("Failed to send Offer Letter email to buyer: " + ex.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR, ex);
        }

        String targetRecordId = zohoKycSyncService.resolveDealRecordIdByDealName(cleanIdentifier);
        OfferLetterAudit audit = auditRepository.findByBookingId(cleanIdentifier)
                .orElse(OfferLetterAudit.builder()
                        .bookingId(cleanIdentifier)
                        .dealRecordId(targetRecordId)
                        .build());

        LocalDateTime now = LocalDateTime.now();
        audit.setSent(true);
        audit.setSentAt(now);
        audit.setSentBy(actorId);
        audit.setRecipientEmail(buyerEmail);
        audit.setRecipientName(buyerName);
        if (targetRecordId != null) {
            audit.setDealRecordId(targetRecordId);
        }
        auditRepository.save(audit);

        log.info("[SEND_OFFER_LETTER] Offer Letter audit saved successfully for deal: {} at {}", cleanIdentifier, now);

        String fileUrl = "/api/v1/deals/" + cleanIdentifier + "/offer-letter/file";

        return new OfferLetterStatusDto(
                true,
                true,
                now.toString(),
                actorId,
                "Offer Letter has been sent successfully to " + buyerEmail,
                fileUrl,
                fileName,
                targetRecordId != null ? targetRecordId : cleanIdentifier
        );
    }

    @Override
    public OfferLetterDto buildOfferLetterDto(String dealIdOrBookingId) {
        log.info("[OFFER_LETTER_TRACE] Service -> Entering buildOfferLetterDto for identifier: {}", dealIdOrBookingId);
        if (dealIdOrBookingId == null || dealIdOrBookingId.trim().isEmpty()) {
            throw new CustomException("Deal ID or Booking Reference is required.", HttpStatus.BAD_REQUEST);
        }

        String cleanIdentifier = dealIdOrBookingId.trim();
        String targetRecordId = zohoKycSyncService.resolveDealRecordIdByDealName(cleanIdentifier);
        log.info("[OFFER_LETTER_TRACE] Service -> Resolved Deal Record ID: {}", targetRecordId);
        if (targetRecordId == null) {
            throw new CustomException("Deal record not found in CRM for identifier: " + cleanIdentifier, HttpStatus.NOT_FOUND);
        }

        try {
            String url = properties.getCrmApiUrl() + "/Deals/" + targetRecordId;
            log.info("[OFFER_LETTER_TRACE] Service -> Fetching Deal data from Zoho CRM: {}", url);
            Map<?, ?> response = apiClient.get(url, Map.class);

            Map<?, ?> dealMap = null;
            if (response != null && response.get("data") instanceof List<?> dataList && !dataList.isEmpty()) {
                if (dataList.get(0) instanceof Map<?, ?> map) {
                    dealMap = map;
                }
            }

            if (dealMap == null) {
                throw new CustomException("No data returned from CRM for Deal ID: " + targetRecordId, HttpStatus.NOT_FOUND);
            }

            log.info("[OFFER_LETTER_TRACE] Service -> CRM deal data retrieved successfully. Mapping to OfferLetterDto...");
            OfferLetterDto dto = mapCrmDealToOfferLetterDto(cleanIdentifier, targetRecordId, dealMap);
            log.info("[OFFER_LETTER_TRACE] Service -> OfferLetterDto built successfully for Offer No: {}", dto.getOfferLetterNo());
            return dto;

        } catch (CustomException ce) {
            log.error("[OFFER_LETTER_TRACE] CustomException in buildOfferLetterDto for {}: {}", cleanIdentifier, ce.getMessage());
            throw ce;
        } catch (Throwable ex) {
            log.error("[OFFER_LETTER_TRACE] Exception fetching Deal data from CRM for {}: {}", cleanIdentifier, ex.getMessage(), ex);
            throw new CustomException("Failed to fetch Deal data from CRM: " + ex.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR, ex);
        }
    }

    @Override
    public byte[] generateOfferLetterPdf(String dealIdOrBookingId) {
        log.info("[OFFER_LETTER_TRACE] Service -> Entering generateOfferLetterPdf for identifier: {}", dealIdOrBookingId);
        OfferLetterDto dto = buildOfferLetterDto(dealIdOrBookingId);
        log.info("[OFFER_LETTER_TRACE] Service -> Invoking pdfGenerator.generatePdf for Offer No: {}", dto.getOfferLetterNo());
        byte[] pdfBytes = pdfGenerator.generatePdf(dto);
        log.info("[OFFER_LETTER_TRACE] Service -> pdfGenerator.generatePdf returned {} bytes", pdfBytes != null ? pdfBytes.length : 0);
        return pdfBytes;
    }

    @Override
    public KycDocumentStreamDto streamOfferLetterPdf(String dealIdOrBookingId, String actorId) {
        log.info("[OFFER_LETTER_TRACE] Service -> Entering streamOfferLetterPdf for identifier: {}, actorId: {}", dealIdOrBookingId, actorId);
        String cleanIdentifier = dealIdOrBookingId.trim();

        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        Set<String> allowedAdminRoles = Set.of(
                "ROLE_SUPER_ADMIN", "SUPER_ADMIN",
                "ROLE_CRM", "CRM",
                "ROLE_ADMIN", "ADMIN",
                "ROLE_FINANCE", "FINANCE",
                "ROLE_DESIGN_STUDIO", "DESIGN_STUDIO",
                "ROLE_PROJECT_MANAGER", "PROJECT_MANAGER"
        );
        boolean isAdmin = auth != null && auth.getAuthorities().stream()
                .anyMatch(a -> allowedAdminRoles.contains(a.getAuthority().toUpperCase()));

        if (!isAdmin && (actorId == null || actorId.equalsIgnoreCase("CLIENT"))) {
            String targetRecordId = zohoKycSyncService.resolveDealRecordIdByDealName(cleanIdentifier);
            Optional<OfferLetterAudit> auditOpt = auditRepository.findByBookingIdOrDealRecordId(cleanIdentifier, targetRecordId);
            boolean isSent = auditOpt.map(OfferLetterAudit::isSent).orElse(false);
            if (!isSent) {
                throw new CustomException("Your Offer Letter has not been shared yet.", HttpStatus.FORBIDDEN);
            }
        }

        byte[] pdfBytes = generateOfferLetterPdf(cleanIdentifier);
        String fileName = "Offer_Letter_" + cleanIdentifier + ".pdf";

        log.info("[OFFER_LETTER_TRACE] Service -> Constructed KycDocumentStreamDto for file: {}, Size: {} bytes", fileName, pdfBytes.length);
        return KycDocumentStreamDto.builder()
                .fileName(fileName)
                .mimeType("application/pdf")
                .fileSize(pdfBytes.length)
                .content(pdfBytes)
                .build();
    }

    private String resolveReferencedModuleApiName(String lookupKey) {
        if (lookupKey == null || lookupKey.isBlank()) return null;
        try {
            String crmApiUrl = properties.getCrmApiUrl();
            String metadataUrl = crmApiUrl + "/settings/fields?module=Deals";
            log.info("[CRM_METADATA_TRACE] Fetching Deals field metadata from: {}", metadataUrl);
            Map<?, ?> response = apiClient.get(metadataUrl, Map.class);
            log.info("[CRM_METADATA_TRACE] Deals fields metadata response: {}", response);

            if (response != null && response.get("fields") instanceof List<?> fields) {
                for (Object item : fields) {
                    if (item instanceof Map<?, ?> fieldMap) {
                        Object apiNameObj = fieldMap.get("api_name");
                        if (apiNameObj != null && apiNameObj.toString().equalsIgnoreCase(lookupKey)) {
                            log.info("[CRM_METADATA_TRACE] Found metadata field for '{}': {}", lookupKey, fieldMap);
                            Object lookupObj = fieldMap.get("lookup");
                            if (lookupObj instanceof Map<?, ?> lookupMap) {
                                Object moduleObj = lookupMap.get("module");
                                if (moduleObj instanceof Map<?, ?> moduleMap && moduleMap.get("api_name") != null) {
                                    String moduleApiName = moduleMap.get("api_name").toString();
                                    log.info("[CRM_METADATA_TRACE] Resolved Referenced Module API Name = '{}' for field '{}'", moduleApiName, lookupKey);
                                    return moduleApiName;
                                }
                            }
                        }
                    }
                }
            }
        } catch (Exception ex) {
            log.warn("[CRM_METADATA_TRACE] Exception resolving field metadata for '{}': {}", lookupKey, ex.getMessage());
        }
        return null;
    }

    private Map<?, ?> fetchUnitMapFromCrm(Map<?, ?> dealMap) {
        log.info("[OFFER_LETTER_UNIT_TRACE] 1. COMPLETE Deal JSON returned from Zoho CRM: {}", dealMap);
        log.info("[OFFER_LETTER_UNIT_TRACE] 2. Product_Name lookup object: {}", dealMap != null ? dealMap.get("Product_Name") : "null");
        log.info("[OFFER_LETTER_UNIT_TRACE] 2b. Unit_Name lookup object: {}", dealMap != null ? dealMap.get("Unit_Name") : "null");
        log.info("[OFFER_LETTER_UNIT_TRACE] 2c. Unit lookup object: {}", dealMap != null ? dealMap.get("Unit") : "null");

        if (dealMap == null || dealMap.isEmpty()) {
            log.error("[OFFER_LETTER_UNIT_TRACE] FAILURE: dealMap is null or empty.");
            return null;
        }

        try {
            String unitRecordId = null;
            String resolvedLookupKey = null;
            Object resolvedLookupObject = null;
            String[] lookupKeys = {"Product_Name", "Unit_Name", "Unit", "Products", "Product", "Saarang_Plot_Deal_Id", "Unit_Lookup", "Unit_Details", "Unit_ID", "Unit_Record_ID", "Linked_Unit_ID"};

            for (String key : lookupKeys) {
                if (dealMap.containsKey(key) && dealMap.get(key) != null) {
                    Object obj = dealMap.get(key);
                    if (obj instanceof Map<?, ?> lookupMap && lookupMap.get("id") != null) {
                        unitRecordId = lookupMap.get("id").toString();
                        resolvedLookupKey = key;
                        resolvedLookupObject = obj;
                        break;
                    } else if (!(obj instanceof Map)) {
                        String val = obj.toString().trim();
                        if (val.matches("\\d{15,20}")) {
                            unitRecordId = val;
                            resolvedLookupKey = key;
                            resolvedLookupObject = obj;
                            break;
                        }
                    }
                }
            }

            log.info("[OFFER_LETTER_UNIT_TRACE] 3. Extracted Unit Record ID: '{}' via key: '{}', object: {}", unitRecordId, resolvedLookupKey, resolvedLookupObject);

            if (unitRecordId == null || unitRecordId.isBlank()) {
                log.error("[OFFER_LETTER_UNIT_TRACE] FAILURE: Unit Record ID could not be resolved from dealMap. Reason: unitRecordId == null or isBlank()");
                return null;
            }

            // Dynamically resolve referenced module API name from CRM metadata
            String moduleApiName = resolveReferencedModuleApiName(resolvedLookupKey);
            if (moduleApiName == null || moduleApiName.isBlank()) {
                moduleApiName = "Products";
            }

            String crmApiUrl = properties.getCrmApiUrl();
            String url = crmApiUrl + "/" + moduleApiName + "/" + unitRecordId;
            log.info("[OFFER_LETTER_UNIT_TRACE] 4. Exact GET URL sent to Zoho based on metadata (Module: {}): {}", moduleApiName, url);

            Map<?, ?> response = null;
            try {
                response = apiClient.get(url, Map.class);
                log.info("[OFFER_LETTER_UNIT_TRACE] 5. COMPLETE Zoho Response JSON from GET {}: {}", url, response);
            } catch (Exception apiEx) {
                log.warn("[OFFER_LETTER_UNIT_TRACE] 5. GET /" + moduleApiName + "/{} failed: {}", unitRecordId, apiEx.getMessage());
            }

            if (response == null || !response.containsKey("data") || (response.get("data") instanceof List<?> list && list.isEmpty())) {
                String fallbackModuleName = moduleApiName.equalsIgnoreCase("Products") ? "Units" : "Products";
                String fallbackUrl = crmApiUrl + "/" + fallbackModuleName + "/" + unitRecordId;
                log.info("[OFFER_LETTER_UNIT_TRACE] 5b. Primary module '{}' returned null/empty/204. Attempting fallback GET URL: {}", moduleApiName, fallbackUrl);
                try {
                    response = apiClient.get(fallbackUrl, Map.class);
                    log.info("[OFFER_LETTER_UNIT_TRACE] 5c. COMPLETE Zoho Response JSON from fallback GET {}: {}", fallbackUrl, response);
                } catch (Exception fallbackEx) {
                    log.error("[OFFER_LETTER_UNIT_TRACE] Fallback GET URL {} failed: {}", fallbackUrl, fallbackEx.getMessage());
                }
            }

            if (response == null) {
                log.error("[OFFER_LETTER_UNIT_TRACE] FAILURE: Zoho response is null (response == null).");
                return null;
            }

            if (!response.containsKey("data")) {
                log.error("[OFFER_LETTER_UNIT_TRACE] FAILURE: Zoho response does not contain 'data' key (!response.containsKey(\"data\")). Full response: {}", response);
                return null;
            }

            Object dataObj = response.get("data");
            log.info("[OFFER_LETTER_UNIT_TRACE] 7. response.data exists? true | data type: {} | data value: {}",
                    dataObj != null ? dataObj.getClass().getName() : "null", dataObj);

            if (!(dataObj instanceof List<?> list)) {
                log.error("[OFFER_LETTER_UNIT_TRACE] FAILURE: response.data is not a List (!(dataObj instanceof List)). Type: {}", dataObj != null ? dataObj.getClass().getName() : "null");
                return null;
            }

            log.info("[OFFER_LETTER_UNIT_TRACE] 7. response.data size: {}", list.size());
            if (list.isEmpty()) {
                log.error("[OFFER_LETTER_UNIT_TRACE] FAILURE: response.data is an empty list (list.isEmpty()).");
                return null;
            }

            Object firstItem = list.get(0);
            log.info("[OFFER_LETTER_UNIT_TRACE] 7. First record in response.data: {}", firstItem);

            if (!(firstItem instanceof Map<?, ?> unitData)) {
                log.error("[OFFER_LETTER_UNIT_TRACE] FAILURE: First item in response.data is not a Map.");
                return null;
            }

            log.info("[OFFER_LETTER_UNIT_TRACE] SUCCESS: Successfully parsed unitMap for Unit ID {}: {}", unitRecordId, unitData);
            return unitData;

        } catch (Exception ex) {
            log.error("[OFFER_LETTER_UNIT_TRACE] EXCEPTION in fetchUnitMapFromCrm: {}", ex.getMessage(), ex);
        }

        return null;
    }

    private OfferLetterDto mapCrmDealToOfferLetterDto(String identifier, String targetRecordId, Map<?, ?> dealMap) {
        log.info("[OFFER_LETTER_TRACE_v2] Backend Code Version: 2026-07-29T15:40:00");
        log.info("[OFFER_LETTER_TRACE_v2] 1. Deal Lookup: Target Record ID: {}, Identifier: {}", targetRecordId, identifier);
        log.info("[OFFER_LETTER_TRACE_v2] Raw Deal Map returned from Zoho CRM Deals module: {}", dealMap);

        String dealName = getStringWithDefault(dealMap, identifier, "Deal_Name", "deal_name", "Name");

        // Identify & fetch linked Unit record from CRM Units module as SOLE source of truth
        Map<?, ?> unitMap = fetchUnitMapFromCrm(dealMap);
        if (unitMap == null || unitMap.isEmpty()) {
            log.error("[OFFER_LETTER_TRACE_v2] FATAL: Unable to retrieve linked Unit record from Zoho CRM for Deal ID: {}", targetRecordId);
            throw new CustomException("Unable to retrieve linked Unit record from Zoho CRM. Offer Letter generation aborted.", HttpStatus.NOT_FOUND);
        }

        log.info("[OFFER_LETTER_TRACE_v2] 4. Primary Unit Source selected: UNITS_MODULE_RECORD (unitMap ID: {})", unitMap.get("id"));

        // Table 1 - Details of unit and provisional allotment (Mapped ONLY from unitMap)
        String projectName = getStringFromObjectOrMap(unitMap, "Project_Site");
        if (projectName == null) projectName = "";

        String unitName = getStringFromObjectOrMap(unitMap, "Product_Name");
        if (unitName == null) unitName = "";

        String offerNo = getString(dealMap, "Offer_Letter_No", "Offer_No");
        if (offerNo == null || offerNo.isBlank()) {
            offerNo = getStringFromObjectOrMap(unitMap, "Product_Code", "Product_Name");
        }
        if (offerNo == null) offerNo = "";

        String offerDate = getString(dealMap, "Offer_Letter_Date", "Offer_Date");
        if (offerDate == null || offerDate.isBlank()) {
            offerDate = LocalDate.now().format(DateTimeFormatter.ofPattern("dd/MM/yyyy"));
        }

        // Applicants
        List<OfferLetterApplicantDto> applicants = extractApplicants(dealMap);

        // Table 1 Fields directly from field_labels.xlsx (ONLY from unitMap)
        String carpetArea = getString(unitMap, "Carpet_Area");
        if (carpetArea == null) carpetArea = "";

        String superBuiltUp = getString(unitMap, "Built_up_area1", "Built_up_Area");
        if (superBuiltUp == null) superBuiltUp = "";

        String areaA = getString(unitMap, "Exclusive_Common_Area_to_the_allottee");
        if (areaA == null) areaA = "";

        String areaB = getString(unitMap, "Exclusive_Common_Area_to_the_association", "Common_Area_allotted_to_association");
        if (areaB == null) areaB = "";

        String areaC = getString(unitMap, "UDS_to_the_allotee");
        if (areaC == null) areaC = "";

        String totalUds = getString(unitMap, "Total_UDS", "Total_UDS_A_B", "Total_UDS_Area");
        if (totalUds == null) totalUds = "";

        String balcony = getString(unitMap, "Exclusive_Balcony_Verandah_use_areas2");
        if (balcony == null) balcony = "";

        String terrace = getString(unitMap, "Exclusive_open_terrace_use_areas_to_the_allotee2");
        if (terrace == null) terrace = "";

        String carParks = getString(unitMap, "Covered_Car_Parks");
        if (carParks == null) carParks = "";

        // Table 2 - Sale Price Details directly from field_labels.xlsx (checks dealMap FIRST as authoritative active deal source)
        BigDecimal costOfUnit = getBigDecimal(dealMap, "Unit_Price", "Amount", "Cost_of_Unit", "Sale_Price");
        if ((costOfUnit == null || costOfUnit.compareTo(BigDecimal.ZERO) <= 0) && unitMap != null) {
            costOfUnit = getBigDecimal(unitMap, "Unit_Price", "Amount");
        }

        BigDecimal gstAmount = getBigDecimal(dealMap, "GST_at_5", "GST", "GST_Value", "GST_Amount");
        if ((gstAmount == null || gstAmount.compareTo(BigDecimal.ZERO) <= 0) && unitMap != null) {
            gstAmount = getBigDecimal(unitMap, "GST_at_5", "GST", "GST_Value");
        }
        if ((gstAmount == null || gstAmount.compareTo(BigDecimal.ZERO) <= 0) && costOfUnit != null) {
            gstAmount = costOfUnit.multiply(new BigDecimal("0.05")).setScale(0, RoundingMode.HALF_UP);
        }

        BigDecimal costOfHome = getBigDecimal(dealMap, "Cost_of_Home_Inc_GST_A", "Final_Cost_of_the_Home_A_B", "Cost_of_Home");
        if ((costOfHome == null || costOfHome.compareTo(BigDecimal.ZERO) <= 0) && unitMap != null) {
            costOfHome = getBigDecimal(unitMap, "Cost_of_Home_Inc_GST_A", "Final_Cost_of_the_Home_A_B");
        }
        if ((costOfHome == null || costOfHome.compareTo(BigDecimal.ZERO) <= 0) && costOfUnit != null) {
            costOfHome = costOfUnit.add(gstAmount != null ? gstAmount : BigDecimal.ZERO);
        }

        BigDecimal maintenanceDeposits = getBigDecimal(dealMap, "Maintenance_Deposit", "Total_Cost_towards_Maint_Deposits_B", "Maintenance_for_One_year_Incl_GST");
        if ((maintenanceDeposits == null || maintenanceDeposits.compareTo(BigDecimal.ZERO) <= 0) && unitMap != null) {
            maintenanceDeposits = getBigDecimal(unitMap, "Maintenance_Deposit", "Total_Cost_towards_Maint_Deposits_B", "Maintenance_for_One_year_Incl_GST");
        }

        String amountInWords = costOfHome != null ? IndianCurrencyFormatter.convertToWords(costOfHome) : "";

        log.info("[OFFER_LETTER_TRACE_v2] Extracted Table 1 & Table 2 Values from primaryUnitSource:");
        log.info(" - Unit Record ID: {}", unitMap != null ? unitMap.get("id") : "N/A (fallback to Deal)");
        log.info(" - Unit Name: '{}'", unitName);
        log.info(" - Project Site: '{}'", projectName);
        log.info(" - Carpet Area: '{}'", carpetArea);
        log.info(" - Built-up Area: '{}'", superBuiltUp);
        log.info(" - Exclusive Common Area: '{}'", areaA);
        log.info(" - Common Area: '{}'", areaB);
        log.info(" - UDS: '{}'", areaC);
        log.info(" - Total UDS: '{}'", totalUds);
        log.info(" - Balcony: '{}'", balcony);
        log.info(" - Terrace: '{}'", terrace);
        log.info(" - Covered Car Parks: '{}'", carParks);
        log.info(" - Unit Price: '{}'", costOfUnit);
        log.info(" - GST: '{}'", gstAmount);
        log.info(" - Cost of Home: '{}'", costOfHome);
        log.info(" - Maintenance Deposit: '{}'", maintenanceDeposits);

        // Dynamic Payment Schedule (Milestones)
        List<OfferLetterMilestoneDto> milestones = extractMilestones(dealMap, costOfUnit, gstAmount, costOfHome);

        // Milestone Totals
        BigDecimal totalUnitAmount = null;
        BigDecimal totalGstAmount = null;
        BigDecimal totalInstallmentAmount = null;

        for (OfferLetterMilestoneDto m : milestones) {
            if (m.getUnitTotalAmount() != null) {
                totalUnitAmount = (totalUnitAmount == null ? BigDecimal.ZERO : totalUnitAmount).add(m.getUnitTotalAmount());
            }
            if (m.getGstAmount() != null) {
                totalGstAmount = (totalGstAmount == null ? BigDecimal.ZERO : totalGstAmount).add(m.getGstAmount());
            }
            if (m.getInstallmentAmount() != null) {
                totalInstallmentAmount = (totalInstallmentAmount == null ? BigDecimal.ZERO : totalInstallmentAmount).add(m.getInstallmentAmount());
            }
        }

        if (totalUnitAmount == null) totalUnitAmount = costOfUnit;
        if (totalGstAmount == null) totalGstAmount = gstAmount;
        if (totalInstallmentAmount == null) totalInstallmentAmount = costOfHome;

        // Bank Remittance Details (Dynamic from linked Project Site record in Zoho CRM ONLY)
        Map<?, ?> projectSiteMap = fetchProjectSiteMapFromCrm(dealMap, unitMap);

        log.info("[PROJECT_SITE_DEBUG_TRACE] projectSiteMap.keySet(): {}", projectSiteMap != null ? projectSiteMap.keySet() : "null");
        log.info("[PROJECT_SITE_DEBUG_TRACE] Individual Key Lookups from projectSiteMap:");
        log.info(" - Unit_Bank_Beneficiary: {}", projectSiteMap != null ? projectSiteMap.get("Unit_Bank_Beneficiary") : "null");
        log.info(" - Unit_Bank_Account_No: {}", projectSiteMap != null ? projectSiteMap.get("Unit_Bank_Account_No") : "null");
        log.info(" - Unit_Bank_Name: {}", projectSiteMap != null ? projectSiteMap.get("Unit_Bank_Name") : "null");
        log.info(" - Unit_Bank_Address: {}", projectSiteMap != null ? projectSiteMap.get("Unit_Bank_Address") : "null");
        log.info(" - Unit_Bank_IFSC_Code: {}", projectSiteMap != null ? projectSiteMap.get("Unit_Bank_IFSC_Code") : "null");
        log.info(" - GST_Bank_Beneficiary: {}", projectSiteMap != null ? projectSiteMap.get("GST_Bank_Beneficiary") : "null");
        log.info(" - GST_Bank_Account_No: {}", projectSiteMap != null ? projectSiteMap.get("GST_Bank_Account_No") : "null");
        log.info(" - GST_Bank_Name: {}", projectSiteMap != null ? projectSiteMap.get("GST_Bank_Name") : "null");
        log.info(" - GST_Bank_Address: {}", projectSiteMap != null ? projectSiteMap.get("GST_Bank_Address") : "null");
        log.info(" - GST_Bank_IFSC_Code: {}", projectSiteMap != null ? projectSiteMap.get("GST_Bank_IFSC_Code") : "null");

        if (projectSiteMap != null) {
            boolean hasNull = projectSiteMap.get("Unit_Bank_Beneficiary") == null ||
                              projectSiteMap.get("Unit_Bank_Account_No") == null ||
                              projectSiteMap.get("Unit_Bank_Name") == null ||
                              projectSiteMap.get("Unit_Bank_Address") == null ||
                              projectSiteMap.get("Unit_Bank_IFSC_Code") == null ||
                              projectSiteMap.get("GST_Bank_Beneficiary") == null ||
                              projectSiteMap.get("GST_Bank_Account_No") == null ||
                              projectSiteMap.get("GST_Bank_Name") == null ||
                              projectSiteMap.get("GST_Bank_Address") == null ||
                              projectSiteMap.get("GST_Bank_IFSC_Code") == null;
            if (hasNull) {
                log.info("[PROJECT_SITE_DEBUG_TRACE] ALL available keys in Project Site record:");
                for (Map.Entry<?, ?> entry : projectSiteMap.entrySet()) {
                    log.info("   [ALL_KEYS] {} => {}", entry.getKey(), entry.getValue());
                }
            }
        }

        String escrowBeneficiary = getStringFromObjectOrMap(projectSiteMap, "Unit_Bank_Beneficiary");
        if (escrowBeneficiary == null || escrowBeneficiary.isBlank()) escrowBeneficiary = "-";

        String escrowAccNo = getStringFromObjectOrMap(projectSiteMap, "Unit_Bank_Account_No");
        if (escrowAccNo == null || escrowAccNo.isBlank()) escrowAccNo = "-";

        String escrowBankName = getStringFromObjectOrMap(projectSiteMap, "Unit_Bank_Name");
        if (escrowBankName == null || escrowBankName.isBlank()) escrowBankName = "-";

        String escrowBankAddress = getStringFromObjectOrMap(projectSiteMap, "Unit_Bank_Address");
        if (escrowBankAddress == null || escrowBankAddress.isBlank()) escrowBankAddress = "-";

        String escrowIfsc = getStringFromObjectOrMap(projectSiteMap, "Unit_Bank_IFSC_Code");
        if (escrowIfsc == null || escrowIfsc.isBlank()) escrowIfsc = "-";

        OfferLetterBankDetailsDto escrowBank = OfferLetterBankDetailsDto.builder()
                .beneficiaryName(escrowBeneficiary)
                .beneficiaryAccountNo(escrowAccNo)
                .bankName(escrowBankName)
                .bankAddress(escrowBankAddress)
                .ifscCode(escrowIfsc)
                .build();

        String currentBeneficiary = getStringFromObjectOrMap(projectSiteMap, "GST_Bank_Beneficiary");
        if (currentBeneficiary == null || currentBeneficiary.isBlank()) currentBeneficiary = "-";

        String currentAccNo = getStringFromObjectOrMap(projectSiteMap, "GST_Bank_Account_No");
        if (currentAccNo == null || currentAccNo.isBlank()) currentAccNo = "-";

        String currentBankName = getStringFromObjectOrMap(projectSiteMap, "GST_Bank_Name");
        if (currentBankName == null || currentBankName.isBlank()) currentBankName = "-";

        String currentBankAddress = getStringFromObjectOrMap(projectSiteMap, "GST_Bank_Address");
        if (currentBankAddress == null || currentBankAddress.isBlank()) currentBankAddress = "-";

        String currentIfsc = getStringFromObjectOrMap(projectSiteMap, "GST_Bank_IFSC_Code");
        if (currentIfsc == null || currentIfsc.isBlank()) currentIfsc = "-";

        OfferLetterBankDetailsDto currentBank = OfferLetterBankDetailsDto.builder()
                .beneficiaryName(currentBeneficiary)
                .beneficiaryAccountNo(currentAccNo)
                .bankName(currentBankName)
                .bankAddress(currentBankAddress)
                .ifscCode(currentIfsc)
                .build();

        log.info("[OFFER_LETTER_PROJECT_SITE_TRACE] Mapped 10 Bank Detail Fields from Project Site record:");
        log.info(" - Table 4 Unit Cost -> Beneficiary: '{}', AccNo: '{}', Bank: '{}', Address: '{}', IFSC: '{}'",
                escrowBeneficiary, escrowAccNo, escrowBankName, escrowBankAddress, escrowIfsc);
        log.info(" - Table 5 GST/Maint -> Beneficiary: '{}', AccNo: '{}', Bank: '{}', Address: '{}', IFSC: '{}'",
                currentBeneficiary, currentAccNo, currentBankName, currentBankAddress, currentIfsc);

        OfferLetterDto dto = OfferLetterDto.builder()
                .offerLetterNo(offerNo)
                .offerLetterDate(offerDate)
                .projectName(projectName)
                .unitName(unitName)
                .applicants(applicants)
                .carpetAreaSqm(carpetArea)
                .superBuiltUpAreaSqm(superBuiltUp)
                .exclusiveCommonAreaSqm(areaA)
                .associationCommonAreaSqm(areaB)
                .udsAllotteeSqm(areaC)
                .totalUdsSqm(totalUds)
                .exclusiveBalconySqm(balcony)
                .openTerraceSqm(terrace)
                .coveredCarParks(carParks)
                .costOfUnit(costOfUnit)
                .costOfUnitFormatted(costOfUnit != null ? IndianCurrencyFormatter.formatCurrency(costOfUnit) : "")
                .gstRate("5%")
                .gstAmount(gstAmount)
                .gstAmountFormatted(gstAmount != null ? IndianCurrencyFormatter.formatCurrency(gstAmount) : "")
                .costOfHome(costOfHome)
                .costOfHomeFormatted(costOfHome != null ? IndianCurrencyFormatter.formatCurrency(costOfHome) : "")
                .maintenanceDeposits(maintenanceDeposits)
                .maintenanceDepositsFormatted(maintenanceDeposits != null ? IndianCurrencyFormatter.formatCurrency(maintenanceDeposits) : "")
                .amountInWords(amountInWords)
                .milestones(milestones)
                .totalMilestonePercent("100%")
                .totalUnitCost(totalUnitAmount)
                .totalUnitCostFormatted(totalUnitAmount != null ? IndianCurrencyFormatter.formatCurrency(totalUnitAmount) : "")
                .totalGstAmount(totalGstAmount)
                .totalGstAmountFormatted(totalGstAmount != null ? IndianCurrencyFormatter.formatCurrency(totalGstAmount) : "")
                .totalInstallmentCost(totalInstallmentAmount)
                .totalInstallmentCostFormatted(totalInstallmentAmount != null ? IndianCurrencyFormatter.formatCurrency(totalInstallmentAmount) : "")
                .escrowBankDetails(escrowBank)
                .currentBankDetails(currentBank)
                .validityDays(7)
                .companyName("GoodEarth Eco Communities Pvt Ltd")
                .reraNo("PRM/KA/RERA/1251/310/PR/070125/007359")
                .build();

        log.info("[OFFER_LETTER_TRACE_v2] 5. Values immediately before OfferLetterDto is returned:");
        log.info(" - Offer No: '{}'", dto.getOfferLetterNo());
        log.info(" - Offer Date: '{}'", dto.getOfferLetterDate());
        log.info(" - Unit Name: '{}'", dto.getUnitName());
        log.info(" - Project Name: '{}'", dto.getProjectName());
        log.info(" - Carpet Area Sqm: '{}'", dto.getCarpetAreaSqm());
        log.info(" - Super Built-up Area Sqm: '{}'", dto.getSuperBuiltUpAreaSqm());
        log.info(" - Exclusive Common Area Sqm: '{}'", dto.getExclusiveCommonAreaSqm());
        log.info(" - Association Common Area Sqm: '{}'", dto.getAssociationCommonAreaSqm());
        log.info(" - UDS Allottee Sqm: '{}'", dto.getUdsAllotteeSqm());
        log.info(" - Total UDS Sqm: '{}'", dto.getTotalUdsSqm());
        log.info(" - Exclusive Balcony Sqm: '{}'", dto.getExclusiveBalconySqm());
        log.info(" - Open Terrace Sqm: '{}'", dto.getOpenTerraceSqm());
        log.info(" - Covered Car Parks: '{}'", dto.getCoveredCarParks());
        log.info(" - Cost of Unit Formatted: '{}'", dto.getCostOfUnitFormatted());
        log.info(" - GST Amount Formatted: '{}'", dto.getGstAmountFormatted());
        log.info(" - Cost of Home Formatted: '{}'", dto.getCostOfHomeFormatted());
        log.info(" - Maintenance Deposits Formatted: '{}'", dto.getMaintenanceDepositsFormatted());

        return dto;
    }

    private List<OfferLetterApplicantDto> extractApplicants(Map<?, ?> dealMap) {
        List<OfferLetterApplicantDto> result = new ArrayList<>();

        // 1. Check for CRM Subform / Array of Applicants
        String[] subformKeys = {"Applicants", "Applicant_Details", "Co_Applicants", "Joint_Applicants", "Subform_Applicants"};
        for (String k : subformKeys) {
            if (dealMap.containsKey(k) && dealMap.get(k) instanceof List<?> list && !list.isEmpty()) {
                int index = 1;
                for (Object item : list) {
                    if (item instanceof Map<?, ?> rowMap) {
                        String type = getStringWithDefault(rowMap, index == 1 ? "PRIMARY" : ("CO_APPLICANT_" + index), "Applicant_Type", "Type", "Role");
                        String salutation = getStringWithDefault(rowMap, index == 1 ? "Ms." : "Mr.", "Salutation", "Title", "Applicant_Title");
                        String firstName = getString(rowMap, "First_Name", "Applicant_First_Name", "First_Name_A");
                        String lastName = getString(rowMap, "Last_Name", "Applicant_Last_Name", "Last_Name_A");
                        String fullName = getString(rowMap, "Full_Name", "Applicant_Name", "Name", "Contact_Name");
                        if ((fullName == null || fullName.isBlank()) && (firstName != null || lastName != null)) {
                            fullName = ((firstName != null ? firstName : "") + " " + (lastName != null ? lastName : "")).trim();
                        }
                        String email = getString(rowMap, "Email", "Applicant_Email");
                        String mobile = getString(rowMap, "Phone", "Mobile", "Applicant_Phone_number");
                        String address = getString(rowMap, "Address", "Permanent_Address");

                        String ordinalLabel = getOrdinalLabel(index);
                        String sigLabel = getSignatureRoleLabel(index, type);

                        if (fullName != null && !fullName.isBlank()) {
                            result.add(OfferLetterApplicantDto.builder()
                                    .applicantType(type)
                                    .salutation(salutation)
                                    .firstName(firstName)
                                    .lastName(lastName)
                                    .fullName(fullName)
                                    .email(email)
                                    .mobile(mobile)
                                    .address(address)
                                    .label(ordinalLabel)
                                    .signatureLabel(sigLabel)
                                    .build());
                            index++;
                        }
                    }
                }
                if (!result.isEmpty()) {
                    return result;
                }
            }
        }

        // 2. Dynamic positional applicant extraction for Primary (A), Secondary (C), Third (T), 4th, 5th, etc.
        ApplicantFieldSpec[] positionalSpecs = new ApplicantFieldSpec[]{
                new ApplicantFieldSpec("PRIMARY", "First applicant", "Primary Applicant", "Ms.",
                        new String[]{"Title_A", "Applicant_Title", "Title_1"},
                        new String[]{"First_Name_A", "Applicant_First_Name", "First_Name_1"},
                        new String[]{"Last_Name_A", "Applicant_Last_Name", "Last_Name_1"},
                        new String[]{"First_Applicant", "Applicant_Name", "Contact_Name", "Name_1"},
                        new String[]{"Applicant_Email", "Email_A", "Email_1"},
                        new String[]{"Applicant_Phone_number", "Phone_A", "Mobile_1"},
                        new String[]{"Permanent_Address_A", "Address_1"}),

                new ApplicantFieldSpec("CO_APPLICANT", "Second applicant", "Co Applicant", "Mr.",
                        new String[]{"Title_C", "CoApplicant_Title", "Title_2"},
                        new String[]{"First_Name_C", "Co_applicant_First_Name", "First_Name_2"},
                        new String[]{"Last_Name_C", "Co_applicant_Last_Name", "Last_Name_2"},
                        new String[]{"Second_Applicant", "Co_applicant_Name", "Name_2"},
                        new String[]{"Co_Applicant_Email", "Email_C", "Email_2"},
                        new String[]{"Co_Applicant_Phone", "Phone_C", "Mobile_2"},
                        new String[]{"Permanent_Address_C", "Address_2"}),

                new ApplicantFieldSpec("THIRD_APPLICANT", "Third applicant", "Third Applicant", "Mr.",
                        new String[]{"Title_T", "Third_Applicant_Title", "Title_3"},
                        new String[]{"First_Name_T", "Third_Applicant_First_Name", "First_Name_3"},
                        new String[]{"Last_Name_T", "Third_Applicant_Last_Name", "Last_Name_3"},
                        new String[]{"Third_Applicant", "Third_Applicant_Name", "Name_3"},
                        new String[]{"Third_Applicant_Email", "Email_T", "Email_3"},
                        new String[]{"Third_Applicant_Phone", "Phone_T", "Mobile_3"},
                        new String[]{"Permanent_Address_T", "Address_3"}),

                new ApplicantFieldSpec("FOURTH_APPLICANT", "Fourth applicant", "Fourth Applicant", "Mr.",
                        new String[]{"Title_4", "Fourth_Applicant_Title"},
                        new String[]{"First_Name_4", "Fourth_Applicant_First_Name"},
                        new String[]{"Last_Name_4", "Fourth_Applicant_Last_Name"},
                        new String[]{"Fourth_Applicant", "Fourth_Applicant_Name", "Name_4"},
                        new String[]{"Fourth_Applicant_Email", "Email_4"},
                        new String[]{"Fourth_Applicant_Phone", "Phone_4"},
                        new String[]{"Permanent_Address_4"})
        };

        int count = 1;
        for (ApplicantFieldSpec spec : positionalSpecs) {
            String title = getStringWithDefault(dealMap, spec.defaultTitle, spec.titleKeys);
            String first = getString(dealMap, spec.firstNameKeys);
            String last = getString(dealMap, spec.lastNameKeys);
            String full = getString(dealMap, spec.fullNameKeys);

            if (full == null && (first != null || last != null)) {
                full = ((first != null ? first : "") + " " + (last != null ? last : "")).trim();
            }



            if (full != null && !full.isBlank()) {
                String email = getString(dealMap, spec.emailKeys);
                String mobile = getString(dealMap, spec.mobileKeys);
                String address = getString(dealMap, spec.addressKeys);

                result.add(OfferLetterApplicantDto.builder()
                        .applicantType(spec.type)
                        .salutation(title)
                        .firstName(first)
                        .lastName(last)
                        .fullName(full)
                        .email(email)
                        .mobile(mobile)
                        .address(address)
                        .label(spec.label)
                        .signatureLabel(spec.signatureLabel)
                        .build());
                count++;
            }
        }

        return result;
    }

    private String getOrdinalLabel(int index) {
        switch (index) {
            case 1: return "First applicant";
            case 2: return "Second applicant";
            case 3: return "Third applicant";
            case 4: return "Fourth applicant";
            case 5: return "Fifth applicant";
            default: return "Applicant " + index;
        }
    }

    private String getSignatureRoleLabel(int index, String type) {
        if ("PRIMARY".equalsIgnoreCase(type) || index == 1) return "Primary Applicant";
        if ("CO_APPLICANT".equalsIgnoreCase(type) || index == 2) return "Co Applicant";
        if ("THIRD_APPLICANT".equalsIgnoreCase(type) || index == 3) return "Third Applicant";
        if ("FOURTH_APPLICANT".equalsIgnoreCase(type) || index == 4) return "Fourth Applicant";
        return "Applicant " + index;
    }

    private static class ApplicantFieldSpec {
        final String type;
        final String label;
        final String signatureLabel;
        final String defaultTitle;
        final String[] titleKeys;
        final String[] firstNameKeys;
        final String[] lastNameKeys;
        final String[] fullNameKeys;
        final String[] emailKeys;
        final String[] mobileKeys;
        final String[] addressKeys;

        ApplicantFieldSpec(String type, String label, String signatureLabel, String defaultTitle,
                           String[] titleKeys, String[] firstNameKeys, String[] lastNameKeys,
                           String[] fullNameKeys, String[] emailKeys, String[] mobileKeys, String[] addressKeys) {
            this.type = type;
            this.label = label;
            this.signatureLabel = signatureLabel;
            this.defaultTitle = defaultTitle;
            this.titleKeys = titleKeys;
            this.firstNameKeys = firstNameKeys;
            this.lastNameKeys = lastNameKeys;
            this.fullNameKeys = fullNameKeys;
            this.emailKeys = emailKeys;
            this.mobileKeys = mobileKeys;
            this.addressKeys = addressKeys;
        }
    }

    private List<OfferLetterMilestoneDto> extractMilestones(
            Map<?, ?> dealMap, BigDecimal totalUnitCost, BigDecimal totalGstAmount, BigDecimal totalCostOfHome) {

        List<OfferLetterMilestoneDto> milestones = new ArrayList<>();

        // Try extracting subform array from CRM payload
        Object rawSubform = null;
        String[] subformKeys = {"Payment_Schedule", "Payment_Milestones", "Stage_Milestones", "Milestone_Details", "Subform_1", "Payment_Details", "Milestones", "Payment_Milestone_Schedule", "Payment_Schedule_Details", "Subform_2", "Schedule"};
        for (String k : subformKeys) {
            if (dealMap.containsKey(k) && dealMap.get(k) instanceof List<?> list && !list.isEmpty()) {
                rawSubform = list;
                break;
            }
        }

        if (rawSubform instanceof List<?> list && !list.isEmpty()) {
            int index = 1;
            for (Object item : list) {
                if (item instanceof Map<?, ?> rowMap) {
                    String name = getString(rowMap, "Payment_milestone_name", "Milestone_Name", "Stage_Name", "Name", "Milestone", "Milestone_Stage", "Payment_Stage", "Stage");
                    String percentStr = getString(rowMap, "Payment_percent", "Percentage", "Percent", "Payment_Percentage", "Milestone_Percentage", "%", "Percent_Value");
                    
                    String dueDate = getString(rowMap, "Payment_due_date", "Due_Date", "Payment_Due_Date", "Target_Date", "Date", "Completion_Date", "Expected_Date", "Schedule_Date");
                    if (dueDate == null || dueDate.isBlank()) {
                        dueDate = getString(dealMap, "Due_Date_" + index, "Payment_Due_Date_" + index, "Milestone_" + index + "_Due_Date", "Stage_" + index + "_Due_Date");
                    }

                    BigDecimal rawUnitAmt = getBigDecimal(rowMap, "Unit_total_amount", "Unit_Amount", "Amount", "Unit_Cost", "Unit_Total_Amount");
                    BigDecimal rawGstAmt = getBigDecimal(rowMap, "GST", "GST_Amount", "GST_Value", "Tax_Amount");
                    BigDecimal rawInstAmt = getBigDecimal(rowMap, "Installment", "Installment_Amount", "Total_Amount", "Milestone_Amount", "Gross_Amount");

                    BigDecimal percentVal = null;
                    if (percentStr != null && !percentStr.isBlank()) {
                        try {
                            String pClean = percentStr.replaceAll("[^0-9.]", "");
                            if (!pClean.isEmpty()) {
                                percentVal = new BigDecimal(pClean);
                            }
                        } catch (Exception ignored) {}
                    }

                    BigDecimal unitAmt = rawUnitAmt;
                    BigDecimal gstAmt = rawGstAmt;
                    BigDecimal instAmt = rawInstAmt;

                    // If subform row has percentage but amounts are missing/unpopulated in CRM, compute dynamically from latest Deal totals
                    if (percentVal != null && percentVal.compareTo(BigDecimal.ZERO) > 0) {
                        BigDecimal percentRatio = percentVal.divide(new BigDecimal("100"), 6, RoundingMode.HALF_UP);
                        if (unitAmt == null && totalUnitCost != null) {
                            unitAmt = totalUnitCost.multiply(percentRatio).setScale(0, RoundingMode.HALF_UP);
                        }
                        if (gstAmt == null && totalGstAmount != null) {
                            gstAmt = totalGstAmount.multiply(percentRatio).setScale(0, RoundingMode.HALF_UP);
                        }
                        if (instAmt == null) {
                            if (totalCostOfHome != null) {
                                instAmt = totalCostOfHome.multiply(percentRatio).setScale(0, RoundingMode.HALF_UP);
                            } else if (unitAmt != null || gstAmt != null) {
                                instAmt = (unitAmt != null ? unitAmt : BigDecimal.ZERO).add(gstAmt != null ? gstAmt : BigDecimal.ZERO);
                            }
                        }
                    } else {
                        if (instAmt == null && (unitAmt != null || gstAmt != null)) {
                            instAmt = (unitAmt != null ? unitAmt : BigDecimal.ZERO).add(gstAmt != null ? gstAmt : BigDecimal.ZERO);
                        }
                        if (unitAmt != null && totalUnitCost != null && totalUnitCost.compareTo(BigDecimal.ZERO) > 0) {
                            BigDecimal calcPct = unitAmt.multiply(new BigDecimal("100")).divide(totalUnitCost, 1, RoundingMode.HALF_UP);
                            percentStr = calcPct.stripTrailingZeros().toPlainString() + "%";
                        } else if (instAmt != null && totalCostOfHome != null && totalCostOfHome.compareTo(BigDecimal.ZERO) > 0) {
                            BigDecimal calcPct = instAmt.multiply(new BigDecimal("100")).divide(totalCostOfHome, 1, RoundingMode.HALF_UP);
                            percentStr = calcPct.stripTrailingZeros().toPlainString() + "%";
                        }
                    }

                    if (name != null) {
                        milestones.add(OfferLetterMilestoneDto.builder()
                                .sNo(index++)
                                .milestoneName(name)
                                .paymentPercent(percentStr != null ? (percentStr.contains("%") ? percentStr : percentStr + "%") : "")
                                .dueDate(dueDate != null ? dueDate : "")
                                .unitTotalAmount(unitAmt)
                                .unitTotalAmountFormatted(unitAmt != null ? IndianCurrencyFormatter.formatCurrency(unitAmt) : "")
                                .gstAmount(gstAmt)
                                .gstAmountFormatted(gstAmt != null ? IndianCurrencyFormatter.formatCurrency(gstAmt) : "")
                                .installmentAmount(instAmt)
                                .installmentAmountFormatted(instAmt != null ? IndianCurrencyFormatter.formatCurrency(instAmt) : "")
                                .build());
                    }
                }
            }
        }

        // If no subform list returned from CRM, build default dynamic schedule matching the 16 milestones reference
        if (milestones.isEmpty()) {
            milestones = createReferenceMilestoneSchedule(totalUnitCost, totalGstAmount, totalCostOfHome, dealMap);
        }

        return milestones;
    }

    private List<OfferLetterMilestoneDto> createReferenceMilestoneSchedule(
            BigDecimal unitTotal, BigDecimal gstTotal, BigDecimal homeTotal, Map<?, ?> dealMap) {

        Object[][] defs = new Object[][]{
                {1, "On Booking", 5, "Jul-2025"},
                {2, "On Agreement", 10, "Jul-2025"},
                {3, "On Excavation & Levelling", 10, "Aug-2025"},
                {4, "On Completion of Foundation", 7, "Aug-2025"},
                {5, "On Completion of Lower Basement Roof Slab Casting", 7, "Nov-2025"},
                {6, "On Completion of Upper Basement Roof Slab Casting", 7, "Jan-2026"},
                {7, "On Completion of Ground Floor Roof Slab Casting", 7, "Apr-2026"},
                {8, "On Completion of 1st Floor Roof Slab Casting", 7, "Jul-2026"},
                {9, "On Completion of 2nd Floor Roof Slab Casting", 7, "Oct-2026"},
                {10, "On Completion of 3rd Floor Roof Slab Casting", 7, "Mar-2027"},
                {11, "On Completion of 4th Floor Roof Slab Casting", 7, "Jun-2027"},
                {12, "On Completion of Brick Work of respective flat", 5, "Aug-2027"},
                {13, "On Completion of Plastering of respective flat", 5, "Oct-2027"},
                {14, "On Completion of Flooring of respective flat", 4, "Dec-2027"},
                {15, "On Completion of Painting & Polishing of respective flat", 4, "Mar-2028"},
                {16, "On Final Hand Over for Registration/Possession", 1, "Aug-2028"}
        };

        List<OfferLetterMilestoneDto> list = new ArrayList<>();
        for (Object[] d : defs) {
            int sNo = (Integer) d[0];
            String name = (String) d[1];
            int pct = (Integer) d[2];
            String defaultDueDate = (String) d[3];

            String dueDate = null;
            if (dealMap != null) {
                dueDate = getString(dealMap,
                        "Due_Date_" + sNo,
                        "Payment_Due_Date_" + sNo,
                        "Milestone_" + sNo + "_Due_Date",
                        "Stage_" + sNo + "_Due_Date",
                        "Due_Date_Stage_" + sNo);
            }
            if (dueDate == null || dueDate.isBlank()) {
                dueDate = defaultDueDate;
            }

            BigDecimal pctRatio = new BigDecimal(pct).divide(new BigDecimal(100), 4, RoundingMode.HALF_UP);
            BigDecimal uAmt = unitTotal != null ? unitTotal.multiply(pctRatio).setScale(0, RoundingMode.HALF_UP) : null;
            BigDecimal gAmt = gstTotal != null ? gstTotal.multiply(pctRatio).setScale(0, RoundingMode.HALF_UP) : null;
            BigDecimal iAmt = (uAmt != null || gAmt != null) ? (uAmt != null ? uAmt : BigDecimal.ZERO).add(gAmt != null ? gAmt : BigDecimal.ZERO) : null;

            list.add(OfferLetterMilestoneDto.builder()
                    .sNo(sNo)
                    .milestoneName(name)
                    .paymentPercent(pct + "%")
                    .dueDate(dueDate)
                    .unitTotalAmount(uAmt)
                    .unitTotalAmountFormatted(uAmt != null ? IndianCurrencyFormatter.formatCurrency(uAmt) : "")
                    .gstAmount(gAmt)
                    .gstAmountFormatted(gAmt != null ? IndianCurrencyFormatter.formatCurrency(gAmt) : "")
                    .installmentAmount(iAmt)
                    .installmentAmountFormatted(iAmt != null ? IndianCurrencyFormatter.formatCurrency(iAmt) : "")
                    .build());
        }
        return list;
    }

    private String sanitizeString(String input) {
        if (input == null) return null;
        return input.replaceAll("[\\r\\n]+", " ").replaceAll("\\s+", " ").trim();
    }

    private String getStringWithDefault(Map<?, ?> map, String defaultVal, String... keys) {
        if (map == null) return sanitizeString(defaultVal);
        for (String k : keys) {
            if (map.containsKey(k) && map.get(k) != null) {
                String val = sanitizeString(map.get(k).toString());
                if (val != null && !val.isEmpty()) return val;
            }
        }
        return sanitizeString(defaultVal);
    }

    private String getString(Map<?, ?> map, String... keys) {
        return getStringWithDefault(map, null, keys);
    }

    private String getStringFromObjectOrMap(Map<?, ?> map, String... keys) {
        if (map == null) return null;
        for (String k : keys) {
            if (map.containsKey(k) && map.get(k) != null) {
                Object obj = map.get(k);
                if (obj instanceof Map<?, ?> subMap) {
                    if (subMap.get("name") != null) return sanitizeString(subMap.get("name").toString());
                } else {
                    String str = sanitizeString(obj.toString());
                    if (str != null && !str.isEmpty()) return str;
                }
            }
        }
        return null;
    }

    private BigDecimal getBigDecimal(Map<?, ?> map, String... keys) {
        if (map == null) return null;
        for (String k : keys) {
            if (map.containsKey(k) && map.get(k) != null) {
                Object obj = map.get(k);
                try {
                    if (obj instanceof Number number) {
                        return new BigDecimal(number.toString());
                    }
                    String str = obj.toString().trim();
                    if (!str.isEmpty()) {
                        return new BigDecimal(str);
                    }
                } catch (Exception ignored) {
                }
            }
        }
        return null;
    }

    private String resolveModuleApiNameByDisplayLabel(String targetLabel) {
        if (targetLabel == null || targetLabel.isBlank()) return null;
        try {
            String crmApiUrl = properties.getCrmApiUrl();
            String metadataUrl = crmApiUrl + "/settings/modules";
            log.info("[ZOHO_MODULE_METADATA_TRACE] Querying CRM module metadata from: {}", metadataUrl);
            Map<?, ?> response = apiClient.get(metadataUrl, Map.class);
            log.info("[ZOHO_MODULE_METADATA_TRACE] Raw GET /settings/modules response: {}", response);

            if (response != null && response.get("modules") instanceof List<?> modules) {
                for (Object item : modules) {
                    if (item instanceof Map<?, ?> modMap) {
                        Object displayLabelObj = modMap.get("display_label");
                        Object singularLabelObj = modMap.get("singular_label");
                        Object pluralLabelObj = modMap.get("plural_label");
                        Object apiNameObj = modMap.get("api_name");
                        Object idObj = modMap.get("id");

                        String displayLabel = displayLabelObj != null ? displayLabelObj.toString() : "";
                        String singularLabel = singularLabelObj != null ? singularLabelObj.toString() : "";
                        String pluralLabel = pluralLabelObj != null ? pluralLabelObj.toString() : "";
                        String apiName = apiNameObj != null ? apiNameObj.toString() : "";
                        String moduleId = idObj != null ? idObj.toString() : "";

                        log.info("[ZOHO_MODULE_METADATA_TRACE] Module Metadata Entry -> Display Label: '{}', Singular: '{}', Plural: '{}', API Name: '{}', Module ID: '{}'",
                                displayLabel, singularLabel, pluralLabel, apiName, moduleId);

                        if (displayLabel.equalsIgnoreCase(targetLabel) || singularLabel.equalsIgnoreCase(targetLabel) || pluralLabel.equalsIgnoreCase(targetLabel)
                                || displayLabel.replaceAll("\\s+", "").equalsIgnoreCase(targetLabel.replaceAll("\\s+", ""))) {
                            log.info("[ZOHO_MODULE_METADATA_TRACE] MATCH FOUND! Display Label: '{}', Actual API Name: '{}', Module ID: '{}'",
                                    displayLabel, apiName, moduleId);
                            return apiName;
                        }
                    }
                }
            }
        } catch (Exception ex) {
            log.warn("[ZOHO_MODULE_METADATA_TRACE] Exception querying CRM modules metadata for label '{}': {}", targetLabel, ex.getMessage());
        }
        return null;
    }

    private Map<?, ?> fetchProjectSiteMapFromCrm(Map<?, ?> dealMap, Map<?, ?> unitMap) {
        log.info("[OFFER_LETTER_PROJECT_SITE_TRACE] --- START Project Site Lookup Resolution ---");
        log.info("[OFFER_LETTER_PROJECT_SITE_TRACE] Deal Map keys: {}", dealMap != null ? dealMap.keySet() : "null");
        log.info("[OFFER_LETTER_PROJECT_SITE_TRACE] Unit Map keys: {}", unitMap != null ? unitMap.keySet() : "null");

        String projectSiteRecordId = null;
        String projectSiteName = null;
        String resolvedLookupKey = null;
        Object resolvedLookupVal = null;
        String sourceMapName = null;

        Map<String, Map<?, ?>> mapsToSearch = new LinkedHashMap<>();
        if (unitMap != null) mapsToSearch.put("unitMap", unitMap);
        if (dealMap != null) mapsToSearch.put("dealMap", dealMap);

        String[] lookupKeys = {
            "Project_Site", "Project_Sites", "Project_Site_Name", "Project_Site_Lookup", 
            "Project_Site_ID", "Project", "Projects", "Project_Name", "Project_Site_s", 
            "Project_Sites_s", "Linked_Project_Site", "Associated_Project_Site"
        };

        for (Map.Entry<String, Map<?, ?>> entry : mapsToSearch.entrySet()) {
            Map<?, ?> m = entry.getValue();
            for (String key : lookupKeys) {
                if (m.containsKey(key) && m.get(key) != null) {
                    Object obj = m.get(key);
                    log.info("[OFFER_LETTER_PROJECT_SITE_TRACE] Found lookup key '{}' in {}: {}", key, entry.getKey(), obj);
                    if (obj instanceof Map<?, ?> lookupMap) {
                        Object idObj = lookupMap.get("id") != null ? lookupMap.get("id") : lookupMap.get("ID");
                        if (idObj != null) {
                            projectSiteRecordId = idObj.toString();
                        }
                        if (lookupMap.get("name") != null) {
                            projectSiteName = lookupMap.get("name").toString();
                        }
                        resolvedLookupKey = key;
                        resolvedLookupVal = obj;
                        sourceMapName = entry.getKey();
                        break;
                    } else if (obj instanceof List<?> list && !list.isEmpty() && list.get(0) instanceof Map<?, ?> listMap) {
                        Object idObj = listMap.get("id") != null ? listMap.get("id") : listMap.get("ID");
                        if (idObj != null) {
                            projectSiteRecordId = idObj.toString();
                        }
                        if (listMap.get("name") != null) {
                            projectSiteName = listMap.get("name").toString();
                        }
                        resolvedLookupKey = key;
                        resolvedLookupVal = obj;
                        sourceMapName = entry.getKey();
                        break;
                    } else if (!(obj instanceof Map) && !(obj instanceof List)) {
                        String val = obj.toString().trim();
                        if (val.matches("\\d{15,20}")) {
                            projectSiteRecordId = val;
                        } else if (!val.isBlank()) {
                            projectSiteName = val;
                        }
                        resolvedLookupKey = key;
                        resolvedLookupVal = obj;
                        sourceMapName = entry.getKey();
                        break;
                    }
                }
            }
            if (projectSiteRecordId != null || projectSiteName != null) break;
        }

        log.info("[OFFER_LETTER_PROJECT_SITE_TRACE] Resolution Result -> Source Map: '{}', Lookup Key: '{}', Raw Lookup Value: {}, Extracted Record ID: '{}', Extracted Name: '{}'",
                sourceMapName, resolvedLookupKey, resolvedLookupVal, projectSiteRecordId, projectSiteName);

        // Dynamically resolve exact API Name for Project Sites module from Zoho CRM Metadata
        String exactModuleApiName = null;

        if (resolvedLookupKey != null) {
            exactModuleApiName = resolveReferencedModuleApiName(resolvedLookupKey);
        }
        if (exactModuleApiName == null || exactModuleApiName.isBlank()) {
            exactModuleApiName = resolveModuleApiNameByDisplayLabel("Project Sites");
        }
        if (exactModuleApiName == null || exactModuleApiName.isBlank()) {
            exactModuleApiName = resolveModuleApiNameByDisplayLabel("Project Site");
        }
        if (exactModuleApiName == null || exactModuleApiName.isBlank()) {
            exactModuleApiName = "Project_Sites"; // Final fallback if metadata call is unvailable
        }

        log.info("[ZOHO_MODULE_METADATA_TRACE] EXACT RESOLVED PROJECT SITES MODULE API NAME: '{}'", exactModuleApiName);

        String crmApiUrl = properties.getCrmApiUrl();

        // 1. Direct GET by Record ID using EXACT module API name
        if (projectSiteRecordId != null && !projectSiteRecordId.isBlank()) {
            String url = crmApiUrl + "/" + exactModuleApiName + "/" + projectSiteRecordId;
            log.info("[OFFER_LETTER_PROJECT_SITE_TRACE] Attempting GET by Record ID using exact module API name: {}", url);
            try {
                Map<?, ?> response = apiClient.get(url, Map.class);
                log.info("[OFFER_LETTER_PROJECT_SITE_TRACE] Raw JSON response from GET {}: {}", url, response);
                if (response != null && response.containsKey("data") && response.get("data") instanceof List<?> list && !list.isEmpty()) {
                    if (list.get(0) instanceof Map<?, ?> firstRecord) {
                        log.info("[OFFER_LETTER_PROJECT_SITE_TRACE] SUCCESS (HTTP 200): Extracted data[0] Project Site record via ID GET from endpoint: {}", url);
                        return firstRecord;
                    }
                }
            } catch (Exception ex) {
                log.warn("[OFFER_LETTER_PROJECT_SITE_TRACE] GET endpoint {} failed: {}", url, ex.getMessage());
            }
        }

        // 2. Search Fallback by Project Site Name using EXACT module API name
        if (projectSiteName != null && !projectSiteName.isBlank()) {
            try {
                String encodedName = java.net.URLEncoder.encode(projectSiteName, java.nio.charset.StandardCharsets.UTF_8);
                String searchUrl = crmApiUrl + "/" + exactModuleApiName + "/search?criteria=(Name:equals:" + encodedName + ")";
                log.info("[OFFER_LETTER_PROJECT_SITE_TRACE] Attempting Search Fallback using exact module API name: {}", searchUrl);
                Map<?, ?> response = apiClient.get(searchUrl, Map.class);
                log.info("[OFFER_LETTER_PROJECT_SITE_TRACE] Raw JSON response from Search GET {}: {}", searchUrl, response);
                if (response != null && response.containsKey("data") && response.get("data") instanceof List<?> list && !list.isEmpty()) {
                    if (list.get(0) instanceof Map<?, ?> firstRecord) {
                        log.info("[OFFER_LETTER_PROJECT_SITE_TRACE] SUCCESS (HTTP 200): Extracted data[0] Project Site record via Name Search from endpoint: {}", searchUrl);
                        return firstRecord;
                    }
                }
            } catch (Exception ex) {
                log.warn("[OFFER_LETTER_PROJECT_SITE_TRACE] Search endpoint for module '{}' failed: {}", exactModuleApiName, ex.getMessage());
            }
        }

        log.warn("[OFFER_LETTER_PROJECT_SITE_TRACE] WARNING: Unable to fetch Project Site record from Zoho CRM. Returning null.");
        return null;
    }
}

