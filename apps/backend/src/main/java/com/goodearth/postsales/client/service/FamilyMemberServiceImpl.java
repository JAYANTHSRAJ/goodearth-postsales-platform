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
        if (count >= 4) {
            throw new CustomException("Maximum of 4 family members are permitted.", HttpStatus.BAD_REQUEST);
        }

        if (newMember.getName() == null || newMember.getName().trim().isEmpty()) {
            throw new CustomException("Name is a required field.", HttpStatus.BAD_REQUEST);
        }

        if (newMember.getRelation() == null || newMember.getRelation().trim().isEmpty()) {
            throw new CustomException("Relation is a required field.", HttpStatus.BAD_REQUEST);
        }

        FamilyMember member = mapper.toFamilyMember(newMember, buyer);
        FamilyMember saved = familyMemberRepository.save(member);
        return mapper.toFamilyMemberDto(saved);
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
