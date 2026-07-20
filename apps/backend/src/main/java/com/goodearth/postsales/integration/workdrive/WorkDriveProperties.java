package com.goodearth.postsales.integration.workdrive;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.validation.annotation.Validated;
import jakarta.validation.constraints.NotBlank;

@Getter
@Setter
@Validated
@ConfigurationProperties(prefix = "app.workdrive")
public class WorkDriveProperties {

    @NotBlank
    private String apiUrl;
}
