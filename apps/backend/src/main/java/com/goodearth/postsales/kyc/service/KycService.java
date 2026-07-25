package com.goodearth.postsales.kyc.service;

import com.goodearth.postsales.kyc.dto.KycApproveRequestDto;
import com.goodearth.postsales.kyc.dto.KycApplicationResponseDto;
import com.goodearth.postsales.kyc.dto.KycAutosaveRequestDto;
import com.goodearth.postsales.kyc.dto.KycAutosaveResponseDto;
import com.goodearth.postsales.kyc.dto.KycDashboardSummaryResponseDto;
import com.goodearth.postsales.kyc.dto.KycDraftSaveRequestDto;
import com.goodearth.postsales.kyc.dto.KycProgressResponseDto;
import com.goodearth.postsales.kyc.dto.KycRejectRequestDto;
import com.goodearth.postsales.kyc.dto.KycRequestChangesRequestDto;
import com.goodearth.postsales.kyc.dto.KycReviewStartRequestDto;
import com.goodearth.postsales.kyc.dto.KycSubmitRequestDto;
import com.goodearth.postsales.kyc.dto.KycTimelineResponseDto;
import com.goodearth.postsales.kyc.entity.KycApplicationStatus;

import com.goodearth.postsales.kyc.dto.KycValidationSummaryResponseDto;

public interface KycService {

    KycApplicationResponseDto saveDraft(KycDraftSaveRequestDto dto, String actorId);

    KycApplicationResponseDto submitApplicantInfo(com.goodearth.postsales.kyc.dto.ApplicantInfoSubmitRequestDto dto, String actorId);

    KycAutosaveResponseDto autosaveField(KycAutosaveRequestDto dto, String actorId);

    KycApplicationResponseDto createKycApplication(String bookingId, String userEmail, String userId);

    KycApplicationResponseDto getKycApplicationByBooking(String bookingId);

    KycApplicationResponseDto getKycApplicationByBooking(String bookingId, String userEmail, String userId);

    KycValidationSummaryResponseDto validateKyc(String bookingId);

    KycApplicationResponseDto submitKyc(KycSubmitRequestDto dto, String actorId);

    KycApplicationResponseDto startReview(KycReviewStartRequestDto dto, String reviewerId);

    KycApplicationResponseDto approveKyc(KycApproveRequestDto dto, String reviewerId);

    KycApplicationResponseDto rejectKyc(KycRejectRequestDto dto, String reviewerId);

    KycApplicationResponseDto requestChanges(KycRequestChangesRequestDto dto, String reviewerId);

    KycApplicationResponseDto grantEditAccess(com.goodearth.postsales.kyc.dto.KycGrantEditRequestDto dto, String reviewerId);

    KycApplicationResponseDto addInternalNote(com.goodearth.postsales.kyc.dto.KycInternalNoteRequestDto dto, String actorId);

    KycApplicationResponseDto resubmitKyc(KycSubmitRequestDto dto, String actorId);

    KycProgressResponseDto getKycProgress(String bookingId);

    KycDashboardSummaryResponseDto getDashboardSummary(String projectId, KycApplicationStatus status, int page, int limit);

    KycTimelineResponseDto getTimeline(String bookingId);
}
