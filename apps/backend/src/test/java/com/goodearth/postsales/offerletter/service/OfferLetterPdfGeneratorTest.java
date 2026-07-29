package com.goodearth.postsales.offerletter.service;

import com.goodearth.postsales.offerletter.dto.OfferLetterDto;
import com.goodearth.postsales.offerletter.dto.OfferLetterMilestoneDto;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

import java.math.BigDecimal;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@ActiveProfiles("test")
public class OfferLetterPdfGeneratorTest {

    @Autowired
    private OfferLetterPdfGenerator pdfGenerator;

    @Test
    @DisplayName("generatePdf produces valid PDF byte array from OfferLetterDto")
    void testGeneratePdf() {
        OfferLetterDto dto = OfferLetterDto.builder()
                .offerLetterNo("CADENCE-A001")
                .offerLetterDate("09/07/2026")
                .projectName("Good Earth Cadence")
                .unitName("CADENCE-A001")
                .applicants(List.of(
                        com.goodearth.postsales.offerletter.dto.OfferLetterApplicantDto.builder()
                                .applicantType("PRIMARY")
                                .salutation("Ms.")
                                .fullName("Nishtha Bhatia")
                                .label("First applicant")
                                .signatureLabel("Primary Applicant")
                                .build(),
                        com.goodearth.postsales.offerletter.dto.OfferLetterApplicantDto.builder()
                                .applicantType("CO_APPLICANT")
                                .salutation("Mr.")
                                .fullName("Aman Uzuwaal")
                                .label("Second applicant")
                                .signatureLabel("Co Applicant")
                                .build()
                ))
                .carpetAreaSqm("150.00")
                .superBuiltUpAreaSqm("225.00")
                .exclusiveCommonAreaSqm("110.00")
                .associationCommonAreaSqm("70.00")
                .udsAllotteeSqm("45.00")
                .totalUdsSqm("225.00")
                .exclusiveBalconySqm("30.00")
                .openTerraceSqm("5.00")
                .coveredCarParks("2")
                .costOfUnitFormatted("INR 4,00,00,000")
                .gstAmountFormatted("INR 20,00,000")
                .costOfHomeFormatted("INR 4,20,00,000")
                .maintenanceDepositsFormatted("INR 2,50,000")
                .amountInWords("Rupees Four Crore Twenty Lakh Only")
                .milestones(List.of(
                        OfferLetterMilestoneDto.builder()
                                .sNo(1)
                                .milestoneName("On Booking")
                                .paymentPercent("5%")
                                .dueDate("Jul-2025")
                                .unitTotalAmountFormatted("INR 20,00,000")
                                .gstAmountFormatted("INR 1,00,000")
                                .installmentAmountFormatted("INR 21,00,000")
                                .build()
                ))
                .totalMilestonePercent("100%")
                .totalUnitCostFormatted("INR 4,00,00,000")
                .totalGstAmountFormatted("INR 20,00,000")
                .totalInstallmentCostFormatted("INR 4,20,00,000")
                .build();

        byte[] pdfBytes = pdfGenerator.generatePdf(dto);

        assertNotNull(pdfBytes);
        assertTrue(pdfBytes.length > 1000, "PDF bytes should be substantial");
        String pdfHeader = new String(pdfBytes, 0, 5);
        assertEquals("%PDF-", pdfHeader, "Output should start with valid PDF magic bytes %PDF-");
    }
}
