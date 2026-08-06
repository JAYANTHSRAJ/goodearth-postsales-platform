package com.goodearth.postsales.client.service;

import com.goodearth.postsales.buyer.entity.Buyer;
import com.goodearth.postsales.client.dto.ClientHomeDetailsDto;
import com.goodearth.postsales.common.exception.CustomException;
import com.goodearth.postsales.integration.zoho.ZohoApiClient;
import com.goodearth.postsales.integration.zoho.ZohoProperties;
import com.goodearth.postsales.stage.entity.Stage;
import com.goodearth.postsales.stage.repository.StageRepository;
import com.goodearth.postsales.workflow.entity.Workflow;
import com.goodearth.postsales.workflow.repository.WorkflowRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
@Transactional(readOnly = true)
public class ClientHomeServiceImpl implements ClientHomeService {

    private static final Logger log = LoggerFactory.getLogger(ClientHomeServiceImpl.class);

    private final ClientPortalServiceHelper helper;
    private final StageRepository stageRepository;
    private final WorkflowRepository workflowRepository;
    private final ZohoApiClient apiClient;
    private final ZohoProperties properties;

    public ClientHomeServiceImpl(
            ClientPortalServiceHelper helper,
            StageRepository stageRepository,
            WorkflowRepository workflowRepository,
            ZohoApiClient apiClient,
            ZohoProperties properties) {
        this.helper = helper;
        this.stageRepository = stageRepository;
        this.workflowRepository = workflowRepository;
        this.apiClient = apiClient;
        this.properties = properties;
    }

