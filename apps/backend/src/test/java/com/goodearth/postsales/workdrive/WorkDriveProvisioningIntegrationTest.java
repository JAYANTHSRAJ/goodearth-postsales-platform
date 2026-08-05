package com.goodearth.postsales.workdrive;

import com.goodearth.postsales.buyer.entity.Buyer;
import com.goodearth.postsales.buyer.repository.BuyerRepository;
import com.goodearth.postsales.client.dto.ClientFloorPlansDto;
import com.goodearth.postsales.client.service.FloorPlanService;
import com.goodearth.postsales.document.entity.Document;
import com.goodearth.postsales.document.entity.DocumentType;
import com.goodearth.postsales.document.repository.DocumentRepository;
import com.goodearth.postsales.integration.workdrive.dto.ZohoWorkDriveResponse;
import com.goodearth.postsales.integration.zoho.ZohoApiClient;
import com.goodearth.postsales.integration.zoho.ZohoTokenManager;
import com.goodearth.postsales.project.entity.Project;
import com.goodearth.postsales.project.repository.ProjectRepository;
import com.goodearth.postsales.workdrive.entity.WorkDriveFile;
import com.goodearth.postsales.workdrive.entity.WorkDriveFolder;
import com.goodearth.postsales.workdrive.entity.WorkDriveFileVersion;
import com.goodearth.postsales.workdrive.repository.WorkDriveFileRepository;
import com.goodearth.postsales.workdrive.repository.WorkDriveFolderRepository;
import com.goodearth.postsales.workdrive.repository.WorkDriveFileVersionRepository;
import com.goodearth.postsales.workdrive.service.WorkDriveSyncService;
import com.goodearth.postsales.workflow.entity.Workflow;
import com.goodearth.postsales.workflow.entity.WorkflowStatus;
import com.goodearth.postsales.workflow.repository.WorkflowRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;

import java.time.LocalDateTime;
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;

@SpringBootTest
@ActiveProfiles("test")
public class WorkDriveProvisioningIntegrationTest {

    @Autowired
    private BuyerRepository buyerRepository;

    @Autowired
    private ProjectRepository projectRepository;

    @Autowired
    private WorkflowRepository workflowRepository;

    @Autowired
    private WorkDriveFolderRepository workDriveFolderRepository;

    @Autowired
    private WorkDriveFileRepository workDriveFileRepository;

    @Autowired
    private WorkDriveFileVersionRepository workDriveFileVersionRepository;

    @Autowired
    private DocumentRepository documentRepository;

    @Autowired
    private WorkDriveSyncService workDriveSyncService;

    @Autowired
    private FloorPlanService floorPlanService;

    @MockBean
    private ZohoTokenManager zohoTokenManager;

    @MockBean
    private ZohoApiClient zohoApiClient;

    @MockBean
    private RestTemplate restTemplate;

    private Workflow testWorkflow;
    private Buyer testBuyer;

