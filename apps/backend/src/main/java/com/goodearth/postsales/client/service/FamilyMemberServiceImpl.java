package com.goodearth.postsales.client.service;

import com.goodearth.postsales.buyer.entity.Buyer;
import com.goodearth.postsales.buyer.entity.FamilyMember;
import com.goodearth.postsales.buyer.repository.FamilyMemberRepository;
import com.goodearth.postsales.client.dto.FamilyMemberDto;
import com.goodearth.postsales.common.exception.CustomException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@Transactional
public class FamilyMemberServiceImpl implements FamilyMemberService {

    private static final Logger log = LoggerFactory.getLogger(FamilyMemberServiceImpl.class);
    private static final int MAX_FAMILY_MEMBERS = 5;
    private static final List<String> DEFAULT_PERMISSIONS = List.of(
            "VIEW_MY_HOME",
            "VIEW_FLOOR_PLANS",
            "DOWNLOAD_FLOOR_PLANS",
            "VIEW_DOCUMENTS",
            "DOWNLOAD_DOCUMENTS",
            "VIEW_CONSTRUCTION_UPDATES",
            "VIEW_PAYMENTS",
            "CONTACT_SUPPORT"
    );

    private final ClientPortalServiceHelper helper;
    private final FamilyMemberRepository familyMemberRepository;

    public FamilyMemberServiceImpl(
            ClientPortalServiceHelper helper,
            FamilyMemberRepository familyMemberRepository) {
        this.helper = helper;
        this.familyMemberRepository = familyMemberRepository;
    }

    @Override
    @Transactional(readOnly = true)
    public List<FamilyMemberDto> getFamilyMembers(UserDetails userDetails) {
        Buyer buyer = helper.getAuthenticatedBuyer(userDetails);
        List<FamilyMember> members = familyMemberRepository.findByBuyerId(buyer.getId());
        return members.stream().map(this::toDto).collect(Collectors.toList());
    }

    @Override
    public FamilyMemberDto addFamilyMember(UserDetails userDetails, FamilyMemberDto dto) {
        Buyer buyer = helper.getAuthenticatedBuyer(userDetails);
        List<FamilyMember> existing = familyMemberRepository.findByBuyerId(buyer.getId());

        // Rule 1: Max 5 family members validation
        if (existing.size() >= MAX_FAMILY_MEMBERS) {
            throw new CustomException("Maximum limit of " + MAX_FAMILY_MEMBERS + " family members reached for this property unit.", HttpStatus.BAD_REQUEST);
        }

        // Rule 2 & 3: Prevent duplicate email & phone
        if (dto.getEmail() != null && !dto.getEmail().isBlank()) {
            String trimmedEmail = dto.getEmail().trim().toLowerCase();
            if (trimmedEmail.equalsIgnoreCase(buyer.getEmail())) {
                throw new CustomException("Cannot add Primary Homeowner email as a secondary family member.", HttpStatus.BAD_REQUEST);
            }
            boolean dupEmail = existing.stream().anyMatch(m -> m.getEmail() != null && m.getEmail().trim().equalsIgnoreCase(trimmedEmail));
            if (dupEmail) {
                throw new CustomException("A family member with this email address already exists.", HttpStatus.BAD_REQUEST);
            }
        }

        if (dto.getPhone() != null && !dto.getPhone().isBlank()) {
            String trimmedPhone = dto.getPhone().trim();
            boolean dupPhone = existing.stream().anyMatch(m -> m.getPhone() != null && m.getPhone().trim().equals(trimmedPhone));
            if (dupPhone) {
                throw new CustomException("A family member with this phone number already exists.", HttpStatus.BAD_REQUEST);
            }
        }

        FamilyMember member = new FamilyMember();
        member.setBuyer(buyer);
        member.setName(dto.getName());
        member.setRelation(dto.getRelation());
        member.setEmail(dto.getEmail());
        member.setPhone(dto.getPhone());
        member.setRole(dto.getRole() != null ? dto.getRole() : "FAMILY_MEMBER");
        member.setStatus("ACTIVE");
        member.setInvitationStatus("INVITED");
        member.setNotes(dto.getNotes());
        
        List<String> perms = dto.getPermissions() != null && !dto.getPermissions().isEmpty() ? dto.getPermissions() : DEFAULT_PERMISSIONS;
        member.setPermissions(String.join(",", perms));

        FamilyMember saved = familyMemberRepository.save(member);
        log.info("Successfully created family member record ID: {} for Buyer: {}", saved.getId(), buyer.getEmail());
        return toDto(saved);
    }

