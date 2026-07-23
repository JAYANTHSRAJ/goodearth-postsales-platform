package com.goodearth.postsales.client.controller;

import com.goodearth.postsales.buyer.entity.Buyer;
import com.goodearth.postsales.buyer.repository.BuyerRepository;
import com.goodearth.postsales.client.dto.*;
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
import com.goodearth.postsales.common.exception.CustomException;
import org.springframework.http.HttpStatus;
import com.goodearth.postsales.auth.repository.UserRepository;
import com.goodearth.postsales.auth.entity.User;
import java.util.List;
import java.util.Map;
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
    private final UserRepository userRepository;
    private final BuyerRepository buyerRepository;
    private final WorkflowRepository workflowRepository;

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
            UserRepository userRepository,
            BuyerRepository buyerRepository,
            WorkflowRepository workflowRepository) {
        this.dashboardService = dashboardService;
        this.clientHomeService = clientHomeService;
        this.floorPlanService = floorPlanService;
        this.clientDocumentService = clientDocumentService;
        this.constructionUpdateService = constructionUpdateService;
        this.clientFinanceService = clientFinanceService;
        this.timelineService = timelineService;
        this.familyMemberService = familyMemberService;
        this.clientProfileService = clientProfileService;
        this.userRepository = userRepository;
        this.buyerRepository = buyerRepository;
        this.workflowRepository = workflowRepository;
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
            dto.setZohoDealId(b.getZohoDealId());
            dto.setStatus(b.getStatus() != null ? b.getStatus() : "ACTIVE");

            Optional<Workflow> wf = workflowRepository.findFirstByBuyerId(b.getId());
            wf.ifPresent(workflow -> {
                dto.setWorkflowId(workflow.getId());
                if (workflow.getProject() != null) {
                    dto.setProjectName(workflow.getProject().getProjectName());
                    dto.setProjectCode(workflow.getProject().getProjectCode());
                    dto.setZohoDealName(workflow.getProject().getProjectName());
                    if (dto.getZohoDealId() == null) {
                        dto.setZohoDealId(workflow.getProject().getZohoDealId());
                    }
                }
            });

            log.info("[TRACE_IDENTIFIER]\nStage: Client Login -> getOwnedUnits()\nUser Email: {}\nBuyer ID: {}\nWorkflow ID: {}\nUnit Name: {}\nBooking Reference: {}\nDeal Name: {}\nZoho Deal Record ID: {}",
                    user.getEmail(), b.getId(), dto.getWorkflowId(), b.getUnitName(), dto.getUnitName(), dto.getZohoDealName(), dto.getZohoDealId());

            return dto;
        }).collect(Collectors.toList());

        return ResponseEntity.ok(new ApiResponse<>(dtos));
    }

    @PostMapping("/units/active")
    public ResponseEntity<ApiResponse<String>> setActiveUnit(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestBody Map<String, UUID> body) {
        UUID buyerId = body.get("buyerId");
        log.info("Endpoint: POST /api/v1/client/units/active, BuyerId: {}", buyerId);
        return ResponseEntity.ok(new ApiResponse<>("Active unit updated to buyer ID: " + buyerId));
    }

    @GetMapping("/dashboard")
    public ResponseEntity<ApiResponse<ClientDashboardDto>> getDashboard(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestParam(required = false) UUID workflowId) {
        ClientDashboardDto result = dashboardService.getDashboard(userDetails, workflowId);
        return ResponseEntity.ok(new ApiResponse<>(result));
    }

    @GetMapping("/home")
    public ResponseEntity<ApiResponse<ClientHomeDetailsDto>> getHomeDetails(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestParam(required = false) UUID workflowId) {
        ClientHomeDetailsDto result = clientHomeService.getHomeDetails(userDetails, workflowId);
        return ResponseEntity.ok(new ApiResponse<>(result));
    }

    @GetMapping("/floorplans")
    public ResponseEntity<ApiResponse<ClientFloorPlansDto>> getFloorPlans(
            @AuthenticationPrincipal UserDetails userDetails) {
        ClientFloorPlansDto result = floorPlanService.getFloorPlans(userDetails);
        return ResponseEntity.ok(new ApiResponse<>(result));
    }

    @GetMapping("/documents")
    public ResponseEntity<ApiResponse<ClientDocumentsGroupedDto>> getDocuments(
            @AuthenticationPrincipal UserDetails userDetails) {
        ClientDocumentsGroupedDto result = clientDocumentService.getDocuments(userDetails);
        return ResponseEntity.ok(new ApiResponse<>(result));
    }

    @GetMapping("/updates")
    public ResponseEntity<ApiResponse<List<ClientProjectUpdateDto>>> getProjectUpdates(
            @AuthenticationPrincipal UserDetails userDetails) {
        List<ClientProjectUpdateDto> result = constructionUpdateService.getProjectUpdates(userDetails);
        return ResponseEntity.ok(new ApiResponse<>(result));
    }

    @GetMapping("/finance")
    public ResponseEntity<ApiResponse<ClientFinanceDto>> getFinanceSummary(
            @AuthenticationPrincipal UserDetails userDetails) {
        ClientFinanceDto result = clientFinanceService.getFinanceSummary(userDetails);
        return ResponseEntity.ok(new ApiResponse<>(result));
    }

    @GetMapping("/timeline")
    public ResponseEntity<ApiResponse<List<ClientTimelineEventDto>>> getTimeline(
            @AuthenticationPrincipal UserDetails userDetails) {
        List<ClientTimelineEventDto> result = timelineService.getTimeline(userDetails);
        return ResponseEntity.ok(new ApiResponse<>(result));
    }

    @GetMapping("/family")
    public ResponseEntity<ApiResponse<List<FamilyMemberDto>>> getFamilyMembers(
            @AuthenticationPrincipal UserDetails userDetails) {
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
}
