package com.goodearth.postsales.system.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class ZohoConnectivityResponse {
    private String crm;
    private String workdrive;
    private String books;
    private String oauth;
}
