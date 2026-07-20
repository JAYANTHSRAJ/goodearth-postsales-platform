package com.goodearth.postsales.stage.dto;

import com.goodearth.postsales.stage.entity.StageStatus;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class StageDto {
    private UUID id;
    private String code;
    private String name;
    private String description;
    private int sequenceOrder;
    private StageStatus status;
}
