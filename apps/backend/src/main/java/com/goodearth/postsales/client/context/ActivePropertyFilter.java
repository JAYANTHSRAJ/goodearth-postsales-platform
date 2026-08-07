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
public class ActivePropertyFilter extends OncePerRequestFilter {

    public static final String HEADER_PROPERTY_BUYER_ID = "X-Active-Property-Buyer-ID";
    public static final String HEADER_PROPERTY_BOOKING_ID = "X-Active-Property-Booking-ID";
    public static final String HEADER_PROPERTY_DEAL_ID = "X-Active-Property-Deal-ID";
    public static final String HEADER_PROPERTY_UNIT_ID = "X-Active-Property-Unit-ID";
    public static final String HEADER_PROPERTY_PROJECT_ID = "X-Active-Property-Project-ID";
    public static final String HEADER_WORKFLOW_ID = "X-Active-Workflow-ID";
    public static final String HEADER_ACTIVE_UNIT_ID = "X-Active-Unit-ID";

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {
        
        String buyerIdStr = request.getHeader(HEADER_PROPERTY_BUYER_ID);
        if (buyerIdStr == null || buyerIdStr.isBlank()) {
            buyerIdStr = request.getHeader(HEADER_ACTIVE_UNIT_ID);
        }

        String workflowIdStr = request.getHeader(HEADER_WORKFLOW_ID);
        String bookingId = request.getHeader(HEADER_PROPERTY_BOOKING_ID);
        String dealId = request.getHeader(HEADER_PROPERTY_DEAL_ID);
        String unitId = request.getHeader(HEADER_PROPERTY_UNIT_ID);
        String projectId = request.getHeader(HEADER_PROPERTY_PROJECT_ID);

        UUID buyerId = parseUuid(buyerIdStr);
        UUID workflowId = parseUuid(workflowIdStr);

        ActivePropertyContext.PropertyContext context = ActivePropertyContext.PropertyContext.builder()
                .buyerId(buyerId)
                .workflowId(workflowId)
                .bookingId(bookingId != null ? bookingId.trim() : null)
                .dealId(dealId != null ? dealId.trim() : null)
                .unitId(unitId != null ? unitId.trim() : null)
                .projectId(projectId != null ? projectId.trim() : null)
                .build();

        ActivePropertyContext.setContext(context);
        ActiveUnitContext.setActiveUnitId(buyerId != null ? buyerId : workflowId);

        try {
            filterChain.doFilter(request, response);
        } finally {
            ActivePropertyContext.clear();
            ActiveUnitContext.clear();
        }
    }

    private UUID parseUuid(String val) {
        if (val == null || val.isBlank()) return null;
        try {
            return UUID.fromString(val.trim());
        } catch (Exception ex) {
            return null;
        }
    }
}
