package com.goodearth.postsales.client.context;

import java.util.UUID;

public class ActiveUnitContext {
    private static final ThreadLocal<UUID> ACTIVE_UNIT_HOLDER = new ThreadLocal<>();

    public static void setActiveUnitId(UUID unitId) {
        ACTIVE_UNIT_HOLDER.set(unitId);
    }

    public static UUID getActiveUnitId() {
        return ACTIVE_UNIT_HOLDER.get();
    }

    public static void clear() {
        ACTIVE_UNIT_HOLDER.remove();
    }
}
