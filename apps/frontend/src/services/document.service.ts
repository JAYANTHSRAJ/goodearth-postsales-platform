import { api } from './api';
import { Document } from '../features/documents/types/documents.types';

export const documentService = {
  getDocuments(): Promise<Document[]> {
    return api.get<Document[]>('/documents');
  },

  getDocumentById(id: string): Promise<Document> {
    return api.get<Document>(`/documents/${id}`);
  },

  createDocument(document: Omit<Document, 'id'>): Promise<Document> {
    return api.post<Document>('/documents', document);
  },

  updateDocument(id: string, document: Partial<Document>): Promise<Document> {
    return api.patch<Document>(`/documents/${id}`, document);
  },

  updateStatus(id: string, status: string): Promise<any> {
    return api.patch<any>(`/documents/${id}/status`, { status });
  },

  deleteDocument(id: string): Promise<void> {
    return api.delete<void>(`/documents/${id}`);
  },
};

export default documentService;
