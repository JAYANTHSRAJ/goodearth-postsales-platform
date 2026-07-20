package com.goodearth.postsales.stage.mapper;

import com.goodearth.postsales.stage.dto.StageDto;
import com.goodearth.postsales.stage.entity.Stage;
import org.springframework.stereotype.Component;

@Component
public class StageMapper {

    public StageDto toDto(Stage stage) {
        if (stage == null) {
            return null;
        }
        StageDto dto = new StageDto();
        dto.setId(stage.getId());
        dto.setCode(stage.getCode());
        dto.setName(stage.getName());
        dto.setDescription(stage.getDescription());
        dto.setSequenceOrder(stage.getSequenceOrder());
        dto.setStatus(stage.getStatus());
        return dto;
    }

    public Stage toEntity(StageDto dto) {
        if (dto == null) {
            return null;
        }
        Stage stage = new Stage();
        stage.setId(dto.getId());
        stage.setCode(dto.getCode());
        stage.setName(dto.getName());
        stage.setDescription(dto.getDescription());
        stage.setSequenceOrder(dto.getSequenceOrder());
        stage.setStatus(dto.getStatus());
        return stage;
    }
}
