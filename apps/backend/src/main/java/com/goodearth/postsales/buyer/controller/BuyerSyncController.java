package com.goodearth.postsales.buyer.controller;

import com.goodearth.postsales.buyer.dto.BuyerDto;
import com.goodearth.postsales.buyer.dto.BuyerSyncResponse;
import com.goodearth.postsales.buyer.service.BuyerService;
import com.goodearth.postsales.buyer.service.ZohoBuyerSyncService;
import com.goodearth.postsales.common.response.ApiResponse;
import com.goodearth.postsales.integration.zoho.ZohoApiClient;
import com.goodearth.postsales.integration.zoho.ZohoProperties;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping({"/api/v1/buyers", "/buyers"})
public class BuyerSyncController {

    private static final Logger log = LoggerFactory.getLogger(BuyerSyncController.class);

    private final ZohoBuyerSyncService syncService;
    private final BuyerService buyerService;
    private final ZohoApiClient apiClient;
    private final ZohoProperties properties;

    public BuyerSyncController(
            ZohoBuyerSyncService syncService,
            BuyerService buyerService,
            ZohoApiClient apiClient,
            ZohoProperties properties) {
        this.syncService = syncService;
        this.buyerService = buyerService;
        this.apiClient = apiClient;
        this.properties = properties;
    }

    @GetMapping("/zoho-contact-raw")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<String> getZohoContactRaw() {
        String url = properties.getCrmApiUrl() + "/Contacts/6638590000146761032";
        String response = apiClient.get(url, String.class);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/sync")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<java.util.Map<String, Object>> syncBuyers() {
        long startTime = System.currentTimeMillis();
        java.util.Map<String, Object> response = syncService.syncBuyers();
        long duration = System.currentTimeMillis() - startTime;

        java.util.Map<String, Object> summary = (java.util.Map<String, Object>) response.get("summary");
        if (summary != null) {
            log.info("Endpoint: POST /api/v1/buyers/sync, Execution Time: {}ms, Fetched: {}, Buyers Created: {}, Buyers Updated: {}, Buyers Skipped: {}, Projects Created: {}, Projects Updated: {}, Workflows Created: {}, Workflows Updated: {}",
                    duration, summary.get("dealsFetched"), summary.get("buyersCreated"), summary.get("buyersUpdated"), summary.get("buyersSkipped"), summary.get("projectsCreated"), summary.get("projectsUpdated"), summary.get("workflowsCreated"), summary.get("workflowsUpdated"));
        }

        return ResponseEntity.ok(response);
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'CRM', 'DESIGN_STUDIO', 'FINANCE', 'PROJECT_MANAGER')")
    public ResponseEntity<ApiResponse<List<BuyerDto>>> getAllBuyers() {
        long startTime = System.currentTimeMillis();
        List<BuyerDto> response = buyerService.getAllBuyers();
        long duration = System.currentTimeMillis() - startTime;

        log.info("Endpoint: GET /api/v1/buyers, Execution Time: {}ms, Size: {}",
                duration, response.size());

        return ResponseEntity.ok(new ApiResponse<>(response));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'CRM', 'DESIGN_STUDIO', 'FINANCE', 'PROJECT_MANAGER')")
    public ResponseEntity<ApiResponse<BuyerDto>> getBuyerById(@PathVariable UUID id) {
        long startTime = System.currentTimeMillis();
        BuyerDto response = buyerService.getBuyerById(id);
        long duration = System.currentTimeMillis() - startTime;

        log.info("Endpoint: GET /api/v1/buyers/{}, Execution Time: {}ms", id, duration);

        return ResponseEntity.ok(new ApiResponse<>(response));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'CRM')")
    public ResponseEntity<ApiResponse<BuyerDto>> createBuyer(@RequestBody BuyerDto dto) {
        long startTime = System.currentTimeMillis();
        BuyerDto response = buyerService.createBuyer(dto);
        long duration = System.currentTimeMillis() - startTime;

        log.info("Endpoint: POST /api/v1/buyers, Execution Time: {}ms, Created ID: {}", duration, response.getId());

        return ResponseEntity.ok(new ApiResponse<>(response));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'CRM')")
    public ResponseEntity<ApiResponse<BuyerDto>> updateBuyer(@PathVariable UUID id, @RequestBody BuyerDto dto) {
        long startTime = System.currentTimeMillis();
        BuyerDto response = buyerService.updateBuyer(id, dto);
        long duration = System.currentTimeMillis() - startTime;

        log.info("Endpoint: PUT /api/v1/buyers/{}, Execution Time: {}ms", id, duration);

        return ResponseEntity.ok(new ApiResponse<>(response));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'CRM')")
    public ResponseEntity<ApiResponse<String>> deleteBuyer(@PathVariable UUID id) {
        long startTime = System.currentTimeMillis();
        buyerService.deleteBuyer(id);
        long duration = System.currentTimeMillis() - startTime;

        log.info("Endpoint: DELETE /api/v1/buyers/{}, Execution Time: {}ms", id, duration);

        return ResponseEntity.ok(new ApiResponse<>("Buyer deleted successfully."));
    }
}
