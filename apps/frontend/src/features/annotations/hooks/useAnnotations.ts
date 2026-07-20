import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { annotationService } from '../../../services/annotation.service';
import { Annotation } from '../types/annotations.types';

export const useAnnotations = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');

  const { data: detailDtos = [], isLoading } = useQuery({
    queryKey: ['annotations'],
    queryFn: () => annotationService.getAnnotations(),
    staleTime: 5 * 60 * 1000, // 5 minutes stale threshold
  });

  const annotations = useMemo(() => {
    return (detailDtos as any[]).map((d): Annotation => {
      const ann = d.annotation || {};
      
      const mapType = (t: string): 'drawing' | 'highlight' | 'text' | 'stamp' => {
        switch (t?.toLowerCase()) {
          case 'drawing':
            return 'drawing';
          case 'highlight':
            return 'highlight';
          case 'text':
            return 'text';
          case 'stamp':
            return 'stamp';
          default:
            return 'text';
        }
      };

      const mapStatus = (s: string): 'active' | 'resolved' | 'pending' => {
        switch (s?.toLowerCase()) {
          case 'open':
          case 'approved':
            return 'active';
          case 'resolved':
            return 'resolved';
          default:
            return 'pending';
        }
      };

      return {
        id: ann.id || '',
        documentName: ann.documentName || 'Drawing Blueprint',
        author: ann.authorName || 'Internal CRM',
        type: mapType(ann.annotationType),
        status: mapStatus(ann.status),
        createdAt: ann.createdAt ? new Date(ann.createdAt).toLocaleDateString('en-IN') : '',
      };
    });
  }, [detailDtos]);

  const filteredAnnotations = useMemo(() => {
    return annotations.filter((annotation) => {
      const matchesSearch =
        annotation.documentName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        annotation.author?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesType = typeFilter === 'all' || annotation.type === typeFilter;

      return matchesSearch && matchesType;
    });
  }, [annotations, searchQuery, typeFilter]);

  const stats = useMemo(() => {
    const totalAnnotations = annotations.length;
    const activeCount = annotations.filter((a) => a.status === 'active').length;
    const resolvedCount = annotations.filter((a) => a.status === 'resolved').length;

    return {
      totalAnnotations,
      activeCount,
      resolvedCount,
    };
  }, [annotations]);

  return {
    searchQuery,
    setSearchQuery,
    typeFilter,
    setTypeFilter,
    filteredAnnotations,
    isLoading,
    stats,
  };
};

export default useAnnotations;