    @BeforeEach
    public void setUp() {
        workDriveFileVersionRepository.deleteAll();
        workDriveFileRepository.deleteAll();
        documentRepository.deleteAll();
        workDriveFolderRepository.deleteAll();
        workflowRepository.deleteAll();
        buyerRepository.deleteAll();
        projectRepository.deleteAll();

        Mockito.when(zohoTokenManager.getAccessToken()).thenReturn("mock-valid-access-token");

        // Dynamic mock file system mapping parentId -> list of items
        Map<String, List<ZohoWorkDriveResponse.WorkDriveItem>> mockDriveFileSystem = new HashMap<>();

        Mockito.when(zohoApiClient.get(anyString(), eq(ZohoWorkDriveResponse.class)))
                .thenAnswer(invocation -> {
                    String url = invocation.getArgument(0);
                    ZohoWorkDriveResponse response = new ZohoWorkDriveResponse();
                    if (url.contains("/files/") && url.endsWith("/files")) {
                        String parentId = url.substring(url.indexOf("/files/") + 7, url.lastIndexOf("/files"));
                        response.setData(mockDriveFileSystem.getOrDefault(parentId, Collections.emptyList()));
                    } else {
                        response.setData(Collections.emptyList());
                    }
                    return response;
                });

        // Mock RestTemplate postForEntity for folder creation with dynamic ID and file system registration
        Mockito.when(restTemplate.postForEntity(anyString(), any(), eq(ZohoWorkDriveResponse.class)))
                .thenAnswer(invocation -> {
                    HttpEntity<Map<String, Object>> entity = invocation.getArgument(1);
                    Map<String, Object> body = entity.getBody();
                    Map<String, Object> data = (Map<String, Object>) body.get("data");
                    Map<String, Object> attributes = (Map<String, Object>) data.get("attributes");
                    String folderName = (String) attributes.get("name");
                    String parentId = (String) attributes.get("parent_id");

                    String newId = "WD-FLDR-" + UUID.randomUUID();
                    ZohoWorkDriveResponse.WorkDriveItem item = new ZohoWorkDriveResponse.WorkDriveItem();
                    item.setId(newId);
                    item.setType("files");
                    ZohoWorkDriveResponse.WorkDriveAttributes attrs = new ZohoWorkDriveResponse.WorkDriveAttributes();
                    attrs.setName(folderName);
                    item.setAttributes(attrs);

                    mockDriveFileSystem.computeIfAbsent(parentId, k -> new ArrayList<>()).add(item);

                    ZohoWorkDriveResponse mockDriveResponse = new ZohoWorkDriveResponse();
                    mockDriveResponse.setData(Collections.singletonList(item));
                    return new ResponseEntity<>(mockDriveResponse, HttpStatus.CREATED);
                });

        Buyer buyer = new Buyer();
        buyer.setFullName("Arjun Test");
        buyer.setEmail("arjun.test@goodearth.com");
        buyer.setPhone("+919876543210");
        buyer.setZohoContactId("ZOHO_CNT_MOTIF16");
        buyer.setZohoDealId("motif16");
        buyer.setUnitName("motif16");
        buyer.setStatus("BOOKING_CONFIRMED");
        buyer.setPortalActivated(true);
        testBuyer = buyerRepository.save(buyer);

        Project project = new Project();
        project.setProjectName("GoodEarth Motif");
        project.setProjectCode("MOTIF");
        project.setZohoDealId("motif16");
        project.setLocation("Bengaluru");
        project.setStatus("ACTIVE");
        Project savedProject = projectRepository.save(project);

        Workflow workflow = new Workflow();
        workflow.setBuyer(testBuyer);
        workflow.setProject(savedProject);
        workflow.setStatus(WorkflowStatus.ACTIVE);
        workflow.setStartedAt(LocalDateTime.now());
        testWorkflow = workflowRepository.save(workflow);
    }

