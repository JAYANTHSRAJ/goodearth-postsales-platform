package com.goodearth.postsales.sign.service;

import com.goodearth.postsales.integration.sign.ZohoSignProperties;
import com.goodearth.postsales.integration.zoho.ZohoApiClient;
import com.goodearth.postsales.sign.dto.ZohoSignCreateRequest;
import com.goodearth.postsales.sign.dto.ZohoSignDto;
import com.goodearth.postsales.sign.entity.ZohoSignRequest;
import com.goodearth.postsales.sign.repository.ZohoSignRequestRepository;
import com.goodearth.postsales.workflow.repository.WorkflowRepository;
import com.goodearth.postsales.document.repository.DocumentRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Map;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ZohoSignServiceImplTest {

    @Mock
    private ZohoApiClient apiClient;

    @Mock
    private ZohoSignProperties signProperties;

    @Mock
    private ZohoSignRequestRepository signRequestRepository;

    @Mock
    private WorkflowRepository workflowRepository;

    @Mock
    private DocumentRepository documentRepository;

    @InjectMocks
    private ZohoSignServiceImpl signService;

    @BeforeEach
    void setUp() {
        lenient().when(signProperties.getApiUrl()).thenReturn("https://sign.zoho.com/api/v1");
    }

    @Test
    void testCreateSignRequest_Success() {
        ZohoSignCreateRequest request = new ZohoSignCreateRequest();
        request.setDocumentName("Construction Agreement.pdf");
        request.setRecipientEmail("buyer@example.com");
        request.setRecipientName("John Doe");

        when(signRequestRepository.save(any(ZohoSignRequest.class))).thenAnswer(invocation -> {
            ZohoSignRequest req = invocation.getArgument(0);
            req.setId(UUID.randomUUID());
            return req;
        });

        ZohoSignDto result = signService.createSignRequest(request);

        assertNotNull(result);
        assertNotNull(result.getRequestId());
        verify(signRequestRepository, times(1)).save(any(ZohoSignRequest.class));
    }

    @Test
    void testGetSignRequestStatus_Success() {
        String requestId = "ZSIGN-REQ-12345";
        ZohoSignRequest entity = new ZohoSignRequest();
        entity.setId(UUID.randomUUID());
        entity.setRequestId(requestId);

        when(signRequestRepository.findByRequestId(requestId)).thenReturn(Optional.of(entity));

        ZohoSignDto result = signService.getSignRequestStatus(requestId);

        assertNotNull(result);
        assertEquals(requestId, result.getRequestId());
    }

    @Test
    void testHandleSignWebhook_Success() {
        Map<String, Object> payload = Map.of("event", "document_completed");
        assertDoesNotThrow(() -> signService.handleSignWebhook(payload));
    }
}
