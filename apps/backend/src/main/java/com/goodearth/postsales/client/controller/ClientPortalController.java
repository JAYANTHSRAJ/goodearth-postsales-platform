package com.goodearth.postsales.client.controller;

import com.goodearth.postsales.buyer.entity.Buyer;
import com.goodearth.postsales.buyer.repository.BuyerRepository;
import com.goodearth.postsales.client.dto.*;
import com.goodearth.postsales.client.entity.KycApplication;
import com.goodearth.postsales.client.repository.KycApplicationRepository;
import com.goodearth.postsales.client.service.*;
import com.goodearth.postsales.common.response.ApiResponse;
import com.goodearth.postsales.workflow.entity.Workflow;
import com.goodearth.postsales.workflow.repository.WorkflowRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import com.goodearth.postsales.common.exception.CustomException;
import org.springframework.http.HttpStatus;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.Files;
import java.nio.file.StandardCopyOption;
import java.util.Map;
import java.util.HashMap;
import com.goodearth.postsales.auth.repository.UserRepository;
import com.goodearth.postsales.auth.entity.User;
import com.goodearth.postsales.common.enumeration.OnboardingStage;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

import org.springframework.transaction.annotation.Transactional;

@RestController
@RequestMapping({"/api/v1/client", "/client"})
@PreAuthorize("hasAnyRole('CLIENT', 'SUPER_ADMIN', 'CRM', 'DESIGN_STUDIO', 'FINANCE', 'PROJECT_MANAGER')")
public class ClientPortalController {

    private static final Logger log = LoggerFactory.getLogger(ClientPortalController.class);

    private final DashboardService dashboardService;
    private final ClientHomeService clientHomeService;
    private final FloorPlanService floorPlanService;
    private final ClientDocumentService clientDocumentService;
    private final ConstructionUpdateService constructionUpdateService;
    private final ClientFinanceService clientFinanceService;
    private final TimelineService timelineService;
    private final FamilyMemberService familyMemberService;
    private final ClientProfileService clientProfileService;
    private final KycService kycService;
    private final UserRepository userRepository;
    private final BuyerRepository buyerRepository;
    private final WorkflowRepository workflowRepository;
    private final KycApplicationRepository kycApplicationRepository;

    public ClientPortalController(
            DashboardService dashboardService,
            ClientHomeService clientHomeService,
            FloorPlanService floorPlanService,
            ClientDocumentService clientDocumentService,
            ConstructionUpdateService constructionUpdateService,
            ClientFinanceService clientFinanceService,
            TimelineService timelineService,
            FamilyMemberService familyMemberService,
            ClientProfileService clientProfileService,
            KycService kycService,
            UserRepository userRepository,
            BuyerRepository buyerRepository,
            WorkflowRepository workflowRepository,
            KycApplicationRepository kycApplicationRepository) {
        this.dashboardService = dashboardService;
        this.clientHomeService = clientHomeService;
        this.floorPlanService = floorPlanService;
        this.clientDocumentService = clientDocumentService;
        this.constructionUpdateService = constructionUpdateService;
        this.clientFinanceService = clientFinanceService;
        this.timelineService = timelineService;
        this.familyMemberService = familyMemberService;
        this.clientProfileService = clientProfileService;
        this.kycService = kycService;
        this.userRepository = userRepository;
        this.buyerRepository = buyerRepository;
        this.workflowRepository = workflowRepository;
        this.kycApplicationRepository = kycApplicationRepository;
    }

    @GetMapping("/units")
    @Transactional(readOnly = true)
    public ResponseEntity<ApiResponse<List<ClientUnitDto>>> getOwnedUnits(
            @AuthenticationPrincipal UserDetails userDetails) {
        log.info("Endpoint: GET /api/v1/client/units, User: {}", userDetails.getUsername());
        User user = userRepository.findByEmailIgnoreCase(userDetails.getUsername())
                .orElseThrow(() -> new CustomException("User not found", HttpStatus.NOT_FOUND));

        List<Buyer> buyers = buyerRepository.findAllByEmailIgnoreCase(user.getEmail());
        List<ClientUnitDto> dtos = buyers.stream().map(b -> {
            ClientUnitDto dto = new ClientUnitDto();
            dto.setId(b.getId());
            dto.setUnitName(b.getUnitName() != null ? b.getUnitName() : "Unit " + b.getZohoDealId());
            dto.setKycApplicationId(b.getKycApplicationId());
            dto.setStatus(b.getStatus() != null ? b.getStatus() : "ACTIVE");

            Optional<Workflow> wf = workflowRepository.findFirstByBuyerId(b.getId());
            wf.ifPresent(workflow -> {
                dto.setWorkflowId(workflow.getId());
                if (workflow.getProject() != null) {
                    dto.setProjectName(workflow.getProject().getProjectName());
                    dto.setProjectCode(workflow.getProject().getProjectCode());
                }
            });

            if (b.getKycApplicationId() != null) {
                Optional<KycApplication> kyc = kycApplicationRepository.findById(b.getKycApplicationId());
                if (kyc.isPresent()) {
                    dto.setKycStatus(kyc.get().getStatus());
                    dto.setKycLocked(kyc.get().isLocked());
                    dto.setKycVerified(kyc.get().isVerified() || "SUBMITTED".equals(kyc.get().getStatus()));
                } else {
                    dto.setKycStatus("NOT_STARTED");
                }
            } else {
                dto.setKycStatus("NOT_STARTED");
            }
            return dto;
        }).collect(Collectors.toList());

        return ResponseEntity.ok(new ApiResponse<>(dtos));
    }

