package com.goodearth.postsales.system.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class DashboardItemDto {
    private String id;
    private String title;
    private String subtitle;
    private String extra;
}
