package com.goodearth.postsales.kyc.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class KycAutosaveRequestDto {

    @NotBlank(message = "Booking ID is required")
    private String bookingId;

    @NotBlank(message = "Field path is required")
    private String fieldPath;

    private Object value;
}
