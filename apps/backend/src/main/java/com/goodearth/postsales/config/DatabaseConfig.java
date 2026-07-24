package com.goodearth.postsales.config;

import com.zaxxer.hikari.HikariDataSource;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;

import javax.sql.DataSource;
import java.net.URI;

@Configuration
public class DatabaseConfig {

    private static final Logger log = LoggerFactory.getLogger(DatabaseConfig.class);

    @Value("${spring.datasource.url:}")
    private String rawUrl;

    @Value("${spring.datasource.username:}")
    private String rawUsername;

    @Value("${spring.datasource.password:}")
    private String rawPassword;

    @Value("${SPRING_DATASOURCE_URL:}")
    private String envSpringDatasourceUrl;

    @Value("${DATABASE_URL:}")
    private String envDatabaseUrl;

    @Value("${PGHOST:}")
    private String pgHost;

    @Value("${PGPORT:5432}")
    private String pgPort;

    @Value("${PGUSER:}")
    private String pgUser;

    @Value("${PGPASSWORD:}")
    private String pgPassword;

    @Value("${PGDATABASE:}")
    private String pgDatabase;

    @Bean
    @Primary
    public DataSource dataSource() {
        HikariDataSource dataSource = new HikariDataSource();
        dataSource.setDriverClassName("org.postgresql.Driver");

        String jdbcUrl = null;
        String username = null;
        String password = null;

        // 1. Check SPRING_DATASOURCE_URL
        if (envSpringDatasourceUrl != null && !envSpringDatasourceUrl.isBlank()) {
            jdbcUrl = envSpringDatasourceUrl.trim();
        } else if (rawUrl != null && !rawUrl.isBlank() && !rawUrl.contains("localhost:5432")) {
            jdbcUrl = rawUrl.trim();
        }

        // 2. Check DATABASE_URL (Railway default environment variable)
        if ((jdbcUrl == null || jdbcUrl.isBlank()) && envDatabaseUrl != null && !envDatabaseUrl.isBlank()) {
            String dbUrl = envDatabaseUrl.trim();
            if (dbUrl.startsWith("jdbc:")) {
                jdbcUrl = dbUrl;
            } else if (dbUrl.startsWith("postgres://") || dbUrl.startsWith("postgresql://")) {
                try {
                    URI uri = new URI(dbUrl.replace("postgresql://", "http://").replace("postgres://", "http://"));
                    String host = uri.getHost();
                    int port = uri.getPort() == -1 ? 5432 : uri.getPort();
                    String path = uri.getPath();
                    jdbcUrl = "jdbc:postgresql://" + host + ":" + port + path;
                    if (uri.getUserInfo() != null) {
                        String[] userInfo = uri.getUserInfo().split(":");
                        if (userInfo.length > 0) username = userInfo[0];
                        if (userInfo.length > 1) password = userInfo[1];
                    }
                } catch (Exception e) {
                    log.warn("Failed to parse DATABASE_URL URI, using fallback raw: {}", e.getMessage());
                    jdbcUrl = "jdbc:" + dbUrl;
                }
            } else {
                jdbcUrl = "jdbc:postgresql://" + dbUrl;
            }
        }

        // 3. Check PGHOST / PGPORT / PGDATABASE (Railway PostgreSQL variables)
        if ((jdbcUrl == null || jdbcUrl.isBlank()) && pgHost != null && !pgHost.isBlank()) {
            String dbName = (pgDatabase != null && !pgDatabase.isBlank()) ? pgDatabase : "goodearth";
            jdbcUrl = "jdbc:postgresql://" + pgHost.trim() + ":" + pgPort.trim() + "/" + dbName.trim();
        }

        // Fallback default
        if (jdbcUrl == null || jdbcUrl.isBlank()) {
            jdbcUrl = (rawUrl != null && !rawUrl.isBlank()) ? rawUrl.trim() : "jdbc:postgresql://localhost:5432/goodearth";
        }

        // Resolve Username & Password
        if (username == null || username.isBlank()) {
            if (rawUsername != null && !rawUsername.isBlank()) username = rawUsername.trim();
            else if (pgUser != null && !pgUser.isBlank()) username = pgUser.trim();
            else username = "postgres";
        }

        if (password == null || password.isBlank()) {
            if (rawPassword != null) password = rawPassword;
            else if (pgPassword != null) password = pgPassword;
            else password = "postgres";
        }

        log.info("Database Connection Configured. JDBC URL: {}, Username: {}", jdbcUrl, username);
        dataSource.setJdbcUrl(jdbcUrl);
        dataSource.setUsername(username);
        dataSource.setPassword(password);

        // Hikari Performance & Connection Pool Tuning for Container Stability
        dataSource.setMaximumPoolSize(10);
        dataSource.setMinimumIdle(2);
        dataSource.setIdleTimeout(30000);
        dataSource.setConnectionTimeout(20000);
        dataSource.setMaxLifetime(1800000);

        return dataSource;
    }
}
