package com.goodearth.postsales.buyer.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class BuyerSyncResponse {
    private int totalFetched;
    private int created;
    private int updated;
    private int skipped;
}
