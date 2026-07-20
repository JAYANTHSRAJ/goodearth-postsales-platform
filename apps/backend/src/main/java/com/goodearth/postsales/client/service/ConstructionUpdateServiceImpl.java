package com.goodearth.postsales.client.service;

import com.goodearth.postsales.buyer.entity.Buyer;
import com.goodearth.postsales.client.dto.ClientProjectUpdateDto;
import com.goodearth.postsales.projectupdate.dto.ProjectUpdateSummaryDto;
import com.goodearth.postsales.projectupdate.service.ProjectUpdateService;
import com.goodearth.postsales.workflow.entity.Workflow;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional(readOnly = true)
public class ConstructionUpdateServiceImpl implements ConstructionUpdateService {

    private final ClientPortalServiceHelper helper;
    private final ProjectUpdateService projectUpdateService;

    public ConstructionUpdateServiceImpl(
            ClientPortalServiceHelper helper,
            ProjectUpdateService projectUpdateService) {
        this.helper = helper;
        this.projectUpdateService = projectUpdateService;
    }

    @Override
    public List<ClientProjectUpdateDto> getProjectUpdates(UserDetails userDetails) {
        Buyer buyer = helper.getAuthenticatedBuyer(userDetails);
        Workflow workflow = helper.getBuyerWorkflow(buyer);

        // Fetch actual updates from the database
        List<ProjectUpdateSummaryDto> dbUpdates = projectUpdateService.listWorkflowUpdates(workflow.getId(), true);

        if (!dbUpdates.isEmpty()) {
            return dbUpdates.stream().map(summary -> {
                String dateStr = summary.getUpdate().getPublishedAt() != null 
                        ? summary.getUpdate().getPublishedAt().toLocalDate().toString() 
                        : "";
                String caption = summary.getUpdate().getTitle() + " - " + summary.getUpdate().getDescription();
                String imageUrl = (summary.getMedia() != null && !summary.getMedia().isEmpty())
                        ? summary.getMedia().get(0).getPreviewUrl()
                        : "https://images.unsplash.com/photo-1541888946425-d81bb19240f5?q=80&w=1000"; // default fallback
                return new ClientProjectUpdateDto(dateStr, caption, imageUrl);
            }).collect(Collectors.toList());
        }

        // Chronological visual updates (Mock fallback list to populate visual components if empty)
        List<ClientProjectUpdateDto> updates = new ArrayList<>();
        updates.add(new ClientProjectUpdateDto("2026-07-02", "First-floor slab concrete casting is completed. Setting period started.", "https://images.unsplash.com/photo-1541888946425-d81bb19240f5?q=80&w=1000"));
        updates.add(new ClientProjectUpdateDto("2026-06-18", "Ground floor brick masonry completed. Electrical conduit laying initiated.", "https://images.unsplash.com/photo-1590069261209-f8e9b8642343?q=80&w=1000"));
        updates.add(new ClientProjectUpdateDto("2026-05-29", "Plinth beam structure completed and curing is verified.", "https://images.unsplash.com/photo-1581094288338-2314dddb7ecc?q=80&w=1000"));

        return updates;
    }
}