    @Test
    @Transactional
    public void testFullWorkDriveProvisioningSyncAndFloorPlansEndpoint() {
        // 1. Trigger syncFolder to provision WorkDrive folder hierarchy
        workDriveSyncService.syncFolder(testWorkflow.getId());

        // 2. Verify folder hierarchy in DB
        WorkDriveFolder folder = workDriveFolderRepository.findByWorkflowId(testWorkflow.getId())
                .orElseThrow(() -> new AssertionError("WorkDriveFolder record should exist"));

        assertEquals("motif16", folder.getBookingId());
        assertEquals("GoodEarth Motif", folder.getProjectName());
        assertEquals("motif16", folder.getUnitNumber());
        assertNotNull(folder.getWorkflow(), "Workflow must never be null");
        assertNotNull(folder.getFolderId(), "TestSandbox folder ID must not be null");
        assertNotNull(folder.getTestSandboxFolderId(), "test_sandbox_folder_id must not be null");
        assertNotNull(folder.getProjectFolderId(), "Project folder ID must not be null");
        assertNotNull(folder.getUnitFolderId(), "Unit folder ID must not be null");
        assertNotNull(folder.getFloorPlansFolderId(), "Floor Plans folder ID must not be null");
        assertNotNull(folder.getArchitecturalFolderId(), "Architectural Drawings folder ID must not be null");
        assertNotNull(folder.getStructuralFolderId(), "Structural Drawings folder ID must not be null");
        assertNotNull(folder.getElectricalFolderId(), "Electrical folder ID must not be null");
        assertNotNull(folder.getPlumbingFolderId(), "Plumbing folder ID must not be null");
        assertNotNull(folder.getInteriorFolderId(), "Interior folder ID must not be null");
        assertNotNull(folder.getSitePhotosFolderId(), "Site Photos folder ID must not be null");
        assertNotNull(folder.getApprovalsFolderId(), "Approvals folder ID must not be null");
        assertNotNull(folder.getDocumentsFolderId(), "Documents folder ID must not be null");

        // 3. Simulate Uploading a PDF into Floor Plans subfolder
        String sampleFileId = "WD-FILE-MOTIF16-FP-001";
        String sampleFileName = "GoodEarth_Motif_Unit16_FloorPlan_v1.pdf";

        Document doc = new Document();
        doc.setWorkflow(testWorkflow);
        doc.setDocumentType(DocumentType.DESIGN_PLAN);
        doc.setFileName(sampleFileName);
        doc.setWorkDriveFileId(sampleFileId);
        doc.setFileSize(2450000L);
        doc.setUploadedBy("Designer Studio");
        doc.setUploadedAt(LocalDateTime.now());
        doc.setStatus(com.goodearth.postsales.document.entity.DocumentStatus.ACTIVE);
        Document savedDoc = documentRepository.save(doc);

        WorkDriveFile wdFile = new WorkDriveFile();
        wdFile.setFolder(folder);
        wdFile.setFileId(sampleFileId);
        wdFile.setFileName(sampleFileName);
        wdFile.setMimeType("application/pdf");
        wdFile.setStatus("ACTIVE");
        wdFile.setDocument(savedDoc);
        WorkDriveFile savedFile = workDriveFileRepository.save(wdFile);

        WorkDriveFileVersion version1 = new WorkDriveFileVersion();
        version1.setWorkDriveFile(savedFile);
        version1.setVersion(1);
        version1.setFileName(sampleFileName);
        version1.setMimeType("application/pdf");
        version1.setPreviewUrl("https://workdrive.zoho.com/file/preview/" + sampleFileId);
        version1.setDownloadUrl("https://workdrive.zoho.com/file/download/" + sampleFileId);
        version1.setUploadedBy("Designer Studio");
        version1.setUploadedAt(LocalDateTime.now());
        workDriveFileVersionRepository.save(version1);

        // 4. Verify workdrive_files and workdrive_file_versions populated
        List<WorkDriveFile> filesInDb = workDriveFileRepository.findByFolderId(folder.getId());
        assertEquals(1, filesInDb.size());
        assertEquals(sampleFileId, filesInDb.get(0).getFileId());
        assertEquals(DocumentType.DESIGN_PLAN, filesInDb.get(0).getDocument().getDocumentType());

        List<WorkDriveFileVersion> versionsInDb = workDriveFileVersionRepository.findByWorkDriveFileIdOrderByVersionAsc(savedFile.getId());
        assertEquals(1, versionsInDb.size());
        assertEquals("https://workdrive.zoho.com/file/preview/" + sampleFileId, versionsInDb.get(0).getPreviewUrl());

        // 5. Test FloorPlanService (Client Portal GET /api/v1/client/floor-plans)
        UserDetails userDetails = new User(testBuyer.getEmail(), "password", Collections.singletonList(new SimpleGrantedAuthority("ROLE_CLIENT")));
        ClientFloorPlansDto floorPlansDto = floorPlanService.getFloorPlans(userDetails);

        assertNotNull(floorPlansDto.getLatestDrawing(), "Latest drawing must be populated");
        assertEquals(sampleFileName, floorPlansDto.getLatestDrawing().getFileName());
        assertEquals("https://workdrive.zoho.com/file/preview/" + sampleFileId, floorPlansDto.getPreviewUrl());
        assertEquals("https://workdrive.zoho.com/file/download/" + sampleFileId, floorPlansDto.getDownloadUrl());
        assertNotNull(floorPlansDto.getRevisionHistory());
        assertEquals(1, floorPlansDto.getRevisionHistory().size());
    }

    @Test
    @Transactional
    public void testBrandNewWorkflowProvisioningQueryAndVerification() {
        // 1. Create a brand-new Buyer, Project, and Workflow
        Buyer newBuyer = new Buyer();
        newBuyer.setFullName("Brand New Buyer");
        newBuyer.setEmail("brandnew.buyer@goodearth.com");
        newBuyer.setPhone("+919988776655");
        newBuyer.setZohoContactId("ZOHO_CNT_BRANDNEW_001");
        newBuyer.setZohoDealId("motif99");
        newBuyer.setUnitName("motif99");
        newBuyer.setStatus("BOOKING_CONFIRMED");
        newBuyer.setPortalActivated(true);
        Buyer savedBuyer = buyerRepository.save(newBuyer);

        Project newProject = new Project();
        newProject.setProjectName("GoodEarth Motif Horizon");
        newProject.setProjectCode("MOTIF-HORIZON");
        newProject.setZohoDealId("motif99");
        newProject.setLocation("Bengaluru");
        newProject.setStatus("ACTIVE");
        Project savedProject = projectRepository.save(newProject);

        Workflow newWorkflow = new Workflow();
        newWorkflow.setBuyer(savedBuyer);
        newWorkflow.setProject(savedProject);
        newWorkflow.setStatus(WorkflowStatus.ACTIVE);
        newWorkflow.setStartedAt(LocalDateTime.now());
        Workflow savedWorkflow = workflowRepository.save(newWorkflow);

        // 2. Trigger syncFolder for the brand-new workflow
        workDriveSyncService.syncFolder(savedWorkflow.getId());

        // 3. Retrieve provisioned WorkDriveFolder record
        WorkDriveFolder folder = workDriveFolderRepository.findByWorkflowId(savedWorkflow.getId())
                .orElseThrow(() -> new AssertionError("WorkDriveFolder record must exist for new workflow"));

        String realFolderId = folder.getTestSandboxFolderId();
        String parentId = folder.getTeamFolderId();
        String permalink = "https://workdrive.zoho.com/folder/" + realFolderId;

        // Print exact required verification fields
        System.out.println("=== NEW WORKFLOW PROVISIONING VERIFICATION ===");
        System.out.println("REAL Folder ID: " + realFolderId);
        System.out.println("Parent ID: " + parentId);
        System.out.println("Permalink: " + permalink);
        System.out.println("==============================================");

        assertNotNull(realFolderId, "REAL folder ID must not be null");
        assertNotNull(parentId, "parent_id must not be null");
        assertEquals("6wbga105d85b36926403d8edcbbaaf29c7583", parentId, "Parent ID must match resolved Team Folder ID");
        assertEquals(realFolderId, folder.getFolderId());
    }

