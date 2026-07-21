import React from 'react';
import { Card } from '../../../../components/ui/Card';
import { KycDropzoneWidget } from '../KycDropzoneWidget';

interface Step3Props {
  form: Record<string, any>;
  errors: Record<string, string>;
  uploadingField: string | null;
  onFileUpload: (field: string, file: File) => void;
  onFileRemove: (field: string) => void;
}

export const Step3DocumentVault: React.FC<Step3Props> = ({
  form,
  errors,
  uploadingField,
  onFileUpload,
  onFileRemove,
}) => {
  const hasCoApp = form.hasCoApplicant === 'Yes';

  return (
    <div className="space-y-6 text-left">
      {/* Primary Applicant Upload Vault */}
      <Card
        title="Primary Applicant Document Vault"
        subtitle="Upload official digital copies for legal identity & address verification"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <KycDropzoneWidget
            label="Primary Applicant Aadhaar Card"
            fieldKey="primaryAadhaarUrl"
            value={form.primaryAadhaarUrl}
            required
            instruction="PDF, JPG or PNG up to 2MB"
            isUploading={uploadingField === 'primaryAadhaarUrl'}
            error={errors.primaryAadhaarUrl}
            onFileUpload={onFileUpload}
            onFileRemove={onFileRemove}
          />

          <KycDropzoneWidget
            label="Primary Applicant PAN Card"
            fieldKey="primaryPanUrl"
            value={form.primaryPanUrl}
            required
            instruction="PDF, JPG or PNG up to 5MB"
            isUploading={uploadingField === 'primaryPanUrl'}
            error={errors.primaryPanUrl}
            onFileUpload={onFileUpload}
            onFileRemove={onFileRemove}
          />

          <KycDropzoneWidget
            label="Residence Address Proof (Passport/DL/OCI/Aadhaar)"
            fieldKey="primaryAddressProofUrl"
            value={form.primaryAddressProofUrl}
            required
            instruction="PDF, JPG or PNG up to 5MB"
            isUploading={uploadingField === 'primaryAddressProofUrl'}
            error={errors.primaryAddressProofUrl}
            onFileUpload={onFileUpload}
            onFileRemove={onFileRemove}
          />

          <KycDropzoneWidget
            label="Voter ID Card (Optional)"
            fieldKey="primaryVoterIdUrl"
            value={form.primaryVoterIdUrl}
            required={false}
            instruction="PDF, JPG or PNG up to 2MB"
            isUploading={uploadingField === 'primaryVoterIdUrl'}
            error={errors.primaryVoterIdUrl}
            onFileUpload={onFileUpload}
            onFileRemove={onFileRemove}
          />
        </div>
      </Card>

      {/* Co-Applicant Upload Vault */}
      {hasCoApp && (
        <Card
          title="Co-Applicant Document Vault"
          subtitle="Upload official digital copies for co-applicant verification"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <KycDropzoneWidget
              label="Co-Applicant Aadhaar Card"
              fieldKey="coAadhaarUrl"
              value={form.coAadhaarUrl}
              required
              instruction="PDF, JPG or PNG up to 2MB"
              isUploading={uploadingField === 'coAadhaarUrl'}
              error={errors.coAadhaarUrl}
              onFileUpload={onFileUpload}
              onFileRemove={onFileRemove}
            />

            <KycDropzoneWidget
              label="Co-Applicant PAN Card"
              fieldKey="coPanUrl"
              value={form.coPanUrl}
              required
              instruction="PDF, JPG or PNG up to 5MB"
              isUploading={uploadingField === 'coPanUrl'}
              error={errors.coPanUrl}
              onFileUpload={onFileUpload}
              onFileRemove={onFileRemove}
            />

            <KycDropzoneWidget
              label="Co-Applicant Residence Address Proof"
              fieldKey="coAddressProofUrl"
              value={form.coAddressProofUrl}
              required
              instruction="PDF, JPG or PNG up to 5MB"
              isUploading={uploadingField === 'coAddressProofUrl'}
              error={errors.coAddressProofUrl}
              onFileUpload={onFileUpload}
              onFileRemove={onFileRemove}
            />
          </div>
        </Card>
      )}
    </div>
  );
};
