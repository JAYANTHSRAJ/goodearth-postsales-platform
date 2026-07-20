import { api } from './api';
import { Annotation } from '../features/annotations/types/annotations.types';

export const annotationService = {
  getAnnotations(): Promise<Annotation[]> {
    return api.get<Annotation[]>('/annotations');
  },

  getAnnotationById(id: string): Promise<Annotation> {
    return api.get<Annotation>(`/annotations/${id}`);
  },

  createAnnotation(annotation: Omit<Annotation, 'id'>): Promise<Annotation> {
    return api.post<Annotation>('/annotations', annotation);
  },

  updateAnnotation(id: string, annotation: Partial<Annotation>): Promise<Annotation> {
    return api.patch<Annotation>(`/annotations/${id}`, annotation);
  },

  deleteAnnotation(id: string): Promise<void> {
    return api.delete<void>(`/annotations/${id}`);
  },
};

export default annotationService;
