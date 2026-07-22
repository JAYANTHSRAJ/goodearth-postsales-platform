package com.goodearth.postsales.client.controller;

import com.goodearth.postsales.client.dto.*;
import com.goodearth.postsales.client.entity.KycApplication;
import com.goodearth.postsales.client.repository.KycApplicationRepository;
import com.goodearth.postsales.client.service.KycService;
import com.goodearth.postsales.common.exception.CustomException;
import com.goodearth.postsales.common.response.ApiResponse;
import com.goodearth.postsales.security.user.CustomUserDetails;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/v1/kyc")
public class KycController {

    private final KycService kycService;
    private final KycApplicationRepository kycApplicationRepository;

    public KycController(KycService kycService, KycApplicationRepository kycApplicationRepository) {
        this.kycService = kycService;
        this.kycApplicationRepository = kycApplicationRepository;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<KycReviewSummaryDto>> getKycByWorkflow(
            @AuthenticationPrincipal CustomUserDetails user,
            @RequestParam UUID workflowId) {
        if (user == null) {
            throw new CustomException("Authentication required", HttpStatus.UNAUTHORIZED);
        }
        KycReviewSummaryDto summary = kycService.getKycByWorkflowId(user.getId(), workflowId);
        return ResponseEntity.ok(new ApiResponse<>(summary));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<KycReviewSummaryDto>> getKycById(
            @AuthenticationPrincipal CustomUserDetails user,
            @PathVariable UUID id) {
        if (user == null) {
            throw new CustomException("Authentication required", HttpStatus.UNAUTHORIZED);
        }
        KycReviewSummaryDto summary = kycService.getKycById(user.getId(), id);
        return ResponseEntity.ok(new ApiResponse<>(summary));
    }

    @PostMapping("/draft")
    public ResponseEntity<ApiResponse<KycDraftDto>> saveDraft(
            @AuthenticationPrincipal CustomUserDetails user,
            @Valid @RequestBody KycDraftDto draftDto) {
        if (user == null) {
            throw new CustomException("Authentication required", HttpStatus.UNAUTHORIZED);
        }
        KycDraftDto saved = kycService.saveDraft(user.getId(), draftDto);
        return ResponseEntity.ok(new ApiResponse<>(saved));
    }

    @PutMapping("/draft/{id}")
    public ResponseEntity<ApiResponse<KycDraftDto>> updateDraft(
            @AuthenticationPrincipal CustomUserDetails user,
            @PathVariable UUID id,
            @Valid @RequestBody KycDraftDto draftDto) {
        if (user == null) {
            throw new CustomException("Authentication required", HttpStatus.UNAUTHORIZED);
        }
        draftDto.setId(id);
        KycDraftDto saved = kycService.saveDraft(user.getId(), draftDto);
        return ResponseEntity.ok(new ApiResponse<>(saved));
    }

    @PostMapping("/{id}/submit")
    public ResponseEntity<ApiResponse<KycReviewSummaryDto>> submitKyc(
            @AuthenticationPrincipal CustomUserDetails user,
            @PathVariable UUID id,
            @Valid @RequestBody SubmitKycRequestDto submitDto) {
        if (user == null) {
            throw new CustomException("Authentication required", HttpStatus.UNAUTHORIZED);
        }
        KycReviewSummaryDto submitted = kycService.submitKyc(user.getId(), submitDto);
        return ResponseEntity.ok(new ApiResponse<>(submitted));
    }

    @GetMapping("/{id}/review")
    public ResponseEntity<ApiResponse<KycReviewSummaryDto>> getReviewSummary(
            @AuthenticationPrincipal CustomUserDetails user,
            @PathVariable UUID id) {
        if (user == null) {
            throw new CustomException("Authentication required", HttpStatus.UNAUTHORIZED);
        }
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
            @AuthenticationPrincipal CustomUserDetails adminUser,
            @PathVariable UUID id,
            @Valid @RequestBody AdminReviewRequestDto reviewDto) {
        if (adminUser == null) {
            throw new CustomException("Authentication required", HttpStatus.UNAUTHORIZED);
        }
        KycReviewSummaryDto summary = kycService.adminReview(adminUser.getId(), id, reviewDto);
        return ResponseEntity.ok(new ApiResponse<>(summary));
    }

    @GetMapping("/admin/all")
    @PreAuthorize("hasAnyRole('ADMIN', 'STAFF')")
    public ResponseEntity<ApiResponse<List<KycReviewSummaryDto>>> getAllKycApplicationsForAdmin() {
        List<KycApplication> all = kycApplicationRepository.findAll();
        List<KycReviewSummaryDto> summaries = all.stream()
                .map(kyc -> kycService.getKycById(null, kyc.getId()))
                .collect(Collectors.toList());
        return ResponseEntity.ok(new ApiResponse<>(summaries));
    }
}
