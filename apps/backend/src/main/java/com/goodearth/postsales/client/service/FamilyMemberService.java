package com.goodearth.postsales.client.service;

import com.goodearth.postsales.client.dto.FamilyMemberDto;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.List;
import java.util.UUID;

public interface FamilyMemberService {
    List<FamilyMemberDto> getFamilyMembers(UserDetails userDetails);
    FamilyMemberDto addFamilyMember(UserDetails userDetails, FamilyMemberDto newMember);
    void removeFamilyMember(UserDetails userDetails, UUID id);
}
