package com.goodearth.postsales;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.ConfigurationPropertiesScan;
import org.springframework.cache.annotation.EnableCaching;

@SpringBootApplication
@ConfigurationPropertiesScan
@EnableCaching
@org.springframework.scheduling.annotation.EnableScheduling
public class PostSalesApplication {

    public static void main(String[] args) {
        SpringApplication.run(PostSalesApplication.class, args);
    }
}
