export interface Document {
  id: string;
  name: string;
  type: 'agreement' | 'noc' | 'receipt' | 'drawing' | 'other';
  status: 'pending' | 'verified' | 'rejected';
  uploadedAt: string;
  fileSize: string;
  workDriveFileId?: string;
}
