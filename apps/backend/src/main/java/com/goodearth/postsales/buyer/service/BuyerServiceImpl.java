package com.goodearth.postsales.buyer.service;

import com.goodearth.postsales.buyer.dto.BuyerDto;
import com.goodearth.postsales.buyer.entity.Buyer;
import com.goodearth.postsales.buyer.repository.BuyerRepository;
import com.goodearth.postsales.finance.dto.PaymentReceiptDto;
import com.goodearth.postsales.finance.service.PaymentService;
import com.goodearth.postsales.workflow.entity.Workflow;
import com.goodearth.postsales.workflow.repository.WorkflowRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Service
@Transactional(readOnly = true)
public class BuyerServiceImpl implements BuyerService {

    private final BuyerRepository buyerRepository;
    private final WorkflowRepository workflowRepository;
    private final PaymentService paymentService;

    public BuyerServiceImpl(
            BuyerRepository buyerRepository,
            WorkflowRepository workflowRepository,
            PaymentService paymentService) {
        this.buyerRepository = buyerRepository;
        this.workflowRepository = workflowRepository;
        this.paymentService = paymentService;
    }

    @Override
    public List<BuyerDto> getAllBuyers() {
        List<Buyer> buyers = buyerRepository.findAll();
        List<BuyerDto> dtos = new ArrayList<>();
        for (Buyer buyer : buyers) {
            dtos.add(mapToDto(buyer));
        }
        return dtos;
    }

    @Override
    public BuyerDto getBuyerById(java.util.UUID id) {
        Buyer buyer = buyerRepository.findById(id)
                .orElseThrow(() -> new com.goodearth.postsales.common.exception.CustomException("Buyer not found", org.springframework.http.HttpStatus.NOT_FOUND));
        return mapToDto(buyer);
    }

    @Override
    @Transactional
    public BuyerDto createBuyer(BuyerDto dto) {
        Buyer buyer = new Buyer();
        buyer.setFullName(dto.getName());
        buyer.setEmail(dto.getEmail());
        buyer.setPhone(dto.getPhone() != null ? dto.getPhone() : "");
        buyer.setStatus(dto.getStatus() != null ? dto.getStatus().toUpperCase() : "PENDING");
        buyer.setZohoContactId("local_" + java.util.UUID.randomUUID().toString().substring(0, 8));
        buyer.setCoApplicantName(dto.getCoApplicantName());
        buyer.setUnitName(dto.getUnitName());
        Buyer saved = buyerRepository.save(buyer);
        return mapToDto(saved);
    }

    @Override
    @Transactional
    public BuyerDto updateBuyer(java.util.UUID id, BuyerDto dto) {
        Buyer buyer = buyerRepository.findById(id)
                .orElseThrow(() -> new com.goodearth.postsales.common.exception.CustomException("Buyer not found", org.springframework.http.HttpStatus.NOT_FOUND));
        buyer.setFullName(dto.getName());
        buyer.setEmail(dto.getEmail());
        if (dto.getStatus() != null) {
            buyer.setStatus(dto.getStatus().toUpperCase());
        }
        buyer.setCoApplicantName(dto.getCoApplicantName());
        buyer.setUnitName(dto.getUnitName());
        if (dto.getPhone() != null) {
            buyer.setPhone(dto.getPhone());
        }
        Buyer saved = buyerRepository.save(buyer);
        return mapToDto(saved);
    }

    @Override
    @Transactional
    public void deleteBuyer(java.util.UUID id) {
        Buyer buyer = buyerRepository.findById(id)
                .orElseThrow(() -> new com.goodearth.postsales.common.exception.CustomException("Buyer not found", org.springframework.http.HttpStatus.NOT_FOUND));
        buyerRepository.delete(buyer);
    }

    private BuyerDto mapToDto(Buyer buyer) {
        BuyerDto dto = new BuyerDto();
        dto.setId(buyer.getId());
        dto.setName(buyer.getFullName());
        dto.setEmail(buyer.getEmail());
        dto.setCoApplicantName(buyer.getCoApplicantName());
        dto.setPhone(buyer.getPhone());

        java.util.Optional<Workflow> workflowOpt = workflowRepository.findFirstByBuyerId(buyer.getId());
        if (workflowOpt.isPresent()) {
            Workflow workflow = workflowOpt.get();
            dto.setProjectName(workflow.getProject().getProjectName());
            dto.setUnitName(buyer.getUnitName() != null ? buyer.getUnitName() : "—");
            dto.setStatus(workflow.getStatus() != null ? workflow.getStatus().name().toLowerCase() : "pending");

            try {
                java.math.BigDecimal outstanding = paymentService.calculateOutstandingBalance(workflow.getId()).getOutstandingBalance();
                dto.setOutstanding("₹" + outstanding.toPlainString());

                List<com.goodearth.postsales.finance.dto.PaymentReceiptDto> receipts = paymentService.getReceiptsByWorkflow(workflow.getId());
                java.math.BigDecimal paidSum = receipts.stream()
                        .map(com.goodearth.postsales.finance.dto.PaymentReceiptDto::getAmount)
                        .reduce(java.math.BigDecimal.ZERO, java.math.BigDecimal::add);
                dto.setTotalPaid("₹" + paidSum.toPlainString());
            } catch (Exception e) {
                dto.setOutstanding("₹0.00");
                dto.setTotalPaid("₹0.00");
            }

            dto.setBookingDate(workflow.getStartedAt() != null ? workflow.getStartedAt().toLocalDate().toString() : "");
        } else {
            dto.setProjectName("—");
            dto.setUnitName(buyer.getUnitName() != null ? buyer.getUnitName() : "—");
            dto.setStatus(buyer.getStatus() != null ? buyer.getStatus().toLowerCase() : "pending");
            dto.setTotalPaid("₹0.00");
            dto.setOutstanding("₹0.00");
            dto.setBookingDate("");
        }
        return dto;
    }
}
