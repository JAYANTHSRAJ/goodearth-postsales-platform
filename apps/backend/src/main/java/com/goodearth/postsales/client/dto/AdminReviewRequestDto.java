package com.goodearth.postsales.client.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class AdminReviewRequestDto {

    @NotNull(message = "Decision action is required")
    private String action; // APPROVED, REJECTED, MODIFICATION_REQUESTED

    private String comments;
}
