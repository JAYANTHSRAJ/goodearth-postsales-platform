package com.goodearth.postsales.system.controller;

import com.goodearth.postsales.common.response.ApiResponse;
import com.goodearth.postsales.integration.books.BooksProperties;
import com.goodearth.postsales.integration.workdrive.WorkDriveProperties;
import com.goodearth.postsales.integration.zoho.ZohoApiClient;
import com.goodearth.postsales.integration.zoho.ZohoProperties;
import com.goodearth.postsales.integration.zoho.ZohoTokenManager;
import com.goodearth.postsales.system.dto.SystemHealthResponse;
import com.goodearth.postsales.system.dto.ZohoConnectivityResponse;
import liquibase.integration.spring.SpringLiquibase;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import javax.sql.DataSource;
import java.sql.Connection;

@RestController
@RequestMapping("/api/v1/system")
@PreAuthorize("hasRole('SUPER_ADMIN')")
public class SystemController {

    private static final Logger log = LoggerFactory.getLogger(SystemController.class);

    private final DataSource dataSource;
    private final SpringLiquibase springLiquibase;
    private final ZohoTokenManager tokenManager;
    private final ZohoApiClient apiClient;
    private final ZohoProperties zohoProperties;
    private final WorkDriveProperties workDriveProperties;
    private final BooksProperties booksProperties;

    public SystemController(
            DataSource dataSource,
            @Autowired(required = false) SpringLiquibase springLiquibase,
            ZohoTokenManager tokenManager,
            ZohoApiClient apiClient,
            ZohoProperties zohoProperties,
            WorkDriveProperties workDriveProperties,
            BooksProperties booksProperties) {
        this.dataSource = dataSource;
        this.springLiquibase = springLiquibase;
        this.tokenManager = tokenManager;
        this.apiClient = apiClient;
        this.zohoProperties = zohoProperties;
        this.workDriveProperties = workDriveProperties;
        this.booksProperties = booksProperties;
    }

    @GetMapping("/health")
    public ResponseEntity<ApiResponse<SystemHealthResponse>> getHealth() {
        long startTime = System.currentTimeMillis();
        
        String dbStatus = "UP";
        try (Connection conn = dataSource.getConnection()) {
            if (!conn.isValid(1)) {
                dbStatus = "DOWN";
            }
        } catch (Exception e) {
            dbStatus = "DOWN";
        }

        String liquibaseStatus = (springLiquibase != null) ? "READY" : "DOWN";

        SystemHealthResponse health = new SystemHealthResponse(
                "UP",
                dbStatus,
                "ENABLED",
                liquibaseStatus
        );

        long duration = System.currentTimeMillis() - startTime;
        log.info("Endpoint: GET /api/v1/system/health, Status: 200, Duration: {}ms", duration);

        return ResponseEntity.ok(new ApiResponse<>(health));
    }

    @GetMapping("/zoho")
    public ResponseEntity<ApiResponse<ZohoConnectivityResponse>> getZohoStatus() {
        long startTime = System.currentTimeMillis();

        String oauth = "CONNECTED";
        try {
            tokenManager.testTokenRefresh();
        } catch (Exception e) {
            log.error("Zoho OAuth Token Refresh failed during verification", e);
            oauth = "FAILED";
        }

        String crm = "CONNECTED";
        try {
            apiClient.get(zohoProperties.getCrmApiUrl() + "/users?type=CurrentUser", String.class);
        } catch (Exception e) {
            log.error("Zoho CRM connection failed during verification", e);
            crm = "FAILED";
        }

        String workdrive = "CONNECTED";
        try {
            apiClient.get(workDriveProperties.getApiUrl() + "/users/me", String.class);
        } catch (Exception e) {
            log.error("Zoho WorkDrive connection failed during verification", e);
            workdrive = "FAILED";
        }

        String books = "CONNECTED";
        try {
            apiClient.get(booksProperties.getApiUrl() + "/organizations", String.class);
        } catch (Exception e) {
            log.error("Zoho Books connection failed during verification", e);
            books = "FAILED";
        }

        ZohoConnectivityResponse response = new ZohoConnectivityResponse(crm, workdrive, books, oauth);

        long duration = System.currentTimeMillis() - startTime;
        log.info("Endpoint: GET /api/v1/system/zoho, Status: 200, Duration: {}ms", duration);

        return ResponseEntity.ok(new ApiResponse<>(response));
    }
}
