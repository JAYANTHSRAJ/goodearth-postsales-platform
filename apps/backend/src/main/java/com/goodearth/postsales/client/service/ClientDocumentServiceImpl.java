package com.goodearth.postsales.client.service;

import com.goodearth.postsales.buyer.entity.Buyer;
import com.goodearth.postsales.client.dto.ClientDocumentSummaryDto;
import com.goodearth.postsales.client.dto.ClientDocumentsGroupedDto;
import com.goodearth.postsales.client.mapper.ClientPortalMapper;
import com.goodearth.postsales.document.dto.DocumentDto;
import com.goodearth.postsales.document.service.DocumentService;
import com.goodearth.postsales.workflow.entity.Workflow;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;

@Service
@Transactional(readOnly = true)
public class ClientDocumentServiceImpl implements ClientDocumentService {

    private final ClientPortalServiceHelper helper;
    private final ClientPortalMapper mapper;
    private final DocumentService documentService;

    public ClientDocumentServiceImpl(
            ClientPortalServiceHelper helper,
            ClientPortalMapper mapper,
            DocumentService documentService) {
        this.helper = helper;
        this.mapper = mapper;
        this.documentService = documentService;
    }

    @Override
    public ClientDocumentsGroupedDto getDocuments(UserDetails userDetails) {
        Buyer buyer = helper.getAuthenticatedBuyer(userDetails);
        Workflow workflow = helper.getBuyerWorkflow(buyer);

        List<DocumentDto> docs = documentService.getDocumentsByWorkflow(workflow.getId());

        ClientDocumentsGroupedDto groupedDto = new ClientDocumentsGroupedDto(
                new ArrayList<>(), new ArrayList<>(), new ArrayList<>(), 
                new ArrayList<>(), new ArrayList<>(), new ArrayList<>()
        );

        for (DocumentDto doc : docs) {
            ClientDocumentSummaryDto summary = mapper.toDocumentSummary(doc);
            if (doc.getDocumentType() == null) {
                groupedDto.getOther().add(summary);
                continue;
            }

            switch (doc.getDocumentType()) {
                case AGREEMENT:
                    groupedDto.getAgreement().add(summary);
                    break;
                case BOOKING_FORM:
                    groupedDto.getLegal().add(summary);
                    break;
                case DESIGN_PLAN:
                    groupedDto.getDesign().add(summary);
                    break;
                case INVOICE:
                    groupedDto.getInvoice().add(summary);
                    break;
                case RECEIPT:
                    groupedDto.getReceipt().add(summary);
                    break;
                case HANDOVER_CERTIFICATE:
                    groupedDto.getLegal().add(summary);
                    break;
                default:
                    groupedDto.getOther().add(summary);
                    break;
            }
        }

        return groupedDto;
    }
}
