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
    private String area;
    private String facing;
    private String plot;
    private String constructionStatus;
    private double completionPercent;
    private String expectedHandover;
}
