export interface Buyer {
  id: string;
  name: string;
  email: string;
  phone?: string;
  projectName: string;
  unitName: string;
  status: 'active' | 'completed' | 'pending';
  totalPaid: string;
  outstanding: string;
  bookingDate: string;
  coApplicantName?: string;
}
