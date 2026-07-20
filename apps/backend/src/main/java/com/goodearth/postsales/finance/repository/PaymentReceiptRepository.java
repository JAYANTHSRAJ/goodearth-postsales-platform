package com.goodearth.postsales.finance.repository;

import com.goodearth.postsales.finance.entity.PaymentReceipt;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface PaymentReceiptRepository extends JpaRepository<PaymentReceipt, UUID> {
    Optional<PaymentReceipt> findByZohoPaymentId(String zohoPaymentId);
    List<PaymentReceipt> findByWorkflowId(UUID workflowId);
}
