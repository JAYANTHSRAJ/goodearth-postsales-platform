package com.goodearth.postsales.client.service;

import com.goodearth.postsales.buyer.entity.Buyer;
import com.goodearth.postsales.client.dto.ClientFinanceDto;
import com.goodearth.postsales.finance.service.FinanceService;
import com.goodearth.postsales.finance.service.PaymentService;
import com.goodearth.postsales.workflow.entity.Workflow;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@Transactional(readOnly = true)
public class ClientFinanceServiceImpl implements ClientFinanceService {

    private final ClientPortalServiceHelper helper;
    private final FinanceService financeService;
    private final PaymentService paymentService;

    public ClientFinanceServiceImpl(
            ClientPortalServiceHelper helper,
            FinanceService financeService,
            PaymentService paymentService) {
        this.helper = helper;
        this.financeService = financeService;
        this.paymentService = paymentService;
    }

    @Override
    public ClientFinanceDto getFinanceSummary(UserDetails userDetails) {
        Buyer buyer = helper.getAuthenticatedBuyer(userDetails);
        Workflow workflow = helper.getBuyerWorkflow(buyer);
        UUID workflowId = workflow.getId();

        ClientFinanceDto financeDto = new ClientFinanceDto();
        financeDto.setQuotes(financeService.getQuotationsByWorkflow(workflowId));
        financeDto.setInvoices(paymentService.getInvoicesByWorkflow(workflowId));
        financeDto.setReceipts(paymentService.getReceiptsByWorkflow(workflowId));
        financeDto.setOutstandingBalance(paymentService.calculateOutstandingBalance(workflowId).getOutstandingBalance());

        return financeDto;
    }
}
