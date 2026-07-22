import React from 'react';
import { Card } from '../../../../components/ui/Card';
import { KycDropzoneWidget } from '../KycDropzoneWidget';

interface Step8DocumentUploadsProps {
  form: Record<string, any>;
  onChange: (field: string, value: any) => void;
  uploadingField: string | null;
  setUploadingField: (field: string | null) => void;
  errors: Record<string, string>;
}

export const Step8DocumentUploads: React.FC<Step8DocumentUploadsProps> = ({
  form,
  onChange,
  uploadingField,
}) => {
  return (
    <div className="space-y-6 text-left">
      <Card
        title="Step 8: Document Vault & Proof Uploads"
        subtitle="Upload verified identity documents, address proofs, and photos"
      >
        <div className="space-y-6 pt-2">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <KycDropzoneWidget
              label="Primary Applicant PAN Card"
              fieldKey="primaryPanUrl"
              value={form.primaryPanUrl}
              onFileUpload={(fieldKey, file) => onChange(fieldKey, URL.createObjectURL(file))}
              onFileRemove={(fieldKey) => onChange(fieldKey, '')}
              isUploading={uploadingField === 'primaryPanUrl'}
            />

            <KycDropzoneWidget
              label="Primary Applicant Aadhaar Card / Passport"
              fieldKey="primaryAadhaarUrl"
              value={form.primaryAadhaarUrl}
              onFileUpload={(fieldKey, file) => onChange(fieldKey, URL.createObjectURL(file))}
              onFileRemove={(fieldKey) => onChange(fieldKey, '')}
              isUploading={uploadingField === 'primaryAadhaarUrl'}
            />

            <KycDropzoneWidget
              label="Address Proof (Utility Bill / Lease / Aadhaar)"
              fieldKey="primaryAddressProofUrl"
              value={form.primaryAddressProofUrl}
              onFileUpload={(fieldKey, file) => onChange(fieldKey, URL.createObjectURL(file))}
              onFileRemove={(fieldKey) => onChange(fieldKey, '')}
              isUploading={uploadingField === 'primaryAddressProofUrl'}
            />

            <KycDropzoneWidget
              label="Cancelled Cheque / Bank Passbook Copy"
              fieldKey="bankProofUrl"
              value={form.bankProofUrl}
              onFileUpload={(fieldKey, file) => onChange(fieldKey, URL.createObjectURL(file))}
              onFileRemove={(fieldKey) => onChange(fieldKey, '')}
              isUploading={uploadingField === 'bankProofUrl'}
            />
          </div>
        </div>
      </Card>
    </div>
  );
};
