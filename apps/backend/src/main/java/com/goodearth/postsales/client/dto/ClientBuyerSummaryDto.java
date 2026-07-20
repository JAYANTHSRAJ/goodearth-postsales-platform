package com.goodearth.postsales.client.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class ClientBuyerSummaryDto {
    private UUID id;
    private String fullName;
    private String email;
    private String phone;
}
