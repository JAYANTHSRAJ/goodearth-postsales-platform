package com.goodearth.postsales.kyc.controller;

import com.goodearth.postsales.common.response.ApiResponse;
import com.goodearth.postsales.kyc.dto.KycApproveRequestDto;
import com.goodearth.postsales.kyc.dto.KycApplicationResponseDto;
import com.goodearth.postsales.kyc.dto.KycAutosaveRequestDto;
import com.goodearth.postsales.kyc.dto.KycAutosaveResponseDto;
import com.goodearth.postsales.kyc.dto.KycDashboardSummaryResponseDto;
import com.goodearth.postsales.kyc.dto.KycDraftSaveRequestDto;
import com.goodearth.postsales.kyc.dto.KycProgressResponseDto;
import com.goodearth.postsales.kyc.dto.KycRejectRequestDto;
import com.goodearth.postsales.kyc.dto.KycRequestChangesRequestDto;
import com.goodearth.postsales.kyc.dto.KycReviewStartRequestDto;
import com.goodearth.postsales.kyc.dto.KycSubmitRequestDto;
import com.goodearth.postsales.kyc.dto.KycTimelineResponseDto;
import com.goodearth.postsales.kyc.entity.KycApplicationStatus;
import com.goodearth.postsales.kyc.service.KycService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping({"/api/v1/kyc", "/kyc"})
@Tag(name = "KYC Lifecycle Management", description = "APIs for KYC form drafts, submissions, verification state machine, and dashboard monitoring")
public class KycController {

    private static final Logger log = LoggerFactory.getLogger(KycController.class);

    private final KycService kycService;

    public KycController(KycService kycService) {
        this.kycService = kycService;
    }

