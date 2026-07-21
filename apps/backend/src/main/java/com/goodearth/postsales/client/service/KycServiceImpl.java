package com.goodearth.postsales.client.service;

import com.goodearth.postsales.auth.entity.User;
import com.goodearth.postsales.auth.repository.UserRepository;
import com.goodearth.postsales.buyer.entity.Buyer;
import com.goodearth.postsales.buyer.repository.BuyerRepository;
import com.goodearth.postsales.client.dto.ClientUnitDto;
import com.goodearth.postsales.client.dto.KycApplicationDto;
import com.goodearth.postsales.client.dto.KycModificationRequestDto;
import com.goodearth.postsales.client.entity.BuyerKycAssociation;
import com.goodearth.postsales.client.entity.KycApplication;
import com.goodearth.postsales.client.entity.KycModificationRequest;
import com.goodearth.postsales.client.repository.BuyerKycAssociationRepository;
import com.goodearth.postsales.client.repository.KycApplicationRepository;
import com.goodearth.postsales.client.repository.KycModificationRequestRepository;
import com.goodearth.postsales.common.enumeration.OnboardingStage;
import com.goodearth.postsales.common.exception.CustomException;
import com.goodearth.postsales.workflow.entity.Workflow;
import com.goodearth.postsales.workflow.repository.WorkflowRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class KycServiceImpl implements KycService {

    private final UserRepository userRepository;
    private final BuyerRepository buyerRepository;
    private final WorkflowRepository workflowRepository;
    private final KycApplicationRepository kycApplicationRepository;
    private final KycModificationRequestRepository modificationRequestRepository;
    private final BuyerKycAssociationRepository associationRepository;

    public KycServiceImpl(
            UserRepository userRepository,
            BuyerRepository buyerRepository,
            WorkflowRepository workflowRepository,
            KycApplicationRepository kycApplicationRepository,
            KycModificationRequestRepository modificationRequestRepository,
            BuyerKycAssociationRepository associationRepository) {
        this.userRepository = userRepository;
        this.buyerRepository = buyerRepository;
        this.workflowRepository = workflowRepository;
        this.kycApplicationRepository = kycApplicationRepository;
        this.modificationRequestRepository = modificationRequestRepository;
        this.associationRepository = associationRepository;
    }

    private Buyer resolveBuyer(User user, UUID workflowId) {
        if (workflowId != null) {
            Workflow workflow = workflowRepository.findById(workflowId)
                    .orElseThrow(() -> new CustomException("Workflow not found", HttpStatus.NOT_FOUND));
            Buyer buyer = workflow.getBuyer();
            if (!buyer.getEmail().equalsIgnoreCase(user.getEmail())) {
                throw new CustomException("User does not own this property unit", HttpStatus.FORBIDDEN);
            }
            return buyer;
        }
        if (user.getLastSelectedUnitId() != null) {
            Optional<Buyer> lastUnit = buyerRepository.findById(user.getLastSelectedUnitId());
            if (lastUnit.isPresent() && lastUnit.get().getEmail().equalsIgnoreCase(user.getEmail())) {
                return lastUnit.get();
            }
        }
        List<Buyer> buyers = buyerRepository.findAllByEmailIgnoreCase(user.getEmail());
        if (buyers.isEmpty()) {
            throw new CustomException("No property units found for customer", HttpStatus.NOT_FOUND);
        }
        return buyers.get(0);
    }

    @Override
    @Transactional(readOnly = true)
    public KycApplicationDto getKycApplication(String email, UUID workflowId) {
        User user = userRepository.findByEmailIgnoreCase(email)
                .orElseThrow(() -> new CustomException("User not found", HttpStatus.NOT_FOUND));

        Buyer buyer = resolveBuyer(user, workflowId);
        KycApplication kyc = resolveKycForBuyer(user, buyer);

        return mapToDto(user, buyer, kyc);
    }

    private KycApplication resolveKycForBuyer(User user, Buyer buyer) {
        // Check association table first
        Optional<BuyerKycAssociation> assoc = associationRepository.findFirstByBuyerIdAndStatusOrderByAssociatedAtDesc(buyer.getId(), "ACTIVE");
        if (assoc.isPresent()) {
            return assoc.get().getKycApplication();
        }

        if (buyer.getKycApplicationId() != null) {
            Optional<KycApplication> linkedKyc = kycApplicationRepository.findById(buyer.getKycApplicationId());
            if (linkedKyc.isPresent()) {
                return linkedKyc.get();
            }
        }

        Optional<KycApplication> buyerKyc = kycApplicationRepository.findByBuyerId(buyer.getId());
        if (buyerKyc.isPresent()) {
            return buyerKyc.get();
        }

        Optional<KycApplication> userKyc = kycApplicationRepository.findFirstByUserIdOrderByCreatedAtDesc(user.getId());
        if (userKyc.isPresent()) {
            return userKyc.get();
        }

        KycApplication newKyc = new KycApplication();
        newKyc.setUser(user);
        newKyc.setBuyer(buyer);
        newKyc.setStatus("DRAFT");
        newKyc.setLocked(false);
        newKyc.setVerified(false);
        newKyc.setVersion(1);
        newKyc.setCurrentVersion(true);
        return newKyc;
    }

    @Override
    @Transactional
    public KycApplicationDto saveKycDraft(String email, UUID workflowId, String draftData) {
        User user = userRepository.findByEmailIgnoreCase(email)
                .orElseThrow(() -> new CustomException("User not found", HttpStatus.NOT_FOUND));

        Buyer buyer = resolveBuyer(user, workflowId);
        KycApplication kyc = resolveKycForBuyer(user, buyer);

        if (kyc.isLocked() && "SUBMITTED".equals(kyc.getStatus())) {
            throw new CustomException("Cannot edit a locked or submitted KYC. Please request a modification first.", HttpStatus.BAD_REQUEST);
        }

        kyc.setDraftData(draftData);
        kyc.setStatus("DRAFT");
        kyc.setUser(user);
        kyc.setBuyer(buyer);
        KycApplication saved = kycApplicationRepository.save(kyc);

        if (buyer.getKycApplicationId() == null) {
            buyer.setKycApplicationId(saved.getId());
            buyerRepository.save(buyer);
        }

        return mapToDto(user, buyer, saved);
    }

    @Override
    @Transactional
    public KycApplicationDto submitKycApplication(String email, UUID workflowId, String finalData) {
        User user = userRepository.findByEmailIgnoreCase(email)
                .orElseThrow(() -> new CustomException("User not found", HttpStatus.NOT_FOUND));

        Buyer buyer = resolveBuyer(user, workflowId);
        KycApplication kyc = resolveKycForBuyer(user, buyer);

        // Immutable Versioning: If current KYC was already submitted/verified, create a NEW version
        if (kyc.isVerified() || kyc.getSubmittedAt() != null) {
            kyc.setCurrentVersion(false);
            kycApplicationRepository.save(kyc);

            KycApplication newVersion = new KycApplication();
            newVersion.setUser(user);
            newVersion.setBuyer(buyer);
            newVersion.setDraftData(finalData);
            newVersion.setStatus("SUBMITTED");
            newVersion.setVerified(true);
            newVersion.setLocked(true);
            newVersion.setSubmittedAt(LocalDateTime.now());
            newVersion.setVersion(kyc.getVersion() + 1);
            newVersion.setParentKycId(kyc.getId());
            newVersion.setCurrentVersion(true);
            KycApplication savedVersion = kycApplicationRepository.save(newVersion);

            // Association
            BuyerKycAssociation assoc = new BuyerKycAssociation();
            assoc.setBuyer(buyer);
            assoc.setKycApplication(savedVersion);
            assoc.setVersion(savedVersion.getVersion());
            assoc.setStatus("ACTIVE");
            assoc.setAssociatedAt(LocalDateTime.now());
            assoc.setAssociatedBy(user.getEmail());
            associationRepository.save(assoc);

            buyer.setKycApplicationId(savedVersion.getId());
            buyer.setStatus("KYC_COMPLETED");
            buyerRepository.save(buyer);

            if (user.getOnboardingStage() == OnboardingStage.PROFILE_PENDING || user.getOnboardingStage() == OnboardingStage.KYC_PENDING) {
                user.setOnboardingStage(OnboardingStage.COMPLETED);
                userRepository.save(user);
            }

            return mapToDto(user, buyer, savedVersion);
        }

        // Standard First Submission
        kyc.setDraftData(finalData);
        kyc.setStatus("SUBMITTED");
        kyc.setVerified(true);
        kyc.setLocked(true);
        kyc.setSubmittedAt(LocalDateTime.now());
        kyc.setUser(user);
        kyc.setBuyer(buyer);
        kyc.setVersion(1);
        kyc.setCurrentVersion(true);
        KycApplication saved = kycApplicationRepository.save(kyc);

        BuyerKycAssociation assoc = new BuyerKycAssociation();
        assoc.setBuyer(buyer);
        assoc.setKycApplication(saved);
        assoc.setVersion(1);
        assoc.setStatus("ACTIVE");
        assoc.setAssociatedAt(LocalDateTime.now());
        assoc.setAssociatedBy(user.getEmail());
        associationRepository.save(assoc);

        buyer.setKycApplicationId(saved.getId());
        buyer.setStatus("KYC_COMPLETED");
        buyerRepository.save(buyer);

        if (user.getOnboardingStage() == OnboardingStage.PROFILE_PENDING || user.getOnboardingStage() == OnboardingStage.KYC_PENDING) {
            user.setOnboardingStage(OnboardingStage.COMPLETED);
            userRepository.save(user);
        }

        return mapToDto(user, buyer, saved);
    }

    @Override
    @Transactional
    public KycApplicationDto reuseKycApplication(String email, UUID workflowId, UUID sourceKycId) {
        User user = userRepository.findByEmailIgnoreCase(email)
                .orElseThrow(() -> new CustomException("User not found", HttpStatus.NOT_FOUND));

        Buyer buyer = resolveBuyer(user, workflowId);
        KycApplication sourceKyc = kycApplicationRepository.findById(sourceKycId)
                .orElseThrow(() -> new CustomException("Source KYC application not found", HttpStatus.NOT_FOUND));

        if (!sourceKyc.getUser().getId().equals(user.getId())) {
            throw new CustomException("Target source KYC belongs to a different customer", HttpStatus.FORBIDDEN);
        }

        BuyerKycAssociation assoc = new BuyerKycAssociation();
        assoc.setBuyer(buyer);
        assoc.setKycApplication(sourceKyc);
        assoc.setVersion(sourceKyc.getVersion());
        assoc.setStatus("ACTIVE");
        assoc.setAssociatedAt(LocalDateTime.now());
        assoc.setAssociatedBy(user.getEmail());
        associationRepository.save(assoc);

        buyer.setKycApplicationId(sourceKyc.getId());
        buyer.setStatus("KYC_COMPLETED");
        buyerRepository.save(buyer);

        return mapToDto(user, buyer, sourceKyc);
    }

    @Override
    @Transactional
    public KycModificationRequestDto requestKycModification(String email, UUID workflowId, String reason) {
        User user = userRepository.findByEmailIgnoreCase(email)
                .orElseThrow(() -> new CustomException("User not found", HttpStatus.NOT_FOUND));

        Buyer buyer = resolveBuyer(user, workflowId);
        KycApplication kyc = resolveKycForBuyer(user, buyer);

        Optional<KycModificationRequest> existing = modificationRequestRepository
                .findFirstByBuyerIdAndStatusOrderByRequestedAtDesc(buyer.getId(), "PENDING");
        if (existing.isPresent()) {
            throw new CustomException("A KYC modification request is already pending approval for this unit.", HttpStatus.BAD_REQUEST);
        }

        KycModificationRequest req = new KycModificationRequest();
        req.setBuyer(buyer);
        req.setUser(user);
        req.setKycApplication(kyc);
        req.setReason(reason);
        req.setStatus("PENDING");
        req.setRequestedAt(LocalDateTime.now());
        KycModificationRequest saved = modificationRequestRepository.save(req);

        return new KycModificationRequestDto(
                saved.getId(),
                buyer.getId(),
                buyer.getUnitName(),
                buyer.getZohoDealId(),
                user.getFullName(),
                user.getEmail(),
                saved.getReason(),
                saved.getStatus(),
                saved.getRequestedAt(),
                saved.getReviewedAt(),
                saved.getReviewedBy()
        );
    }

    private KycApplicationDto mapToDto(User user, Buyer buyer, KycApplication kyc) {
        KycApplicationDto dto = new KycApplicationDto();
        dto.setId(kyc.getId());
        dto.setBuyerId(buyer.getId());
        dto.setUnitName(buyer.getUnitName());
        dto.setStatus(kyc.getStatus());
        dto.setDraftData(kyc.getDraftData());
        dto.setLocked(kyc.isLocked());
        dto.setVerified(kyc.isVerified() || "SUBMITTED".equals(kyc.getStatus()));
        dto.setSubmittedAt(kyc.getSubmittedAt());
        dto.setReviewedAt(kyc.getReviewedAt());

        Optional<KycModificationRequest> pendingReq = modificationRequestRepository
                .findFirstByBuyerIdAndStatusOrderByRequestedAtDesc(buyer.getId(), "PENDING");
        if (pendingReq.isPresent()) {
            dto.setHasPendingModificationRequest(true);
            dto.setModificationRequestReason(pendingReq.get().getReason());
        } else {
            dto.setHasPendingModificationRequest(false);
        }

        List<Buyer> allCustomerBuyers = buyerRepository.findAllByEmailIgnoreCase(user.getEmail());
        List<ClientUnitDto> availableVerifiedKycs = new ArrayList<>();

        for (Buyer b : allCustomerBuyers) {
            if (!b.getId().equals(buyer.getId()) && b.getKycApplicationId() != null) {
                Optional<KycApplication> bKyc = kycApplicationRepository.findById(b.getKycApplicationId());
                if (bKyc.isPresent() && (bKyc.get().isVerified() || "SUBMITTED".equals(bKyc.get().getStatus()))) {
                    ClientUnitDto unitDto = new ClientUnitDto();
                    unitDto.setId(b.getId());
                    unitDto.setUnitName(b.getUnitName());
                    unitDto.setKycApplicationId(b.getKycApplicationId());
                    unitDto.setKycStatus("VERIFIED");
                    unitDto.setKycVerified(true);
                    availableVerifiedKycs.add(unitDto);
                }
            }
        }
        dto.setAvailableVerifiedKycs(availableVerifiedKycs);

        return dto;
    }
}
