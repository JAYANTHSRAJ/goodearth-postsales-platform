package com.goodearth.postsales.client.service;

import org.springframework.web.multipart.MultipartFile;

public interface VirusScannerService {

    /**
     * Virus scanning integration point.
     * Evaluates uploaded file bytes for malware signatures.
     *
     * @param file uploaded MultipartFile
     * @return true if clean, false if infected
     */
    boolean scanFile(MultipartFile file);
}
