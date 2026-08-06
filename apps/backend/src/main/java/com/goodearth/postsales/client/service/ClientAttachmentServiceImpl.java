package com.goodearth.postsales.client.service;

import com.goodearth.postsales.buyer.entity.Buyer;
import com.goodearth.postsales.client.dto.ClientAttachmentDto;
import com.goodearth.postsales.common.exception.CustomException;
import com.goodearth.postsales.integration.zoho.ZohoApiClient;
import com.goodearth.postsales.integration.zoho.ZohoProperties;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@Transactional(readOnly = true)
public class ClientAttachmentServiceImpl implements ClientAttachmentService {

    private static final Logger log = LoggerFactory.getLogger(ClientAttachmentServiceImpl.class);

    private final ClientPortalServiceHelper helper;
    private final ZohoApiClient apiClient;
    private final ZohoProperties properties;

    public ClientAttachmentServiceImpl(
            ClientPortalServiceHelper helper,
            ZohoApiClient apiClient,
            ZohoProperties properties) {
        this.helper = helper;
        this.apiClient = apiClient;
        this.properties = properties;
    }

    @Override
    @Cacheable(value = "clientAttachmentMetadata", key = "#userDetails.username", unless = "#result == null || #result.isEmpty()")
    public List<ClientAttachmentDto> getAttachments(UserDetails userDetails, String category, String search, String sort) {
        Buyer buyer = helper.getAuthenticatedBuyer(userDetails);
        String zohoDealId = buyer.getZohoDealId();

        if (zohoDealId == null || zohoDealId.isBlank()) {
            log.warn("No Zoho Deal ID linked for buyer: {}", buyer.getEmail());
            return new ArrayList<>();
        }

        List<ClientAttachmentDto> rawList = fetchAttachmentsFromZoho(zohoDealId);

        // 1. Filter by category if provided
        if (category != null && !category.isBlank() && !"ALL".equalsIgnoreCase(category)) {
            rawList = rawList.stream()
                    .filter(a -> category.equalsIgnoreCase(a.getCategory()))
                    .collect(Collectors.toList());
        }

        // 2. Filter by search query (filename, category, fileType)
        if (search != null && !search.isBlank()) {
            String q = search.trim().toLowerCase();
            rawList = rawList.stream()
                    .filter(a -> a.getFileName().toLowerCase().contains(q)
                            || a.getCategory().toLowerCase().contains(q)
                            || a.getFileType().toLowerCase().contains(q))
                    .collect(Collectors.toList());
        }

        // 3. Sort
        if ("OLDEST".equalsIgnoreCase(sort)) {
            rawList.sort(Comparator.comparing(ClientAttachmentDto::getUploadedTime));
        } else if ("A-Z".equalsIgnoreCase(sort)) {
            rawList.sort(Comparator.comparing(ClientAttachmentDto::getFileName, String.CASE_INSENSITIVE_ORDER));
        } else {
            // Default: NEWEST
            rawList.sort(Comparator.comparing(ClientAttachmentDto::getUploadedTime).reversed());
        }

        log.info("Successfully retrieved {} attachment metadata items for buyer: {}", rawList.size(), buyer.getEmail());
        return rawList;
    }

    @Override
    public ClientAttachmentDto getAttachmentById(UserDetails userDetails, String attachmentId) {
        List<ClientAttachmentDto> attachments = getAttachments(userDetails, null, null, null);
        return attachments.stream()
                .filter(a -> attachmentId.equals(a.getAttachmentId()) || attachmentId.equals(a.getId().toString()))
                .findFirst()
                .orElseThrow(() -> new CustomException("Document attachment not found with ID: " + attachmentId, HttpStatus.NOT_FOUND));
    }

    @Override
    public byte[] streamAttachmentContent(UserDetails userDetails, String attachmentId) {
        Buyer buyer = helper.getAuthenticatedBuyer(userDetails);
        String zohoDealId = buyer.getZohoDealId();

        if (zohoDealId == null || zohoDealId.isBlank()) {
            throw new CustomException("No active Zoho Deal linked to buyer session", HttpStatus.FORBIDDEN);
        }

        String crmDownloadUrl = properties.getCrmApiUrl() + "/Deals/" + zohoDealId + "/Attachments/" + attachmentId;
        log.info("Streaming preview binary for attachment ID: {} under Deal: {}", attachmentId, zohoDealId);
        return apiClient.downloadCrmAttachment(crmDownloadUrl);
    }

    @Override
    public byte[] downloadAttachmentContent(UserDetails userDetails, String attachmentId) {
        Buyer buyer = helper.getAuthenticatedBuyer(userDetails);
        String zohoDealId = buyer.getZohoDealId();

        if (zohoDealId == null || zohoDealId.isBlank()) {
            throw new CustomException("No active Zoho Deal linked to buyer session", HttpStatus.FORBIDDEN);
        }

        String crmDownloadUrl = properties.getCrmApiUrl() + "/Deals/" + zohoDealId + "/Attachments/" + attachmentId;
        log.info("Downloading file attachment binary for ID: {} under Deal: {}", attachmentId, zohoDealId);
        return apiClient.downloadCrmAttachment(crmDownloadUrl);
    }

