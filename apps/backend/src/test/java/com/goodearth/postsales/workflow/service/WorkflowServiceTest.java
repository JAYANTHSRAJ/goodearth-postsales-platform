package com.goodearth.postsales.workflow.service;

import com.goodearth.postsales.buyer.entity.Buyer;
import com.goodearth.postsales.buyer.repository.BuyerRepository;
import com.goodearth.postsales.common.exception.CustomException;
import com.goodearth.postsales.project.entity.Project;
import com.goodearth.postsales.project.repository.ProjectRepository;
import com.goodearth.postsales.workflow.dto.WorkflowDto;
import com.goodearth.postsales.workflow.entity.Workflow;
import com.goodearth.postsales.workflow.entity.WorkflowStatus;
import com.goodearth.postsales.workflow.mapper.WorkflowMapper;
import com.goodearth.postsales.workflow.repository.WorkflowRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;

import java.util.Arrays;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class WorkflowServiceTest {

    @Mock
    private WorkflowRepository workflowRepository;

    @Mock
    private BuyerRepository buyerRepository;

    @Mock
    private ProjectRepository projectRepository;

    @Mock
    private WorkflowMapper workflowMapper;

    @InjectMocks
    private WorkflowServiceImpl workflowService;

    @Test
    public void testCreateWorkflow_Success() {
        UUID buyerId = UUID.randomUUID();
        UUID projectId = UUID.randomUUID();
        Buyer buyer = new Buyer();
        buyer.setId(buyerId);
        Project project = new Project();
        project.setId(projectId);

        Workflow workflow = new Workflow();
        workflow.setBuyer(buyer);
        workflow.setProject(project);
        workflow.setStatus(WorkflowStatus.ACTIVE);

        WorkflowDto dto = new WorkflowDto();
        dto.setStatus(WorkflowStatus.ACTIVE);

        when(buyerRepository.findById(buyerId)).thenReturn(Optional.of(buyer));
        when(projectRepository.findById(projectId)).thenReturn(Optional.of(project));
        when(workflowRepository.existsByBuyerIdAndProjectIdAndStatus(buyerId, projectId, WorkflowStatus.ACTIVE)).thenReturn(false);
        when(workflowRepository.existsByBuyerIdAndProjectId(buyerId, projectId)).thenReturn(false);
        when(workflowRepository.save(any(Workflow.class))).thenReturn(workflow);
        when(workflowMapper.toDto(any(Workflow.class))).thenReturn(dto);

        WorkflowDto result = workflowService.createWorkflow(buyerId, projectId);

        assertNotNull(result);
        assertEquals(WorkflowStatus.ACTIVE, result.getStatus());
        verify(workflowRepository).save(any(Workflow.class));
    }

    @Test
    public void testCreateWorkflow_BuyerNotFound() {
        UUID buyerId = UUID.randomUUID();
        UUID projectId = UUID.randomUUID();

        when(buyerRepository.findById(buyerId)).thenReturn(Optional.empty());

        CustomException exception = assertThrows(CustomException.class, () -> {
            workflowService.createWorkflow(buyerId, projectId);
        });

        assertEquals(HttpStatus.NOT_FOUND, exception.getStatus());
        assertEquals("Buyer not found.", exception.getMessage());
    }

    @Test
    public void testGetWorkflow_Success() {
        UUID workflowId = UUID.randomUUID();
        Workflow workflow = new Workflow();
        workflow.setId(workflowId);

        WorkflowDto dto = new WorkflowDto();
        dto.setId(workflowId);

        when(workflowRepository.findById(workflowId)).thenReturn(Optional.of(workflow));
        when(workflowMapper.toDto(workflow)).thenReturn(dto);

        WorkflowDto result = workflowService.getWorkflow(workflowId);

        assertNotNull(result);
        assertEquals(workflowId, result.getId());
    }

    @Test
    public void testGetWorkflow_NotFound() {
        UUID workflowId = UUID.randomUUID();

        when(workflowRepository.findById(workflowId)).thenReturn(Optional.empty());

        CustomException exception = assertThrows(CustomException.class, () -> {
            workflowService.getWorkflow(workflowId);
        });

        assertEquals(HttpStatus.NOT_FOUND, exception.getStatus());
    }
}
