package com.goodearth.postsales.client.context;

import lombok.Builder;
import lombok.Data;

import java.util.UUID;

public class ActivePropertyContext {

    @Data
    @Builder
    public static class PropertyContext {
        private UUID buyerId;
        private UUID workflowId;
        private String bookingId;
        private String dealId;
        private String unitId;
        private String projectId;
    }

    private static final ThreadLocal<PropertyContext> CONTEXT_HOLDER = new ThreadLocal<>();

    public static void setContext(PropertyContext context) {
        CONTEXT_HOLDER.set(context);
    }

    public static PropertyContext getContext() {
        return CONTEXT_HOLDER.get();
    }

    public static UUID getBuyerId() {
        PropertyContext ctx = getContext();
        return ctx != null ? ctx.getBuyerId() : null;
    }

    public static UUID getWorkflowId() {
        PropertyContext ctx = getContext();
        return ctx != null ? ctx.getWorkflowId() : null;
    }

    public static String getBookingId() {
        PropertyContext ctx = getContext();
        return ctx != null ? ctx.getBookingId() : null;
    }

    public static String getDealId() {
        PropertyContext ctx = getContext();
        return ctx != null ? ctx.getDealId() : null;
    }

    public static String getUnitId() {
        PropertyContext ctx = getContext();
        return ctx != null ? ctx.getUnitId() : null;
    }

    public static String getProjectId() {
        PropertyContext ctx = getContext();
        return ctx != null ? ctx.getProjectId() : null;
    }

    public static void clear() {
        CONTEXT_HOLDER.remove();
    }
}
