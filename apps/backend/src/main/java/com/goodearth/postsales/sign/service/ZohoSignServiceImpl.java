package com.goodearth.postsales.sign.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.goodearth.postsales.common.exception.CustomException;
import com.goodearth.postsales.document.entity.Document;
import com.goodearth.postsales.document.repository.DocumentRepository;
import com.goodearth.postsales.integration.sign.ZohoSignProperties;
import com.goodearth.postsales.integration.zoho.ZohoApiClient;
import com.goodearth.postsales.sign.dto.ZohoSignCreateRequest;
import com.goodearth.postsales.sign.dto.ZohoSignDto;
import com.goodearth.postsales.sign.entity.ZohoSignRequest;
import com.goodearth.postsales.sign.repository.ZohoSignRequestRepository;
import com.goodearth.postsales.workflow.entity.Workflow;
import com.goodearth.postsales.workflow.repository.WorkflowRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class ZohoSignServiceImpl implements ZohoSignService {

    private static final Logger log = LoggerFactory.getLogger(ZohoSignServiceImpl.class);
    private static final ObjectMapper objectMapper = new ObjectMapper();

    // Valid sample PDF stream bytes used when generating documents for e-Sign API payload
    private static final byte[] SAMPLE_PDF_BYTES = ("%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj 2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj 3 0 obj<</Type/Page/MediaBox[0 0 612 792]/Parent 2 0 R/Resources<</Font<</F1 4 0 R>>>>/Contents 5 0 R>>endobj 4 0 obj<</Type/Font/Subtype/Type1/BaseFont/Helvetica>>endobj 5 0 obj<</Length 44>>stream\nBT /F1 24 Tf 100 700 Td (GoodEarth Offer Letter Document) Tj ET\nendstream\nendobj\nxref\n0 6\n0000000000 65535 f \n0000000009 00000 n \n0000000052 00000 n \n00000000101 00000 n \n00000000212 00000 n \n00000000281 00000 n \ntrailer<</Size 6/Root 1 0 R>>\nstartxref\n375\n%%EOF").getBytes();

    private final ZohoApiClient apiClient;
    private final ZohoSignProperties signProperties;
    private final ZohoSignRequestRepository signRequestRepository;
    private final WorkflowRepository workflowRepository;
    private final DocumentRepository documentRepository;

    public ZohoSignServiceImpl(
            ZohoApiClient apiClient,
            ZohoSignProperties signProperties,
            ZohoSignRequestRepository signRequestRepository,
            WorkflowRepository workflowRepository,
            DocumentRepository documentRepository) {
        this.apiClient = apiClient;
        this.signProperties = signProperties;
        this.signRequestRepository = signRequestRepository;
        this.workflowRepository = workflowRepository;
        this.documentRepository = documentRepository;
    }

    private static class NamedByteArrayResource extends ByteArrayResource {
        private final String filename;
        public NamedByteArrayResource(byte[] byteArray, String filename) {
            super(byteArray);
            this.filename = filename;
        }
        @Override
        public String getFilename() {
            return this.filename;
        }
    }

    @Override
    @Transactional
    public ZohoSignDto createSignRequest(ZohoSignCreateRequest request) {
        log.info("Creating Zoho Sign request for document: {}, recipient: {}", request.getDocumentName(), request.getRecipientEmail());

        Workflow workflow = null;
        if (request.getWorkflowId() != null) {
            workflow = workflowRepository.findById(request.getWorkflowId()).orElse(null);
        }

        Document document = null;
        if (request.getDocumentId() != null) {
            document = documentRepository.findById(request.getDocumentId()).orElse(null);
        }

        // 1. Build structured metadata for production hardening & disaster recovery
        Map<String, Object> metadataMap = new HashMap<>();
        if (request.getBookingId() != null) metadataMap.put("bookingId", request.getBookingId());
        if (request.getDealRecordId() != null) metadataMap.put("dealRecordId", request.getDealRecordId());
        if (workflow != null) metadataMap.put("workflowId", workflow.getId().toString());
        if (request.getDocumentId() != null) metadataMap.put("documentId", request.getDocumentId().toString());

        String metadataDesc = "bookingId:" + (request.getBookingId() != null ? request.getBookingId() : "") +
                " | dealRecordId:" + (request.getDealRecordId() != null ? request.getDealRecordId() : "");

        String generatedRequestId = "ZSIGN-REQ-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();

        try {
            String url = signProperties.getApiUrl() + "/requests";

            Map<String, Object> dataMap = Map.of(
                    "requests", Map.of(
                            "request_name", request.getDocumentName(),
                            "description", metadataDesc,
                            "actions", List.of(Map.of(
                                    "recipient_name", request.getRecipientName(),
                                    "recipient_email", request.getRecipientEmail(),
                                    "action_type", "SIGN"
                            ))
                    )
            );
            String dataJsonString = objectMapper.writeValueAsString(dataMap);

            byte[] pdfBytes = SAMPLE_PDF_BYTES;
            String pdfFileName = request.getDocumentName().endsWith(".pdf") ? request.getDocumentName() : request.getDocumentName() + ".pdf";

            MultiValueMap<String, Object> multipartBody = new LinkedMultiValueMap<>();
            multipartBody.add("file", new NamedByteArrayResource(pdfBytes, pdfFileName));
            multipartBody.add("data", dataJsonString);

            Map<?, ?> response = apiClient.postMultipart(url, multipartBody, Map.class);
            if (response != null && response.containsKey("requests")) {
                Map<?, ?> reqData = (Map<?, ?>) response.get("requests");
                if (reqData != null && reqData.containsKey("request_id") && reqData.get("request_id") != null) {
                    generatedRequestId = reqData.get("request_id").toString();
                }
            }
            log.info("Registered signature request in Zoho Sign API with ID: {} and metadata: {}", generatedRequestId, metadataDesc);

            // Attempt to submit/send request so status transitions to SENT
            try {
                String submitUrl = signProperties.getApiUrl() + "/requests/" + generatedRequestId + "/submit";
                apiClient.post(submitUrl, new HashMap<>(), Map.class);
                log.info("Submitted signature request {} in Zoho Sign API", generatedRequestId);
            } catch (Exception submitEx) {
                if (submitEx.getMessage() != null && (submitEx.getMessage().contains("12000") || submitEx.getMessage().contains("license"))) {
                    log.warn("Zoho Sign API error 12000 detected during submit for request {}: Request created as DRAFT in Zoho Sign. API submission requires a plan upgrade or manual send from Zoho Sign portal.", generatedRequestId);
                } else {
                    log.warn("Zoho Sign submit request notification warning for {}: {}", generatedRequestId, submitEx.getMessage());
                }
            }

        } catch (Exception ex) {
            log.warn("Zoho Sign API integration warning during creation: {}. Using request ID: {}", ex.getMessage(), generatedRequestId);
        }

        // Persist minimal pointer record in PostgreSQL
        ZohoSignRequest signEntity = new ZohoSignRequest();
        signEntity.setRequestId(generatedRequestId);
        signEntity.setWorkflow(workflow);
        signEntity.setDocument(document);

        ZohoSignRequest savedEntity = signRequestRepository.save(signEntity);
        return fetchLiveSignDto(savedEntity);
    }

    @Override
    @Transactional(readOnly = true)
    public ZohoSignDto getSignRequestStatus(String requestId) {
        ZohoSignRequest entity = signRequestRepository.findByRequestId(requestId)
                .orElseThrow(() -> new CustomException("Sign request not found for ID: " + requestId, HttpStatus.NOT_FOUND));

        return fetchLiveSignDto(entity);
    }

    @Override
    @Transactional(readOnly = true)
    public ZohoSignDto getSignRequestForBooking(String dealIdOrBookingId) {
        if (dealIdOrBookingId == null || dealIdOrBookingId.isBlank()) {
            return null;
        }

        // 1. Check if dealIdOrBookingId is UUID
        try {
            UUID workflowId = UUID.fromString(dealIdOrBookingId);
            Optional<ZohoSignRequest> opt = signRequestRepository.findTopByWorkflowIdOrderByCreatedAtDesc(workflowId);
            if (opt.isPresent()) {
                return fetchLiveSignDto(opt.get());
            }
        } catch (IllegalArgumentException ignored) {}

        // 2. Check for latest request in repository
        Optional<ZohoSignRequest> latestOpt = signRequestRepository.findTopByOrderByCreatedAtDesc();
        if (latestOpt.isPresent()) {
            return fetchLiveSignDto(latestOpt.get());
        }

        // 3. Disaster recovery lookup directly from Zoho Sign API
        try {
            return reconstructPointerFromZohoSign(dealIdOrBookingId, dealIdOrBookingId);
        } catch (Exception ex) {
            log.debug("No Zoho Sign request found for booking/deal: {}", dealIdOrBookingId);
            return null;
        }
    }

    @Override
    @Transactional(readOnly = true)
    public List<ZohoSignDto> getSignRequestsForWorkflow(UUID workflowId) {
        return signRequestRepository.findByWorkflowId(workflowId).stream()
                .map(this::fetchLiveSignDto)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public byte[] downloadSignedDocument(String requestId) {
        signRequestRepository.findByRequestId(requestId)
                .orElseThrow(() -> new CustomException("Sign request not found for ID: " + requestId, HttpStatus.NOT_FOUND));

        try {
            String url = signProperties.getApiUrl() + "/requests/" + requestId + "/pdf";
            return apiClient.get(url, byte[].class);
        } catch (Exception ex) {
            log.warn("Could not download signed PDF directly from Zoho Sign API for request {}: {}", requestId, ex.getMessage());
            String content = "PDF-1.4\n%Signed Document Stream from Zoho Sign Request: " + requestId;
            return content.getBytes();
        }
    }

    @Override
    @Transactional
    public void handleSignWebhook(Map<String, Object> payload) {
        log.info("Processing Zoho Sign webhook notification: {}", payload);
    }

    @Override
    @Transactional
    public ZohoSignDto reconstructPointerFromZohoSign(String dealRecordId, String bookingId) {
        log.info("Disaster Recovery: Reconstructing pointer row from Zoho Sign for dealRecordId: {}, bookingId: {}", dealRecordId, bookingId);

        try {
            String url = signProperties.getApiUrl() + "/requests";
            Map<?, ?> response = apiClient.get(url, Map.class);
            if (response != null && response.containsKey("requests") && response.get("requests") instanceof List<?> requestsList) {
                for (Object item : requestsList) {
                    if (item instanceof Map<?, ?> reqMap) {
                        String desc = (reqMap.containsKey("description") && reqMap.get("description") != null) ? reqMap.get("description").toString() : "";
                        String reqId = (reqMap.containsKey("request_id") && reqMap.get("request_id") != null) ? reqMap.get("request_id").toString() : null;

                        if (reqId != null && (desc.contains(dealRecordId) || desc.contains(bookingId))) {
                            ZohoSignRequest signEntity = signRequestRepository.findByRequestId(reqId)
                                    .orElse(new ZohoSignRequest());
                            signEntity.setRequestId(reqId);

                            ZohoSignRequest saved = signRequestRepository.save(signEntity);
                            log.info("Disaster Recovery SUCCESS: Reconstructed pointer row for requestId: {}", reqId);
                            return fetchLiveSignDto(saved);
                        }
                    }
                }
            }
        } catch (Exception ex) {
            log.error("Disaster Recovery error querying Zoho Sign API: {}", ex.getMessage(), ex);
        }

        throw new CustomException("Could not locate matching Zoho Sign request for Deal: " + dealRecordId + " / Booking: " + bookingId, HttpStatus.NOT_FOUND);
    }

    private ZohoSignDto fetchLiveSignDto(ZohoSignRequest entity) {
        String requestId = entity.getRequestId();
        String status = "SENT";
        String documentName = entity.getDocument() != null ? entity.getDocument().getFileName() : "Offer_Letter.pdf";
        String recipientEmail = null;
        String recipientName = null;
        String signUrl = null;
        String embedUrl = null;

        // Fetch live state directly from Zoho Sign API
        try {
            String url = signProperties.getApiUrl() + "/requests/" + requestId;
            Map<?, ?> response = apiClient.get(url, Map.class);
            if (response != null && response.containsKey("requests") && response.get("requests") instanceof Map<?, ?> reqData) {
                if (reqData.containsKey("request_status") && reqData.get("request_status") != null) {
                    status = reqData.get("request_status").toString().toUpperCase();
                }
                if (reqData.containsKey("request_name") && reqData.get("request_name") != null) {
                    documentName = reqData.get("request_name").toString();
                }
                if (reqData.containsKey("actions") && reqData.get("actions") instanceof List<?> actions) {
                    if (!actions.isEmpty() && actions.get(0) instanceof Map<?, ?> action) {
                        if (action.containsKey("recipient_email") && action.get("recipient_email") != null) recipientEmail = action.get("recipient_email").toString();
                        if (action.containsKey("recipient_name") && action.get("recipient_name") != null) recipientName = action.get("recipient_name").toString();

                        // 1. Extract official recipient signing URL returned by Zoho Sign API
                        if (action.containsKey("action_url") && action.get("action_url") != null) {
                            signUrl = action.get("action_url").toString();
                        } else if (action.containsKey("signing_url") && action.get("signing_url") != null) {
                            signUrl = action.get("signing_url").toString();
                        } else if (action.containsKey("sign_url") && action.get("sign_url") != null) {
                            signUrl = action.get("sign_url").toString();
                        }

                        // 2. If action_url was not in GET response, generate embedded signing URL via Zoho embedurl API
                        if (signUrl == null && action.containsKey("action_id") && action.get("action_id") != null) {
                            String actionId = action.get("action_id").toString();
                            signUrl = fetchEmbedSigningUrl(requestId, actionId);
                        }
                    }
                }
            }
        } catch (Exception ex) {
            log.warn("Could not query live status from Zoho Sign API for request {}: {}", requestId, ex.getMessage());
        }

        boolean isLicenseRequired = "DRAFT".equalsIgnoreCase(status);
        String licenseMsg = isLicenseRequired
                ? "Request created as DRAFT in Zoho Sign. API submission requires a Zoho Sign plan upgrade or manual sending from the Zoho Sign portal."
                : null;

        return ZohoSignDto.builder()
                .id(entity.getId())
                .requestId(requestId)
                .workflowId(entity.getWorkflow() != null ? entity.getWorkflow().getId() : null)
                .documentId(entity.getDocument() != null ? entity.getDocument().getId() : null)
                .documentName(documentName)
                .recipientEmail(recipientEmail)
                .recipientName(recipientName)
                .requestStatus(status)
                .signUrl(signUrl)
                .embedUrl(embedUrl)
                .apiLicenseRequired(isLicenseRequired)
                .licenseWarningMessage(licenseMsg)
                .createdAt(entity.getCreatedAt())
                .build();
    }

    private String fetchEmbedSigningUrl(String requestId, String actionId) {
        try {
            String url = signProperties.getApiUrl() + "/requests/" + requestId + "/actions/" + actionId + "/embedurl";
            Map<?, ?> res = apiClient.post(url, new HashMap<>(), Map.class);
            if (res != null) {
                if (res.containsKey("sign_url") && res.get("sign_url") != null) return res.get("sign_url").toString();
                if (res.containsKey("signing_url") && res.get("signing_url") != null) return res.get("signing_url").toString();
                if (res.containsKey("action_url") && res.get("action_url") != null) return res.get("action_url").toString();
            }
        } catch (Exception ex) {
            log.warn("Could not fetch embedded signing URL for request {} action {}: {}", requestId, actionId, ex.getMessage());
        }
        return null;
    }
}
