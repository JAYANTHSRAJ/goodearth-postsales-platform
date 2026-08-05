package com.goodearth.postsales.document.service;

import com.goodearth.postsales.common.exception.CustomException;
import com.goodearth.postsales.document.dto.DocumentDto;
import com.goodearth.postsales.document.entity.Document;
import com.goodearth.postsales.document.entity.DocumentType;
import com.goodearth.postsales.document.mapper.DocumentMapper;
import com.goodearth.postsales.document.repository.DocumentRepository;
import com.goodearth.postsales.workflow.entity.Workflow;
import com.goodearth.postsales.workflow.repository.WorkflowRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.http.HttpStatus;

import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
public class DocumentServiceImplUnitTest {

    @Mock
    private DocumentRepository documentRepository;
    @Mock
    private WorkflowRepository workflowRepository;
    @Mock
    private DocumentMapper documentMapper;

    @InjectMocks
    private DocumentServiceImpl documentService;

    private UUID workflowId;
    private Workflow workflow;

    @BeforeEach
    public void setUp() {
        workflowId = UUID.randomUUID();
        workflow = new Workflow();
        workflow.setId(workflowId);

        when(workflowRepository.findById(workflowId)).thenReturn(Optional.of(workflow));
        when(documentRepository.save(any(Document.class))).thenAnswer(invocation -> {
            Document doc = invocation.getArgument(0);
            doc.setId(UUID.randomUUID());
            return doc;
        });
        when(documentMapper.toDto(any(Document.class))).thenAnswer(invocation -> {
            Document doc = invocation.getArgument(0);
            DocumentDto dto = new DocumentDto();
            dto.setId(doc.getId());
            dto.setWorkflowId(workflowId);
            dto.setWorkDriveFileId(doc.getWorkDriveFileId());
            dto.setFileName(doc.getFileName());
            dto.setDocumentType(doc.getDocumentType());
            return dto;
        });
    }

    @Test
    public void testCreateEngineeringDocument_Success_WithWorkDriveFileId() {
        DocumentDto request = new DocumentDto();
        request.setWorkflowId(workflowId);
        request.setDocumentType(DocumentType.DESIGN_PLAN);
        request.setFileName("Floor_Plan.pdf");
        request.setWorkDriveFileId("WD-FILE-1001");

        DocumentDto result = documentService.createDocument(request);

        assertNotNull(result);
        assertEquals("WD-FILE-1001", result.getWorkDriveFileId());
        verify(documentRepository, times(1)).save(any(Document.class));
    }

    @Test
    public void testCreateEngineeringDocument_Failure_WithoutWorkDriveFileId() {
        DocumentDto request = new DocumentDto();
        request.setWorkflowId(workflowId);
        request.setDocumentType(DocumentType.DESIGN_PLAN);
        request.setFileName("Floor_Plan.pdf");
        request.setWorkDriveFileId(null);

        CustomException exception = assertThrows(CustomException.class, () -> documentService.createDocument(request));

        assertEquals(HttpStatus.BAD_REQUEST, exception.getStatus());
        assertTrue(exception.getMessage().contains("WorkDrive File ID is required for engineering documents"));
        verify(documentRepository, never()).save(any());
    }

    @Test
    public void testCreateBuyerKycDocument_Success_WithoutWorkDriveFileId() {
        DocumentDto request = new DocumentDto();
        request.setWorkflowId(workflowId);
        request.setDocumentType(DocumentType.PAN_CARD);
        request.setFileName("PAN_Primary.pdf");
        request.setWorkDriveFileId(null);

        DocumentDto result = documentService.createDocument(request);

        assertNotNull(result);
        assertNull(result.getWorkDriveFileId());
        verify(documentRepository, times(1)).save(any(Document.class));
    }

    @Test
    public void testCreateBuyerKycDocument_Success_WithLegacyWorkDriveFileId() {
        DocumentDto request = new DocumentDto();
        request.setWorkflowId(workflowId);
        request.setDocumentType(DocumentType.AGREEMENT);
        request.setFileName("Agreement_Signed.pdf");
        request.setWorkDriveFileId("WD-LEGACY-999");

        DocumentDto result = documentService.createDocument(request);

        assertNotNull(result);
        assertEquals("WD-LEGACY-999", result.getWorkDriveFileId());
        verify(documentRepository, times(1)).save(any(Document.class));
    }
}
