package com.goodearth.postsales.finance.entity;

import com.goodearth.postsales.audit.BaseEntity;
import com.goodearth.postsales.buyer.entity.Buyer;
import com.goodearth.postsales.changerequest.entity.ChangeRequest;
import com.goodearth.postsales.workflow.entity.Workflow;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;

@Entity
@Table(name = "financial_quotes")
@Getter
@Setter
@NoArgsConstructor
public class FinancialQuote extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "workflow_id", nullable = false)
    private Workflow workflow;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "buyer_id", nullable = false)
    private Buyer buyer;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "change_request_id")
    private ChangeRequest changeRequest;

    @Column(name = "zoho_estimate_id", unique = true)
    private String zohoEstimateId;

    @Column(name = "amount", nullable = false, precision = 19, scale = 2)
    private BigDecimal amount;

    @Column(name = "gst", precision = 19, scale = 2)
    private BigDecimal gst;

    @Column(name = "discount", precision = 19, scale = 2)
    private BigDecimal discount;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 50)
    private QuoteStatus status;

    @Column(name = "remarks", length = 1000)
    private String remarks;
}
