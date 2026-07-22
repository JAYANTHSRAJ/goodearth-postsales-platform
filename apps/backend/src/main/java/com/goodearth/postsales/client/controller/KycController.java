package com.goodearth.postsales.client.controller;

import com.goodearth.postsales.auth.entity.User;
import com.goodearth.postsales.client.dto.*;
import com.goodearth.postsales.client.service.KycService;
import com.goodearth.postsales.common.response.ApiResponse;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/kyc")
public class KycController {

    private final KycService kycService;

    public KycController(KycService kycService) {
        this.kycService = kycService;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<KycReviewSummaryDto>> getKycByWorkflow(
            @AuthenticationPrincipal User user,
            @RequestParam UUID workflowId) {
        KycReviewSummaryDto summary = kycService.getKycByWorkflowId(user.getId(), workflowId);
        return ResponseEntity.ok(new ApiResponse<>(summary));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<KycReviewSummaryDto>> getKycById(
            @AuthenticationPrincipal User user,
            @PathVariable UUID id) {
        KycReviewSummaryDto summary = kycService.getKycById(user.getId(), id);
        return ResponseEntity.ok(new ApiResponse<>(summary));
    }

    @PostMapping("/draft")
    public ResponseEntity<ApiResponse<KycDraftDto>> saveDraft(
            @AuthenticationPrincipal User user,
            @Valid @RequestBody KycDraftDto draftDto) {
        KycDraftDto saved = kycService.saveDraft(user.getId(), draftDto);
        return ResponseEntity.ok(new ApiResponse<>(saved));
    }

    @PutMapping("/draft/{id}")
    public ResponseEntity<ApiResponse<KycDraftDto>> updateDraft(
            @AuthenticationPrincipal User user,
            @PathVariable UUID id,
            @Valid @RequestBody KycDraftDto draftDto) {
        draftDto.setId(id);
        KycDraftDto saved = kycService.saveDraft(user.getId(), draftDto);
        return ResponseEntity.ok(new ApiResponse<>(saved));
    }

    @PostMapping("/{id}/submit")
    public ResponseEntity<ApiResponse<KycReviewSummaryDto>> submitKyc(
            @AuthenticationPrincipal User user,
            @PathVariable UUID id,
            @Valid @RequestBody SubmitKycRequestDto submitDto) {
        KycReviewSummaryDto submitted = kycService.submitKyc(user.getId(), submitDto);
        return ResponseEntity.ok(new ApiResponse<>(submitted));
    }

    @GetMapping("/{id}/review")
    public ResponseEntity<ApiResponse<KycReviewSummaryDto>> getReviewSummary(
            @AuthenticationPrincipal User user,
            @PathVariable UUID id) {
        KycReviewSummaryDto summary = kycService.getKycById(user.getId(), id);
        return ResponseEntity.ok(new ApiResponse<>(summary));
    }

    @GetMapping("/{id}/audit")
    public ResponseEntity<ApiResponse<List<KycAuditLogDto>>> getAuditLogs(
            @PathVariable UUID id) {
        List<KycAuditLogDto> logs = kycService.getAuditLogs(id);
        return ResponseEntity.ok(new ApiResponse<>(logs));
    }

    @GetMapping("/status/{workflowId}")
    public ResponseEntity<ApiResponse<KycStatusResponseDto>> getKycStatus(
            @PathVariable UUID workflowId) {
        KycStatusResponseDto status = kycService.getKycStatus(workflowId);
        return ResponseEntity.ok(new ApiResponse<>(status));
    }

    @PostMapping("/{id}/admin-review")
    @PreAuthorize("hasAnyRole('ADMIN', 'STAFF')")
    public ResponseEntity<ApiResponse<KycReviewSummaryDto>> adminReview(
            @AuthenticationPrincipal User adminUser,
            @PathVariable UUID id,
            @Valid @RequestBody AdminReviewRequestDto reviewDto) {
        KycReviewSummaryDto summary = kycService.adminReview(adminUser.getId(), id, reviewDto);
        return ResponseEntity.ok(new ApiResponse<>(summary));
    }
}
