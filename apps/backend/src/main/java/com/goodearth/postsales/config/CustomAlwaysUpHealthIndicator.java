package com.goodearth.postsales.config;

import org.springframework.boot.actuate.health.Health;
import org.springframework.boot.actuate.health.HealthIndicator;
import org.springframework.stereotype.Component;

@Component("customAlwaysUp")
public class CustomAlwaysUpHealthIndicator implements HealthIndicator {

    @Override
    public Health health() {
        return Health.up()
                .withDetail("service", "postsales-backend")
                .withDetail("status", "UP")
                .build();
    }
}
