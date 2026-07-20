package com.goodearth.postsales.client.service;

import com.goodearth.postsales.client.dto.ClientDashboardDto;
import org.springframework.security.core.userdetails.UserDetails;

public interface DashboardService {
    ClientDashboardDto getDashboard(org.springframework.security.core.userdetails.UserDetails userDetails, java.util.UUID workflowId);
}
