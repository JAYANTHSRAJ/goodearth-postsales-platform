package com.goodearth.postsales.client.controller;

import com.goodearth.postsales.client.dto.KycModificationRequestDto;
import com.goodearth.postsales.client.entity.KycApplication;
import com.goodearth.postsales.client.entity.KycModificationRequest;
import com.goodearth.postsales.client.repository.KycApplicationRepository;
import com.goodearth.postsales.client.repository.KycModificationRequestRepository;
import com.goodearth.postsales.common.response.ApiResponse;
import com.goodearth.postsales.common.exception.CustomException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/v1/admin/kyc-modifications")
@PreAuthorize("hasAnyRole('ADMIN', 'CRM')")
public class AdminKycModificationController {

    private final KycModificationRequestRepository modificationRequestRepository;
    private final KycApplicationRepository kycApplicationRepository;

    public AdminKycModificationController(
            KycModificationRequestRepository modificationRequestRepository,
            KycApplicationRepository kycApplicationRepository) {
        this.modificationRequestRepository = modificationRequestRepository;
        this.kycApplicationRepository = kycApplicationRepository;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<KycModificationRequestDto>>> getPendingRequests() {
        List<KycModificationRequest> requests = modificationRequestRepository.findByStatus("PENDING");
        List<KycModificationRequestDto> dtos = requests.stream().map(req -> new KycModificationRequestDto(
                req.getId(),
                req.getBuyer().getId(),
                req.getBuyer().getUnitName(),
                req.getBuyer().getZohoDealId(),
                req.getUser().getFullName(),
                req.getUser().getEmail(),
                req.getReason(),
                req.getStatus(),
                req.getRequestedAt(),
                req.getReviewedAt(),
                req.getReviewedBy()
        )).collect(Collectors.toList());

        return ResponseEntity.ok(new ApiResponse<>(dtos));
    }

    @PostMapping("/{id}/approve")
    @Transactional
    public ResponseEntity<ApiResponse<String>> approveRequest(@PathVariable UUID id, Authentication auth) {
        KycModificationRequest req = modificationRequestRepository.findById(id)
                .orElseThrow(() -> new CustomException("Modification request not found", HttpStatus.NOT_FOUND));

        req.setStatus("APPROVED");
        req.setReviewedAt(LocalDateTime.now());
        req.setReviewedBy(auth != null ? auth.getName() : "CRM Admin");
        modificationRequestRepository.save(req);

        // Unlock the target KYC application for editing
        if (req.getKycApplication() != null) {
            KycApplication kyc = req.getKycApplication();
            kyc.setLocked(false);
            kyc.setStatus("DRAFT");
            kycApplicationRepository.save(kyc);
        }

        return ResponseEntity.ok(new ApiResponse<>("KYC modification request approved and unlocked for editing"));
    }

    @PostMapping("/{id}/reject")
    @Transactional
    public ResponseEntity<ApiResponse<String>> rejectRequest(@PathVariable UUID id, Authentication auth) {
        KycModificationRequest req = modificationRequestRepository.findById(id)
                .orElseThrow(() -> new CustomException("Modification request not found", HttpStatus.NOT_FOUND));

        req.setStatus("REJECTED");
        req.setReviewedAt(LocalDateTime.now());
        req.setReviewedBy(auth != null ? auth.getName() : "CRM Admin");
        modificationRequestRepository.save(req);

        return ResponseEntity.ok(new ApiResponse<>("KYC modification request rejected"));
    }
}
