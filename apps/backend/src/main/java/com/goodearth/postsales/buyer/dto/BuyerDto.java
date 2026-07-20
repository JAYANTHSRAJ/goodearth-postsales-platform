package com.goodearth.postsales.buyer.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class BuyerDto {
    private UUID id;
    private String name;
    private String email;
    private String projectName;
    private String unitName;
    private String status;
    private String totalPaid;
    private String outstanding;
    private String bookingDate;
    private String coApplicantName;
    private String phone;
}