    @PostMapping("/units/active")
    public ResponseEntity<ApiResponse<String>> setActiveUnit(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestParam UUID buyerId) {
        log.info("Endpoint: POST /api/v1/client/units/active, User: {}, UnitId: {}", userDetails.getUsername(), buyerId);
        User user = userRepository.findByEmailIgnoreCase(userDetails.getUsername())
                .orElseThrow(() -> new CustomException("User not found", HttpStatus.NOT_FOUND));

        Buyer buyer = buyerRepository.findById(buyerId)
                .orElseThrow(() -> new CustomException("Unit not found", HttpStatus.NOT_FOUND));

        if (!buyer.getEmail().equalsIgnoreCase(user.getEmail())) {
            throw new CustomException("Customer does not own this unit", HttpStatus.FORBIDDEN);
        }

        user.setLastSelectedUnitId(buyer.getId());
        userRepository.save(user);

        return ResponseEntity.ok(new ApiResponse<>("Active unit updated successfully"));
    }

    @GetMapping("/dashboard")
    public ResponseEntity<ApiResponse<ClientDashboardDto>> getDashboard(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestParam(required = false) UUID workflowId) {
        try {
            ClientDashboardDto result = dashboardService.getDashboard(userDetails, workflowId);
            return ResponseEntity.ok(new ApiResponse<>(result));
        } catch (Exception ex) {
            log.error("Exception in GET /api/v1/client/dashboard", ex);
            throw ex;
        }
    }

    @GetMapping("/home")
    public ResponseEntity<ApiResponse<ClientHomeDetailsDto>> getHomeDetails(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestParam(required = false) UUID workflowId) {
        try {
            ClientHomeDetailsDto result = clientHomeService.getHomeDetails(userDetails, workflowId);
            return ResponseEntity.ok(new ApiResponse<>(result));
        } catch (Exception ex) {
            log.error("Exception in GET /api/v1/client/home", ex);
            throw ex;
        }
    }

    @GetMapping("/floorplans")
    public ResponseEntity<ApiResponse<ClientFloorPlansDto>> getFloorPlans(@AuthenticationPrincipal UserDetails userDetails) {
        ClientFloorPlansDto result = floorPlanService.getFloorPlans(userDetails);
        return ResponseEntity.ok(new ApiResponse<>(result));
    }

    @GetMapping("/documents")
    public ResponseEntity<ApiResponse<ClientDocumentsGroupedDto>> getDocuments(@AuthenticationPrincipal UserDetails userDetails) {
        ClientDocumentsGroupedDto result = clientDocumentService.getDocuments(userDetails);
        return ResponseEntity.ok(new ApiResponse<>(result));
    }

    @GetMapping("/updates")
    public ResponseEntity<ApiResponse<List<ClientProjectUpdateDto>>> getProjectUpdates(@AuthenticationPrincipal UserDetails userDetails) {
        List<ClientProjectUpdateDto> result = constructionUpdateService.getProjectUpdates(userDetails);
        return ResponseEntity.ok(new ApiResponse<>(result));
    }

    @GetMapping("/finance")
    public ResponseEntity<ApiResponse<ClientFinanceDto>> getFinanceSummary(@AuthenticationPrincipal UserDetails userDetails) {
        ClientFinanceDto result = clientFinanceService.getFinanceSummary(userDetails);
        return ResponseEntity.ok(new ApiResponse<>(result));
    }

    @GetMapping("/timeline")
    public ResponseEntity<ApiResponse<List<ClientTimelineEventDto>>> getTimeline(@AuthenticationPrincipal UserDetails userDetails) {
        List<ClientTimelineEventDto> result = timelineService.getTimeline(userDetails);
        return ResponseEntity.ok(new ApiResponse<>(result));
    }

    @GetMapping("/family")
    public ResponseEntity<ApiResponse<List<FamilyMemberDto>>> getFamilyMembers(@AuthenticationPrincipal UserDetails userDetails) {
        List<FamilyMemberDto> result = familyMemberService.getFamilyMembers(userDetails);
        return ResponseEntity.ok(new ApiResponse<>(result));
    }

    @PostMapping("/family")
    public ResponseEntity<ApiResponse<FamilyMemberDto>> addFamilyMember(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestBody FamilyMemberDto newMember) {
        FamilyMemberDto result = familyMemberService.addFamilyMember(userDetails, newMember);
        return ResponseEntity.ok(new ApiResponse<>(result));
    }

    @DeleteMapping("/family/{id}")
    public ResponseEntity<ApiResponse<String>> removeFamilyMember(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable UUID id) {
        familyMemberService.removeFamilyMember(userDetails, id);
        return ResponseEntity.ok(new ApiResponse<>("Family member removed successfully."));
    }

