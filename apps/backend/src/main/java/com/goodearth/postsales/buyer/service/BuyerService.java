package com.goodearth.postsales.buyer.service;

import com.goodearth.postsales.buyer.dto.BuyerDto;
import java.util.List;

public interface BuyerService {
    List<BuyerDto> getAllBuyers();
    BuyerDto getBuyerById(java.util.UUID id);
    BuyerDto createBuyer(BuyerDto dto);
    BuyerDto updateBuyer(java.util.UUID id, BuyerDto dto);
    void deleteBuyer(java.util.UUID id);
}
