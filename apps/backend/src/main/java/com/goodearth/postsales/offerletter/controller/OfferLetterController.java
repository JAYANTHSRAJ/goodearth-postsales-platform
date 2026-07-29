package com.goodearth.postsales.offerletter.controller;

import com.goodearth.postsales.common.response.ApiResponse;
import com.goodearth.postsales.kyc.dto.KycDocumentStreamDto;
import com.goodearth.postsales.offerletter.dto.OfferLetterStatusDto;
import com.goodearth.postsales.offerletter.service.OfferLetterService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping({"/api/v1/deals", "/deals"})
@Tag(name = "Deal Offer Letter Operations", description = "APIs for dynamic Spring Boot Offer Letter PDF generation and streaming")
public class OfferLetterController {

    private static final Logger log = LoggerFactory.getLogger(OfferLetterController.class);

    private final OfferLetterService offerLetterService;

    public OfferLetterController(OfferLetterService offerLetterService) {
        this.offerLetterService = offerLetterService;
    }

    @GetMapping("/{dealIdOrBookingId}/offer-letter/status")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'CRM', 'CLIENT')")
    @Operation(summary = "Check Deal Offer Letter generation status", description = "Checks whether Offer Letter is available for the specified Deal")
    public ResponseEntity<ApiResponse<OfferLetterStatusDto>> getOfferLetterStatus(
            @PathVariable String dealIdOrBookingId) {

        long startTime = System.currentTimeMillis();
        OfferLetterStatusDto status = offerLetterService.getOfferLetterStatus(dealIdOrBookingId);
        long duration = System.currentTimeMillis() - startTime;

        log.info("Endpoint: GET /api/v1/deals/{}/offer-letter/status, Execution Time: {}ms, Available: {}",
                dealIdOrBookingId, duration, status.isGenerated());

        return ResponseEntity.ok(new ApiResponse<>(status));
    }

    @GetMapping(value = {"/{dealIdOrBookingId}/offer-letter", "/{dealIdOrBookingId}/offer-letter/file"},
                produces = MediaType.APPLICATION_PDF_VALUE)
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'CRM', 'CLIENT')")
    @Operation(summary = "Stream Offer Letter PDF binary inline", description = "Generates and streams the Offer Letter PDF dynamically directly from Spring Boot backend using live CRM data")
    public ResponseEntity<byte[]> streamOfferLetterFile(
            @PathVariable String dealIdOrBookingId,
            Authentication authentication) {

        long startTime = System.currentTimeMillis();
        String actorId = authentication != null ? authentication.getName() : "ADMIN";

        KycDocumentStreamDto streamDto = offerLetterService.streamOfferLetterPdf(dealIdOrBookingId, actorId);
        long duration = System.currentTimeMillis() - startTime;

        log.info("Endpoint: GET /api/v1/deals/{}/offer-letter, Execution Time: {}ms, File: {}, Size: {} bytes",
                dealIdOrBookingId, duration, streamDto.getFileName(), streamDto.getFileSize());

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + streamDto.getFileName() + "\"")
                .contentType(MediaType.parseMediaType(streamDto.getMimeType()))
                .contentLength(streamDto.getFileSize())
                .body(streamDto.getContent());
    }
}
