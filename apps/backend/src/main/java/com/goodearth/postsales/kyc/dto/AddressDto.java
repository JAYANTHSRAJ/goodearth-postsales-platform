package com.goodearth.postsales.kyc.dto;

import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AddressDto {

    @Size(max = 500, message = "Street address must not exceed 500 characters")
    private String street;

    @Size(max = 100, message = "City must not exceed 100 characters")
    private String city;

    @Size(max = 100, message = "State must not exceed 100 characters")
    private String state;

    @Size(max = 20, message = "Pincode must not exceed 20 characters")
    private String pincode;

    @Size(max = 100, message = "Country must not exceed 100 characters")
    private String country;
}
