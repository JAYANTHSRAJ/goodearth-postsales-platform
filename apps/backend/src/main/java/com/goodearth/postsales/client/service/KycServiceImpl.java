package com.goodearth.postsales.client.service;

import com.goodearth.postsales.auth.entity.User;
import com.goodearth.postsales.auth.repository.UserRepository;
import com.goodearth.postsales.client.dto.KycApplicationDto;
import com.goodearth.postsales.client.entity.KycApplication;
import com.goodearth.postsales.client.repository.KycApplicationRepository;
import com.goodearth.postsales.common.enumeration.OnboardingStage;
import com.goodearth.postsales.common.exception.CustomException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
public class KycServiceImpl implements KycService {

    private final UserRepository userRepository;
    private final KycApplicationRepository kycApplicationRepository;

    public KycServiceImpl(UserRepository userRepository, KycApplicationRepository kycApplicationRepository) {
        this.userRepository = userRepository;
        this.kycApplicationRepository = kycApplicationRepository;
    }

    @Override
    @Transactional(readOnly = true)
    public KycApplicationDto getKycApplication(String email) {
        User user = userRepository.findByEmailIgnoreCase(email)
                .orElseThrow(() -> new CustomException("User not found", HttpStatus.NOT_FOUND));

        KycApplication kyc = kycApplicationRepository.findByUserId(user.getId())
                .orElseGet(() -> {
                    KycApplication newKyc = new KycApplication();
                    newKyc.setUser(user);
                    newKyc.setStatus("DRAFT");
                    return newKyc;
                });

        return mapToDto(kyc);
    }

    @Override
    @Transactional
    public KycApplicationDto saveKycDraft(String email, String draftData) {
        User user = userRepository.findByEmailIgnoreCase(email)
                .orElseThrow(() -> new CustomException("User not found", HttpStatus.NOT_FOUND));

        KycApplication kyc = kycApplicationRepository.findByUserId(user.getId())
                .orElseGet(() -> {
                    KycApplication newKyc = new KycApplication();
                    newKyc.setUser(user);
                    return newKyc;
                });

        if ("SUBMITTED".equals(kyc.getStatus()) || "APPROVED".equals(kyc.getStatus())) {
            throw new CustomException("Cannot edit a submitted or approved KYC application", HttpStatus.BAD_REQUEST);
        }

        kyc.setDraftData(draftData);
        kyc.setStatus("DRAFT");
        kycApplicationRepository.save(kyc);

        return mapToDto(kyc);
    }

    @Override
    @Transactional
    public KycApplicationDto submitKycApplication(String email, String finalData) {
        User user = userRepository.findByEmailIgnoreCase(email)
                .orElseThrow(() -> new CustomException("User not found", HttpStatus.NOT_FOUND));

        KycApplication kyc = kycApplicationRepository.findByUserId(user.getId())
                .orElseGet(() -> {
                    KycApplication newKyc = new KycApplication();
                    newKyc.setUser(user);
                    return newKyc;
                });

        if ("APPROVED".equals(kyc.getStatus())) {
            throw new CustomException("KYC application is already approved", HttpStatus.BAD_REQUEST);
        }

        kyc.setDraftData(finalData);
        kyc.setStatus("SUBMITTED");
        kyc.setSubmittedAt(LocalDateTime.now());
        kycApplicationRepository.save(kyc);

        if (user.getOnboardingStage() == OnboardingStage.KYC_PENDING) {
            user.setOnboardingStage(OnboardingStage.PAYMENT_PENDING);
            userRepository.save(user);
        }

        return mapToDto(kyc);
    }

    private KycApplicationDto mapToDto(KycApplication kyc) {
        KycApplicationDto dto = new KycApplicationDto();
        dto.setStatus(kyc.getStatus());
        dto.setDraftData(kyc.getDraftData());
        dto.setSubmittedAt(kyc.getSubmittedAt());
        dto.setReviewedAt(kyc.getReviewedAt());
        return dto;
    }
}
