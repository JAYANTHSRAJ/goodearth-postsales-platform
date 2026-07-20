package com.goodearth.postsales.finance.service;

import com.goodearth.postsales.buyer.entity.Buyer;
import com.goodearth.postsales.changerequest.entity.ChangeRequest;
import com.goodearth.postsales.changerequest.repository.ChangeRequestRepository;
import com.goodearth.postsales.finance.dto.FinancialQuoteDto;
import com.goodearth.postsales.finance.entity.FinancialQuote;
import com.goodearth.postsales.finance.entity.QuoteStatus;
import com.goodearth.postsales.finance.mapper.FinanceMapper;
import com.goodearth.postsales.finance.repository.FinancialQuoteRepository;
import com.goodearth.postsales.workflow.entity.Workflow;
import com.goodearth.postsales.workflow.repository.WorkflowRepository;
import com.goodearth.postsales.common.exception.CustomException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class FinanceServiceImpl implements FinanceService {

    private final FinancialQuoteRepository quoteRepository;
    private final WorkflowRepository workflowRepository;
    private final ChangeRequestRepository changeRequestRepository;
    private final FinanceMapper mapper;

    public FinanceServiceImpl(
            FinancialQuoteRepository quoteRepository,
            WorkflowRepository workflowRepository,
            ChangeRequestRepository changeRequestRepository,
            FinanceMapper mapper) {
        this.quoteRepository = quoteRepository;
        this.workflowRepository = workflowRepository;
        this.changeRequestRepository = changeRequestRepository;
        this.mapper = mapper;
    }

    @Override
    @Transactional
    public FinancialQuoteDto createQuotation(UUID workflowId, UUID changeRequestId, BigDecimal amount,
                                            BigDecimal gst, BigDecimal discount, String remarks) {
        Workflow workflow = workflowRepository.findById(workflowId)
                .orElseThrow(() -> new CustomException("Workflow not found.", HttpStatus.NOT_FOUND));

        Buyer buyer = workflow.getBuyer();
        if (buyer == null) {
            throw new CustomException("Buyer not associated with this workflow.", HttpStatus.BAD_REQUEST);
        }

        ChangeRequest changeRequest = null;
        if (changeRequestId != null) {
            changeRequest = changeRequestRepository.findById(changeRequestId)
                    .orElseThrow(() -> new CustomException("Change request not found.", HttpStatus.NOT_FOUND));
        }

        FinancialQuote quote = new FinancialQuote();
        quote.setWorkflow(workflow);
        quote.setBuyer(buyer);
        quote.setChangeRequest(changeRequest);
        quote.setAmount(amount);
        quote.setGst(gst != null ? gst : BigDecimal.ZERO);
        quote.setDiscount(discount != null ? discount : BigDecimal.ZERO);
        quote.setStatus(QuoteStatus.DRAFT);
        quote.setRemarks(remarks);
        quote.setZohoEstimateId("est_mock_" + UUID.randomUUID().toString().substring(0, 8));

        FinancialQuote savedQuote = quoteRepository.save(quote);
        return mapper.toDto(savedQuote);
    }

    @Override
    @Transactional
    public FinancialQuoteDto acceptQuotation(UUID id) {
        FinancialQuote quote = quoteRepository.findById(id)
                .orElseThrow(() -> new CustomException("Quotation not found.", HttpStatus.NOT_FOUND));

        quote.setStatus(QuoteStatus.ACCEPTED);
        FinancialQuote savedQuote = quoteRepository.save(quote);
        return mapper.toDto(savedQuote);
    }

    @Override
    @Transactional
    public FinancialQuoteDto rejectQuotation(UUID id) {
        FinancialQuote quote = quoteRepository.findById(id)
                .orElseThrow(() -> new CustomException("Quotation not found.", HttpStatus.NOT_FOUND));

        quote.setStatus(QuoteStatus.DECLINED);
        FinancialQuote savedQuote = quoteRepository.save(quote);
        return mapper.toDto(savedQuote);
    }

    @Override
    @Transactional(readOnly = true)
    public FinancialQuoteDto getQuotation(UUID id) {
        FinancialQuote quote = quoteRepository.findById(id)
                .orElseThrow(() -> new CustomException("Quotation not found.", HttpStatus.NOT_FOUND));
        return mapper.toDto(quote);
    }

    @Override
    @Transactional(readOnly = true)
    public List<FinancialQuoteDto> getQuotationsByWorkflow(UUID workflowId) {
        return quoteRepository.findByWorkflowId(workflowId).stream()
                .map(mapper::toDto)
                .collect(Collectors.toList());
    }
}
