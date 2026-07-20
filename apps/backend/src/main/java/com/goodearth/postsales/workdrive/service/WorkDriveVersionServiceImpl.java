package com.goodearth.postsales.workdrive.service;

import com.goodearth.postsales.workdrive.dto.WorkDriveFileVersionDto;
import com.goodearth.postsales.workdrive.entity.WorkDriveFileVersion;
import com.goodearth.postsales.workdrive.mapper.WorkDriveMapper;
import com.goodearth.postsales.workdrive.repository.WorkDriveFileRepository;
import com.goodearth.postsales.workdrive.repository.WorkDriveFileVersionRepository;
import com.goodearth.postsales.common.exception.CustomException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class WorkDriveVersionServiceImpl implements WorkDriveVersionService {

    private final WorkDriveFileRepository fileRepository;
    private final WorkDriveFileVersionRepository versionRepository;
    private final WorkDriveMapper mapper;

    public WorkDriveVersionServiceImpl(
            WorkDriveFileRepository fileRepository,
            WorkDriveFileVersionRepository versionRepository,
            WorkDriveMapper mapper) {
        this.fileRepository = fileRepository;
        this.versionRepository = versionRepository;
        this.mapper = mapper;
    }

    @Override
    @Transactional(readOnly = true)
    public List<WorkDriveFileVersionDto> getVersionHistory(UUID fileId) {
        if (!fileRepository.existsById(fileId)) {
            throw new CustomException("WorkDrive file not found.", HttpStatus.NOT_FOUND);
        }
        return versionRepository.findByWorkDriveFileIdOrderByVersionAsc(fileId).stream()
                .map(mapper::toDto)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public WorkDriveFileVersionDto getLatestVersion(UUID fileId) {
        if (!fileRepository.existsById(fileId)) {
            throw new CustomException("WorkDrive file not found.", HttpStatus.NOT_FOUND);
        }
        WorkDriveFileVersion version = versionRepository.findFirstByWorkDriveFileIdOrderByVersionDesc(fileId)
                .orElseThrow(() -> new CustomException("No versions found for this file.", HttpStatus.NOT_FOUND));
        return mapper.toDto(version);
    }
}
