import { api } from './api';
import { Payment } from '../features/payments/types/payments.types';

export const paymentService = {
  getPayments(): Promise<Payment[]> {
    return api.get<Payment[]>('/payments');
  },

  getInvoices(): Promise<any[]> {
    return api.get<any[]>('/payments/invoices');
  },

  getPaymentById(id: string): Promise<Payment> {
    return api.get<Payment>(`/payments/${id}`);
  },

  createPayment(payment: Omit<Payment, 'id'>): Promise<Payment> {
    return api.post<Payment>('/payments', payment);
  },

  updatePayment(id: string, payment: Partial<Payment>): Promise<Payment> {
    return api.patch<Payment>(`/payments/${id}`, payment);
  },

  deletePayment(id: string): Promise<void> {
    return api.delete<void>(`/payments/${id}`);
  },
};

export default paymentService;
