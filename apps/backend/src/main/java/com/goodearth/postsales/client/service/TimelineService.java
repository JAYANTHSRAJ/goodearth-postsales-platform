package com.goodearth.postsales.client.service;

import com.goodearth.postsales.client.dto.ClientTimelineEventDto;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.List;

public interface TimelineService {
    List<ClientTimelineEventDto> getTimeline(UserDetails userDetails);
}
