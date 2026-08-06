package com.goodearth.postsales.client.controller;

import com.goodearth.postsales.client.dto.ClientAttachmentDto;
import com.goodearth.postsales.client.service.ClientAttachmentService;
import com.goodearth.postsales.common.response.ApiResponse;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/client/attachments")
public class ClientAttachmentController {

    private final ClientAttachmentService attachmentService;

    public ClientAttachmentController(ClientAttachmentService attachmentService) {
        this.attachmentService = attachmentService;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<ClientAttachmentDto>>> getAttachments(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestParam(required = false) String category,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String sort) {
        List<ClientAttachmentDto> result = attachmentService.getAttachments(userDetails, category, search, sort);
        return ResponseEntity.ok(new ApiResponse<>(result));
    }

    @GetMapping("/{attachmentId}")
    public ResponseEntity<ApiResponse<ClientAttachmentDto>> getAttachmentById(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable String attachmentId) {
        ClientAttachmentDto result = attachmentService.getAttachmentById(userDetails, attachmentId);
        return ResponseEntity.ok(new ApiResponse<>(result));
    }

    @GetMapping("/{attachmentId}/content")
    public ResponseEntity<byte[]> streamAttachmentContent(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable String attachmentId) {
        ClientAttachmentDto dto = attachmentService.getAttachmentById(userDetails, attachmentId);
        byte[] data = attachmentService.streamAttachmentContent(userDetails, attachmentId);

        HttpHeaders headers = new HttpHeaders();
        try {
            headers.setContentType(MediaType.parseMediaType(dto.getMimeType()));
        } catch (Exception ex) {
            headers.setContentType(MediaType.APPLICATION_OCTET_STREAM);
        }
        headers.setContentDisposition(org.springframework.http.ContentDisposition.inline().filename(dto.getFileName()).build());

        return new ResponseEntity<>(data, headers, HttpStatus.OK);
    }

    @GetMapping("/{attachmentId}/download")
    public ResponseEntity<byte[]> downloadAttachmentContent(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable String attachmentId) {
        ClientAttachmentDto dto = attachmentService.getAttachmentById(userDetails, attachmentId);
        byte[] data = attachmentService.downloadAttachmentContent(userDetails, attachmentId);

        HttpHeaders headers = new HttpHeaders();
        try {
            headers.setContentType(MediaType.parseMediaType(dto.getMimeType()));
        } catch (Exception ex) {
            headers.setContentType(MediaType.APPLICATION_OCTET_STREAM);
        }
        headers.setContentDispositionFormData("attachment", dto.getFileName());

        return new ResponseEntity<>(data, headers, HttpStatus.OK);
    }
}
