package com.goodearth.postsales.offerletter.util;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.text.DecimalFormat;
import java.text.DecimalFormatSymbols;
import java.util.Locale;

public class IndianCurrencyFormatter {

    private static final String[] UNITS = {
            "", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten",
            "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"
    };

    private static final String[] TENS = {
            "", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"
    };

    /**
     * Formats a BigDecimal or Number into Indian Rupee format, e.g. "INR 3,76,19,048" or "INR 94,048".
     */
    public static String formatCurrency(BigDecimal amount) {
        if (amount == null) {
            return "";
        }
        BigDecimal rounded = amount.setScale(0, RoundingMode.HALF_UP);
        long value = rounded.longValue();
        if (value == 0) {
            return "INR 0";
        }

        boolean negative = value < 0;
        String str = String.valueOf(Math.abs(value));

        if (str.length() <= 3) {
            return "INR " + (negative ? "-" : "") + str;
        }

        String lastThree = str.substring(str.length() - 3);
        String remaining = str.substring(0, str.length() - 3);

        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < remaining.length(); i++) {
            if (i > 0 && (remaining.length() - i) % 2 == 0) {
                sb.append(',');
            }
            sb.append(remaining.charAt(i));
        }
        sb.append(',').append(lastThree);

        return "INR " + (negative ? "-" : "") + sb.toString();
    }

    public static String formatCurrency(Double amount) {
        if (amount == null) {
            return "";
        }
        return formatCurrency(BigDecimal.valueOf(amount));
    }

    public static String formatCurrency(Long amount) {
        if (amount == null) {
            return "";
        }
        return formatCurrency(BigDecimal.valueOf(amount));
    }

    /**
     * Converts an amount into Indian English Words, e.g. "Rupees Three Crore Ninety Five Lakh Only".
     */
    public static String convertToWords(BigDecimal amount) {
        if (amount == null) {
            return "";
        }
        if (amount.compareTo(BigDecimal.ZERO) == 0) {
            return "Rupees Zero Only";
        }

        long n = amount.setScale(0, RoundingMode.HALF_UP).longValue();
        if (n < 0) {
            return "Minus " + convertToWords(BigDecimal.valueOf(-n));
        }

        StringBuilder words = new StringBuilder();

        long crore = n / 10000000;
        n %= 10000000;

        long lakh = n / 100000;
        n %= 100000;

        long thousand = n / 1000;
        n %= 1000;

        long hundred = n / 100;
        n %= 100;

        if (crore > 0) {
            words.append(convertThreeDigits(crore)).append(" Crore ");
        }
        if (lakh > 0) {
            words.append(convertThreeDigits(lakh)).append(" Lakh ");
        }
        if (thousand > 0) {
            words.append(convertThreeDigits(thousand)).append(" Thousand ");
        }
        if (hundred > 0) {
            words.append(convertThreeDigits(hundred)).append(" Hundred ");
        }
        if (n > 0) {
            words.append(convertThreeDigits(n)).append(" ");
        }

        return "Rupees " + words.toString().trim() + " Only";
    }

    private static String convertThreeDigits(long number) {
        if (number == 0) {
            return "";
        }
        if (number < 20) {
            return UNITS[(int) number];
        }
        if (number < 100) {
            return TENS[(int) (number / 10)] + ((number % 10 != 0) ? " " + UNITS[(int) (number % 10)] : "");
        }

        long hundredPart = number / 100;
        long restPart = number % 100;

        String result = UNITS[(int) hundredPart] + " Hundred";
        if (restPart > 0) {
            result += " " + convertThreeDigits(restPart);
        }
        return result;
    }
}
