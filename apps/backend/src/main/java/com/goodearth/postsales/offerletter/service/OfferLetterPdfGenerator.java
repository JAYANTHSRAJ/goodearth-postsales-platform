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

        long startTime = System.currentTimeMillis();
        try {
            Context context = new Context();
            context.setVariable("offer", dto);

            String htmlContent = templateEngine.process("offer-letter", context);

            ByteArrayOutputStream os = new ByteArrayOutputStream();
            PdfRendererBuilder builder = new PdfRendererBuilder();
            builder.useFastMode();
            builder.withHtmlContent(htmlContent, null);
            builder.toStream(os);
            builder.run();

            byte[] pdfBytes = os.toByteArray();
            long duration = System.currentTimeMillis() - startTime;
            log.info("[OFFER_LETTER_GEN] Generated PDF for Deal: {} | Size: {} bytes | Execution Time: {}ms",
                    dto.getOfferLetterNo(), pdfBytes.length, duration);

            return pdfBytes;
        } catch (Exception ex) {
            log.error("[OFFER_LETTER_GEN] Error rendering PDF for Deal {}: {}", dto.getOfferLetterNo(), ex.getMessage(), ex);
            throw new CustomException("Failed to generate Offer Letter PDF: " + ex.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR, ex);
        }
    }
}
