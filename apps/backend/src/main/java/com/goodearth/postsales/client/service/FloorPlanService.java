package com.goodearth.postsales.client.service;

import com.goodearth.postsales.client.dto.ClientFloorPlansDto;
import org.springframework.security.core.userdetails.UserDetails;

public interface FloorPlanService {
    ClientFloorPlansDto getFloorPlans(UserDetails userDetails);
}
