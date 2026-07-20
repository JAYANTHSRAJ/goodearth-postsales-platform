package com.goodearth.postsales.document.service;

import com.goodearth.postsales.document.dto.DocumentDto;
import com.goodearth.postsales.document.entity.Document;
import com.goodearth.postsales.document.entity.DocumentStatus;
import com.goodearth.postsales.document.mapper.DocumentMapper;
import com.goodearth.postsales.document.repository.DocumentRepository;
import com.goodearth.postsales.workflow.entity.Workflow;
import com.goodearth.postsales.workflow.repository.WorkflowRepository;
import com.goodearth.postsales.common.exception.CustomException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class DocumentServiceImpl implements DocumentService {

    private final DocumentRepository documentRepository;
    private final WorkflowRepository workflowRepository;
    private final DocumentMapper documentMapper;

    public DocumentServiceImpl(
            DocumentRepository documentRepository,
            WorkflowRepository workflowRepository,
            DocumentMapper documentMapper) {
        this.documentRepository = documentRepository;
        this.workflowRepository = workflowRepository;
        this.documentMapper = documentMapper;
    }

    @Override
    @Transactional
    public DocumentDto createDocument(DocumentDto dto) {
        if (dto.getWorkflowId() == null) {
            throw new CustomException("Workflow ID is required.", HttpStatus.BAD_REQUEST);
        }
        if (dto.getWorkDriveFileId() == null || dto.getWorkDriveFileId().trim().isEmpty()) {
            throw new CustomException("WorkDrive File ID is required.", HttpStatus.BAD_REQUEST);
        }
        if (dto.getFileName() == null || dto.getFileName().trim().isEmpty()) {
            throw new CustomException("File name is required.", HttpStatus.BAD_REQUEST);
        }
        if (dto.getDocumentType() == null) {
            throw new CustomException("Document type is required.", HttpStatus.BAD_REQUEST);
        }

        Workflow workflow = workflowRepository.findById(dto.getWorkflowId())
                .orElseThrow(() -> new CustomException("Workflow not found.", HttpStatus.NOT_FOUND));

        int nextVersion = 1;
        Optional<Document> topDocOpt = documentRepository.findFirstByWorkflowIdAndDocumentTypeOrderByVersionDesc(dto.getWorkflowId(), dto.getDocumentType());
        if (topDocOpt.isPresent()) {
            nextVersion = topDocOpt.get().getVersion() + 1;
        }

        DocumentStatus newStatus = dto.getStatus() != null ? dto.getStatus() : DocumentStatus.ACTIVE;
        if (newStatus == DocumentStatus.ACTIVE) {
            Optional<Document> activeDocOpt = documentRepository.findByWorkflowIdAndDocumentTypeAndStatus(dto.getWorkflowId(), dto.getDocumentType(), DocumentStatus.ACTIVE);
            if (activeDocOpt.isPresent()) {
                Document activeDoc = activeDocOpt.get();
                activeDoc.setStatus(DocumentStatus.ARCHIVED);
                documentRepository.save(activeDoc);
            }
        }

        Document document = new Document();
        document.setWorkflow(workflow);
        document.setWorkDriveFileId(dto.getWorkDriveFileId());
        document.setVersion(nextVersion);
        document.setFileName(dto.getFileName());
        document.setDocumentType(dto.getDocumentType());
        document.setMimeType(dto.getMimeType());
        document.setFileSize(dto.getFileSize());
        document.setUploadedBy(dto.getUploadedBy() != null ? dto.getUploadedBy() : "system");
        document.setUploadedAt(LocalDateTime.now());
        document.setStatus(newStatus);

        Document savedDoc = documentRepository.save(document);
        return documentMapper.toDto(savedDoc);
    }

    @Override
    @Transactional(readOnly = true)
    public DocumentDto getDocument(UUID id) {
        Document document = documentRepository.findById(id)
                .orElseThrow(() -> new CustomException("Document not found.", HttpStatus.NOT_FOUND));
        return documentMapper.toDto(document);
    }

    @Override
    @Transactional(readOnly = true)
    public List<DocumentDto> listDocuments() {
        return documentRepository.findAll().stream()
                .map(documentMapper::toDto)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<DocumentDto> getDocumentsByWorkflow(UUID workflowId) {
        if (!workflowRepository.existsById(workflowId)) {
            throw new CustomException("Workflow not found.", HttpStatus.NOT_FOUND);
        }
        return documentRepository.findByWorkflowId(workflowId).stream()
                .map(documentMapper::toDto)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public DocumentDto updateStatus(UUID id, DocumentStatus status) {
        Document document = documentRepository.findById(id)
                .orElseThrow(() -> new CustomException("Document not found.", HttpStatus.NOT_FOUND));

        if (status == DocumentStatus.ACTIVE) {
            Optional<Document> activeDocOpt = documentRepository.findByWorkflowIdAndDocumentTypeAndStatus(document.getWorkflow().getId(), document.getDocumentType(), DocumentStatus.ACTIVE);
            if (activeDocOpt.isPresent() && !activeDocOpt.get().getId().equals(id)) {
                Document activeDoc = activeDocOpt.get();
                activeDoc.setStatus(DocumentStatus.ARCHIVED);
                documentRepository.save(activeDoc);
            }
        }

        document.setStatus(status);
        Document savedDoc = documentRepository.save(document);
        return documentMapper.toDto(savedDoc);
    }
}
