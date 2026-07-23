export type KycApplicationStatus =
  | 'DRAFT'
  | 'SUBMITTED'
  | 'UNDER_REVIEW'
  | 'ACTION_REQUIRED'
  | 'APPROVED'
  | 'REJECTED';

export type ApplicantType = 'PRIMARY' | 'JOINT_1' | 'JOINT_2';

export type DocumentCategory = 'KYC' | 'AGREEMENT' | 'PAYMENT' | 'HANDOVER';

export type DocumentType =
  | 'PAN_CARD'
  | 'AADHAAR_CARD'
  | 'PASSPORT'
  | 'PHOTO'
  | 'ADDRESS_PROOF'
  | 'VOTER_ID'
  | 'OTHER';

export type DocumentVersionStatus =
  | 'DRAFT'
  | 'SUBMITTED'
  | 'UNDER_REVIEW'
  | 'APPROVED'
  | 'REJECTED'
  | 'SUPERSEDED';

export interface AddressDto {
  street?: string;
  addressLine2?: string;
  city?: string;
  state?: string;
  pincode?: string;
  country?: string;
}

export interface ApplicantDto {
  id?: string;
  applicantType: ApplicantType;
  fullName?: string;
  salutation?: string;
  firstName?: string;
  lastName?: string;
  guardianRelation?: string;
  guardianSalutation?: string;
  guardianFirstName?: string;
  guardianLastName?: string;
  guardianName?: string;
  dateOfBirth?: string;
  occupation?: string;
  addressSameAsPrimary?: boolean;
  addressSameAsSecondary?: boolean;
  email?: string;
  phone?: string;
  phoneCode?: string;
  relation?: string;
  panNumber?: string;
  aadhaarNumber?: string;
  maskedAadhaarNumber?: string;
  address?: AddressDto;
}

export interface DocumentVersionDto {
  versionId: string;
  versionNumber: number;
  fileName: string;
  fileSizeBytes: number;
  mimeType: string;
  status: DocumentVersionStatus;
  rejectionReasonCode?: string;
  rejectionComments?: string;
  uploadedBy?: string;
  uploadedAt?: string;
  isCurrent?: boolean;
}

export interface DocumentSlotDto {
  documentId: string;
  documentCategory: DocumentCategory;
  documentType: DocumentType;
  applicantType: ApplicantType;
  isRequired: boolean;
  status: string;
  currentVersion?: DocumentVersionDto;
}

export interface KycApplicationResponseDto {
  kycApplicationId: string;
  bookingId: string;
  status: KycApplicationStatus;
  completionPercentage: number;
  clientNotes?: string;
  applicationDate?: string;
  consideringHomeLoan?: string;
  hasCoApplicant?: string;
  hasThirdApplicant?: string;
  submittedAt?: string;
  verifiedAt?: string;
  verifiedBy?: string;
  lastSavedAt?: string;
  primaryApplicant?: ApplicantDto;
  jointApplicants?: ApplicantDto[];
  documentSlots?: DocumentSlotDto[];
}

export interface KycProgressResponseDto {
  bookingId: string;
  kycApplicationId: string;
  overallStatus: KycApplicationStatus;
  completionPercentage: number;
  requiredSlotsCount: number;
  uploadedSlotsCount: number;
  approvedSlotsCount: number;
  rejectedSlotsCount: number;
  pendingReviewSlotsCount: number;
  slots: DocumentSlotDto[];
}

export interface KycTimelineEventDto {
  eventId: string;
  eventType: string;
  actorId: string;
  actorRole: string;
  summary: string;
  timestamp: string;
}

export interface KycTimelineResponseDto {
  bookingId: string;
  kycApplicationId: string;
  events: KycTimelineEventDto[];
}

export interface KycDraftSaveRequestDto {
  bookingId: string;
  applicationDate?: string;
  consideringHomeLoan?: string;
  hasCoApplicant?: string;
  hasThirdApplicant?: string;
  primaryApplicant?: ApplicantDto;
  jointApplicants?: ApplicantDto[];
}

export interface KycAutosaveRequestDto {
  bookingId: string;
  fieldPath: string;
  value?: any;
}

export interface KycAutosaveResponseDto {
  kycApplicationId: string;
  fieldSaved: string;
  lastSavedAt: string;
}

export interface KycSubmitRequestDto {
  kycApplicationId: string;
  declarationAccepted: boolean;
  clientNotes?: string;
}

export interface DocumentUploadResponseDto {
  documentId: string;
  kycApplicationId: string;
  documentCategory: DocumentCategory;
  documentType: DocumentType;
  applicantType: ApplicantType;
  currentVersion: DocumentVersionDto;
}

export interface DocumentDownloadResponseDto {
  documentId: string;
  versionNumber: number;
  fileName: string;
  mimeType: string;
  downloadUrl: string;
  expiresAt: string;
}

export interface KycMissingItemDto {
  section: string;
  key: string;
  requirement: string;
  applicantType?: ApplicantType;
}

export interface KycValidationSummaryResponseDto {
  bookingId: string;
  overallValid: boolean;
  primaryApplicantComplete: boolean;
  primaryApplicantMissingFields: string[];
  coApplicantComplete: boolean;
  coApplicantMissingFields: string[];
  thirdApplicantComplete: boolean;
  thirdApplicantMissingFields: string[];
  documentsComplete: boolean;
  documentsMissingSlots: string[];
  missingItems: KycMissingItemDto[];
}
