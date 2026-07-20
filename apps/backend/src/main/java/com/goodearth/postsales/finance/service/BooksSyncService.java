package com.goodearth.postsales.finance.service;

import java.util.UUID;

public interface BooksSyncService {
    void syncQuotationFromZoho(UUID id);
    void syncInvoiceStatusFromZoho(UUID scheduleId);
    void syncPaymentStatusFromZoho(UUID receiptId);
    void syncReceipts(UUID workflowId);
}
