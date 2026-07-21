package com.goodearth.postsales.client.controller;

import com.goodearth.postsales.client.dto.*;
import com.goodearth.postsales.client.service.*;
import com.goodearth.postsales.common.response.ApiResponse;
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
import com.goodearth.postsales.payment.service.OnboardingPaymentService;
import com.goodearth.postsales.auth.repository.UserRepository;
import com.goodearth.postsales.auth.entity.User;
import com.goodearth.postsales.common.enumeration.OnboardingStage;
import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

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
    private final OnboardingPaymentService paymentService;
    private final UserRepository userRepository;

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
            OnboardingPaymentService paymentService,
            UserRepository userRepository) {
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
        this.paymentService = paymentService;
        this.userRepository = userRepository;
    }

    @GetMapping("/dashboard")
    public ResponseEntity<ApiResponse<ClientDashboardDto>> getDashboard(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestParam(required = false) UUID workflowId) {
        System.out.println("[AUTH_LOG] ClientPortalController: getDashboard entered. Username: " + (userDetails != null ? userDetails.getUsername() : "null") + ", Endpoint: GET /api/v1/client/dashboard");
        try {
            ClientDashboardDto result = dashboardService.getDashboard(userDetails, workflowId);
            return ResponseEntity.ok(new ApiResponse<>(result));
        } catch (Exception ex) {
            log.error("Exception in GET /api/v1/client/dashboard: Class={}, Message={}", ex.getClass().getName(), ex.getMessage(), ex);
            throw ex;
        }
    }

    @GetMapping("/home")
    public ResponseEntity<ApiResponse<ClientHomeDetailsDto>> getHomeDetails(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestParam(required = false) UUID workflowId) {
        System.out.println("[AUTH_LOG] ClientPortalController: getHomeDetails entered. Username: " + (userDetails != null ? userDetails.getUsername() : "null") + ", Endpoint: GET /api/v1/client/home");
        try {
            ClientHomeDetailsDto result = clientHomeService.getHomeDetails(userDetails, workflowId);
            System.out.println("[AUTH_LOG] ClientPortalController: getHomeDetails returning result DTO -> " +
                    "project=" + result.getProject() +
                    ", villa=" + result.getVilla() +
                    ", area=" + result.getArea() +
                    ", facing=" + result.getFacing() +
                    ", plot=" + result.getPlot() +
                    ", constructionStatus=" + result.getConstructionStatus() +
                    ", completionPercent=" + result.getCompletionPercent() +
                    ", expectedHandover=" + result.getExpectedHandover());
            return ResponseEntity.ok(new ApiResponse<>(result));
        } catch (Exception ex) {
            log.error("Exception in GET /api/v1/client/home: Class={}, Message={}", ex.getClass().getName(), ex.getMessage(), ex);
            throw ex;
        }
    }

    @GetMapping("/floorplans")
    public ResponseEntity<ApiResponse<ClientFloorPlansDto>> getFloorPlans(@AuthenticationPrincipal UserDetails userDetails) {
        long startTime = System.currentTimeMillis();
        ClientFloorPlansDto result = floorPlanService.getFloorPlans(userDetails);
        log.info("Endpoint: GET /api/v1/client/floorplans, Execution Time: {}ms, User: {}", 
                System.currentTimeMillis() - startTime, userDetails.getUsername());
        return ResponseEntity.ok(new ApiResponse<>(result));
    }

    @GetMapping("/documents")
    public ResponseEntity<ApiResponse<ClientDocumentsGroupedDto>> getDocuments(@AuthenticationPrincipal UserDetails userDetails) {
        long startTime = System.currentTimeMillis();
        ClientDocumentsGroupedDto result = clientDocumentService.getDocuments(userDetails);
        log.info("Endpoint: GET /api/v1/client/documents, Execution Time: {}ms, User: {}", 
                System.currentTimeMillis() - startTime, userDetails.getUsername());
        return ResponseEntity.ok(new ApiResponse<>(result));
    }

    @GetMapping("/updates")
    public ResponseEntity<ApiResponse<List<ClientProjectUpdateDto>>> getProjectUpdates(@AuthenticationPrincipal UserDetails userDetails) {
        long startTime = System.currentTimeMillis();
        List<ClientProjectUpdateDto> result = constructionUpdateService.getProjectUpdates(userDetails);
        log.info("Endpoint: GET /api/v1/client/updates, Execution Time: {}ms, User: {}", 
                System.currentTimeMillis() - startTime, userDetails.getUsername());
        return ResponseEntity.ok(new ApiResponse<>(result));
    }

    @GetMapping("/finance")
    public ResponseEntity<ApiResponse<ClientFinanceDto>> getFinanceSummary(@AuthenticationPrincipal UserDetails userDetails) {
        long startTime = System.currentTimeMillis();
        try {
            ClientFinanceDto result = clientFinanceService.getFinanceSummary(userDetails);
            log.info("Endpoint: GET /api/v1/client/finance, Execution Time: {}ms, User: {}", 
                    System.currentTimeMillis() - startTime, userDetails.getUsername());
            return ResponseEntity.ok(new ApiResponse<>(result));
        } catch (Exception ex) {
            log.error("Exception in GET /api/v1/client/finance: Class={}, Message={}", ex.getClass().getName(), ex.getMessage(), ex);
            throw ex;
        }
    }

    @GetMapping("/timeline")
    public ResponseEntity<ApiResponse<List<ClientTimelineEventDto>>> getTimeline(@AuthenticationPrincipal UserDetails userDetails) {
        long startTime = System.currentTimeMillis();
        try {
            List<ClientTimelineEventDto> result = timelineService.getTimeline(userDetails);
            log.info("Endpoint: GET /api/v1/client/timeline, Execution Time: {}ms, User: {}", 
                    System.currentTimeMillis() - startTime, userDetails.getUsername());
            return ResponseEntity.ok(new ApiResponse<>(result));
        } catch (Exception ex) {
            log.error("Exception in GET /api/v1/client/timeline: Class={}, Message={}", ex.getClass().getName(), ex.getMessage(), ex);
            throw ex;
        }
    }

    @GetMapping("/family")
    public ResponseEntity<ApiResponse<List<FamilyMemberDto>>> getFamilyMembers(@AuthenticationPrincipal UserDetails userDetails) {
        long startTime = System.currentTimeMillis();
        List<FamilyMemberDto> result = familyMemberService.getFamilyMembers(userDetails);
        log.info("Endpoint: GET /api/v1/client/family, Execution Time: {}ms, User: {}", 
                System.currentTimeMillis() - startTime, userDetails.getUsername());
        return ResponseEntity.ok(new ApiResponse<>(result));
    }

    @PostMapping("/family")
    public ResponseEntity<ApiResponse<FamilyMemberDto>> addFamilyMember(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestBody FamilyMemberDto newMember) {
        long startTime = System.currentTimeMillis();
        FamilyMemberDto result = familyMemberService.addFamilyMember(userDetails, newMember);
        log.info("Endpoint: POST /api/v1/client/family, Execution Time: {}ms, User: {}, Member ID: {}", 
                System.currentTimeMillis() - startTime, userDetails.getUsername(), result.getId());
        return ResponseEntity.ok(new ApiResponse<>(result));
    }

    @DeleteMapping("/family/{id}")
    public ResponseEntity<ApiResponse<String>> removeFamilyMember(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable UUID id) {
        long startTime = System.currentTimeMillis();
        familyMemberService.removeFamilyMember(userDetails, id);
        log.info("Endpoint: DELETE /api/v1/client/family/{}, Execution Time: {}ms, User: {}", 
                id, System.currentTimeMillis() - startTime, userDetails.getUsername());
        return ResponseEntity.ok(new ApiResponse<>("Family member removed successfully."));
    }

    @GetMapping("/profile")
    public ResponseEntity<ApiResponse<ClientProfileDto>> getProfile(
            @AuthenticationPrincipal UserDetails userDetails) {
        log.info("Endpoint: GET /api/v1/client/profile, User: {}", userDetails.getUsername());
        ClientProfileDto result = clientProfileService.getProfile(userDetails.getUsername());
        return ResponseEntity.ok(new ApiResponse<>(result));
    }

    @PutMapping("/profile")
    public ResponseEntity<ApiResponse<ClientProfileDto>> updateProfile(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestBody ClientProfileDto dto) {
        log.info("Endpoint: PUT /api/v1/client/profile, User: {}", userDetails.getUsername());
        ClientProfileDto result = clientProfileService.updateProfile(userDetails.getUsername(), dto);
        return ResponseEntity.ok(new ApiResponse<>(result));
    }

    @GetMapping("/kyc")
    public ResponseEntity<ApiResponse<KycApplicationDto>> getKyc(
            @AuthenticationPrincipal UserDetails userDetails) {
        log.info("Endpoint: GET /api/v1/client/kyc, User: {}", userDetails.getUsername());
        KycApplicationDto result = kycService.getKycApplication(userDetails.getUsername());
        return ResponseEntity.ok(new ApiResponse<>(result));
    }

    @PostMapping("/kyc/draft")
    public ResponseEntity<ApiResponse<KycApplicationDto>> saveKycDraft(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestBody Map<String, Object> payload) {
        log.info("Endpoint: POST /api/v1/client/kyc/draft, User: {}", userDetails.getUsername());
        String json = serializeJson(payload);
        KycApplicationDto result = kycService.saveKycDraft(userDetails.getUsername(), json);
        return ResponseEntity.ok(new ApiResponse<>(result));
    }

    @PostMapping("/kyc/submit")
    public ResponseEntity<ApiResponse<KycApplicationDto>> submitKyc(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestBody Map<String, Object> payload) {
        log.info("Endpoint: POST /api/v1/client/kyc/submit, User: {}", userDetails.getUsername());
        String json = serializeJson(payload);
        KycApplicationDto result = kycService.submitKycApplication(userDetails.getUsername(), json);
        return ResponseEntity.ok(new ApiResponse<>(result));
    }

    @PostMapping("/kyc/upload")
    public ResponseEntity<ApiResponse<Map<String, String>>> uploadKycFile(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestParam("file") MultipartFile file) {
        log.info("Endpoint: POST /api/v1/client/kyc/upload, User: {}, File: {}", userDetails.getUsername(), file.getOriginalFilename());
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
        log.info("Endpoint: GET /api/v1/client/kyc/files/{}, User: {}", filename, userDetails.getUsername());
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

    @PostMapping("/payment/simulate")
    public ResponseEntity<ApiResponse<Map<String, Object>>> simulatePayment(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestBody Map<String, Object> payload) {
        log.info("Endpoint: POST /api/v1/client/payment/simulate, User: {}", userDetails.getUsername());
        
        String orderId = (String) payload.getOrDefault("orderId", UUID.randomUUID().toString());
        BigDecimal amount = new BigDecimal(payload.getOrDefault("amount", "50000").toString());
        String currency = (String) payload.getOrDefault("currency", "INR");

        boolean success = paymentService.executePayment(userDetails.getUsername(), amount, currency, orderId);
        
        if (success) {
            User user = userRepository.findByEmailIgnoreCase(userDetails.getUsername())
                    .orElseThrow(() -> new CustomException("User not found", HttpStatus.NOT_FOUND));
            
            if (user.getOnboardingStage() == OnboardingStage.PAYMENT_PENDING) {
                user.setOnboardingStage(OnboardingStage.COMPLETED);
                userRepository.save(user);
            }

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("onboardingStage", user.getOnboardingStage().name());
            return ResponseEntity.ok(new ApiResponse<>(response));
        } else {
            throw new CustomException("Payment failed", HttpStatus.BAD_REQUEST);
        }
    }
}
