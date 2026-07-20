package com.goodearth.postsales.client.service;

import com.goodearth.postsales.client.dto.ClientHomeDetailsDto;
import org.springframework.security.core.userdetails.UserDetails;

public interface ClientHomeService {
    ClientHomeDetailsDto getHomeDetails(org.springframework.security.core.userdetails.UserDetails userDetails, java.util.UUID workflowId);
}
