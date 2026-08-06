package com.goodearth.postsales.client.service;

import com.goodearth.postsales.client.dto.FamilyMemberDto;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.List;
import java.util.UUID;

public interface FamilyMemberService {
    List<FamilyMemberDto> getFamilyMembers(UserDetails userDetails);
    FamilyMemberDto addFamilyMember(UserDetails userDetails, FamilyMemberDto dto);
    FamilyMemberDto updateFamilyMember(UserDetails userDetails, UUID id, FamilyMemberDto dto);
    void removeFamilyMember(UserDetails userDetails, UUID id);
    FamilyMemberDto sendInvitation(UserDetails userDetails, UUID id);
    List<String> getPermissions(UserDetails userDetails, UUID id);
    FamilyMemberDto updatePermissions(UserDetails userDetails, UUID id, List<String> permissions);
}
