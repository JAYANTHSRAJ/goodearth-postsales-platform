package com.goodearth.postsales.annotation.service;

import com.goodearth.postsales.annotation.dto.AnnotationAttachmentDto;
import com.goodearth.postsales.annotation.dto.AnnotationCommentDto;
import com.goodearth.postsales.annotation.dto.AnnotationDetailDto;
import com.goodearth.postsales.annotation.dto.AnnotationDto;
import com.goodearth.postsales.annotation.entity.*;
import com.goodearth.postsales.annotation.event.AnnotationEvents;
import com.goodearth.postsales.annotation.mapper.AnnotationAttachmentMapper;
import com.goodearth.postsales.annotation.mapper.AnnotationCommentMapper;
import com.goodearth.postsales.annotation.mapper.AnnotationMapper;
import com.goodearth.postsales.annotation.repository.AnnotationAttachmentRepository;
import com.goodearth.postsales.annotation.repository.AnnotationCommentRepository;
import com.goodearth.postsales.annotation.repository.AnnotationRepository;
import com.goodearth.postsales.auth.entity.User;
import com.goodearth.postsales.auth.repository.UserRepository;
import com.goodearth.postsales.changerequest.dto.ChangeRequestDto;
import com.goodearth.postsales.changerequest.entity.Priority;
import com.goodearth.postsales.changerequest.service.ChangeRequestService;
import com.goodearth.postsales.common.exception.CustomException;
import com.goodearth.postsales.document.entity.Document;
import com.goodearth.postsales.document.repository.DocumentRepository;
import com.goodearth.postsales.workflow.entity.Workflow;
import com.goodearth.postsales.workflow.repository.WorkflowRepository;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class AnnotationServiceImpl implements AnnotationService {

    private final AnnotationRepository repository;
    private final AnnotationCommentRepository commentRepository;
    private final AnnotationAttachmentRepository attachmentRepository;
    private final WorkflowRepository workflowRepository;
    private final DocumentRepository documentRepository;
    private final UserRepository userRepository;
    private final ChangeRequestService changeRequestService;
    private final AnnotationMapper mapper;
    private final AnnotationCommentMapper commentMapper;
    private final AnnotationAttachmentMapper attachmentMapper;
    private final ApplicationEventPublisher eventPublisher;

    public AnnotationServiceImpl(
            AnnotationRepository repository,
            AnnotationCommentRepository commentRepository,
            AnnotationAttachmentRepository attachmentRepository,
            WorkflowRepository workflowRepository,
            DocumentRepository documentRepository,
            UserRepository userRepository,
            ChangeRequestService changeRequestService,
            AnnotationMapper mapper,
            AnnotationCommentMapper commentMapper,
            AnnotationAttachmentMapper attachmentMapper,
            ApplicationEventPublisher eventPublisher) {
        this.repository = repository;
        this.commentRepository = commentRepository;
        this.attachmentRepository = attachmentRepository;
        this.workflowRepository = workflowRepository;
        this.documentRepository = documentRepository;
        this.userRepository = userRepository;
        this.changeRequestService = changeRequestService;
        this.mapper = mapper;
        this.commentMapper = commentMapper;
        this.attachmentMapper = attachmentMapper;
        this.eventPublisher = eventPublisher;
    }

    @Override
    @Transactional
    public AnnotationDetailDto createAnnotation(UUID workflowId, UUID documentId, String workdriveFileId, UUID authorId, String authorRole, String annotationType, BigDecimal xCoordinate, BigDecimal yCoordinate, int pageNumber, String color, String title, String description) {
        Workflow workflow = workflowRepository.findById(workflowId)
                .orElseThrow(() -> new CustomException("Workflow not found", HttpStatus.NOT_FOUND));
        Document document = documentRepository.findById(documentId)
                .orElseThrow(() -> new CustomException("Document not found", HttpStatus.NOT_FOUND));
        User author = userRepository.findById(authorId)
                .orElseThrow(() -> new CustomException("User not found", HttpStatus.NOT_FOUND));

        Annotation annotation = new Annotation();
        annotation.setWorkflow(workflow);
        annotation.setDocument(document);
        annotation.setWorkdriveFileId(workdriveFileId);
        annotation.setAuthor(author);
        annotation.setAuthorRole(authorRole);
        annotation.setAnnotationType(AnnotationType.valueOf(annotationType.toUpperCase()));
        annotation.setXCoordinate(xCoordinate);
        annotation.setYCoordinate(yCoordinate);
        annotation.setPageNumber(pageNumber);
        annotation.setColor(color != null ? color : "#FF0000");
        annotation.setTitle(title);
        annotation.setDescription(description);
        annotation.setStatus(AnnotationStatus.OPEN);

        Annotation saved = repository.save(annotation);
        
        eventPublisher.publishEvent(new AnnotationEvents.AnnotationCreatedEvent(
                saved.getId(), author.getEmail(), workflowId
        ));

        return getDetailDto(saved);
    }

    @Override
    @Transactional
    public AnnotationDetailDto updateAnnotation(UUID id, String title, String description, BigDecimal xCoordinate, BigDecimal yCoordinate, int pageNumber, String color) {
        Annotation annotation = repository.findById(id)
                .orElseThrow(() -> new CustomException("Annotation not found", HttpStatus.NOT_FOUND));

        if (title != null) annotation.setTitle(title);
        if (description != null) annotation.setDescription(description);
        if (xCoordinate != null) annotation.setXCoordinate(xCoordinate);
        if (yCoordinate != null) annotation.setYCoordinate(yCoordinate);
        if (pageNumber > 0) annotation.setPageNumber(pageNumber);
        if (color != null) annotation.setColor(color);

        Annotation saved = repository.save(annotation);

        eventPublisher.publishEvent(new AnnotationEvents.AnnotationUpdatedEvent(
                saved.getId(), saved.getWorkflow().getId()
        ));

        return getDetailDto(saved);
    }

    @Override
    @Transactional
    public void deleteAnnotation(UUID id) {
        Annotation annotation = repository.findById(id)
                .orElseThrow(() -> new CustomException("Annotation not found", HttpStatus.NOT_FOUND));
        repository.delete(annotation);
    }

    @Override
    @Transactional
    public AnnotationDetailDto approveAnnotation(UUID id, UUID actorId, boolean spawnChangeRequest, String remarks) {
        Annotation annotation = repository.findById(id)
                .orElseThrow(() -> new CustomException("Annotation not found", HttpStatus.NOT_FOUND));
        User actor = userRepository.findById(actorId)
                .orElseThrow(() -> new CustomException("Actor not found", HttpStatus.NOT_FOUND));

        annotation.setStatus(AnnotationStatus.APPROVED);
        Annotation saved = repository.save(annotation);

        UUID changeRequestId = null;
        if (spawnChangeRequest) {
            ChangeRequestDto crDto = changeRequestService.createRequest(
                    saved.getWorkflow().getId(),
                    saved.getDocument().getId(),
                    saved.getId().toString(),
                    saved.getAuthor().getEmail(),
                    Priority.MEDIUM,
                    remarks != null ? remarks : saved.getDescription()
            );
            changeRequestId = crDto.getId();
        }

        // Add history comment
        if (remarks != null && !remarks.isBlank()) {
            addComment(saved.getId(), actorId, saved.getAuthorRole(), remarks);
        }

        eventPublisher.publishEvent(new AnnotationEvents.AnnotationApprovedEvent(
                saved.getId(), saved.getWorkflow().getId(), changeRequestId
        ));

        return getDetailDto(saved);
    }

    @Override
    @Transactional
    public AnnotationDetailDto rejectAnnotation(UUID id, String remarks) {
        Annotation annotation = repository.findById(id)
                .orElseThrow(() -> new CustomException("Annotation not found", HttpStatus.NOT_FOUND));

        annotation.setStatus(AnnotationStatus.REJECTED);
        Annotation saved = repository.save(annotation);

        eventPublisher.publishEvent(new AnnotationEvents.AnnotationRejectedEvent(
                saved.getId(), saved.getWorkflow().getId()
        ));

        return getDetailDto(saved);
    }

    @Override
    @Transactional
    public AnnotationDetailDto resolveAnnotation(UUID id, String remarks) {
        Annotation annotation = repository.findById(id)
                .orElseThrow(() -> new CustomException("Annotation not found", HttpStatus.NOT_FOUND));

        annotation.setStatus(AnnotationStatus.RESOLVED);
        Annotation saved = repository.save(annotation);

        eventPublisher.publishEvent(new AnnotationEvents.AnnotationResolvedEvent(
                saved.getId(), saved.getWorkflow().getId()
        ));

        return getDetailDto(saved);
    }

    @Override
    @Transactional
    public AnnotationCommentDto addComment(UUID annotationId, UUID authorId, String authorRole, String comment) {
        Annotation annotation = repository.findById(annotationId)
                .orElseThrow(() -> new CustomException("Annotation not found", HttpStatus.NOT_FOUND));
        User author = userRepository.findById(authorId)
                .orElseThrow(() -> new CustomException("User not found", HttpStatus.NOT_FOUND));

        AnnotationComment c = new AnnotationComment();
        c.setAnnotation(annotation);
        c.setAuthor(author);
        c.setAuthorRole(authorRole);
        c.setComment(comment);

        AnnotationComment saved = commentRepository.save(c);
        return commentMapper.toDto(saved);
    }

    @Override
    @Transactional
    public AnnotationAttachmentDto uploadAttachmentMetadata(UUID annotationId, String workdriveFileId, String mediaType) {
        Annotation annotation = repository.findById(annotationId)
                .orElseThrow(() -> new CustomException("Annotation not found", HttpStatus.NOT_FOUND));

        AnnotationAttachment att = new AnnotationAttachment();
        att.setAnnotation(annotation);
        att.setWorkdriveFileId(workdriveFileId);
        att.setMediaType(mediaType);

        AnnotationAttachment saved = attachmentRepository.save(att);
        return attachmentMapper.toDto(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public List<AnnotationDetailDto> listAnnotationsByDocument(UUID documentId, String status) {
        List<Annotation> list = (status != null && !status.isBlank())
                ? repository.findByDocumentIdAndStatus(documentId, AnnotationStatus.valueOf(status.toUpperCase()))
                : repository.findByDocumentId(documentId);

        return list.stream()
                .map(this::getDetailDto)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<AnnotationDetailDto> listAnnotationsByWorkflow(UUID workflowId, String status) {
        List<Annotation> list = (status != null && !status.isBlank())
                ? repository.findByWorkflowIdAndStatus(workflowId, AnnotationStatus.valueOf(status.toUpperCase()))
                : repository.findByWorkflowId(workflowId);

        return list.stream()
                .map(this::getDetailDto)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<AnnotationDetailDto> listAllAnnotations() {
        return repository.findAll().stream()
                .map(this::getDetailDto)
                .collect(Collectors.toList());
    }

    private AnnotationDetailDto getDetailDto(Annotation annotation) {
        AnnotationDto dto = mapper.toDto(annotation);
        List<AnnotationCommentDto> comments = commentRepository.findByAnnotationIdOrderByCreatedAtAsc(annotation.getId()).stream()
                .map(commentMapper::toDto)
                .collect(Collectors.toList());
        List<AnnotationAttachmentDto> attachments = attachmentRepository.findByAnnotationId(annotation.getId()).stream()
                .map(attachmentMapper::toDto)
                .collect(Collectors.toList());
        return new AnnotationDetailDto(dto, comments, attachments);
    }
}
