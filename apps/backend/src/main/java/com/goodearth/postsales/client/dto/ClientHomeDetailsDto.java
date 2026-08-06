package com.goodearth.postsales.client.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class ClientHomeDetailsDto {
    private String project;
    private String villa;
    private String unitNumber;
    private String block;
    private String unitType;
    private String floor;
    private String area;
    private String facing;
    private String bedrooms;
    private String purchaseDate;
    private String expectedHandover;
    private String possessionDate;
    private String primaryBuyer;
    private String primaryBuyerEmail;
    private String coOwner;
    private String constructionStatus;
    private double completionPercent;
}
