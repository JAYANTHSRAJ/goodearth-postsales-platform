package com.goodearth.postsales.workdrive;

import com.goodearth.postsales.buyer.entity.Buyer;
import com.goodearth.postsales.buyer.repository.BuyerRepository;
import com.goodearth.postsales.integration.workdrive.dto.ZohoWorkDriveResponse;
import com.goodearth.postsales.integration.zoho.ZohoApiClient;
import com.goodearth.postsales.integration.zoho.ZohoTokenManager;
import com.goodearth.postsales.project.entity.Project;
import com.goodearth.postsales.project.repository.ProjectRepository;
import com.goodearth.postsales.workdrive.entity.WorkDriveFolder;
import com.goodearth.postsales.workdrive.repository.WorkDriveFileRepository;
import com.goodearth.postsales.workdrive.repository.WorkDriveFolderRepository;
import com.goodearth.postsales.workdrive.service.WorkDriveSyncService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;

@SpringBootTest
@ActiveProfiles("test")
public class CrmDrivenWorkDriveProvisioningIntegrationTest {

    private static final String TEST_SANDBOX_ID = "6wbga105d85b36926403d8edcbbaaf29c7583";

    @Autowired
    private WorkDriveSyncService workDriveSyncService;

    @Autowired
    private WorkDriveFolderRepository workDriveFolderRepository;

    @Autowired
    private ProjectRepository projectRepository;

    @Autowired
    private BuyerRepository buyerRepository;

    @MockBean
    private ZohoTokenManager zohoTokenManager;

    @MockBean
    private ZohoApiClient zohoApiClient;

    @MockBean
    private org.springframework.web.client.RestTemplate restTemplate;

    private Map<String, List<ZohoWorkDriveResponse.WorkDriveItem>> mockDriveFileSystem;
    private int folderIdCounter = 100;

    @BeforeEach
    public void setUp() {
        workDriveFolderRepository.deleteAll();
        buyerRepository.deleteAll();
        projectRepository.deleteAll();

        Mockito.when(zohoTokenManager.getAccessToken()).thenReturn("mock-access-token");
        mockDriveFileSystem = new HashMap<>();

        // Mock GET /files/{parentId}/files
        Mockito.when(zohoApiClient.get(anyString(), eq(ZohoWorkDriveResponse.class)))
                .thenAnswer(invocation -> {
                    String url = invocation.getArgument(0);
                    ZohoWorkDriveResponse response = new ZohoWorkDriveResponse();
                    if (url.contains("/files/") && url.endsWith("/files")) {
                        String parentId = url.substring(url.indexOf("/files/") + 7, url.lastIndexOf("/files"));
                        List<ZohoWorkDriveResponse.WorkDriveItem> items = mockDriveFileSystem.getOrDefault(parentId, new ArrayList<>());
                        response.setData(items);
                    }
                    return response;
                });

        // Mock RestTemplate POST /files (Create folder)
        Mockito.when(restTemplate.postForEntity(anyString(), any(), eq(ZohoWorkDriveResponse.class)))
                .thenAnswer(invocation -> {
                    org.springframework.http.HttpEntity<Map<String, Object>> httpEntity = invocation.getArgument(1);
                    Map<String, Object> body = httpEntity.getBody();
                    Map<String, Object> data = (Map<String, Object>) body.get("data");
                    Map<String, Object> attributes = (Map<String, Object>) data.get("attributes");

                    String name = (String) attributes.get("name");
                    String parentId = (String) attributes.get("parent_id");
                    String newFolderId = "WD-REAL-" + name.toUpperCase().replace(" ", "_") + "-" + (folderIdCounter++);

                    ZohoWorkDriveResponse.WorkDriveItem item = new ZohoWorkDriveResponse.WorkDriveItem();
                    item.setId(newFolderId);
                    item.setType("files");

                    ZohoWorkDriveResponse.WorkDriveAttributes attr = new ZohoWorkDriveResponse.WorkDriveAttributes();
                    attr.setName(name);
                    item.setAttributes(attr);

                    mockDriveFileSystem.computeIfAbsent(parentId, k -> new ArrayList<>()).add(item);

                    ZohoWorkDriveResponse mockResponse = new ZohoWorkDriveResponse();
                    mockResponse.setData(Collections.singletonList(item));
                    return new ResponseEntity<>(mockResponse, HttpStatus.CREATED);
                });
    }