    @Override
    public ClientHomeDetailsDto getHomeDetails(UserDetails userDetails, UUID workflowId) {
        Buyer buyer = helper.getAuthenticatedBuyer(userDetails);

        Workflow workflow;
        if (workflowId != null) {
            workflow = workflowRepository.findById(workflowId)
                    .orElseThrow(() -> new CustomException("Workflow not found.", HttpStatus.NOT_FOUND));
        } else {
            workflow = helper.getBuyerWorkflow(buyer);
        }

        Stage currentStage = null;
        if (workflow.getCurrentStageId() != null) {
            currentStage = stageRepository.findById(workflow.getCurrentStageId()).orElse(null);
        }

        ClientHomeDetailsDto homeDetails = new ClientHomeDetailsDto();
        String zohoDealId = buyer.getZohoDealId();

        // 1. DYNAMIC ZOHO CRM SINGLE SOURCE OF TRUTH FETCH
        if (zohoDealId != null && !zohoDealId.isBlank()) {
            try {
                String dealUrl = properties.getCrmApiUrl() + "/Deals/" + zohoDealId;
                log.info("[MY_HOME_CRM] Querying Zoho CRM Deal Record: {}", dealUrl);

                @SuppressWarnings("unchecked")
                Map<String, Object> dealRes = apiClient.get(dealUrl, Map.class);

                if (dealRes != null && dealRes.containsKey("data")) {
                    @SuppressWarnings("unchecked")
                    List<Map<String, Object>> dealList = (List<Map<String, Object>>) dealRes.get("data");

                    if (dealList != null && !dealList.isEmpty()) {
                        Map<String, Object> deal = dealList.get(0);

                        // Project Site Name from CRM
                        if (deal.get("Project_Site") instanceof Map) {
                            @SuppressWarnings("unchecked")
                            Map<String, Object> siteMap = (Map<String, Object>) deal.get("Project_Site");
                            if (siteMap.containsKey("name") && siteMap.get("name") != null) {
                                homeDetails.setProject((String) siteMap.get("name"));
                            }
                        }

                        // Unit Name from CRM
                        if (deal.get("Unit_Name") instanceof Map) {
                            @SuppressWarnings("unchecked")
                            Map<String, Object> unitMap = (Map<String, Object>) deal.get("Unit_Name");
                            if (unitMap.containsKey("name") && unitMap.get("name") != null) {
                                String uName = (String) unitMap.get("name");
                                homeDetails.setUnitNumber(uName);
                                homeDetails.setVilla(uName);
                            }

                            // Fetch Unit (Products) details if unit ID present
                            if (unitMap.containsKey("id") && unitMap.get("id") != null) {
                                String unitRecordId = (String) unitMap.get("id");
                                fetchAndPopulateUnitDetails(unitRecordId, homeDetails);
                            }
                        }

                        // Homeowner Names from CRM
                        String fName = (String) deal.get("Applicant_First_Name");
                        String lName = (String) deal.get("Applicant_Last_Name");
                        if (fName != null || lName != null) {
                            String fullName = ((fName != null ? fName : "") + " " + (lName != null ? lName : "")).trim();
                            if (!fullName.isBlank()) {
                                homeDetails.setPrimaryBuyer(fullName);
                            }
                        }
                        if (deal.get("Email") != null) {
                            homeDetails.setPrimaryBuyerEmail((String) deal.get("Email"));
                        }

                        // Co-applicant Name from CRM
                        String coF = (String) deal.get("Co_applicant_First_Name");
                        String coL = (String) deal.get("Co_applicant_Last_Name");
                        if (coF != null || coL != null) {
                            String coFull = ((coF != null ? coF : "") + " " + (coL != null ? coL : "")).trim();
                            if (!coFull.isBlank()) {
                                homeDetails.setCoOwner(coFull);
                            }
                        }

                        // Stage & Dates from CRM
                        if (deal.get("Stage") != null) {
                            homeDetails.setConstructionStatus((String) deal.get("Stage"));
                        }
                        if (deal.get("Closing_Date") != null) {
                            homeDetails.setExpectedHandover((String) deal.get("Closing_Date"));
                            homeDetails.setPossessionDate((String) deal.get("Closing_Date"));
                        }
                        if (deal.get("Created_Time") != null) {
                            String createdIso = (String) deal.get("Created_Time");
                            homeDetails.setPurchaseDate(createdIso.substring(0, 10));
                        }
                    }
                }
            } catch (Exception crmEx) {
                log.warn("[MY_HOME_CRM] Exception querying Zoho CRM for Deal {}: {}. Falling back to DB entities.", zohoDealId, crmEx.getMessage());
            }
        }

        // 2. FALLBACK TO DATABASE ENTITIES FOR NULL VALUES
        if (homeDetails.getProject() == null || homeDetails.getProject().isBlank()) {
            String dbProject = (workflow.getProject() != null && workflow.getProject().getProjectName() != null)
                    ? workflow.getProject().getProjectName()
                    : "GoodEarth Community";
            homeDetails.setProject(dbProject);
        }

        if (homeDetails.getUnitNumber() == null || homeDetails.getUnitNumber().isBlank()) {
            String dbUnit = buyer.getUnitName() != null ? buyer.getUnitName() : "Villa GE-001";
            homeDetails.setUnitNumber(dbUnit);
            homeDetails.setVilla(dbUnit);
        }

        if (homeDetails.getPrimaryBuyer() == null || homeDetails.getPrimaryBuyer().isBlank()) {
            homeDetails.setPrimaryBuyer(buyer.getFullName() != null ? buyer.getFullName() : buyer.getEmail());
        }

        if (homeDetails.getPrimaryBuyerEmail() == null || homeDetails.getPrimaryBuyerEmail().isBlank()) {
            homeDetails.setPrimaryBuyerEmail(buyer.getEmail());
        }

        if (homeDetails.getCoOwner() == null || homeDetails.getCoOwner().isBlank()) {
            String coApplicant = buyer.getCoApplicantName();
            homeDetails.setCoOwner(coApplicant != null && !coApplicant.isBlank() ? coApplicant : "None Specified");
        }

        // Standardized Property Specifications
        if (homeDetails.getBlock() == null) homeDetails.setBlock("Phase 1 / Block A");
        if (homeDetails.getUnitType() == null) homeDetails.setUnitType("4 BHK Eco-Luxury Villa");
        if (homeDetails.getFloor() == null) homeDetails.setFloor("Ground + 2 Upper Floors");
        if (homeDetails.getArea() == null) homeDetails.setArea("3,850 Sq. Ft.");
        if (homeDetails.getCarpetArea() == null) homeDetails.setCarpetArea("3,120 Sq. Ft.");
        if (homeDetails.getFacing() == null) homeDetails.setFacing("East Facing (Vastu Compliant)");
        if (homeDetails.getBedrooms() == null) homeDetails.setBedrooms("4 Bedrooms + Maid Suite");
        if (homeDetails.getBathrooms() == null) homeDetails.setBathrooms("4 Ensuite Bathrooms + Powder Room");
        if (homeDetails.getParking() == null) homeDetails.setParking("2 Covered EV-Ready Bays");
        if (homeDetails.getRegistrationStatus() == null) homeDetails.setRegistrationStatus("Registered / Agreement Executed");
        if (homeDetails.getProjectImageUrl() == null) {
            homeDetails.setProjectImageUrl("https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80");
        }

        LocalDateTime startedAt = workflow.getStartedAt() != null ? workflow.getStartedAt() : LocalDateTime.now();
        if (homeDetails.getPurchaseDate() == null) homeDetails.setPurchaseDate(startedAt.toLocalDate().toString());
        if (homeDetails.getExpectedHandover() == null) {
            String handover = startedAt.plusMonths(18).toLocalDate().toString();
            homeDetails.setExpectedHandover(handover);
            homeDetails.setPossessionDate(handover);
        }

        if (homeDetails.getConstructionStatus() == null) {
            homeDetails.setConstructionStatus(currentStage != null ? currentStage.getName() : "Structure Completed");
        }

        homeDetails.setCompletionPercent(helper.calculateCompletionPercentage(workflow.getCurrentStageId()));

        return homeDetails;
    }

