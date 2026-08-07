package com.goodearth.postsales.client.controller;

import com.goodearth.postsales.buyer.entity.Buyer;
import com.goodearth.postsales.buyer.entity.FamilyMember;
import com.goodearth.postsales.buyer.repository.BuyerRepository;
import com.goodearth.postsales.buyer.repository.FamilyMemberRepository;
import com.goodearth.postsales.client.dto.*;
import com.goodearth.postsales.client.service.*;
import com.goodearth.postsales.common.response.ApiResponse;
import com.goodearth.postsales.stage.entity.Stage;
import com.goodearth.postsales.stage.repository.StageRepository;
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
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.Objects;
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
    private final FamilyMemberRepository familyMemberRepository;
    private final WorkflowRepository workflowRepository;
    private final StageRepository stageRepository;
    private final ClientPortalServiceHelper helper;

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
            FamilyMemberRepository familyMemberRepository,
            WorkflowRepository workflowRepository,
            StageRepository stageRepository,
            ClientPortalServiceHelper helper) {
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
        this.familyMemberRepository = familyMemberRepository;
        this.workflowRepository = workflowRepository;
        this.stageRepository = stageRepository;
        this.helper = helper;
    }

    @GetMapping("/units")
    @Transactional(readOnly = true)
    public ResponseEntity<ApiResponse<List<ClientUnitDto>>> getOwnedUnits(
            @AuthenticationPrincipal UserDetails userDetails) {
        String email = userDetails != null ? userDetails.getUsername() : "";
        log.info("[UNITS_TRACE] Endpoint: GET /api/v1/client/units, Authenticated Email: {}", email);

        List<Buyer> buyers = buyerRepository.findAllByEmailIgnoreCase(email);
        log.info("[UNITS_TRACE] Direct buyers found for email {}: count={}", email, buyers.size());
        for (Buyer b : buyers) {
            log.info("[UNITS_TRACE]   Buyer ID={}, ZohoDealId={}, UnitName={}, ContactId={}",
                    b.getId(), b.getZohoDealId(), b.getUnitName(), b.getZohoContactId());
        }

        if (buyers.isEmpty()) {
            List<FamilyMember> familyMembers = familyMemberRepository.findAllByEmailIgnoreCase(email);
            buyers = familyMembers.stream()
                    .map(FamilyMember::getBuyer)
                    .filter(java.util.Objects::nonNull)
                    .distinct()
                    .collect(Collectors.toList());
            log.info("[UNITS_TRACE] Family member buyers found for email {}: count={}", email, buyers.size());
        }

        if (buyers.isEmpty()) {
            try {
                Buyer primaryBuyer = helper.getAuthenticatedBuyer(userDetails);
                if (primaryBuyer != null) {
                    buyers = List.of(primaryBuyer);
                    log.info("[UNITS_TRACE] Fallback helper buyer found: ID={}, Unit={}", primaryBuyer.getId(), primaryBuyer.getUnitName());
                }
            } catch (Exception ex) {
                log.warn("[UNITS_TRACE] Fallback buyer resolution failed: {}", ex.getMessage());
                buyers = Collections.emptyList();
            }
        }

        List<ClientUnitDto> dtos = new java.util.ArrayList<>();
        for (Buyer b : buyers) {
            List<Workflow> workflows = workflowRepository.findByBuyerId(b.getId());
            log.info("[UNITS_TRACE] Workflows for buyer ID {}: count={}", b.getId(), workflows.size());

            if (!workflows.isEmpty()) {
                for (Workflow wf : workflows) {
                    ClientUnitDto dto = new ClientUnitDto();
                    dto.setId(b.getId());
                    dto.setWorkflowId(wf.getId());

                    String dealRef = (wf.getProject() != null && wf.getProject().getZohoDealId() != null)
                            ? wf.getProject().getZohoDealId()
                            : (b.getZohoDealId() != null ? b.getZohoDealId() : wf.getId().toString());
                    String unitTitleName = (b.getUnitName() != null && !b.getUnitName().isBlank()) ? b.getUnitName() : "Unit " + dealRef;

                    dto.setBookingId(dealRef);
                    dto.setUnitId(dealRef);
                    dto.setUnitName(unitTitleName);
                    dto.setZohoDealId(dealRef);
                    dto.setStatus(b.getStatus() != null ? b.getStatus() : "ACTIVE");

                    if (wf.getProject() != null) {
                        dto.setProjectName(wf.getProject().getProjectName());
                        dto.setProjectCode(wf.getProject().getProjectCode());
                        dto.setZohoDealName(wf.getProject().getProjectName());
                    }

                    if (wf.getCurrentStageId() != null) {
                        stageRepository.findById(wf.getCurrentStageId()).ifPresent(stage -> {
                            dto.setConstructionStage(stage.getName());
                        });
                    }

                    if (dto.getConstructionStage() == null) {
                        dto.setConstructionStage("Structure Completed");
                    }
                    dto.setPossessionDate("Dec 2026");
                    dto.setThumbnail("/assets/unit-placeholder.jpg");

                    dtos.add(dto);
                    log.info("[UNITS_TRACE]   Mapped Unit DTO: ID={}, UnitName={}, WorkflowID={}, Project={}",
                            dto.getId(), dto.getUnitName(), dto.getWorkflowId(), dto.getProjectName());
                }
            } else {
                ClientUnitDto dto = new ClientUnitDto();
                dto.setId(b.getId());
                dto.setBookingId(b.getZohoDealId() != null ? b.getZohoDealId() : b.getId().toString());
                dto.setUnitId(b.getUnitName() != null ? b.getUnitName() : b.getId().toString());
                dto.setUnitName(b.getUnitName() != null ? b.getUnitName() : "Unit " + b.getZohoDealId());
                dto.setZohoDealId(b.getZohoDealId());
                dto.setStatus(b.getStatus() != null ? b.getStatus() : "ACTIVE");
                dto.setConstructionStage("Structure Completed");
                dto.setPossessionDate("Dec 2026");
                dto.setThumbnail("/assets/unit-placeholder.jpg");

                dtos.add(dto);
                log.info("[UNITS_TRACE]   Mapped Buyer Fallback DTO: ID={}, UnitName={}", dto.getId(), dto.getUnitName());
            }
        }

        log.info("[UNITS_TRACE] Final returning ClientUnitDtos count={}", dtos.size());
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

    @GetMapping({"/home", "/my-home"})
    public ResponseEntity<ApiResponse<ClientHomeDetailsDto>> getHomeDetails(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestParam(required = false) UUID workflowId) {
        ClientHomeDetailsDto result = clientHomeService.getHomeDetails(userDetails, workflowId);
        return ResponseEntity.ok(new ApiResponse<>(result));
    }

    @GetMapping({"/floorplans", "/floor-plans"})
    public ResponseEntity<ApiResponse<ClientFloorPlansDto>> getFloorPlans(
            @AuthenticationPrincipal UserDetails userDetails) {
        ClientFloorPlansDto result = floorPlanService.getFloorPlans(userDetails);
        return ResponseEntity.ok(new ApiResponse<>(result));
    }

    @GetMapping({"/floor-plans/{attachmentId}", "/floorplans/{attachmentId}"})
    public ResponseEntity<ApiResponse<ClientDrawingSummaryDto>> getFloorPlanById(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable String attachmentId) {
        ClientDrawingSummaryDto result = floorPlanService.getFloorPlanById(userDetails, attachmentId);
        return ResponseEntity.ok(new ApiResponse<>(result));
    }

    @GetMapping({"/floor-plans/attachment/{dealId}/{attachmentId}", "/floorplans/attachment/{dealId}/{attachmentId}"})
    public ResponseEntity<byte[]> streamFloorPlanAttachment(
            @PathVariable String dealId,
            @PathVariable String attachmentId,
            @RequestParam(required = false, defaultValue = "false") boolean download) {
        byte[] data = floorPlanService.downloadAttachment(dealId, attachmentId);

        org.springframework.http.HttpHeaders headers = new org.springframework.http.HttpHeaders();
        headers.setContentType(org.springframework.http.MediaType.APPLICATION_PDF);
        if (download) {
            headers.setContentDispositionFormData("attachment", "Floor_Plan_" + attachmentId + ".pdf");
        } else {
            headers.setContentDisposition(org.springframework.http.ContentDisposition.inline().filename("Floor_Plan_" + attachmentId + ".pdf").build());
        }

        return new ResponseEntity<>(data, headers, HttpStatus.OK);
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

    @GetMapping({"/family", "/family-members"})
    public ResponseEntity<ApiResponse<List<FamilyMemberDto>>> getFamilyMembers(
            @AuthenticationPrincipal UserDetails userDetails) {
        List<FamilyMemberDto> result = familyMemberService.getFamilyMembers(userDetails);
        return ResponseEntity.ok(new ApiResponse<>(result));
    }

    @PostMapping({"/family", "/family-members"})
    public ResponseEntity<ApiResponse<FamilyMemberDto>> addFamilyMember(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestBody FamilyMemberDto newMember) {
        log.info("[FAMILY_INVITE] Controller entered. Email={}", newMember != null ? newMember.getEmail() : null);
        FamilyMemberDto result = familyMemberService.addFamilyMember(userDetails, newMember);
        return ResponseEntity.ok(new ApiResponse<>(result));
    }

    @PutMapping({"/family/{id}", "/family-members/{id}"})
    public ResponseEntity<ApiResponse<FamilyMemberDto>> updateFamilyMember(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable UUID id,
            @RequestBody FamilyMemberDto memberDto) {
        FamilyMemberDto result = familyMemberService.updateFamilyMember(userDetails, id, memberDto);
        return ResponseEntity.ok(new ApiResponse<>(result));
    }

    @DeleteMapping({"/family/{id}", "/family-members/{id}"})
    public ResponseEntity<ApiResponse<String>> removeFamilyMember(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable UUID id) {
        familyMemberService.removeFamilyMember(userDetails, id);
        return ResponseEntity.ok(new ApiResponse<>("Family member removed successfully."));
    }

    @PostMapping({"/family/{id}/invite", "/family-members/{id}/invite"})
    public ResponseEntity<ApiResponse<FamilyMemberDto>> sendInvitation(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable UUID id) {
        FamilyMemberDto result = familyMemberService.sendInvitation(userDetails, id);
        return ResponseEntity.ok(new ApiResponse<>(result));
    }

    @GetMapping({"/family/{id}/permissions", "/family-members/{id}/permissions"})
    public ResponseEntity<ApiResponse<List<String>>> getPermissions(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable UUID id) {
        List<String> result = familyMemberService.getPermissions(userDetails, id);
        return ResponseEntity.ok(new ApiResponse<>(result));
    }

    @PutMapping({"/family/{id}/permissions", "/family-members/{id}/permissions"})
    public ResponseEntity<ApiResponse<FamilyMemberDto>> updatePermissions(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable UUID id,
            @RequestBody List<String> permissions) {
        FamilyMemberDto result = familyMemberService.updatePermissions(userDetails, id, permissions);
        return ResponseEntity.ok(new ApiResponse<>(result));
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
