package com.goodearth.postsales.client.service;

import com.goodearth.postsales.buyer.entity.Buyer;
import com.goodearth.postsales.buyer.entity.FamilyMember;
import com.goodearth.postsales.buyer.repository.FamilyMemberRepository;
import com.goodearth.postsales.client.dto.FamilyMemberDto;
import com.goodearth.postsales.client.mapper.ClientPortalMapper;
import com.goodearth.postsales.common.exception.CustomException;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@Transactional
public class FamilyMemberServiceImpl implements FamilyMemberService {

    private final ClientPortalServiceHelper helper;
    private final ClientPortalMapper mapper;
    private final FamilyMemberRepository familyMemberRepository;

    public FamilyMemberServiceImpl(
            ClientPortalServiceHelper helper,
            ClientPortalMapper mapper,
            FamilyMemberRepository familyMemberRepository) {
        this.helper = helper;
        this.mapper = mapper;
        this.familyMemberRepository = familyMemberRepository;
    }

    @Override
    @Transactional(readOnly = true)
    public List<FamilyMemberDto> getFamilyMembers(UserDetails userDetails) {
        Buyer buyer = helper.getAuthenticatedBuyer(userDetails);
        List<FamilyMember> members = familyMemberRepository.findByBuyerId(buyer.getId());
        return members.stream().map(mapper::toFamilyMemberDto).collect(Collectors.toList());
    }

    @Override
    @Transactional
    public FamilyMemberDto addFamilyMember(UserDetails userDetails, FamilyMemberDto newMember) {
        Buyer buyer = helper.getAuthenticatedBuyer(userDetails);

        long count = familyMemberRepository.countByBuyerId(buyer.getId());
        if (count >= 5) {
            throw new CustomException("Maximum limit of 5 family members reached for this property.", HttpStatus.BAD_REQUEST);
        }

        if (newMember.getName() == null || newMember.getName().trim().isEmpty()) {
            throw new CustomException("Family member name is required.", HttpStatus.BAD_REQUEST);
        }

        if (newMember.getRelation() == null || newMember.getRelation().trim().isEmpty()) {
            throw new CustomException("Relationship is required.", HttpStatus.BAD_REQUEST);
        }

        FamilyMember member = mapper.toFamilyMember(newMember, buyer);
        FamilyMember saved = familyMemberRepository.save(member);
        return mapper.toFamilyMemberDto(saved);
    }

    @Override
    @Transactional
    public FamilyMemberDto updateFamilyMember(UserDetails userDetails, UUID id, FamilyMemberDto dto) {
        Buyer buyer = helper.getAuthenticatedBuyer(userDetails);
        FamilyMember member = familyMemberRepository.findById(id)
                .orElseThrow(() -> new CustomException("Family member not found.", HttpStatus.NOT_FOUND));

        if (!member.getBuyer().getId().equals(buyer.getId())) {
            throw new CustomException("Family member not found.", HttpStatus.NOT_FOUND);
        }

        if (dto.getName() != null && !dto.getName().trim().isEmpty()) {
            member.setName(dto.getName().trim());
        }
        if (dto.getRelation() != null && !dto.getRelation().trim().isEmpty()) {
            member.setRelation(dto.getRelation().trim());
        }
        if (dto.getEmail() != null) {
            member.setEmail(dto.getEmail().trim());
        }
        if (dto.getPhone() != null) {
            member.setPhone(dto.getPhone().trim());
        }

        FamilyMember updated = familyMemberRepository.save(member);
        return mapper.toFamilyMemberDto(updated);
    }

    @Override
    @Transactional
    public void removeFamilyMember(UserDetails userDetails, UUID id) {
        Buyer buyer = helper.getAuthenticatedBuyer(userDetails);
        FamilyMember member = familyMemberRepository.findById(id)
                .orElseThrow(() -> new CustomException("Family member not found.", HttpStatus.NOT_FOUND));

        if (!member.getBuyer().getId().equals(buyer.getId())) {
            throw new CustomException("Family member not found.", HttpStatus.NOT_FOUND);
        }

        familyMemberRepository.delete(member);
    }
}
