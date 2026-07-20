package com.goodearth.postsales.finance.service;

import com.goodearth.postsales.finance.dto.FinancialQuoteDto;
import com.goodearth.postsales.finance.dto.FinancialSummaryDto;
import com.goodearth.postsales.finance.dto.PaymentScheduleDto;
import com.goodearth.postsales.finance.dto.PaymentReceiptDto;
import com.goodearth.postsales.finance.entity.InvoiceStatus;
import com.goodearth.postsales.finance.entity.PaymentReceipt;
import com.goodearth.postsales.finance.entity.PaymentSchedule;
import com.goodearth.postsales.finance.entity.PaymentStatus;
import com.goodearth.postsales.finance.mapper.FinanceMapper;
import com.goodearth.postsales.finance.repository.PaymentReceiptRepository;
import com.goodearth.postsales.finance.repository.PaymentScheduleRepository;
import com.goodearth.postsales.workflow.entity.Workflow;
import com.goodearth.postsales.workflow.repository.WorkflowRepository;
import com.goodearth.postsales.common.exception.CustomException;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class PaymentServiceImpl implements PaymentService {

    private final PaymentScheduleRepository scheduleRepository;
    private final PaymentReceiptRepository receiptRepository;
    private final WorkflowRepository workflowRepository;
    private final FinanceService financeService;
    private final FinanceMapper mapper;

    public PaymentServiceImpl(
            PaymentScheduleRepository scheduleRepository,
            PaymentReceiptRepository receiptRepository,
            WorkflowRepository workflowRepository,
            FinanceService financeService,
            FinanceMapper mapper) {
        this.scheduleRepository = scheduleRepository;
        this.receiptRepository = receiptRepository;
        this.workflowRepository = workflowRepository;
        this.financeService = financeService;
        this.mapper = mapper;
    }

    @Override
    @Transactional
    public PaymentScheduleDto generateInvoice(UUID workflowId, BigDecimal amount, LocalDateTime dueDate, String remarks) {
        Workflow workflow = workflowRepository.findById(workflowId)
                .orElseThrow(() -> new CustomException("Workflow not found.", HttpStatus.NOT_FOUND));

        PaymentSchedule schedule = new PaymentSchedule();
        schedule.setWorkflow(workflow);
        schedule.setAmount(amount);
        schedule.setDueDate(dueDate);
        schedule.setStatus(InvoiceStatus.SENT);
        schedule.setRemarks(remarks);
        schedule.setZohoInvoiceId("inv_mock_" + UUID.randomUUID().toString().substring(0, 8));

        PaymentSchedule savedSchedule = scheduleRepository.save(schedule);
        return mapper.toDto(savedSchedule);
    }

    @Override
    @Transactional(readOnly = true)
    public List<PaymentScheduleDto> getInvoicesByWorkflow(UUID workflowId) {
        return scheduleRepository.findByWorkflowId(workflowId).stream()
                .map(mapper::toDto)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<PaymentReceiptDto> getReceiptsByWorkflow(UUID workflowId) {
        return receiptRepository.findByWorkflowId(workflowId).stream()
                .map(mapper::toDto)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    @Cacheable(value = "financialSummary", key = "#workflowId")
    public FinancialSummaryDto calculateOutstandingBalance(UUID workflowId) {
        if (!workflowRepository.existsById(workflowId)) {
            throw new CustomException("Workflow not found.", HttpStatus.NOT_FOUND);
        }

        List<PaymentSchedule> schedules = scheduleRepository.findByWorkflowId(workflowId);
        List<PaymentReceipt> receipts = receiptRepository.findByWorkflowId(workflowId);
        List<FinancialQuoteDto> quotes = financeService.getQuotationsByWorkflow(workflowId);

        BigDecimal totalContractAmount = quotes.stream()
                .filter(q -> q.getStatus() == com.goodearth.postsales.finance.entity.QuoteStatus.ACCEPTED)
                .map(FinancialQuoteDto::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal totalInvoiced = schedules.stream()
                .filter(s -> s.getStatus() != InvoiceStatus.VOID)
                .map(PaymentSchedule::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal totalPaid = receipts.stream()
                .filter(r -> r.getStatus() == PaymentStatus.SUCCESS)
                .map(PaymentReceipt::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal outstandingBalance = totalInvoiced.subtract(totalPaid);

        List<PaymentScheduleDto> invoiceDtos = schedules.stream().map(mapper::toDto).collect(Collectors.toList());
        List<PaymentReceiptDto> receiptDtos = receipts.stream().map(mapper::toDto).collect(Collectors.toList());

        FinancialSummaryDto summary = new FinancialSummaryDto();
        summary.setWorkflowId(workflowId);
        summary.setTotalContractAmount(totalContractAmount);
        summary.setTotalInvoiced(totalInvoiced);
        summary.setTotalPaid(totalPaid);
        summary.setOutstandingBalance(outstandingBalance);
        summary.setQuotations(quotes);
        summary.setInvoices(invoiceDtos);
        summary.setReceipts(receiptDtos);

        return summary;
    }

    @Override
    @Transactional(readOnly = true)
    public List<com.goodearth.postsales.finance.dto.PaymentDto> getAllPayments() {
        List<PaymentReceipt> receipts = receiptRepository.findAll();
        java.util.List<com.goodearth.postsales.finance.dto.PaymentDto> dtos = new java.util.ArrayList<>();

        for (PaymentReceipt receipt : receipts) {
            com.goodearth.postsales.finance.dto.PaymentDto dto = new com.goodearth.postsales.finance.dto.PaymentDto();
            dto.setId(receipt.getId());
            
            Workflow workflow = receipt.getWorkflow();
            if (workflow != null) {
                if (workflow.getBuyer() != null) {
                    dto.setBuyerName(workflow.getBuyer().getFullName());
                } else {
                    dto.setBuyerName("—");
                }
                
                String projectCode = workflow.getProject() != null && workflow.getProject().getProjectCode() != null 
                        ? workflow.getProject().getProjectCode() : "GE";
                String contactIdTail = workflow.getBuyer() != null && workflow.getBuyer().getZohoContactId() != null && workflow.getBuyer().getZohoContactId().length() > 4
                        ? workflow.getBuyer().getZohoContactId().substring(workflow.getBuyer().getZohoContactId().length() - 4) : "001";
                dto.setUnitName("Villa " + projectCode + "-" + contactIdTail);
            } else {
                dto.setBuyerName("—");
                dto.setUnitName("—");
            }
            
            dto.setAmount("₹" + (receipt.getAmount() != null ? receipt.getAmount().toPlainString() : "0.00"));
            
            String status = "pending";
            if (receipt.getStatus() != null) {
                switch (receipt.getStatus()) {
                    case SUCCESS:
                        status = "paid";
                        break;
                    case FAILED:
                        status = "failed";
                        break;
                    default:
                        status = "pending";
                }
            }
            dto.setStatus(status);
            dto.setTransactionId(receipt.getZohoPaymentId() != null ? receipt.getZohoPaymentId() : "txn_" + receipt.getId().toString().substring(0, 8));
            java.time.LocalDateTime dt = receipt.getPaidDate() != null ? receipt.getPaidDate() : receipt.getCreatedAt();
            dto.setPaymentDate(dt != null ? dt.toLocalDate().toString() : "");
            
            dtos.add(dto);
        }

        return dtos;
    }

    @Override
    @Transactional(readOnly = true)
    public List<PaymentScheduleDto> getAllInvoices() {
        return scheduleRepository.findAll().stream()
                .map(mapper::toDto)
                .collect(Collectors.toList());
    }
}
