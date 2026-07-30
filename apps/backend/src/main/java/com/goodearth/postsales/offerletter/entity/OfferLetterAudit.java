package com.goodearth.postsales.offerletter.entity;

import com.goodearth.postsales.audit.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Table(name = "offer_letter_audits")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OfferLetterAudit extends BaseEntity {

    @Column(name = "booking_id", nullable = false, unique = true, length = 100)
    private String bookingId;

    @Column(name = "deal_record_id", length = 100)
    private String dealRecordId;

    @Column(name = "sent", nullable = false)
    @Builder.Default
    private boolean sent = false;

    @Column(name = "sent_at")
    private LocalDateTime sentAt;

    @Column(name = "sent_by", length = 100)
    private String sentBy;

    @Column(name = "recipient_email", length = 150)
    private String recipientEmail;

    @Column(name = "recipient_name", length = 150)
    private String recipientName;
}
