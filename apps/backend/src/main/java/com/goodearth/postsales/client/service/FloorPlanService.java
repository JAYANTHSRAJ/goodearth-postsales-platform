package com.goodearth.postsales.client.service;

import com.goodearth.postsales.client.dto.ClientDrawingSummaryDto;
import com.goodearth.postsales.client.dto.ClientFloorPlansDto;
import org.springframework.security.core.userdetails.UserDetails;

public interface FloorPlanService {
    ClientFloorPlansDto getFloorPlans(UserDetails userDetails);
    ClientDrawingSummaryDto getFloorPlanById(UserDetails userDetails, String attachmentId);
    byte[] downloadAttachment(String dealId, String attachmentId);
}
