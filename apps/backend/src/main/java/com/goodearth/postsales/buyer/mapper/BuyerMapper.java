package com.goodearth.postsales.buyer.mapper;

import com.goodearth.postsales.buyer.entity.Buyer;
import com.goodearth.postsales.integration.zoho.dto.ZohoContactResponse;
import org.springframework.stereotype.Component;

@Component
public class BuyerMapper {

    public Buyer toEntity(ZohoContactResponse.ZohoContact crmContact) {
        if (crmContact == null) {
            return null;
        }
        Buyer buyer = new Buyer();
        buyer.setZohoContactId(crmContact.getId());
        buyer.setFullName(crmContact.getResolvedFullName());
        buyer.setEmail(crmContact.getEmail());
        buyer.setPhone(crmContact.getPhone());
        buyer.setStatus(crmContact.getStatus());
        return buyer;
    }
}
