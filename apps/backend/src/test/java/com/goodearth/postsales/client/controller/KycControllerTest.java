package com.goodearth.postsales.client.controller;

import com.goodearth.postsales.client.dto.KycReviewSummaryDto;
import com.goodearth.postsales.client.repository.KycApplicationRepository;
import com.goodearth.postsales.client.service.KycService;
import com.goodearth.postsales.common.exception.CustomException;
import com.goodearth.postsales.common.response.ApiResponse;
import com.goodearth.postsales.security.user.CustomUserDetails;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.authority.SimpleGrantedAuthority;

import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class KycControllerTest {

    @Mock
    private KycService kycService;

    @Mock
    private KycApplicationRepository kycApplicationRepository;

    @InjectMocks
    private KycController kycController;

    @Test
    public void testGetKycByWorkflow_AuthenticatedUser_Success() {
        UUID userId = UUID.randomUUID();
        UUID workflowId = UUID.randomUUID();

        CustomUserDetails userDetails = new CustomUserDetails(
                userId,
                "client@goodearth.com",
                "password",
                List.of(new SimpleGrantedAuthority("ROLE_CLIENT"))
        );

        KycReviewSummaryDto summaryDto = new KycReviewSummaryDto();
        summaryDto.setId(UUID.randomUUID());

        when(kycService.getKycByWorkflowId(userId, workflowId)).thenReturn(summaryDto);

        ResponseEntity<ApiResponse<KycReviewSummaryDto>> response = kycController.getKycByWorkflow(userDetails, workflowId);

        assertNotNull(response);
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals(summaryDto, response.getBody().getData());
        verify(kycService).getKycByWorkflowId(userId, workflowId);
    }

    @Test
    public void testGetKycByWorkflow_NullUser_ThrowsUnauthorized() {
        UUID workflowId = UUID.randomUUID();

        CustomException exception = assertThrows(CustomException.class, () -> {
            kycController.getKycByWorkflow(null, workflowId);
        });

        assertEquals(HttpStatus.UNAUTHORIZED, exception.getStatus());
        assertEquals("Authentication required", exception.getMessage());
        verifyNoInteractions(kycService);
    }
}