    @PostMapping("/draft")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'CRM', 'CLIENT')")
    @Operation(summary = "Save or initialize KYC form draft", description = "Saves primary and joint applicant details into draft state")
    public ResponseEntity<ApiResponse<KycApplicationResponseDto>> saveDraft(
            @Valid @RequestBody KycDraftSaveRequestDto requestDto,
            Authentication authentication) {
        long startTime = System.currentTimeMillis();
        String actorId = authentication != null ? authentication.getName() : "CLIENT";
        
        KycApplicationResponseDto response = kycService.saveDraft(requestDto, actorId);
        long duration = System.currentTimeMillis() - startTime;
        log.info("Endpoint: POST /api/v1/kyc/draft, Execution Time: {}ms, Booking ID: {}", duration, requestDto.getBookingId());

        return ResponseEntity.ok(new ApiResponse<>(response));
    }

    @PutMapping("/applicant")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'CRM', 'CLIENT')")
    @Operation(summary = "Submit applicant information directly to Zoho CRM Deal (PUT)", description = "Updates all applicant fields directly on the Zoho CRM Deal record via PUT")
    public ResponseEntity<ApiResponse<KycApplicationResponseDto>> submitApplicantInfoPut(
            @Valid @RequestBody com.goodearth.postsales.kyc.dto.ApplicantInfoSubmitRequestDto requestDto,
            Authentication authentication) {
        return submitApplicantInfo(requestDto, authentication);
    }

    @PostMapping("/applicant")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'CRM', 'CLIENT')")
    @Operation(summary = "Submit applicant information directly to Zoho CRM Deal (POST)", description = "Updates all applicant fields directly on the Zoho CRM Deal record via POST")
    public ResponseEntity<ApiResponse<KycApplicationResponseDto>> submitApplicantInfoPost(
            @Valid @RequestBody com.goodearth.postsales.kyc.dto.ApplicantInfoSubmitRequestDto requestDto,
            Authentication authentication) {
        return submitApplicantInfo(requestDto, authentication);
    }

    private ResponseEntity<ApiResponse<KycApplicationResponseDto>> submitApplicantInfo(
            com.goodearth.postsales.kyc.dto.ApplicantInfoSubmitRequestDto requestDto,
            Authentication authentication) {
        long startTime = System.currentTimeMillis();
        String actorId = authentication != null ? authentication.getName() : "CLIENT";

        log.info("==================== [INCOMING APPLICANT SUBMISSION] ====================");
        log.info("Actor: {}", actorId);
        log.info("Booking ID: {}", requestDto.getBookingId());
        log.info("Zoho Deal Name: {}", requestDto.getZohoDealName());
        log.info("Zoho Deal ID: {}", requestDto.getZohoDealId());
        log.info("Incoming DTO: {}", requestDto);
        log.info("==========================================================================");

        KycApplicationResponseDto response = kycService.submitApplicantInfo(requestDto, actorId);
        long duration = System.currentTimeMillis() - startTime;
        log.info("Endpoint: /api/v1/kyc/applicant, Execution Time: {}ms, Booking ID: {}", duration, requestDto.getBookingId());

        return ResponseEntity.ok(new ApiResponse<>(response));
    }

    @PatchMapping("/draft/autosave")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'CRM', 'CLIENT')")
    @Operation(summary = "Low-latency partial auto-save", description = "Autosaves single field modifications during form filling")
    public ResponseEntity<ApiResponse<KycAutosaveResponseDto>> autosaveField(
            @Valid @RequestBody KycAutosaveRequestDto requestDto,
            Authentication authentication) {
        long startTime = System.currentTimeMillis();
        String actorId = authentication != null ? authentication.getName() : "CLIENT";

        KycAutosaveResponseDto response = kycService.autosaveField(requestDto, actorId);
        long duration = System.currentTimeMillis() - startTime;
        log.info("Endpoint: PATCH /api/v1/kyc/draft/autosave, Execution Time: {}ms, Field: {}", duration, requestDto.getFieldPath());

        return ResponseEntity.ok(new ApiResponse<>(response));
    }

    @PostMapping("/create")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'CRM', 'CLIENT')")
    @Operation(summary = "Explicitly create a new, empty KYC application", description = "Creates a brand new empty KYC application for the authenticated user and booking")
    public ResponseEntity<ApiResponse<KycApplicationResponseDto>> createKycApplication(
            @RequestBody(required = false) java.util.Map<String, String> body,
            Authentication authentication) {
        long startTime = System.currentTimeMillis();
        String bookingId = body != null && body.containsKey("bookingId") && body.get("bookingId") != null ? body.get("bookingId") : "DEFAULT_BOOKING";
        String actorId = authentication != null ? authentication.getName() : "CLIENT";

        KycApplicationResponseDto response = kycService.createKycApplication(bookingId, actorId, actorId);
        long duration = System.currentTimeMillis() - startTime;
        log.info("Endpoint: POST /api/v1/kyc/create, Execution Time: {}ms, Booking ID: {}", duration, bookingId);

        return ResponseEntity.ok(new ApiResponse<>(response));
    }

    @GetMapping("/booking/{bookingId}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'CRM', 'CLIENT')")
    @Operation(summary = "Fetch KYC application by Booking ID", description = "Returns complete KYC application payload including applicants and document slots")
    public ResponseEntity<ApiResponse<KycApplicationResponseDto>> getKycByBooking(
            @PathVariable String bookingId,
            Authentication authentication) {
        long startTime = System.currentTimeMillis();
        String actorId = authentication != null ? authentication.getName() : null;
        KycApplicationResponseDto response = kycService.getKycApplicationByBooking(bookingId, actorId, actorId);
        long duration = System.currentTimeMillis() - startTime;
        log.info("Endpoint: GET /api/v1/kyc/booking/{}, Execution Time: {}ms", bookingId, duration);

        return ResponseEntity.ok(new ApiResponse<>(response));
    }

    @GetMapping({"/booking/{bookingId}/validate", "/{bookingId}/validate"})
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'CRM', 'CLIENT')")
    @Operation(summary = "Validate complete KYC application", description = "Performs non-mutating validation of PII, addresses, applicant combinations, and mandatory document uploads")
    public ResponseEntity<ApiResponse<com.goodearth.postsales.kyc.dto.KycValidationSummaryResponseDto>> validateKyc(@PathVariable String bookingId) {
        long startTime = System.currentTimeMillis();
        com.goodearth.postsales.kyc.dto.KycValidationSummaryResponseDto response = kycService.validateKyc(bookingId);
        long duration = System.currentTimeMillis() - startTime;
        log.info("Endpoint: GET /api/v1/kyc/booking/{}/validate, Execution Time: {}ms, Overall Valid: {}", bookingId, duration, response.isOverallValid());

        return ResponseEntity.ok(new ApiResponse<>(response));
    }

    @PostMapping("/submit")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'CRM', 'CLIENT')")
    @Operation(summary = "Submit KYC application for review", description = "Finalizes draft and transitions state to SUBMITTED after verifying mandatory uploads")
    public ResponseEntity<ApiResponse<KycApplicationResponseDto>> submitKyc(
            @Valid @RequestBody KycSubmitRequestDto requestDto,
            Authentication authentication) {
        long startTime = System.currentTimeMillis();
        String actorId = authentication != null ? authentication.getName() : "CLIENT";

        KycApplicationResponseDto response = kycService.submitKyc(requestDto, actorId);
        long duration = System.currentTimeMillis() - startTime;
        log.info("Endpoint: POST /api/v1/kyc/submit, Execution Time: {}ms, KycApplicationId: {}", duration, requestDto.getKycApplicationId());

        return ResponseEntity.ok(new ApiResponse<>(response));
    }

    @PostMapping("/review/start")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'CRM')")
    @Operation(summary = "Initiate KYC review", description = "Locks submission for verification and transitions state to UNDER_REVIEW")
    public ResponseEntity<ApiResponse<KycApplicationResponseDto>> startReview(
            @Valid @RequestBody KycReviewStartRequestDto requestDto,
            Authentication authentication) {
        long startTime = System.currentTimeMillis();
        String reviewerId = authentication != null ? authentication.getName() : "ADMIN";

        KycApplicationResponseDto response = kycService.startReview(requestDto, reviewerId);
        long duration = System.currentTimeMillis() - startTime;
        log.info("Endpoint: POST /api/v1/kyc/review/start, Execution Time: {}ms, Reviewer: {}", duration, reviewerId);

        return ResponseEntity.ok(new ApiResponse<>(response));
    }

    @PostMapping("/review/approve")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'CRM')")
    @Operation(summary = "Approve document or full KYC", description = "Approves single document or entire KYC application")
    public ResponseEntity<ApiResponse<KycApplicationResponseDto>> approveKyc(
            @Valid @RequestBody KycApproveRequestDto requestDto,
            Authentication authentication) {
        long startTime = System.currentTimeMillis();
        String reviewerId = authentication != null ? authentication.getName() : "ADMIN";

        KycApplicationResponseDto response = kycService.approveKyc(requestDto, reviewerId);
        long duration = System.currentTimeMillis() - startTime;
        log.info("Endpoint: POST /api/v1/kyc/review/approve, Execution Time: {}ms, Scope: {}", duration, requestDto.getApprovalScope());

        return ResponseEntity.ok(new ApiResponse<>(response));
    }

    @PostMapping("/review/reject")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'CRM')")
    @Operation(summary = "Reject document or KYC application", description = "Rejects submission with mandatory reason code and transitions to REJECTED")
    public ResponseEntity<ApiResponse<KycApplicationResponseDto>> rejectKyc(
            @Valid @RequestBody KycRejectRequestDto requestDto,
            Authentication authentication) {
        long startTime = System.currentTimeMillis();
        String reviewerId = authentication != null ? authentication.getName() : "ADMIN";

        KycApplicationResponseDto response = kycService.rejectKyc(requestDto, reviewerId);
        long duration = System.currentTimeMillis() - startTime;
        log.info("Endpoint: POST /api/v1/kyc/review/reject, Execution Time: {}ms, Code: {}", duration, requestDto.getRejectionReasonCode());

        return ResponseEntity.ok(new ApiResponse<>(response));
    }

    @PostMapping("/review/request-changes")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'CRM')")
    @Operation(summary = "Request specific document corrections", description = "Dispatches change requests to homebuyer and transitions state to ACTION_REQUIRED")
    public ResponseEntity<ApiResponse<KycApplicationResponseDto>> requestChanges(
            @Valid @RequestBody KycRequestChangesRequestDto requestDto,
            Authentication authentication) {
        long startTime = System.currentTimeMillis();
        String reviewerId = authentication != null ? authentication.getName() : "ADMIN";

        KycApplicationResponseDto response = kycService.requestChanges(requestDto, reviewerId);
        long duration = System.currentTimeMillis() - startTime;
        return ResponseEntity.ok(new ApiResponse<>(response));
    }

    @PostMapping("/resubmit")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'CRM', 'CLIENT')")
    @Operation(summary = "Resubmit KYC application after editing", description = "Resubmits updated KYC and transitions state to UNDER_REVIEW")
    public ResponseEntity<ApiResponse<KycApplicationResponseDto>> resubmitKyc(
            @Valid @RequestBody KycSubmitRequestDto requestDto,
            Authentication authentication) {
        long startTime = System.currentTimeMillis();
        String actorId = authentication != null ? authentication.getName() : "CLIENT";

        KycApplicationResponseDto response = kycService.resubmitKyc(requestDto, actorId);
        long duration = System.currentTimeMillis() - startTime;
        log.info("Endpoint: POST /api/v1/kyc/resubmit, Execution Time: {}ms, KycApplicationId: {}", duration, requestDto.getKycApplicationId());

        return ResponseEntity.ok(new ApiResponse<>(response));
    }

    @PostMapping("/grant-edit")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'CRM')")
    @Operation(summary = "Grant edit access to homebuyer", description = "Unlocks buyer KYC form with mandatory reason and transitions state to EDIT_ENABLED")
    public ResponseEntity<ApiResponse<KycApplicationResponseDto>> grantEditAccess(
            @Valid @RequestBody com.goodearth.postsales.kyc.dto.KycGrantEditRequestDto requestDto,
            Authentication authentication) {
        long startTime = System.currentTimeMillis();
        String reviewerId = authentication != null ? authentication.getName() : "ADMIN";

        KycApplicationResponseDto response = kycService.grantEditAccess(requestDto, reviewerId);
        long duration = System.currentTimeMillis() - startTime;
        log.info("Endpoint: POST /api/v1/kyc/grant-edit, Execution Time: {}ms", duration);

        return ResponseEntity.ok(new ApiResponse<>(response));
    }

    @PostMapping("/internal-note")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'CRM')")
    @Operation(summary = "Add private internal note to KYC", description = "Adds an admin-only private note not visible to buyers")
    public ResponseEntity<ApiResponse<KycApplicationResponseDto>> addInternalNote(
            @Valid @RequestBody com.goodearth.postsales.kyc.dto.KycInternalNoteRequestDto requestDto,
            Authentication authentication) {
        long startTime = System.currentTimeMillis();
        String actorId = authentication != null ? authentication.getName() : "ADMIN";

        KycApplicationResponseDto response = kycService.addInternalNote(requestDto, actorId);
        long duration = System.currentTimeMillis() - startTime;
        log.info("Endpoint: POST /api/v1/kyc/internal-note, Execution Time: {}ms", duration);

        return ResponseEntity.ok(new ApiResponse<>(response));
    }

    @GetMapping("/{bookingId}/timeline")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'CRM', 'CLIENT')")
    @Operation(summary = "Fetch KYC audit timeline", description = "Returns chronological activity history and status transitions")
    public ResponseEntity<ApiResponse<KycTimelineResponseDto>> getTimeline(@PathVariable String bookingId) {
        long startTime = System.currentTimeMillis();
        KycTimelineResponseDto response = kycService.getTimeline(bookingId);
        long duration = System.currentTimeMillis() - startTime;
        log.info("Endpoint: GET /api/v1/kyc/{}/timeline, Execution Time: {}ms", bookingId, duration);

        return ResponseEntity.ok(new ApiResponse<>(response));
    }

    @GetMapping("/{bookingId}/progress")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'CRM', 'CLIENT')")
    @Operation(summary = "Fetch KYC completion progress", description = "Returns completion metrics, required counts, and slot statuses")
    public ResponseEntity<ApiResponse<KycProgressResponseDto>> getProgress(@PathVariable String bookingId) {
        long startTime = System.currentTimeMillis();
        KycProgressResponseDto response = kycService.getKycProgress(bookingId);
        long duration = System.currentTimeMillis() - startTime;
        log.info("Endpoint: GET /api/v1/kyc/{}/progress, Execution Time: {}ms", bookingId, duration);

        return ResponseEntity.ok(new ApiResponse<>(response));
    }

    @GetMapping("/dashboard/summary")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'CRM')")
    @Operation(summary = "Fetch dashboard operational summary", description = "Returns review queue metrics and paginated application summaries")
    public ResponseEntity<ApiResponse<KycDashboardSummaryResponseDto>> getDashboardSummary(
            @RequestParam(required = false) String projectId,
            @RequestParam(required = false) KycApplicationStatus status,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "20") int limit) {
        long startTime = System.currentTimeMillis();
        KycDashboardSummaryResponseDto response = kycService.getDashboardSummary(projectId, status, page, limit);
        long duration = System.currentTimeMillis() - startTime;
        log.info("Endpoint: GET /api/v1/kyc/dashboard/summary, Execution Time: {}ms, Status Filter: {}", duration, status);

        return ResponseEntity.ok(new ApiResponse<>(response));
    }
}
