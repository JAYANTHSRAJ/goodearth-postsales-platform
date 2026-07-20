package com.goodearth.postsales.client.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class ClientDocumentsGroupedDto {
    private List<ClientDocumentSummaryDto> agreement;
    private List<ClientDocumentSummaryDto> invoice;
    private List<ClientDocumentSummaryDto> receipt;
    private List<ClientDocumentSummaryDto> design;
    private List<ClientDocumentSummaryDto> legal;
    private List<ClientDocumentSummaryDto> other;
}
