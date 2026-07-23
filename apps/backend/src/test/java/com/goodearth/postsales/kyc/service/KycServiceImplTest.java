package com.goodearth.postsales.kyc.service;

import com.goodearth.postsales.document.repository.DocumentRepository;
import com.goodearth.postsales.document.repository.DocumentVersionRepository;
import com.goodearth.postsales.kyc.dto.KycApplicationResponseDto;
import com.goodearth.postsales.kyc.entity.KycApplication;
import com.goodearth.postsales.kyc.entity.KycApplicationStatus;
import com.goodearth.postsales.kyc.mapper.KycApplicationMapper;
import com.goodearth.postsales.kyc.mapper.KycTimelineMapper;
import com.goodearth.postsales.kyc.repository.KycApplicantRepository;
import com.goodearth.postsales.kyc.repository.KycApplicationRepository;
import com.goodearth.postsales.kyc.repository.KycAuditLogRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Collections;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class KycServiceImplTest {

    @Mock
    private KycApplicationRepository kycApplicationRepository;
    @Mock
    private KycApplicantRepository kycApplicantRepository;
    @Mock
    private DocumentRepository documentRepository;
    @Mock
    private DocumentVersionRepository documentVersionRepository;
    @Mock
    private KycAuditLogRepository auditLogRepository;
    @Mock
    private KycApplicationMapper kycApplicationMapper;
    @Mock
    private KycTimelineMapper kycTimelineMapper;
    @Mock
    private KycAuditService auditService;
    @Mock
    private ZohoKycSyncService zohoKycSyncService;

    private KycServiceImpl kycService;

    @BeforeEach
    public void setUp() {
        kycService = new KycServiceImpl(
                kycApplicationRepository,
                kycApplicantRepository,
                documentRepository,
                documentVersionRepository,
                auditLogRepository,
                kycApplicationMapper,
                kycTimelineMapper,
                auditService,
                zohoKycSyncService
        );
    }

    @Test
    public void testGetKycApplicationByBooking_WhenExists_ReturnsExisting() {
        String bookingId = "BOOKING-101";
        KycApplication existingApp = new KycApplication();
        existingApp.setId(UUID.randomUUID());
        existingApp.setBookingId(bookingId);
        existingApp.setStatus(KycApplicationStatus.DRAFT);
        existingApp.setCompletionPercentage(50);

        when(kycApplicationRepository.findByBookingId(bookingId)).thenReturn(Optional.of(existingApp));
        when(documentRepository.findByKycApplicationId(existingApp.getId())).thenReturn(Collections.emptyList());

        KycApplicationResponseDto responseDto = KycApplicationResponseDto.builder()
                .kycApplicationId(existingApp.getId())
                .bookingId(bookingId)
                .status(KycApplicationStatus.DRAFT)
                .completionPercentage(50)
                .build();
        when(kycApplicationMapper.toResponseDto(existingApp, Collections.emptyList())).thenReturn(responseDto);

        KycApplicationResponseDto result = kycService.getKycApplicationByBooking(bookingId);

        assertNotNull(result);
        assertEquals(bookingId, result.getBookingId());
        assertEquals(50, result.getCompletionPercentage());
        verify(kycApplicationRepository, times(1)).findByBookingId(bookingId);
        verify(kycApplicationRepository, never()).save(any());
    }

    @Test
    public void testGetKycApplicationByBooking_WhenNotExists_CreatesNewDraftAndReturnsIt() {
        String bookingId = "BOOKING-NEW-202";
        UUID generatedId = UUID.randomUUID();

        when(kycApplicationRepository.findByBookingId(bookingId)).thenReturn(Optional.empty());

        when(kycApplicationRepository.save(any(KycApplication.class))).thenAnswer(invocation -> {
            KycApplication appToSave = invocation.getArgument(0);
            appToSave.setId(generatedId);
            return appToSave;
        });

        when(documentRepository.findByKycApplicationId(generatedId)).thenReturn(Collections.emptyList());

        KycApplicationResponseDto responseDto = KycApplicationResponseDto.builder()
                .kycApplicationId(generatedId)
                .bookingId(bookingId)
                .status(KycApplicationStatus.DRAFT)
                .completionPercentage(0)
                .build();
        when(kycApplicationMapper.toResponseDto(any(KycApplication.class), eq(Collections.emptyList()))).thenReturn(responseDto);

        KycApplicationResponseDto result = kycService.getKycApplicationByBooking(bookingId);

        assertNotNull(result);
        assertEquals(bookingId, result.getBookingId());
        assertEquals(KycApplicationStatus.DRAFT, result.getStatus());
        assertEquals(0, result.getCompletionPercentage());

        ArgumentCaptor<KycApplication> appCaptor = ArgumentCaptor.forClass(KycApplication.class);
        verify(kycApplicationRepository, times(1)).save(appCaptor.capture());
        KycApplication savedApp = appCaptor.getValue();
        assertEquals(bookingId, savedApp.getBookingId());
        assertEquals(KycApplicationStatus.DRAFT, savedApp.getStatus());
        assertEquals(0, savedApp.getCompletionPercentage());
    }

    @Test
    public void testGetKycApplicationByBooking_Idempotency() {
        String bookingId = "BOOKING-IDEM-303";
        KycApplication createdApp = new KycApplication();
        createdApp.setId(UUID.randomUUID());
        createdApp.setBookingId(bookingId);
        createdApp.setStatus(KycApplicationStatus.DRAFT);
        createdApp.setCompletionPercentage(0);

        // First call: empty -> saves
        when(kycApplicationRepository.findByBookingId(bookingId))
                .thenReturn(Optional.empty())
                .thenReturn(Optional.of(createdApp));

        when(kycApplicationRepository.save(any(KycApplication.class))).thenReturn(createdApp);
        when(documentRepository.findByKycApplicationId(createdApp.getId())).thenReturn(Collections.emptyList());

        KycApplicationResponseDto responseDto = KycApplicationResponseDto.builder()
                .kycApplicationId(createdApp.getId())
                .bookingId(bookingId)
                .status(KycApplicationStatus.DRAFT)
                .build();
        when(kycApplicationMapper.toResponseDto(any(KycApplication.class), anyList())).thenReturn(responseDto);

        // Call 1
        KycApplicationResponseDto res1 = kycService.getKycApplicationByBooking(bookingId);
        // Call 2
        KycApplicationResponseDto res2 = kycService.getKycApplicationByBooking(bookingId);

        assertNotNull(res1);
        assertNotNull(res2);

        // save is called only once (during call 1)
        verify(kycApplicationRepository, times(1)).save(any(KycApplication.class));
        verify(kycApplicationRepository, times(2)).findByBookingId(bookingId);
    }
}
