package com.goodearth.postsales.client.context;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.UUID;

@Component
public class ActiveUnitFilter extends OncePerRequestFilter {

    public static final String HEADER_ACTIVE_UNIT_ID = "X-Active-Unit-ID";

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {
        String unitIdHeader = request.getHeader(HEADER_ACTIVE_UNIT_ID);
        if (unitIdHeader != null && !unitIdHeader.trim().isEmpty()) {
            try {
                UUID unitId = UUID.fromString(unitIdHeader.trim());
                ActiveUnitContext.setActiveUnitId(unitId);
            } catch (Exception ex) {
                // Ignore invalid UUID string formats
            }
        }
        try {
            filterChain.doFilter(request, response);
        } finally {
            ActiveUnitContext.clear();
        }
    }
}
