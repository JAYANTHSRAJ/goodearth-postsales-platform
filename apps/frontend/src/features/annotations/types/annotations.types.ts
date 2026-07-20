export interface Annotation {
  id: string;
  documentName: string;
  author: string;
  type: 'drawing' | 'highlight' | 'text' | 'stamp';
  status: 'active' | 'resolved' | 'pending';
  createdAt: string;
}
