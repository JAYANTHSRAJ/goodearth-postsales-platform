package com.goodearth.postsales.system.controller;

import com.goodearth.postsales.common.response.ApiResponse;
import com.goodearth.postsales.security.user.CustomUserDetails;
import com.goodearth.postsales.system.dto.AdminDashboardDto;
import com.goodearth.postsales.system.service.AdminDashboardService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import java.math.BigDecimal;
import java.util.Collections;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AdminDashboardControllerTest {

    @Mock
    private AdminDashboardService dashboardService;

    @Mock
    private CustomUserDetails userDetails;

    @InjectMocks
    private AdminDashboardController dashboardController;

    private AdminDashboardDto sampleDto;

    @BeforeEach
    void setUp() {
        sampleDto = new AdminDashboardDto(
                5L, 3L, BigDecimal.valueOf(100000), BigDecimal.valueOf(50000), BigDecimal.valueOf(50000),
                0L, 0L, Collections.emptyMap(), Collections.emptyMap(),
                Collections.emptyList(), Collections.emptyList(), Collections.emptyList(),
                Collections.emptyList(), Collections.emptyList()
        );
    }

    @Test
    void testGetDashboardStats_Success() {
        when(dashboardService.getDashboardStats()).thenReturn(sampleDto);
        when(userDetails.getUsername()).thenReturn("admin@goodearth.com");

        ResponseEntity<ApiResponse<AdminDashboardDto>> response = dashboardController.getDashboardStats(userDetails);

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals(5L, response.getBody().getData().getTotalBuyers());
    }
}
