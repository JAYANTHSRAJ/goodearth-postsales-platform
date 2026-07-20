package com.goodearth.postsales.finance.repository;

import com.goodearth.postsales.finance.entity.PaymentSchedule;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface PaymentScheduleRepository extends JpaRepository<PaymentSchedule, UUID> {
    Optional<PaymentSchedule> findByZohoInvoiceId(String zohoInvoiceId);
    List<PaymentSchedule> findByWorkflowId(UUID workflowId);
}
