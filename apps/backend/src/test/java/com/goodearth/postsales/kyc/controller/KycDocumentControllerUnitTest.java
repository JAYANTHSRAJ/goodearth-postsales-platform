package com.goodearth.postsales.kyc.controller;

import com.goodearth.postsales.document.dto.DocumentUploadResponseDto;
import com.goodearth.postsales.document.entity.DocumentCategory;
import com.goodearth.postsales.document.entity.DocumentType;
import com.goodearth.postsales.kyc.entity.ApplicantType;
import com.goodearth.postsales.kyc.service.KycDocumentService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.util.UUID;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
public class KycDocumentControllerUnitTest {

    private MockMvc mockMvc;

    @Mock
    private KycDocumentService kycDocumentService;

    @InjectMocks
    private KycDocumentController kycDocumentController;

    private UUID appId;

    @BeforeEach
    public void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(kycDocumentController).build();
        appId = UUID.randomUUID();
    }

    @Test
    public void testUploadDocument_WithAllParams() throws Exception {
        DocumentUploadResponseDto responseDto = DocumentUploadResponseDto.builder()
                .documentId(UUID.randomUUID())
                .kycApplicationId(appId)
                .build();

        when(kycDocumentService.uploadKycDocument(any(), any(), any(), any(), any(), any(), anyLong(), any(), any()))
                .thenReturn(responseDto);

        MockMultipartFile file = new MockMultipartFile("file", "test.pdf", "application/pdf", "data".getBytes());

        mockMvc.perform(multipart("/api/v1/kyc/documents/upload")
                        .file(file)
                        .param("kycApplicationId", appId.toString())
                        .param("documentCategory", DocumentCategory.KYC.name())
                        .param("documentType", DocumentType.AADHAAR_CARD.name())
                        .param("applicantType", ApplicantType.PRIMARY.name()))
                .andExpect(status().isOk());
    }

    @Test
    public void testUploadDocument_WithoutCategoryParam() throws Exception {
        DocumentUploadResponseDto responseDto = DocumentUploadResponseDto.builder()
                .documentId(UUID.randomUUID())
                .kycApplicationId(appId)
                .build();

        MockMultipartFile file = new MockMultipartFile("file", "test.pdf", "application/pdf", "data".getBytes());

        mockMvc.perform(multipart("/api/v1/kyc/documents/upload")
                        .file(file)
                        .param("kycApplicationId", appId.toString())
                        .param("documentType", DocumentType.AADHAAR_CARD.name())
                        .param("applicantType", ApplicantType.PRIMARY.name()))
                .andExpect(status().isBadRequest());
    }
}