    @Test
    @Transactional
    public void testProjectFolderProvisioningOnly() {
        // 1. Sync Project Site 'GoodEarth Motif' before any Buyer or Workflow exists
        String projectFolderId = workDriveSyncService.syncProjectFolder("GoodEarth Motif");

        assertNotNull(projectFolderId);
        assertTrue(projectFolderId.startsWith("WD-REAL-GOODEARTH_MOTIF"));

        // Verify Project folder exists under TestSandbox
        List<ZohoWorkDriveResponse.WorkDriveItem> rootItems = mockDriveFileSystem.get(TEST_SANDBOX_ID);
        assertNotNull(rootItems);
        assertEquals(1, rootItems.size());
        assertEquals("GoodEarth Motif", rootItems.get(0).getAttributes().getName());

        // 2. Re-run sync for same project (Idempotency)
        String reusedProjectFolderId = workDriveSyncService.syncProjectFolder("GoodEarth Motif");
        assertEquals(projectFolderId, reusedProjectFolderId, "Project folder must be reused!");

        // Verify root still contains only 1 folder
        assertEquals(1, mockDriveFileSystem.get(TEST_SANDBOX_ID).size());
    }

    @Test
    @Transactional
    public void testMultipleUnitsUnderSameProject() {
        String projectName = "GoodEarth Motif";

        // 1. Provision Unit 1 (Motif-16)
        WorkDriveFolder unit1Folder = workDriveSyncService.syncUnitFolder(projectName, "Motif-16");
        assertNotNull(unit1Folder);
        assertEquals("GoodEarth Motif", unit1Folder.getProjectName());
        assertEquals("Motif-16", unit1Folder.getUnitNumber());

        // 2. Provision Unit 2 (Motif-69)
        WorkDriveFolder unit2Folder = workDriveSyncService.syncUnitFolder(projectName, "Motif-69");
        assertNotNull(unit2Folder);
        assertEquals("Motif-69", unit2Folder.getUnitNumber());
        assertEquals(unit1Folder.getProjectFolderId(), unit2Folder.getProjectFolderId(), "Project folder ID must be shared between units!");

        // 3. Provision Unit 3 (Motif-70)
        WorkDriveFolder unit3Folder = workDriveSyncService.syncUnitFolder(projectName, "Motif-70");
        assertNotNull(unit3Folder);
        assertEquals("Motif-70", unit3Folder.getUnitNumber());
        assertEquals(unit1Folder.getProjectFolderId(), unit3Folder.getProjectFolderId(), "Project folder ID must be shared!");

        // Verify TestSandbox contains only 1 Project folder ('GoodEarth Motif')
        List<ZohoWorkDriveResponse.WorkDriveItem> rootFolders = mockDriveFileSystem.get(TEST_SANDBOX_ID);
        assertEquals(1, rootFolders.size());
        assertEquals("GoodEarth Motif", rootFolders.get(0).getAttributes().getName());

        // Verify 'GoodEarth Motif' project folder contains exactly 3 unit folders
        String projectFolderId = unit1Folder.getProjectFolderId();
        List<ZohoWorkDriveResponse.WorkDriveItem> unitFolders = mockDriveFileSystem.get(projectFolderId);
        assertEquals(3, unitFolders.size());

        // 4. Test Idempotency: Re-sync Motif-16 multiple times
        WorkDriveFolder resyncedFolder = workDriveSyncService.syncUnitFolder(projectName, "Motif-16");
        assertEquals(unit1Folder.getUnitFolderId(), resyncedFolder.getUnitFolderId());
        assertEquals(3, mockDriveFileSystem.get(projectFolderId).size(), "Zero duplicate unit folders allowed!");
    }

    @Test
    @Transactional
    public void testMultipleProjectsAndUnits() {
        // Project 1
        WorkDriveFolder motif16 = workDriveSyncService.syncUnitFolder("GoodEarth Motif", "Motif-16");

        // Project 2
        WorkDriveFolder tarana01 = workDriveSyncService.syncUnitFolder("GoodEarth Tarana", "Tarana-01");

        assertNotEquals(motif16.getProjectFolderId(), tarana01.getProjectFolderId());

        // TestSandbox should contain 2 project folders: GoodEarth Motif & GoodEarth Tarana
        List<ZohoWorkDriveResponse.WorkDriveItem> rootFolders = mockDriveFileSystem.get(TEST_SANDBOX_ID);
        assertEquals(2, rootFolders.size());
    }
}
