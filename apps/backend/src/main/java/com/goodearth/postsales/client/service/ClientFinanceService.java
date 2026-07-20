package com.goodearth.postsales.client.service;

import com.goodearth.postsales.client.dto.ClientFinanceDto;
import org.springframework.security.core.userdetails.UserDetails;

public interface ClientFinanceService {
    ClientFinanceDto getFinanceSummary(UserDetails userDetails);
}
