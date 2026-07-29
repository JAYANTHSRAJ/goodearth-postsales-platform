package com.goodearth.postsales.offerletter.util;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;

import static org.junit.jupiter.api.Assertions.assertEquals;

public class IndianCurrencyFormatterTest {

    @Test
    @DisplayName("formatCurrency formats numbers according to Indian numbering system")
    void testFormatCurrency() {
        assertEquals("INR 1,23,45,678", IndianCurrencyFormatter.formatCurrency(new BigDecimal("12345678")));
        assertEquals("INR 5,00,000", IndianCurrencyFormatter.formatCurrency(new BigDecimal("500000")));
        assertEquals("INR 1,00,00,000", IndianCurrencyFormatter.formatCurrency(new BigDecimal("10000000")));
        assertEquals("INR 3,00,000", IndianCurrencyFormatter.formatCurrency(new BigDecimal("300000")));
    }

    @Test
    @DisplayName("convertToWords converts BigDecimal into Indian Rupee words")
    void testConvertToWords() {
        assertEquals("Rupees One Crore Only",
                IndianCurrencyFormatter.convertToWords(new BigDecimal("10000000")));
        assertEquals("Rupees Three Lakh Only",
                IndianCurrencyFormatter.convertToWords(new BigDecimal("300000")));
    }
}
