package com.goodearth.postsales.finance.controller;

import com.goodearth.postsales.common.response.ApiResponse;
import com.goodearth.postsales.finance.dto.FinancialQuoteDto;
import com.goodearth.postsales.finance.dto.FinancialSummaryDto;
import com.goodearth.postsales.finance.service.BooksSyncService;
import com.goodearth.postsales.finance.service.FinanceService;
import com.goodearth.postsales.finance.service.PaymentService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.math.BigDecimal;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/finance")
public class FinanceController {

    private final FinanceService financeService;
    private final PaymentService paymentService;
    private final BooksSyncService booksSyncService;

    public FinanceController(
            FinanceService financeService,
            PaymentService paymentService,
            BooksSyncService booksSyncService) {
        this.financeService = financeService;
        this.paymentService = paymentService;
        this.booksSyncService = booksSyncService;
    }

    @PostMapping("/quotations")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'FINANCE')")
    public ResponseEntity<ApiResponse<FinancialQuoteDto>> createQuotation(@RequestBody Map<String, Object> request) {
        UUID workflowId = UUID.fromString((String) request.get("workflowId"));
        String changeRequestIdStr = (String) request.get("changeRequestId");
        UUID changeRequestId = changeRequestIdStr != null ? UUID.fromString(changeRequestIdStr) : null;
        BigDecimal amount = new BigDecimal(request.get("amount").toString());
        BigDecimal gst = request.get("gst") != null ? new BigDecimal(request.get("gst").toString()) : BigDecimal.ZERO;
        BigDecimal discount = request.get("discount") != null ? new BigDecimal(request.get("discount").toString()) : BigDecimal.ZERO;
        String remarks = (String) request.get("remarks");

        FinancialQuoteDto response = financeService.createQuotation(workflowId, changeRequestId, amount, gst, discount, remarks);
        return ResponseEntity.ok(new ApiResponse<>(response));
    }

    @PostMapping("/quotations/{id}/sync")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'FINANCE')")
    public ResponseEntity<ApiResponse<FinancialQuoteDto>> syncQuotation(@PathVariable UUID id) {
        booksSyncService.syncQuotationFromZoho(id);
        FinancialQuoteDto response = financeService.getQuotation(id);
        return ResponseEntity.ok(new ApiResponse<>(response));
    }

    @PostMapping("/quotations/{id}/accept")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'CLIENT')")
    public ResponseEntity<ApiResponse<FinancialQuoteDto>> acceptQuotation(@PathVariable UUID id) {
        FinancialQuoteDto response = financeService.acceptQuotation(id);
        return ResponseEntity.ok(new ApiResponse<>(response));
    }

    @PostMapping("/quotations/{id}/reject")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'CLIENT')")
    public ResponseEntity<ApiResponse<FinancialQuoteDto>> rejectQuotation(@PathVariable UUID id) {
        FinancialQuoteDto response = financeService.rejectQuotation(id);
        return ResponseEntity.ok(new ApiResponse<>(response));
    }

    @GetMapping("/workflows/{workflowId}/summary")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'CRM', 'FINANCE', 'CLIENT')")
    public ResponseEntity<ApiResponse<FinancialSummaryDto>> getFinancialSummary(@PathVariable UUID workflowId) {
        FinancialSummaryDto response = paymentService.calculateOutstandingBalance(workflowId);
        return ResponseEntity.ok(new ApiResponse<>(response));
    }
}
