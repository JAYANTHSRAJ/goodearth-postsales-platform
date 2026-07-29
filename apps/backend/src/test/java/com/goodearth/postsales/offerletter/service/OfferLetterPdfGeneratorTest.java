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
                .offerLetterNo("CADENCE-A001-290625")
                .offerLetterDate("09/07/2026")
                .projectName("Good Earth Cadence")
                .unitName("CADENCE-A001")
                .primaryApplicantFormatted("Ms. Nishtha Bhatia")
                .secondaryApplicantFormatted("Mr. Aman Uzuwaal")
                .carpetAreaSqm("149.01")
                .superBuiltUpAreaSqm("224.35")
                .exclusiveCommonAreaSqm("115.55")
                .associationCommonAreaSqm("69.44")
                .udsAllotteeSqm("40.24")
                .totalUdsSqm("225.23")
                .exclusiveBalconySqm("29.65")
                .openTerraceSqm("2.77")
                .coveredCarParks("2")
                .costOfUnitFormatted("INR 3,76,19,048")
                .gstAmountFormatted("INR 18,80,952")
                .costOfHomeFormatted("INR 3,95,00,000")
                .maintenanceDepositsFormatted("INR 2,00,000")
                .amountInWords("Rupees Three Crore Ninety Five Lakh Only")
                .milestones(List.of(
                        OfferLetterMilestoneDto.builder()
                                .sNo(1)
                                .milestoneName("On Booking")
                                .paymentPercent("5%")
                                .dueDate("Jul-2025")
                                .unitTotalAmountFormatted("INR 18,80,952")
                                .gstAmountFormatted("INR 94,048")
                                .installmentAmountFormatted("INR 19,75,000")
                                .build()
                ))
                .totalMilestonePercent("100%")
                .totalUnitCostFormatted("INR 3,76,19,048")
                .totalGstAmountFormatted("INR 18,80,952")
                .totalInstallmentCostFormatted("INR 3,95,00,000")
                .build();

        byte[] pdfBytes = pdfGenerator.generatePdf(dto);

        assertNotNull(pdfBytes);
        assertTrue(pdfBytes.length > 1000, "PDF bytes should be substantial");
        String pdfHeader = new String(pdfBytes, 0, 5);
        assertEquals("%PDF-", pdfHeader, "Output should start with valid PDF magic bytes %PDF-");
    }
}
