package com.goodearth.postsales.client.service;

import com.goodearth.postsales.client.dto.ClientProjectUpdateDto;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.List;

public interface ConstructionUpdateService {
    List<ClientProjectUpdateDto> getProjectUpdates(UserDetails userDetails);
}
