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
} from '../types/kyc';

export const kycService = {
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
};

export default kycService;
