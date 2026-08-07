import api from '../../../services/api';
import {
  KycApplicationResponseDto,
  KycProgressResponseDto,
  KycTimelineResponseDto,
  KycDraftSaveRequestDto,
  KycAutosaveRequestDto,
  KycAutosaveResponseDto,
  KycSubmitRequestDto,
  DocumentUploadResponseDto,
  DocumentDownloadResponseDto,
  KycValidationSummaryResponseDto,
  OfferLetterStatusDto,
  OfferLetterDto,
  ZohoSignDto,
  KycCopySourceDto,
  KycCopyRequestDto,
} from '../types/kyc';

export const kycService = {
  createKycApplication: (bookingId?: string): Promise<KycApplicationResponseDto> => {
    return api.post<KycApplicationResponseDto>('/kyc/create', { bookingId });
  },

  getKycByBooking: (bookingId: string): Promise<KycApplicationResponseDto> => {
    return api.get<KycApplicationResponseDto>(`/kyc/booking/${bookingId}`);
  },

  validateKyc: (bookingId: string): Promise<KycValidationSummaryResponseDto> => {
    return api.get<KycValidationSummaryResponseDto>(`/kyc/booking/${bookingId}/validate`);
  },

  getKycProgress: (bookingId: string): Promise<KycProgressResponseDto> => {
    return api.get<KycProgressResponseDto>(`/kyc/${bookingId}/progress`);
  },

  getKycTimeline: (bookingId: string): Promise<KycTimelineResponseDto> => {
    return api.get<KycTimelineResponseDto>(`/kyc/${bookingId}/timeline`);
  },

  saveDraft: (dto: KycDraftSaveRequestDto): Promise<KycApplicationResponseDto> => {
    return api.post<KycApplicationResponseDto>('/kyc/draft', dto);
  },

  submitApplicantInfo: (data: any): Promise<KycApplicationResponseDto> => {
    return api.put<KycApplicationResponseDto>('/kyc/applicant', data);
  },

  autosaveField: (dto: KycAutosaveRequestDto): Promise<KycAutosaveResponseDto> => {
    return api.patch<KycAutosaveResponseDto>('/kyc/draft/autosave', dto);
  },

  submitKyc: (dto: KycSubmitRequestDto): Promise<KycApplicationResponseDto> => {
    return api.post<KycApplicationResponseDto>('/kyc/submit', dto);
  },

  resubmitKyc: (dto: KycSubmitRequestDto): Promise<KycApplicationResponseDto> => {
    return api.post<KycApplicationResponseDto>('/kyc/resubmit', dto);
  },

  grantEditAccess: (dto: { kycApplicationId: string; reason: string }): Promise<KycApplicationResponseDto> => {
    return api.post<KycApplicationResponseDto>('/kyc/grant-edit', dto);
  },

  addInternalNote: (dto: { kycApplicationId: string; note: string }): Promise<KycApplicationResponseDto> => {
    return api.post<KycApplicationResponseDto>('/kyc/internal-note', dto);
  },

  uploadDocument: (
    kycApplicationId: string,
    documentCategory: string,
    documentType: string,
    applicantType: string,
    file: File
  ): Promise<DocumentUploadResponseDto> => {
    const formData = new FormData();
    formData.append('kycApplicationId', kycApplicationId);
    formData.append('documentCategory', documentCategory);
    formData.append('documentType', documentType);
    formData.append('applicantType', applicantType);
    formData.append('file', file);

    return api.post<DocumentUploadResponseDto>('/kyc/documents/upload', formData);
  },

  deleteDocument: (documentId: string): Promise<{ documentId: string; deleted: boolean }> => {
    return api.delete<{ documentId: string; deleted: boolean }>(`/kyc/documents/${documentId}`);
  },

  generateDownloadUrl: (documentId: string, versionNumber?: number): Promise<DocumentDownloadResponseDto> => {
    const query = versionNumber ? `?versionNumber=${versionNumber}` : '';
    return api.get<DocumentDownloadResponseDto>(`/kyc/documents/${documentId}/download${query}`);
  },

  getFileUrl: (documentId: string, versionNumber?: number): string => {
    const query = versionNumber ? `?versionNumber=${versionNumber}` : '';
    const path = `/kyc/documents/${documentId}/file${query}`;
    const rawBaseUrl = import.meta.env.VITE_API_BASE_URL || '/api/v1';
    const baseUrl = rawBaseUrl.endsWith('/') ? rawBaseUrl.slice(0, -1) : rawBaseUrl;
    return `${baseUrl}${path}`;
  },

  getOfferLetterStatus: (dealIdOrBookingId: string): Promise<OfferLetterStatusDto> => {
    return api.get<OfferLetterStatusDto>(`/deals/${dealIdOrBookingId}/offer-letter/status`);
  },

  getOfferLetterDetails: (dealIdOrBookingId: string): Promise<OfferLetterDto> => {
    return api.get<OfferLetterDto>(`/deals/${dealIdOrBookingId}/offer-letter/details`);
  },

  sendOfferLetter: (dealIdOrBookingId: string): Promise<OfferLetterStatusDto> => {
    return api.post<OfferLetterStatusDto>(`/deals/${dealIdOrBookingId}/offer-letter/send`);
  },

  getOfferLetterFileUrl: (dealIdOrBookingId: string): string => {
    const path = `/deals/${dealIdOrBookingId}/offer-letter/file`;
    const rawBaseUrl = import.meta.env.VITE_API_BASE_URL || '/api/v1';
    const baseUrl = rawBaseUrl.endsWith('/') ? rawBaseUrl.slice(0, -1) : rawBaseUrl;
    return `${baseUrl}${path}`;
  },

  getSignRequestForBooking: async (dealIdOrBookingId: string): Promise<ZohoSignDto | null> => {
    try {
      const res = await api.get<ZohoSignDto>(`/sign/requests/booking/${dealIdOrBookingId}`);
      return res;
    } catch {
      return null;
    }
  },

  getSignRequestStatus: (requestId: string): Promise<ZohoSignDto> => {
    return api.get<ZohoSignDto>(`/sign/requests/${requestId}/status`);
  },

  getSignedDocumentDownloadUrl: (requestId: string): string => {
    const path = `/sign/requests/${requestId}/download`;
    const rawBaseUrl = import.meta.env.VITE_API_BASE_URL || '/api/v1';
    const baseUrl = rawBaseUrl.endsWith('/') ? rawBaseUrl.slice(0, -1) : rawBaseUrl;
    return `${baseUrl}${path}`;
  },

  getAvailableSources: async (workflowId?: string): Promise<KycCopySourceDto[]> => {
    const query = workflowId ? `?workflowId=${workflowId}` : '';
    const res = await api.get<KycCopySourceDto[] | { data: KycCopySourceDto[] }>(`/client/kyc/available-sources${query}`);
    return (res as any)?.data?.data || (res as any)?.data || (res as any) || [];
  },

  copyKycFromSource: async (targetWorkflowId: string, payload: KycCopyRequestDto): Promise<KycApplicationResponseDto> => {
    const res = await api.post<KycApplicationResponseDto | { data: KycApplicationResponseDto }>(`/client/kyc/${targetWorkflowId}/copy`, payload);
    return (res as any)?.data?.data || (res as any)?.data || res;
  },
};

export default kycService;
