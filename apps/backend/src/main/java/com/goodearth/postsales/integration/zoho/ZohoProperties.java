package com.goodearth.postsales.integration.zoho;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.validation.annotation.Validated;
import jakarta.validation.constraints.NotBlank;

@Getter
@Setter
@Validated
@ConfigurationProperties(prefix = "app.zoho")
public class ZohoProperties {

    @NotBlank
    private String clientId;

    @NotBlank
    private String clientSecret;

    @NotBlank
    private String refreshToken;

    @NotBlank
    private String accountsUrl;

    @NotBlank
    private String crmApiUrl;
}