    @Test
    @Transactional
    public void testMultiProjectAndMultiUnitProvisioningNoDuplicates() {
        // 1. Setup Project 1 (GoodEarth Motif) and Unit 1 (Motif-16)
        Project project1 = new Project();
        project1.setProjectName("GoodEarth Motif");
        project1.setProjectCode("MOTIF");
        project1.setZohoDealId("DEAL_MOTIF_PROJ1");
        project1 = projectRepository.save(project1);

        Buyer buyer1 = new Buyer();
        buyer1.setFullName("Buyer Motif 16");
        buyer1.setEmail("motif16@goodearth.com");
        buyer1.setZohoContactId("CNT_MOTIF_16");
        buyer1.setZohoDealId("Motif-16");
        buyer1 = buyerRepository.save(buyer1);

        Workflow wf1 = new Workflow();
        wf1.setProject(project1);
        wf1.setBuyer(buyer1);
        wf1.setStatus(WorkflowStatus.ACTIVE);
        wf1 = workflowRepository.save(wf1);

        workDriveSyncService.syncFolder(wf1.getId());

        WorkDriveFolder folder1 = workDriveFolderRepository.findByWorkflowId(wf1.getId()).orElseThrow();
        assertEquals("6wbga105d85b36926403d8edcbbaaf29c7583", folder1.getTestSandboxFolderId());
        assertNotNull(folder1.getProjectFolderId());
        assertNotNull(folder1.getUnitFolderId());

        // 2. Setup Unit 2 (Motif-17) under Project 1 (GoodEarth Motif)
        Buyer buyer2 = new Buyer();
        buyer2.setFullName("Buyer Motif 17");
        buyer2.setEmail("motif17@goodearth.com");
        buyer2.setZohoContactId("CNT_MOTIF_17");
        buyer2.setZohoDealId("Motif-17");
        buyer2 = buyerRepository.save(buyer2);

        Workflow wf2 = new Workflow();
        wf2.setProject(project1);
        wf2.setBuyer(buyer2);
        wf2.setStatus(WorkflowStatus.ACTIVE);
        wf2 = workflowRepository.save(wf2);

        workDriveSyncService.syncFolder(wf2.getId());

        WorkDriveFolder folder2 = workDriveFolderRepository.findByWorkflowId(wf2.getId()).orElseThrow();
        // Project folder ID for Unit 17 must equal Project folder ID for Unit 16 (reused, no duplication)
        assertEquals(folder1.getProjectFolderId(), folder2.getProjectFolderId(), "Project folder must be reused for second unit under same project");

        // 3. Setup Project 2 (GoodEarth Malhar) and Unit 1 (Malhar-01)
        Project project2 = new Project();
        project2.setProjectName("GoodEarth Malhar");
        project2.setProjectCode("MALHAR");
        project2.setZohoDealId("DEAL_MALHAR_PROJ2");
        project2 = projectRepository.save(project2);

        Buyer buyer3 = new Buyer();
        buyer3.setFullName("Buyer Malhar 01");
        buyer3.setEmail("malhar01@goodearth.com");
        buyer3.setZohoContactId("CNT_MALHAR_01");
        buyer3.setZohoDealId("Malhar-01");
        buyer3 = buyerRepository.save(buyer3);

        Workflow wf3 = new Workflow();
        wf3.setProject(project2);
        wf3.setBuyer(buyer3);
        wf3.setStatus(WorkflowStatus.ACTIVE);
        wf3 = workflowRepository.save(wf3);

        workDriveSyncService.syncFolder(wf3.getId());

        WorkDriveFolder folder3 = workDriveFolderRepository.findByWorkflowId(wf3.getId()).orElseThrow();
        assertEquals("6wbga105d85b36926403d8edcbbaaf29c7583", folder3.getTestSandboxFolderId(), "Root must remain TestSandbox Team Folder");
        assertNotNull(folder3.getProjectFolderId());
        assertNotEquals(folder1.getProjectFolderId(), folder3.getProjectFolderId(), "Different projects must have different project folder IDs");
    }
}

