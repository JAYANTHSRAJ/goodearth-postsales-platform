import { api } from './api';
import { Buyer } from '../features/buyers/types/buyers.types';

export const buyerService = {
  getBuyers(): Promise<Buyer[]> {
    return api.get<Buyer[]>('/buyers');
  },

  getBuyerById(id: string): Promise<Buyer> {
    return api.get<Buyer>(`/buyers/${id}`);
  },

  createBuyer(buyer: Omit<Buyer, 'id'>): Promise<Buyer> {
    return api.post<Buyer>('/buyers', buyer);
  },

  updateBuyer(id: string, buyer: Partial<Buyer>): Promise<Buyer> {
    return api.put<Buyer>(`/buyers/${id}`, buyer);
  },

  deleteBuyer(id: string): Promise<void> {
    return api.delete<void>(`/buyers/${id}`);
  },
};

export default buyerService;
