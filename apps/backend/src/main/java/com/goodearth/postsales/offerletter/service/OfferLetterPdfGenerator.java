package com.goodearth.postsales.offerletter.service;

import com.goodearth.postsales.common.exception.CustomException;
import com.goodearth.postsales.offerletter.dto.OfferLetterDto;
import com.openhtmltopdf.pdfboxout.PdfRendererBuilder;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.thymeleaf.TemplateEngine;
import org.thymeleaf.context.Context;

import java.io.ByteArrayOutputStream;

@Component
public class OfferLetterPdfGenerator {

    private static final Logger log = LoggerFactory.getLogger(OfferLetterPdfGenerator.class);

    private final TemplateEngine templateEngine;

    public OfferLetterPdfGenerator(TemplateEngine templateEngine) {
        this.templateEngine = templateEngine;
    }

    /**
     * Renders an OfferLetterDto object to a byte array representing a PDF document.
     */
    public byte[] generatePdf(OfferLetterDto dto) {
        if (dto == null) {
            throw new CustomException("OfferLetterDto cannot be null for PDF generation.", HttpStatus.BAD_REQUEST);
        }

        log.info("[OFFER_LETTER_TRACE_v2] PDFGenerator Code Version: 2026-07-29T15:35:00");
        log.info("[OFFER_LETTER_TRACE_v2] PDFGenerator -> Starting generatePdf for Offer No: {}", dto.getOfferLetterNo());
        long startTime = System.currentTimeMillis();
        try {
            log.info("[OFFER_LETTER_TRACE_v2] PDFGenerator -> Step 1: Setting up Thymeleaf Context...");
            Context context = new Context();
            context.setVariable("offer", dto);

            log.info("[OFFER_LETTER_TRACE_v2] 6. Values inside Thymeleaf Context before rendering:");
            log.info(" - offer.unitName: '{}'", dto.getUnitName());
            log.info(" - offer.projectName: '{}'", dto.getProjectName());
            log.info(" - offer.carpetAreaSqm: '{}'", dto.getCarpetAreaSqm());
            log.info(" - offer.superBuiltUpAreaSqm: '{}'", dto.getSuperBuiltUpAreaSqm());
            log.info(" - offer.exclusiveCommonAreaSqm: '{}'", dto.getExclusiveCommonAreaSqm());
            log.info(" - offer.associationCommonAreaSqm: '{}'", dto.getAssociationCommonAreaSqm());
            log.info(" - offer.udsAllotteeSqm: '{}'", dto.getUdsAllotteeSqm());
            log.info(" - offer.totalUdsSqm: '{}'", dto.getTotalUdsSqm());
            log.info(" - offer.exclusiveBalconySqm: '{}'", dto.getExclusiveBalconySqm());
            log.info(" - offer.openTerraceSqm: '{}'", dto.getOpenTerraceSqm());
            log.info(" - offer.coveredCarParks: '{}'", dto.getCoveredCarParks());
            log.info(" - offer.costOfUnitFormatted: '{}'", dto.getCostOfUnitFormatted());
            log.info(" - offer.gstAmountFormatted: '{}'", dto.getGstAmountFormatted());
            log.info(" - offer.costOfHomeFormatted: '{}'", dto.getCostOfHomeFormatted());
            log.info(" - offer.maintenanceDepositsFormatted: '{}'", dto.getMaintenanceDepositsFormatted());

            log.info("[OFFER_LETTER_TRACE_v2] PDFGenerator -> Step 2: Processing Thymeleaf HTML template 'offer-letter'...");
            String htmlContent = templateEngine.process("offer-letter", context);
            log.info("[OFFER_LETTER_TRACE] PDFGenerator -> Step 2 Complete. Rendered HTML length: {} characters",
                    htmlContent != null ? htmlContent.length() : 0);

            log.info("[OFFER_LETTER_TRACE] PDFGenerator -> Step 3: Initializing OpenHTMLToPDF PdfRendererBuilder...");
            ByteArrayOutputStream os = new ByteArrayOutputStream();
            PdfRendererBuilder builder = new PdfRendererBuilder();
            builder.useFastMode();
            builder.withHtmlContent(htmlContent, null);
            builder.toStream(os);

            log.info("[OFFER_LETTER_TRACE] PDFGenerator -> Step 4: Executing OpenHTMLToPDF builder.run()...");
            builder.run();

            byte[] pdfBytes = os.toByteArray();
            long duration = System.currentTimeMillis() - startTime;
            log.info("[OFFER_LETTER_TRACE] PDFGenerator -> Step 5 Complete: PDF generated successfully for Deal: {} | Size: {} bytes | Duration: {}ms",
                    dto.getOfferLetterNo(), pdfBytes.length, duration);

            return pdfBytes;
        } catch (Throwable ex) {
            log.error("[OFFER_LETTER_TRACE] CRITICAL ERROR in PDFGenerator for Deal {}: {}",
                    dto.getOfferLetterNo(), ex.getMessage(), ex);
            throw new CustomException("Failed to generate Offer Letter PDF: " + ex.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR, ex);
        }
    }
}