    private List<ClientAttachmentDto> fetchAttachmentsFromZoho(String zohoDealId) {
        List<ClientAttachmentDto> list = new ArrayList<>();
        try {
            String crmAttachmentsUrl = properties.getCrmApiUrl() + "/Deals/" + zohoDealId + "/Attachments";
            log.info("Querying Zoho CRM Deal Attachments from URL: {}", crmAttachmentsUrl);

            @SuppressWarnings("unchecked")
            Map<String, Object> crmResponse = apiClient.get(crmAttachmentsUrl, Map.class);

            if (crmResponse != null && crmResponse.containsKey("data")) {
                @SuppressWarnings("unchecked")
                List<Map<String, Object>> attachmentsData = (List<Map<String, Object>>) crmResponse.get("data");

                if (attachmentsData != null && !attachmentsData.isEmpty()) {
                    int versionCounter = attachmentsData.size();

                    for (Map<String, Object> att : attachmentsData) {
                        String attachmentId = (String) att.get("id");
                        String fileName = (String) att.get("File_Name");
                        if (fileName == null) fileName = "Document.pdf";

                        String createdTime = (String) att.get("Created_Time");
                        String sizeStr = (String) att.get("Size");
                        long fileSize = 1048576L;
                        if (sizeStr != null) {
                            try {
                                fileSize = Long.parseLong(sizeStr);
                            } catch (NumberFormatException ignored) {}
                        }

                        String uploadedBy = "GoodEarth CRM Team";
                        if (att.get("Created_By") instanceof Map) {
                            @SuppressWarnings("unchecked")
                            Map<String, Object> createdByMap = (Map<String, Object>) att.get("Created_By");
                            if (createdByMap.containsKey("name")) {
                                uploadedBy = (String) createdByMap.get("name");
                            }
                        }

                        String category = categorizeDocument(fileName);
                        String lowerName = fileName.toLowerCase();

                        String mimeType = "application/pdf";
                        String fileType = "PDF";
                        boolean isPreviewable = false;

                        if (lowerName.endsWith(".pdf")) {
                            mimeType = "application/pdf";
                            fileType = "PDF Document";
                            isPreviewable = true;
                        } else if (lowerName.endsWith(".png")) {
                            mimeType = "image/png";
                            fileType = "PNG Image";
                            isPreviewable = true;
                        } else if (lowerName.endsWith(".jpg") || lowerName.endsWith(".jpeg")) {
                            mimeType = "image/jpeg";
                            fileType = "JPEG Image";
                            isPreviewable = true;
                        } else if (lowerName.endsWith(".doc") || lowerName.endsWith(".docx")) {
                            mimeType = "application/msword";
                            fileType = "Word Document";
                        } else if (lowerName.endsWith(".xls") || lowerName.endsWith(".xlsx")) {
                            mimeType = "application/vnd.ms-excel";
                            fileType = "Excel Spreadsheet";
                        } else if (lowerName.endsWith(".ppt") || lowerName.endsWith(".pptx")) {
                            mimeType = "application/vnd.ms-powerpoint";
                            fileType = "Presentation";
                        } else if (lowerName.endsWith(".zip") || lowerName.endsWith(".rar")) {
                            mimeType = "application/zip";
                            fileType = "Archive";
                        }

                        String previewUrl = "/api/v1/client/attachments/" + attachmentId + "/content";
                        String downloadUrl = "/api/v1/client/attachments/" + attachmentId + "/download";

                        ClientAttachmentDto dto = new ClientAttachmentDto();
                        dto.setId(UUID.nameUUIDFromBytes(attachmentId.getBytes()));
                        dto.setAttachmentId(attachmentId);
                        dto.setFileName(fileName);
                        dto.setCategory(category);
                        dto.setVersion(versionCounter--);
                        dto.setMimeType(mimeType);
                        dto.setFileType(fileType);
                        dto.setFileSize(fileSize);
                        dto.setPreviewable(isPreviewable);
                        dto.setPreviewUrl(previewUrl);
                        dto.setDownloadUrl(downloadUrl);
                        dto.setUploadedBy(uploadedBy);
                        dto.setUploadedTime(createdTime != null ? createdTime : LocalDateTime.now().toString());
                        dto.setUploadedAt(LocalDateTime.now());
                        dto.setRevisions(new ArrayList<>());

                        list.add(dto);
                    }
                }
            }
        } catch (Exception ex) {
            log.warn("Could not query Zoho CRM Deal attachments for Deal ID {}: {}", zohoDealId, ex.getMessage());
        }
        return list;
    }

    private String categorizeDocument(String fileName) {
        if (fileName == null) return "OTHER";
        String upper = fileName.toUpperCase();

        // 1. Filename Prefix Rules
        if (upper.startsWith("AGR_")) return "AGREEMENT";
        if (upper.startsWith("LEG_")) return "LEGAL";
        if (upper.startsWith("PAY_")) return "PAYMENT";
        if (upper.startsWith("WAR_")) return "WARRANTY";
        if (upper.startsWith("PLAN_")) return "PLAN";
        if (upper.startsWith("OTHER_")) return "OTHER";

        // 2. Keyword Matching Rules
        String lower = fileName.toLowerCase();
        if (lower.contains("agreement") || lower.contains("sale") || lower.contains("allotment") || lower.contains("mou") || lower.contains("contract")) {
            return "AGREEMENT";
        }
        if (lower.contains("legal") || lower.contains("rera") || lower.contains("khata") || lower.contains("noc") || lower.contains("approval") || lower.contains("deed") || lower.contains("title")) {
            return "LEGAL";
        }
        if (lower.contains("invoice") || lower.contains("receipt") || lower.contains("payment") || lower.contains("demand") || lower.contains("tax") || lower.contains("bill") || lower.contains("cost_sheet")) {
            return "PAYMENT";
        }
        if (lower.contains("warranty") || lower.contains("manual") || lower.contains("certificate") || lower.contains("brochure") || lower.contains("handover")) {
            return "WARRANTY";
        }
        if (lower.contains("plan") || lower.contains("drawing") || lower.contains("layout") || lower.contains("floor") || lower.contains("elevation") || lower.contains("architectural")) {
            return "PLAN";
        }

        // 3. Fallback
        return "OTHER";
    }
}
