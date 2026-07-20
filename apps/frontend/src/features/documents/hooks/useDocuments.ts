import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { documentService } from '../../../services/document.service';
import { Document } from '../types/documents.types';

export const useDocuments = () => {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');

  // Pagination & Sorting States
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;
  const [sortField, setSortField] = useState<keyof Document>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  const { data: documentDtos = [], isLoading, refetch } = useQuery({
    queryKey: ['documents'],
    queryFn: () => documentService.getDocuments(),
    staleTime: 5 * 60 * 1000,
  });

  const documents = useMemo(() => {
    return (documentDtos as any[]).map((d): Document => {
      const mapType = (t: string): 'agreement' | 'noc' | 'receipt' | 'drawing' | 'other' => {
        switch (t?.toLowerCase()) {
          case 'agreement':
            return 'agreement';
          case 'legal':
            return 'noc';
          case 'invoice':
          case 'receipt':
            return 'receipt';
          case 'design':
            return 'drawing';
          default:
            return 'other';
        }
      };

      const mapStatus = (s: string): 'pending' | 'verified' | 'rejected' => {
        switch (s?.toLowerCase()) {
          case 'verified':
            return 'verified';
          case 'rejected':
            return 'rejected';
          default:
            return 'pending';
        }
      };

      const formatSize = (bytes: number) => {
        if (!bytes) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
      };

      return {
        id: d.id || '',
        name: d.fileName || 'Document File',
        type: mapType(d.documentType),
        status: mapStatus(d.status),
        uploadedAt: d.uploadedAt ? new Date(d.uploadedAt).toLocaleDateString('en-IN') : '',
        fileSize: formatSize(d.fileSize || 0),
        workDriveFileId: d.workDriveFileId || '',
      };
    });
  }, [documentDtos]);

  const filteredDocuments = useMemo(() => {
    return documents.filter((doc) => {
      const matchesSearch =
        doc.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        doc.type?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesType = typeFilter === 'all' || doc.type === typeFilter;

      return matchesSearch && matchesType;
    });
  }, [documents, searchQuery, typeFilter]);

  const sortedDocuments = useMemo(() => {
    const sorted = [...filteredDocuments];
    sorted.sort((a, b) => {
      let aVal = a[sortField] || '';
      let bVal = b[sortField] || '';

      if (typeof aVal === 'string') {
        aVal = aVal.toLowerCase();
        bVal = (bVal as string).toLowerCase();
      }

      if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
    return sorted;
  }, [filteredDocuments, sortField, sortOrder]);

  const totalPages = Math.max(1, Math.ceil(sortedDocuments.length / pageSize));

  const paginatedDocuments = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return sortedDocuments.slice(startIndex, startIndex + pageSize);
  }, [sortedDocuments, currentPage]);

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage((prev) => prev + 1);
    }
  };

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage((prev) => prev - 1);
    }
  };

  const handleSort = (field: keyof Document) => {
    if (sortField === field) {
      setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
    setCurrentPage(1);
  };

  const stats = useMemo(() => {
    const totalDocuments = documents.length;
    const verifiedDocuments = documents.filter((d) => d.status === 'verified').length;
    const pendingDocuments = documents.filter((d) => d.status === 'pending').length;

    return {
      totalDocuments,
      verifiedDocuments,
      pendingDocuments,
    };
  }, [documents]);

  const createDocumentMutation = useMutation({
    mutationFn: (newDoc: {
      workflowId: string;
      workDriveFileId: string;
      fileName: string;
      documentType: string;
      fileSize: number;
      mimeType: string;
    }) => documentService.createDocument(newDoc as any),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      documentService.updateStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
    },
  });

  return {
    searchQuery,
    setSearchQuery,
    typeFilter,
    setTypeFilter,
    filteredDocuments: paginatedDocuments,
    isLoading,
    stats,
    refetch,
    // Pagination & Sorting Context
    currentPage,
    totalPages,
    onNextPage: handleNextPage,
    onPreviousPage: handlePreviousPage,
    sortField,
    sortOrder,
    onSort: handleSort,
    // Mutations
    createDocument: createDocumentMutation.mutateAsync,
    isCreating: createDocumentMutation.isPending,
    updateStatus: updateStatusMutation.mutateAsync,
    isUpdatingStatus: updateStatusMutation.isPending,
  };
};

export default useDocuments;