    @Override
    public FamilyMemberDto updateFamilyMember(UserDetails userDetails, UUID id, FamilyMemberDto dto) {
        Buyer buyer = helper.getAuthenticatedBuyer(userDetails);
        FamilyMember member = familyMemberRepository.findById(id)
                .orElseThrow(() -> new CustomException("Family member not found with ID: " + id, HttpStatus.NOT_FOUND));

        if (!member.getBuyer().getId().equals(buyer.getId())) {
            throw new CustomException("Unauthorized access to update family member.", HttpStatus.FORBIDDEN);
        }

        member.setName(dto.getName());
        member.setRelation(dto.getRelation());
        member.setEmail(dto.getEmail());
        member.setPhone(dto.getPhone());
        if (dto.getRole() != null) member.setRole(dto.getRole());
        if (dto.getStatus() != null) member.setStatus(dto.getStatus());
        if (dto.getNotes() != null) member.setNotes(dto.getNotes());
        if (dto.getPermissions() != null && !dto.getPermissions().isEmpty()) {
            member.setPermissions(String.join(",", dto.getPermissions()));
        }

        FamilyMember updated = familyMemberRepository.save(member);
        log.info("Successfully updated family member record ID: {}", updated.getId());
        return toDto(updated);
    }

    @Override
    public void removeFamilyMember(UserDetails userDetails, UUID id) {
        Buyer buyer = helper.getAuthenticatedBuyer(userDetails);
        FamilyMember member = familyMemberRepository.findById(id)
                .orElseThrow(() -> new CustomException("Family member not found with ID: " + id, HttpStatus.NOT_FOUND));

        if (!member.getBuyer().getId().equals(buyer.getId())) {
            throw new CustomException("Unauthorized access to delete family member.", HttpStatus.FORBIDDEN);
        }

        familyMemberRepository.delete(member);
        log.info("Successfully removed family member record ID: {}", id);
    }

    @Override
    public FamilyMemberDto sendInvitation(UserDetails userDetails, UUID id) {
        Buyer buyer = helper.getAuthenticatedBuyer(userDetails);
        FamilyMember member = familyMemberRepository.findById(id)
                .orElseThrow(() -> new CustomException("Family member not found with ID: " + id, HttpStatus.NOT_FOUND));

        if (!member.getBuyer().getId().equals(buyer.getId())) {
            throw new CustomException("Unauthorized access to send invitation.", HttpStatus.FORBIDDEN);
        }

        member.setInvitationStatus("INVITED");
        FamilyMember updated = familyMemberRepository.save(member);
        log.info("Re-sent email invitation to family member ID: {}, Email: {}", id, member.getEmail());
        return toDto(updated);
    }

    @Override
    @Transactional(readOnly = true)
    public List<String> getPermissions(UserDetails userDetails, UUID id) {
        Buyer buyer = helper.getAuthenticatedBuyer(userDetails);
        FamilyMember member = familyMemberRepository.findById(id)
                .orElseThrow(() -> new CustomException("Family member not found with ID: " + id, HttpStatus.NOT_FOUND));

        if (!member.getBuyer().getId().equals(buyer.getId())) {
            throw new CustomException("Unauthorized access to read permissions.", HttpStatus.FORBIDDEN);
        }

        return parsePermissions(member.getPermissions());
    }

    @Override
    public FamilyMemberDto updatePermissions(UserDetails userDetails, UUID id, List<String> permissions) {
        Buyer buyer = helper.getAuthenticatedBuyer(userDetails);
        FamilyMember member = familyMemberRepository.findById(id)
                .orElseThrow(() -> new CustomException("Family member not found with ID: " + id, HttpStatus.NOT_FOUND));

        if (!member.getBuyer().getId().equals(buyer.getId())) {
            throw new CustomException("Unauthorized access to update permissions.", HttpStatus.FORBIDDEN);
        }

        member.setPermissions(String.join(",", permissions));
        FamilyMember updated = familyMemberRepository.save(member);
        return toDto(updated);
    }

    private FamilyMemberDto toDto(FamilyMember m) {
        FamilyMemberDto dto = new FamilyMemberDto();
        dto.setId(m.getId());
        dto.setName(m.getName());
        dto.setRelation(m.getRelation());
        dto.setEmail(m.getEmail());
        dto.setPhone(m.getPhone());
        dto.setRole(m.getRole() != null ? m.getRole() : "FAMILY_MEMBER");
        dto.setStatus(m.getStatus() != null ? m.getStatus() : "ACTIVE");
        dto.setInvitationStatus(m.getInvitationStatus() != null ? m.getInvitationStatus() : "ACTIVATED");
        dto.setCreatedDate(m.getCreatedAt());
        dto.setLastLogin(m.getLastLogin());
        dto.setNotes(m.getNotes());
        dto.setPermissions(parsePermissions(m.getPermissions()));
        return dto;
    }

    private List<String> parsePermissions(String permStr) {
        if (permStr == null || permStr.isBlank()) {
            return DEFAULT_PERMISSIONS;
        }
        return Arrays.stream(permStr.split(","))
                .map(String::trim)
                .filter(s -> !s.isBlank())
                .collect(Collectors.toList());
    }
}
