package com.goodearth.postsales.integration.sign;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.validation.annotation.Validated;
import jakarta.validation.constraints.NotBlank;

@Getter
@Setter
@Validated
@ConfigurationProperties(prefix = "app.sign")
public class ZohoSignProperties {

    @NotBlank
    private String apiUrl;
}
