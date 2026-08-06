package com.goodearth.postsales.client.mapper;

import com.goodearth.postsales.buyer.entity.Buyer;
import com.goodearth.postsales.changerequest.dto.ChangeRequestDto;
import com.goodearth.postsales.client.dto.*;
import com.goodearth.postsales.document.dto.DocumentDto;
import com.goodearth.postsales.project.entity.Project;
import com.goodearth.postsales.stage.entity.Stage;
import com.goodearth.postsales.workdrive.dto.WorkDriveFileVersionDto;
import com.goodearth.postsales.workflow.entity.Workflow;
import org.springframework.stereotype.Component;

@Component
public class ClientPortalMapper {

    public ClientBuyerSummaryDto toBuyerSummary(Buyer buyer) {
        if (buyer == null) {
            return null;
        }
        return new ClientBuyerSummaryDto(
                buyer.getId(),
                buyer.getFullName(),
                buyer.getEmail(),
                buyer.getPhone()
        );
    }

    public ClientProjectSummaryDto toProjectSummary(Project project) {
        if (project == null) {
            return null;
        }
        return new ClientProjectSummaryDto(
                project.getId(),
                project.getProjectName(),
                project.getProjectCode(),
                project.getLocation()
        );
    }

    public ClientWorkflowSummaryDto toWorkflowSummary(Workflow workflow) {
        if (workflow == null) {
            return null;
        }
        return new ClientWorkflowSummaryDto(
                workflow.getId(),
                workflow.getStatus() != null ? workflow.getStatus().name() : null,
                workflow.getStartedAt()
        );
    }

    public ClientStageSummaryDto toStageSummary(Stage stage) {
        if (stage == null) {
            return null;
        }
        return new ClientStageSummaryDto(
                stage.getId(),
                stage.getCode(),
                stage.getName(),
                stage.getDescription()
        );
    }

    public ClientDocumentSummaryDto toDocumentSummary(DocumentDto doc) {
        if (doc == null) {
            return null;
        }
        return new ClientDocumentSummaryDto(
                doc.getId(),
                doc.getFileName(),
                doc.getDocumentType() != null ? doc.getDocumentType().name() : null,
                doc.getUploadedAt(),
                doc.getFileSize(),
                doc.getUploadedBy(),
                doc.getStatus() != null ? doc.getStatus().name() : null
        );
    }

    public ClientDrawingSummaryDto toDrawingSummary(WorkDriveFileVersionDto version) {
        if (version == null) {
            return null;
        }
        ClientDrawingSummaryDto dto = new ClientDrawingSummaryDto();
        dto.setId(version.getId());
        dto.setFileName(version.getFileName());
        dto.setVersion(version.getVersion());
        dto.setMimeType(version.getMimeType());
        dto.setPreviewUrl(version.getPreviewUrl());
        dto.setDownloadUrl(version.getDownloadUrl());
        dto.setUploadedBy(version.getUploadedBy());
        dto.setUploadedAt(version.getUploadedAt());
        return dto;
    }

    public ClientChangeRequestSummaryDto toChangeRequestSummary(ChangeRequestDto cr) {
        if (cr == null) {
            return null;
        }
        return new ClientChangeRequestSummaryDto(
                cr.getId(),
                cr.getAnnotationId(),
                cr.getStatus() != null ? cr.getStatus().name() : null,
                cr.getPriority() != null ? cr.getPriority().name() : null,
                cr.getEstimatedCost(),
                cr.getEstimatedCompletionDate(),
                cr.getRemarks(),
                cr.getCreatedAt()
        );
    }

    public FamilyMemberDto toFamilyMemberDto(com.goodearth.postsales.buyer.entity.FamilyMember member) {
        if (member == null) {
            return null;
        }
        FamilyMemberDto dto = new FamilyMemberDto();
        dto.setId(member.getId());
        dto.setName(member.getName());
        dto.setRelation(member.getRelation());
        dto.setEmail(member.getEmail());
        dto.setPhone(member.getPhone());
        dto.setRole(member.getRole() != null ? member.getRole() : "FAMILY_MEMBER");
        dto.setStatus(member.getStatus() != null ? member.getStatus() : "ACTIVE");
        dto.setInvitationStatus(member.getInvitationStatus() != null ? member.getInvitationStatus() : "ACTIVATED");
        dto.setCreatedDate(member.getCreatedAt());
        dto.setLastLogin(member.getLastLogin());
        dto.setNotes(member.getNotes());
        if (member.getPermissions() != null && !member.getPermissions().isBlank()) {
            dto.setPermissions(java.util.Arrays.asList(member.getPermissions().split(",")));
        }
        return dto;
    }

    public com.goodearth.postsales.buyer.entity.FamilyMember toFamilyMember(FamilyMemberDto dto, Buyer buyer) {
        if (dto == null) {
            return null;
        }
        com.goodearth.postsales.buyer.entity.FamilyMember member = new com.goodearth.postsales.buyer.entity.FamilyMember();
        member.setId(dto.getId());
        member.setName(dto.getName());
        member.setRelation(dto.getRelation());
        member.setEmail(dto.getEmail());
        member.setPhone(dto.getPhone());
        if (dto.getRole() != null) member.setRole(dto.getRole());
        if (dto.getStatus() != null) member.setStatus(dto.getStatus());
        if (dto.getInvitationStatus() != null) member.setInvitationStatus(dto.getInvitationStatus());
        if (dto.getNotes() != null) member.setNotes(dto.getNotes());
        if (dto.getPermissions() != null && !dto.getPermissions().isEmpty()) {
            member.setPermissions(String.join(",", dto.getPermissions()));
        }
        member.setBuyer(buyer);
        return member;
    }
}

