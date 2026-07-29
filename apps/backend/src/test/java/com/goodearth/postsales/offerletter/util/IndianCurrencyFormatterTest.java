package com.goodearth.postsales.offerletter.util;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;

import static org.junit.jupiter.api.Assertions.assertEquals;

public class IndianCurrencyFormatterTest {

    @Test
    @DisplayName("formatCurrency formats numbers according to Indian numbering system")
    void testFormatCurrency() {
        assertEquals("INR 3,76,19,048", IndianCurrencyFormatter.formatCurrency(new BigDecimal("37619048")));
        assertEquals("INR 18,80,952", IndianCurrencyFormatter.formatCurrency(new BigDecimal("1880952")));
        assertEquals("INR 3,95,00,000", IndianCurrencyFormatter.formatCurrency(new BigDecimal("39500000")));
        assertEquals("INR 2,00,000", IndianCurrencyFormatter.formatCurrency(new BigDecimal("200000")));
    }

    @Test
    @DisplayName("convertToWords converts BigDecimal into Indian Rupee words")
    void testConvertToWords() {
        assertEquals("Rupees Three Crore Ninety Five Lakh Only",
                IndianCurrencyFormatter.convertToWords(new BigDecimal("39500000")));
        assertEquals("Rupees Two Lakh Only",
                IndianCurrencyFormatter.convertToWords(new BigDecimal("200000")));
    }
}
