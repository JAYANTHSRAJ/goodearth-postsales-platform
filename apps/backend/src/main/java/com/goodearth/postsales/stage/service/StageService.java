package com.goodearth.postsales.stage.service;

import com.goodearth.postsales.stage.dto.StageDto;

import java.util.List;
import java.util.UUID;

public interface StageService {
    StageDto createStage(StageDto stageDto);
    StageDto updateStage(UUID id, StageDto stageDto);
    List<StageDto> listStages();
    StageDto getStage(UUID id);
}
