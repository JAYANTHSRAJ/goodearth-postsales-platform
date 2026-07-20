package com.goodearth.postsales.webhook.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.goodearth.postsales.buyer.entity.Buyer;
import com.goodearth.postsales.finance.entity.PaymentReceipt;
import com.goodearth.postsales.finance.repository.PaymentReceiptRepository;
import com.goodearth.postsales.project.entity.Project;
import com.goodearth.postsales.workflow.entity.Workflow;
import com.goodearth.postsales.workflow.repository.WorkflowRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.context.ApplicationEventPublisher;

import java.math.BigDecimal;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class RazorpayWebhookProcessorTest {

    @Mock
    private PaymentReceiptRepository receiptRepository;

    @Mock
    private WorkflowRepository workflowRepository;

    @Mock
    private ApplicationEventPublisher eventPublisher;

    private ObjectMapper objectMapper;
    private RazorpayWebhookProcessor processor;

    @BeforeEach
    public void setUp() {
        objectMapper = new ObjectMapper();
        processor = new RazorpayWebhookProcessor(
                receiptRepository,
                workflowRepository,
                objectMapper,
                eventPublisher
        );
    }

    @Test
    public void testProcessPaymentCaptured_Success() throws Exception {
        UUID workflowId = UUID.randomUUID();
        String payload = "{\n" +
                "  \"entity\": \"event\",\n" +
                "  \"event\": \"payment.captured\",\n" +
                "  \"payload\": {\n" +
                "    \"payment\": {\n" +
                "      \"entity\": {\n" +
                "        \"id\": \"pay_12345\",\n" +
                "        \"amount\": 500000,\n" +
                "        \"description\": \"Test description\",\n" +
                "        \"notes\": {\n" +
                "          \"workflow_id\": \"" + workflowId.toString() + "\"\n" +
                "        }\n" +
                "      }\n" +
                "    }\n" +
                "  }\n" +
                "}";

        Workflow workflow = new Workflow();
        workflow.setId(workflowId);
        
        Buyer buyer = new Buyer();
        buyer.setEmail("buyer@example.com");
        buyer.setFullName("John Doe");
        workflow.setBuyer(buyer);

        Project project = new Project();
        project.setProjectName("GoodEarth Villa");
        workflow.setProject(project);

        when(workflowRepository.findById(workflowId)).thenReturn(Optional.of(workflow));
        when(receiptRepository.findByZohoPaymentId("pay_12345")).thenReturn(Optional.empty());

        UUID correlationId = UUID.randomUUID();
        processor.process("payment.captured", payload, correlationId);

        ArgumentCaptor<PaymentReceipt> receiptCaptor = ArgumentCaptor.forClass(PaymentReceipt.class);
        verify(receiptRepository).save(receiptCaptor.capture());

        PaymentReceipt savedReceipt = receiptCaptor.getValue();
        assertNotNull(savedReceipt);
        assertEquals(workflow, savedReceipt.getWorkflow());
        assertEquals("pay_12345", savedReceipt.getZohoPaymentId());
        assertEquals(new BigDecimal("5000.00"), savedReceipt.getAmount());
        assertEquals("Test description", savedReceipt.getRemarks());

        verify(eventPublisher, times(1)).publishEvent(any(Object.class));
    }
}
