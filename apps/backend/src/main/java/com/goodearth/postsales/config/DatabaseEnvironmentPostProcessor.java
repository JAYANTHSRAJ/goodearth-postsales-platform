package com.goodearth.postsales.config;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.env.EnvironmentPostProcessor;
import org.springframework.core.env.ConfigurableEnvironment;
import org.springframework.core.env.MapPropertySource;

import java.net.URI;
import java.util.HashMap;
import java.util.Map;

public class DatabaseEnvironmentPostProcessor implements EnvironmentPostProcessor {

    @Override
    public void postProcessEnvironment(ConfigurableEnvironment environment, SpringApplication application) {
        String dbUrl = environment.getProperty("DATABASE_URL");
        if (dbUrl == null || dbUrl.trim().isEmpty()) {
            dbUrl = environment.getProperty("spring.datasource.url");
        }

        if (dbUrl == null || dbUrl.trim().isEmpty()) {
            return;
        }

        String raw = dbUrl.trim();

        // Only rewrite libpq-style URLs. Leave already-valid jdbc: URLs untouched.
        if (!raw.startsWith("postgresql://") && !raw.startsWith("postgres://")) {
            return;
        }

        // Normalize scheme to a parseable form.
        String parseable = raw.startsWith("postgres://")
                ? "postgresql://" + raw.substring("postgres://".length())
                : raw;

        try {
            URI uri = URI.create(parseable);

            String host = uri.getHost();
            int port = uri.getPort() == -1 ? 5432 : uri.getPort();
            String path = uri.getPath(); // includes leading "/"
            String query = uri.getQuery();

            StringBuilder jdbcUrl = new StringBuilder("jdbc:postgresql://")
                    .append(host)
                    .append(":")
                    .append(port)
                    .append(path == null || path.isEmpty() ? "/" : path);
            if (query != null && !query.isEmpty()) {
                jdbcUrl.append("?").append(query);
            }

            Map<String, Object> props = new HashMap<>();
            props.put("spring.datasource.url", jdbcUrl.toString());
            props.put("spring.liquibase.url", jdbcUrl.toString());

            String userInfo = uri.getUserInfo();
            if (userInfo != null && !userInfo.isEmpty()) {
                int sep = userInfo.indexOf(':');
                String username = sep >= 0 ? userInfo.substring(0, sep) : userInfo;
                String password = sep >= 0 ? userInfo.substring(sep + 1) : "";
                if (!username.isEmpty()) {
                    props.put("spring.datasource.username", username);
                    props.put("spring.liquibase.user", username);
                }
                if (!password.isEmpty()) {
                    props.put("spring.datasource.password", password);
                    props.put("spring.liquibase.password", password);
                }
            }

            environment.getPropertySources().addFirst(new MapPropertySource("railwayDatabaseUrlFix", props));
        } catch (Exception ignored) {
            // If parsing fails, leave the environment unchanged so existing config applies.
        }
    }
}
