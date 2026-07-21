package com.goodearth.postsales.config;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.env.EnvironmentPostProcessor;
import org.springframework.core.env.ConfigurableEnvironment;
import org.springframework.core.env.MapPropertySource;

import java.util.HashMap;
import java.util.Map;

public class DatabaseEnvironmentPostProcessor implements EnvironmentPostProcessor {

    @Override
    public void postProcessEnvironment(ConfigurableEnvironment environment, SpringApplication application) {
        String dbUrl = environment.getProperty("DATABASE_URL");
        if (dbUrl == null || dbUrl.trim().isEmpty()) {
            dbUrl = environment.getProperty("spring.datasource.url");
        }

        if (dbUrl != null && !dbUrl.trim().isEmpty()) {
            String formattedUrl = dbUrl.trim();
            if (formattedUrl.startsWith("postgresql://")) {
                formattedUrl = "jdbc:" + formattedUrl;
            } else if (formattedUrl.startsWith("postgres://")) {
                formattedUrl = "jdbc:postgresql://" + formattedUrl.substring("postgres://".length());
            }

            Map<String, Object> props = new HashMap<>();
            props.put("spring.datasource.url", formattedUrl);
            props.put("spring.liquibase.url", formattedUrl);

            environment.getPropertySources().addFirst(new MapPropertySource("railwayDatabaseUrlFix", props));
        }
    }
}
