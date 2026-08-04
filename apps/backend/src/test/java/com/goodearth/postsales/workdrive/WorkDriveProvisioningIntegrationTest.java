package com.goodearth.postsales.workdrive;

import com.goodearth.postsales.buyer.entity.Buyer;
import com.goodearth.postsales.buyer.repository.BuyerRepository;
import com.goodearth.postsales.client.dto.ClientFloorPlansDto;
import com.goodearth.postsales.client.service.FloorPlanService;
import com.goodearth.postsales.document.entity.Document;
import com.goodearth.postsales.document.entity.DocumentType;
import com.goodearth.postsales.document.repository.DocumentRepository;
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
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.test.context.ActiveProfiles;

import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

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

    private Workflow testWorkflow;
    private Buyer testBuyer;

    @BeforeEach
    public void setUp() {
        buyerRepository.deleteAll();
        workflowRepository.deleteAll();
        projectRepository.deleteAll();
        workDriveFileVersionRepository.deleteAll();
        workDriveFileRepository.deleteAll();
        documentRepository.deleteAll();
        workDriveFolderRepository.deleteAll();

        Buyer buyer = new Buyer();
        buyer.setFullName("Arjun Test");
        buyer.setEmail("arjun.test@goodearth.com");
        buyer.setPhone("+919876543210");
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
    public void testFullWorkDriveProvisioningSyncAndFloorPlansEndpoint() {
        // 1. Trigger syncFolder to provision WorkDrive folder hierarchy
        workDriveSyncService.syncFolder(testWorkflow.getId());

        // 2. Verify folder hierarchy in DB
        WorkDriveFolder folder = workDriveFolderRepository.findByWorkflowId(testWorkflow.getId())
                .orElseThrow(() -> new AssertionError("WorkDriveFolder record should exist"));

        assertEquals("motif16", folder.getBookingId());
        assertEquals("GoodEarth Motif", folder.getProjectName());
        assertEquals("motif16", folder.getUnitNumber());
        assertNotNull(folder.getFolderId(), "TestSandbox folder ID must not be null");
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
        version1.setPreviewUrl("https://workdrive.zoho.in/file/preview/" + sampleFileId);
        version1.setDownloadUrl("https://workdrive.zoho.in/file/download/" + sampleFileId);
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
        assertEquals("https://workdrive.zoho.in/file/preview/" + sampleFileId, versionsInDb.get(0).getPreviewUrl());

        // 5. Test FloorPlanService (Client Portal GET /api/v1/client/floor-plans)
        UserDetails userDetails = new User(testBuyer.getEmail(), "password", Collections.singletonList(new SimpleGrantedAuthority("ROLE_CLIENT")));
        ClientFloorPlansDto floorPlansDto = floorPlanService.getFloorPlans(userDetails);

        assertNotNull(floorPlansDto.getLatestDrawing(), "Latest drawing must be populated");
        assertEquals(sampleFileName, floorPlansDto.getLatestDrawing().getFileName());
        assertEquals("https://workdrive.zoho.in/file/preview/" + sampleFileId, floorPlansDto.getPreviewUrl());
        assertEquals("https://workdrive.zoho.in/file/download/" + sampleFileId, floorPlansDto.getDownloadUrl());
        assertNotNull(floorPlansDto.getRevisionHistory());
        assertEquals(1, floorPlansDto.getRevisionHistory().size());
    }
}