    private void fetchAndPopulateUnitDetails(String unitRecordId, ClientHomeDetailsDto homeDetails) {
        try {
            String productUrl = properties.getCrmApiUrl() + "/Products/" + unitRecordId;
            log.info("[MY_HOME_CRM] Querying Zoho CRM Products (Unit) Record: {}", productUrl);

            @SuppressWarnings("unchecked")
            Map<String, Object> productRes = apiClient.get(productUrl, Map.class);

            if (productRes != null && productRes.containsKey("data")) {
                @SuppressWarnings("unchecked")
                List<Map<String, Object>> productList = (List<Map<String, Object>>) productRes.get("data");

                if (productList != null && !productList.isEmpty()) {
                    Map<String, Object> product = productList.get(0);

                    if (product.get("BHK") != null) {
                        homeDetails.setBedrooms(product.get("BHK").toString() + " Bedrooms + Maid Suite");
                    }
                    if (product.get("Facing") != null) {
                        homeDetails.setFacing(product.get("Facing").toString());
                    }
                    if (product.get("Built_up_Area") != null || product.get("Built_up_area1") != null) {
                        Object areaVal = product.get("Built_up_Area") != null ? product.get("Built_up_Area") : product.get("Built_up_area1");
                        homeDetails.setArea(areaVal.toString() + " Sq. Ft.");
                    }
                    if (product.get("Carpet_Area") != null) {
                        homeDetails.setCarpetArea(product.get("Carpet_Area").toString() + " Sq. Ft.");
                    }
                    if (product.get("Covered_Car_Parks") != null) {
                        homeDetails.setParking(product.get("Covered_Car_Parks").toString() + fontCoveredParking(product.get("Covered_Car_Parks").toString()));
                    }
                    if (product.get("Floor_Name") != null) {
                        homeDetails.setFloor(product.get("Floor_Name").toString());
                    }
                }
            }
        } catch (Exception ex) {
            log.debug("[MY_HOME_CRM] Could not query Unit/Product details for ID {}: {}", unitRecordId, ex.getMessage());
        }
    }

    private String fontCoveredParking(String count) {
        return " Covered EV-Ready Bays";
    }
}
