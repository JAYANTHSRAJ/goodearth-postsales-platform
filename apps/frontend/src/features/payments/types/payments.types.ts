export interface Payment {
  id: string;
  buyerName: string;
  unitName: string;
  amount: string;
  status: 'paid' | 'pending' | 'failed' | 'refunded';
  transactionId: string;
  paymentDate: string;
}