    @GetMapping("/profile")
    public ResponseEntity<ApiResponse<ClientProfileDto>> getProfile(
            @AuthenticationPrincipal UserDetails userDetails) {
        ClientProfileDto result = clientProfileService.getProfile(userDetails.getUsername());
        return ResponseEntity.ok(new ApiResponse<>(result));
    }

    @PutMapping("/profile")
    public ResponseEntity<ApiResponse<ClientProfileDto>> updateProfile(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestBody ClientProfileDto dto) {
        ClientProfileDto result = clientProfileService.updateProfile(userDetails.getUsername(), dto);
        return ResponseEntity.ok(new ApiResponse<>(result));
    }

    @GetMapping("/kyc")
    public ResponseEntity<ApiResponse<KycApplicationDto>> getKyc(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestParam(required = false) UUID workflowId) {
        KycApplicationDto result = kycService.getKycApplication(userDetails.getUsername(), workflowId);
        return ResponseEntity.ok(new ApiResponse<>(result));
    }

    @PostMapping("/kyc/draft")
    public ResponseEntity<ApiResponse<KycApplicationDto>> saveKycDraft(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestParam(required = false) UUID workflowId,
            @RequestBody Map<String, Object> payload) {
        String json = serializeJson(payload);
        KycApplicationDto result = kycService.saveKycDraft(userDetails.getUsername(), workflowId, json);
        return ResponseEntity.ok(new ApiResponse<>(result));
    }

    @PostMapping("/kyc/submit")
    public ResponseEntity<ApiResponse<KycApplicationDto>> submitKyc(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestParam(required = false) UUID workflowId,
            @RequestBody Map<String, Object> payload) {
        String json = serializeJson(payload);
        KycApplicationDto result = kycService.submitKycApplication(userDetails.getUsername(), workflowId, json);
        return ResponseEntity.ok(new ApiResponse<>(result));
    }

    @PostMapping("/kyc/reuse")
    public ResponseEntity<ApiResponse<KycApplicationDto>> reuseKyc(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestParam UUID workflowId,
            @RequestParam UUID sourceKycId) {
        KycApplicationDto result = kycService.reuseKycApplication(userDetails.getUsername(), workflowId, sourceKycId);
        return ResponseEntity.ok(new ApiResponse<>(result));
    }

    @PostMapping("/kyc/request-modification")
    public ResponseEntity<ApiResponse<KycModificationRequestDto>> requestModification(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestParam(required = false) UUID workflowId,
            @RequestBody Map<String, String> payload) {
        String reason = payload.getOrDefault("reason", "Requested KYC update");
        KycModificationRequestDto result = kycService.requestKycModification(userDetails.getUsername(), workflowId, reason);
        return ResponseEntity.ok(new ApiResponse<>(result));
    }

    @PostMapping("/kyc/upload")
    public ResponseEntity<ApiResponse<Map<String, String>>> uploadKycFile(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestParam("file") MultipartFile file) {
        try {
            if (file.isEmpty()) {
                throw new CustomException("Uploaded file is empty", HttpStatus.BAD_REQUEST);
            }
            Path uploadPath = Paths.get("uploads", "kyc");
            if (!Files.exists(uploadPath)) {
                Files.createDirectories(uploadPath);
            }
            String originalFileName = file.getOriginalFilename();
            String extension = "";
            if (originalFileName != null && originalFileName.contains(".")) {
                extension = originalFileName.substring(originalFileName.lastIndexOf("."));
            }
            String newFileName = UUID.randomUUID().toString() + extension;
            Path targetLocation = uploadPath.resolve(newFileName);
            Files.copy(file.getInputStream(), targetLocation, StandardCopyOption.REPLACE_EXISTING);

            String fileUrl = "/api/v1/client/kyc/files/" + newFileName;
            Map<String, String> response = new HashMap<>();
            response.put("fileUrl", fileUrl);
            return ResponseEntity.ok(new ApiResponse<>(response));
        } catch (Exception ex) {
            log.error("Failed to upload file", ex);
            throw new CustomException("Failed to upload file: " + ex.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @GetMapping("/kyc/files/{filename}")
    public ResponseEntity<Resource> serveKycFile(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable String filename) {
        try {
            Path filePath = Paths.get("uploads", "kyc").resolve(filename).normalize();
            Resource resource = new UrlResource(filePath.toUri());
            if (resource.exists()) {
                String contentType = Files.probeContentType(filePath);
                if (contentType == null) {
                    contentType = "application/octet-stream";
                }
                return ResponseEntity.ok()
                        .contentType(MediaType.parseMediaType(contentType))
                        .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + resource.getFilename() + "\"")
                        .body(resource);
            } else {
                return ResponseEntity.notFound().build();
            }
        } catch (Exception ex) {
            log.error("Failed to serve file", ex);
            return ResponseEntity.internalServerError().build();
        }
    }

    private String serializeJson(Map<String, Object> payload) {
        try {
            return new com.fasterxml.jackson.databind.ObjectMapper().writeValueAsString(payload);
        } catch (Exception ex) {
            throw new CustomException("Failed to serialize KYC payload", HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
}
