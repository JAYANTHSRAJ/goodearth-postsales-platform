package com.goodearth.postsales.document.service;

import com.goodearth.postsales.document.dto.DocumentDto;
import com.goodearth.postsales.document.entity.DocumentStatus;

import java.util.List;
import java.util.UUID;

public interface DocumentService {
    DocumentDto createDocument(DocumentDto documentDto);
    DocumentDto getDocument(UUID id);
    List<DocumentDto> listDocuments();
    List<DocumentDto> getDocumentsByWorkflow(UUID workflowId);
    DocumentDto updateStatus(UUID id, DocumentStatus status);
}
