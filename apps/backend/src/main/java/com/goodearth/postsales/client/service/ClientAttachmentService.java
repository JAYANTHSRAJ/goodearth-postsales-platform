package com.goodearth.postsales.client.service;

import com.goodearth.postsales.client.dto.ClientAttachmentDto;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.List;

public interface ClientAttachmentService {
    List<ClientAttachmentDto> getAttachments(UserDetails userDetails, String category, String search, String sort);
    ClientAttachmentDto getAttachmentById(UserDetails userDetails, String attachmentId);
    byte[] streamAttachmentContent(UserDetails userDetails, String attachmentId);
    byte[] downloadAttachmentContent(UserDetails userDetails, String attachmentId);
}
