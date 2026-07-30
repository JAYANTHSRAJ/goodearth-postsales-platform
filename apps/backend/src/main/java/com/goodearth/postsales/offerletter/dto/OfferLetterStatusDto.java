package com.goodearth.postsales.offerletter.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class OfferLetterStatusDto {
    private boolean generated;
    private boolean sent;
    private String sentAt;
    private String sentBy;
    private String message;
    private String fileUrl;
    private String fileName;
    private String dealId;
}
