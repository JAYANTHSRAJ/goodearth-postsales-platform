package com.goodearth.postsales.stage.service;

import com.goodearth.postsales.stage.dto.StageDto;
import com.goodearth.postsales.stage.entity.Stage;
import com.goodearth.postsales.stage.mapper.StageMapper;
import com.goodearth.postsales.stage.repository.StageRepository;
import com.goodearth.postsales.common.exception.CustomException;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class StageServiceImpl implements StageService {

    private final StageRepository stageRepository;
    private final StageMapper stageMapper;

    public StageServiceImpl(StageRepository stageRepository, StageMapper stageMapper) {
        this.stageRepository = stageRepository;
        this.stageMapper = stageMapper;
    }

    @Override
    @Transactional
    public StageDto createStage(StageDto stageDto) {
        if (stageDto.getCode() == null || stageDto.getCode().trim().isEmpty()) {
            throw new CustomException("Stage code is required.", HttpStatus.BAD_REQUEST);
        }
        if (stageDto.getName() == null || stageDto.getName().trim().isEmpty()) {
            throw new CustomException("Stage name is required.", HttpStatus.BAD_REQUEST);
        }
        if (stageDto.getSequenceOrder() <= 0) {
            throw new CustomException("Sequence order must be greater than zero.", HttpStatus.BAD_REQUEST);
        }

        if (stageRepository.existsByCode(stageDto.getCode())) {
            throw new CustomException("Stage code must be unique.", HttpStatus.CONFLICT);
        }
        if (stageRepository.existsBySequenceOrder(stageDto.getSequenceOrder())) {
            throw new CustomException("Sequence order must be unique.", HttpStatus.CONFLICT);
        }

        Stage stage = stageMapper.toEntity(stageDto);
        if (stage.getStatus() == null) {
            stage.setStatus(com.goodearth.postsales.stage.entity.StageStatus.ACTIVE);
        }

        Stage savedStage = stageRepository.save(stage);
        return stageMapper.toDto(savedStage);
    }

    @Override
    @Transactional
    public StageDto updateStage(UUID id, StageDto stageDto) {
        Stage stage = stageRepository.findById(id)
                .orElseThrow(() -> new CustomException("Stage not found.", HttpStatus.NOT_FOUND));

        if (stageDto.getCode() != null && !stageDto.getCode().trim().isEmpty()) {
            if (stageRepository.existsByCodeAndIdNot(stageDto.getCode(), id)) {
                throw new CustomException("Stage code must be unique.", HttpStatus.CONFLICT);
            }
            stage.setCode(stageDto.getCode());
        }

        if (stageDto.getName() != null && !stageDto.getName().trim().isEmpty()) {
            stage.setName(stageDto.getName());
        }

        if (stageDto.getDescription() != null) {
            stage.setDescription(stageDto.getDescription());
        }

        if (stageDto.getSequenceOrder() > 0) {
            if (stageRepository.existsBySequenceOrderAndIdNot(stageDto.getSequenceOrder(), id)) {
                throw new CustomException("Sequence order must be unique.", HttpStatus.CONFLICT);
            }
            stage.setSequenceOrder(stageDto.getSequenceOrder());
        }

        if (stageDto.getStatus() != null) {
            stage.setStatus(stageDto.getStatus());
        }

        Stage savedStage = stageRepository.save(stage);
        return stageMapper.toDto(savedStage);
    }

    @Override
    @Transactional(readOnly = true)
    public List<StageDto> listStages() {
        return stageRepository.findAll(Sort.by(Sort.Direction.ASC, "sequenceOrder")).stream()
                .map(stageMapper::toDto)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public StageDto getStage(UUID id) {
        Stage stage = stageRepository.findById(id)
                .orElseThrow(() -> new CustomException("Stage not found.", HttpStatus.NOT_FOUND));
        return stageMapper.toDto(stage);
    }
}
