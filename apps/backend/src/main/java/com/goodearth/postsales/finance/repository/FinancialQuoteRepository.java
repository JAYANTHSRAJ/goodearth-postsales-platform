package com.goodearth.postsales.finance.repository;

import com.goodearth.postsales.finance.entity.FinancialQuote;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface FinancialQuoteRepository extends JpaRepository<FinancialQuote, UUID> {
    Optional<FinancialQuote> findByZohoEstimateId(String zohoEstimateId);
    List<FinancialQuote> findByWorkflowId(UUID workflowId);
}
