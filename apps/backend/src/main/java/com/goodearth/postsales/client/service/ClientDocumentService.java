package com.goodearth.postsales.client.service;

import com.goodearth.postsales.client.dto.ClientDocumentsGroupedDto;
import org.springframework.security.core.userdetails.UserDetails;

public interface ClientDocumentService {
    ClientDocumentsGroupedDto getDocuments(UserDetails userDetails);
}
