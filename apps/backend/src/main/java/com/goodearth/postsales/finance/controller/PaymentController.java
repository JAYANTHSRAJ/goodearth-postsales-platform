package com.goodearth.postsales.finance.controller;

import com.goodearth.postsales.common.response.ApiResponse;
import com.goodearth.postsales.finance.dto.PaymentScheduleDto;
import com.goodearth.postsales.finance.service.BooksSyncService;
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
import java.time.LocalDateTime;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/payments")
public class PaymentController {

    private final PaymentService paymentService;
    private final BooksSyncService booksSyncService;

    public PaymentController(PaymentService paymentService, BooksSyncService booksSyncService) {
        this.paymentService = paymentService;
        this.booksSyncService = booksSyncService;
    }

    @PostMapping("/invoices")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'FINANCE')")
    public ResponseEntity<ApiResponse<PaymentScheduleDto>> generateInvoice(@RequestBody Map<String, Object> request) {
        UUID workflowId = UUID.fromString((String) request.get("workflowId"));
        BigDecimal amount = new BigDecimal(request.get("amount").toString());
        LocalDateTime dueDate = LocalDateTime.parse(request.get("dueDate").toString());
        String remarks = (String) request.get("remarks");

        PaymentScheduleDto response = paymentService.generateInvoice(workflowId, amount, dueDate, remarks);
        return ResponseEntity.ok(new ApiResponse<>(response));
    }

    @PostMapping("/invoices/{id}/sync")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'FINANCE')")
    public ResponseEntity<ApiResponse<String>> syncInvoice(@PathVariable UUID id) {
        booksSyncService.syncInvoiceStatusFromZoho(id);
        return ResponseEntity.ok(new ApiResponse<>("Invoice status synchronized successfully."));
    }

    @PostMapping("/receipts/{id}/sync")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'FINANCE')")
    public ResponseEntity<ApiResponse<String>> syncPaymentStatus(@PathVariable UUID id) {
        booksSyncService.syncPaymentStatusFromZoho(id);
        return ResponseEntity.ok(new ApiResponse<>("Payment status synchronized successfully."));
    }

    @PostMapping("/workflows/{workflowId}/receipts/sync")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'FINANCE')")
    public ResponseEntity<ApiResponse<String>> syncReceipts(@PathVariable UUID workflowId) {
        booksSyncService.syncReceipts(workflowId);
        return ResponseEntity.ok(new ApiResponse<>("Workflow receipts synchronized successfully."));
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'CRM', 'FINANCE')")
    public ResponseEntity<ApiResponse<java.util.List<com.goodearth.postsales.finance.dto.PaymentDto>>> getAllPayments() {
        java.util.List<com.goodearth.postsales.finance.dto.PaymentDto> response = paymentService.getAllPayments();
        return ResponseEntity.ok(new ApiResponse<>(response));
    }

    @GetMapping("/invoices")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'CRM', 'FINANCE')")
    public ResponseEntity<ApiResponse<java.util.List<PaymentScheduleDto>>> getAllInvoices() {
        java.util.List<PaymentScheduleDto> response = paymentService.getAllInvoices();
        return ResponseEntity.ok(new ApiResponse<>(response));
    }
}
