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
import java.util.List;
import java.util.Map;

@Service
public class OfferLetterServiceImpl implements OfferLetterService {

    private static final Logger log = LoggerFactory.getLogger(OfferLetterServiceImpl.class);

    private final ZohoApiClient apiClient;
    private final ZohoProperties properties;
    private final ZohoKycSyncService zohoKycSyncService;
    private final OfferLetterPdfGenerator pdfGenerator;

    public OfferLetterServiceImpl(
            ZohoApiClient apiClient,
            ZohoProperties properties,
            ZohoKycSyncService zohoKycSyncService,
            OfferLetterPdfGenerator pdfGenerator) {
        this.apiClient = apiClient;
        this.properties = properties;
        this.zohoKycSyncService = zohoKycSyncService;
        this.pdfGenerator = pdfGenerator;
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
                    "Offer Letter is not available as Deal record was not found.",
                    null,
                    null,
                    cleanIdentifier
            );
        }

        String fileUrl = "/api/v1/deals/" + cleanIdentifier + "/offer-letter/file";
        String fileName = "Offer_Letter_" + cleanIdentifier + ".pdf";

        return new OfferLetterStatusDto(
                true,
                "Offer Letter is generated dynamically and available for viewing.",
                fileUrl,
                fileName,
                targetRecordId
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

            String crmApiUrl = properties.getCrmApiUrl();
            String url = crmApiUrl + "/Units/" + unitRecordId;
            log.info("[OFFER_LETTER_UNIT_TRACE] 4. Exact GET URL sent to Zoho: {}", url);

            Map<?, ?> response = null;
            try {
                response = apiClient.get(url, Map.class);
                log.info("[OFFER_LETTER_UNIT_TRACE] 5. COMPLETE Zoho Response JSON from GET {}: {}", url, response);
            } catch (Exception apiEx) {
                log.error("[OFFER_LETTER_UNIT_TRACE] 5. Zoho API HTTP Request Error for URL {}: {}", url, apiEx.getMessage(), apiEx);
                String fallbackUrl = crmApiUrl + "/Products/" + unitRecordId;
                log.info("[OFFER_LETTER_UNIT_TRACE] 5b. Attempting fallback GET URL: {}", fallbackUrl);
                try {
                    response = apiClient.get(fallbackUrl, Map.class);
                    log.info("[OFFER_LETTER_UNIT_TRACE] 5c. COMPLETE Zoho Response JSON from fallback GET {}: {}", fallbackUrl, response);
                } catch (Exception fallbackEx) {
                    log.error("[OFFER_LETTER_UNIT_TRACE] Fallback GET URL {} also failed: {}", fallbackUrl, fallbackEx.getMessage());
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

        // Table 2 - Sale Price Details directly from field_labels.xlsx (ONLY from unitMap)
        BigDecimal costOfUnit = getBigDecimal(unitMap, "Unit_Price");

        BigDecimal gstAmount = getBigDecimal(unitMap, "GST_at_5", "GST", "GST_Value");

        BigDecimal costOfHome = getBigDecimal(unitMap, "Cost_of_Home_Inc_GST_A", "Final_Cost_of_the_Home_A_B");

        BigDecimal maintenanceDeposits = getBigDecimal(unitMap, "Maintenance_Deposit", "Total_Cost_towards_Maint_Deposits_B", "Maintenance_for_One_year_Incl_GST");

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

        // Bank Remittance Details
        OfferLetterBankDetailsDto escrowBank = OfferLetterBankDetailsDto.builder()
                .beneficiaryName(getStringWithDefault(dealMap, "GEECPL - GOOD EARTH CADENCE COLLECTION ESCROW ACCOUNT", "Escrow_Beneficiary_Name"))
                .beneficiaryAccountNo(getStringWithDefault(dealMap, "57500001653570", "Escrow_Account_No"))
                .bankName(getStringWithDefault(dealMap, "HDFC Bank Ltd", "Escrow_Bank_Name"))
                .bankAddress(getStringWithDefault(dealMap, "Richmond Road, Bengaluru", "Escrow_Bank_Address"))
                .ifscCode(getStringWithDefault(dealMap, "HDFC0000523", "Escrow_IFSC_Code"))
                .build();

        OfferLetterBankDetailsDto currentBank = OfferLetterBankDetailsDto.builder()
                .beneficiaryName(getStringWithDefault(dealMap, "GEECPL GOOD EARTH CADENCE CURRENT ACCOUNT", "Current_Beneficiary_Name"))
                .beneficiaryAccountNo(getStringWithDefault(dealMap, "57500001654366", "Current_Account_No"))
                .bankName(getStringWithDefault(dealMap, "HDFC Bank Ltd", "Current_Bank_Name"))
                .bankAddress(getStringWithDefault(dealMap, "Richmond Road, Bengaluru", "Current_Bank_Address"))
                .ifscCode(getStringWithDefault(dealMap, "HDFC0000523", "Current_IFSC_Code"))
                .build();

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
        String[] subformKeys = {"Payment_Schedule", "Payment_Milestones", "Stage_Milestones", "Milestone_Details", "Subform_1"};
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
                    String name = getString(rowMap, "Payment_milestone_name", "Milestone_Name", "Stage_Name", "Name");
                    String percentStr = getString(rowMap, "Payment_percent", "Percentage", "Percent");
                    String dueDate = getString(rowMap, "Payment_due_date", "Due_Date");

                    BigDecimal unitAmt = getBigDecimal(rowMap, "Unit_total_amount", "Unit_Amount", "Amount");
                    BigDecimal gstAmt = getBigDecimal(rowMap, "GST", "GST_Amount");
                    BigDecimal instAmt = getBigDecimal(rowMap, "Installment", "Installment_Amount", "Total_Amount");

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
            milestones = createReferenceMilestoneSchedule(totalUnitCost, totalGstAmount, totalCostOfHome);
        }

        return milestones;
    }

    private List<OfferLetterMilestoneDto> createReferenceMilestoneSchedule(
            BigDecimal unitTotal, BigDecimal gstTotal, BigDecimal homeTotal) {

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
            String dueDate = (String) d[3];

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

    private String getStringWithDefault(Map<?, ?> map, String defaultVal, String... keys) {
        for (String k : keys) {
            if (map.containsKey(k) && map.get(k) != null) {
                String val = map.get(k).toString().trim();
                if (!val.isEmpty()) return val;
            }
        }
        return defaultVal;
    }

    private String getString(Map<?, ?> map, String... keys) {
        return getStringWithDefault(map, null, keys);
    }

    private String getStringFromObjectOrMap(Map<?, ?> map, String... keys) {
        for (String k : keys) {
            if (map.containsKey(k) && map.get(k) != null) {
                Object obj = map.get(k);
                if (obj instanceof Map<?, ?> subMap) {
                    if (subMap.get("name") != null) return subMap.get("name").toString().trim();
                } else {
                    String str = obj.toString().trim();
                    if (!str.isEmpty()) return str;
                }
            }
        }
        return null;
    }

    private BigDecimal getBigDecimal(Map<?, ?> map, String... keys) {
        for (String k : keys) {
            if (map.containsKey(k) && map.get(k) != null) {
                try {
                    String str = map.get(k).toString().replaceAll("[^0-9.]", "");
                    if (!str.isEmpty()) {
                        return new BigDecimal(str);
                    }
                } catch (Exception ignored) {
                }
            }
        }
        return null;
    }
}
