import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { buyerService } from '../../../services/buyer.service';
import { Buyer } from '../types/buyers.types';

export const useBuyers = () => {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  
  // Pagination & Sorting States
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;
  const [sortField, setSortField] = useState<keyof Buyer>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  const { data: buyers = [], isLoading, refetch } = useQuery({
    queryKey: ['buyers'],
    queryFn: () => buyerService.getBuyers(),
    staleTime: 5 * 60 * 1000,
  });

  const filteredBuyers = useMemo(() => {
    return buyers.filter((buyer) => {
      const matchesSearch =
        buyer.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        buyer.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        buyer.unitName?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus = statusFilter === 'all' || buyer.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [buyers, searchQuery, statusFilter]);

  const sortedBuyers = useMemo(() => {
    const sorted = [...filteredBuyers];
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
  }, [filteredBuyers, sortField, sortOrder]);

  const totalPages = Math.max(1, Math.ceil(sortedBuyers.length / pageSize));

  const paginatedBuyers = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return sortedBuyers.slice(startIndex, startIndex + pageSize);
  }, [sortedBuyers, currentPage]);

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

  const handleSort = (field: keyof Buyer) => {
    if (sortField === field) {
      setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
    setCurrentPage(1);
  };

  const stats = useMemo(() => {
    return {
      totalBuyers: buyers.length,
      activeBuyers: buyers.filter((b) => b.status === 'active').length,
      pendingBuyers: buyers.filter((b) => b.status === 'pending').length,
    };
  }, [buyers]);

  // Mutations
  const createBuyerMutation = useMutation({
    mutationFn: (newBuyer: Omit<Buyer, 'id' | 'projectName' | 'unitName' | 'totalPaid' | 'outstanding' | 'bookingDate'>) =>
      buyerService.createBuyer(newBuyer as any),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['buyers'] });
    },
  });

  const updateBuyerMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Buyer> }) =>
      buyerService.updateBuyer(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['buyers'] });
    },
  });

  const deleteBuyerMutation = useMutation({
    mutationFn: (id: string) => buyerService.deleteBuyer(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['buyers'] });
    },
  });

  return {
    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
    filteredBuyers: paginatedBuyers,
    isLoading,
    totalBuyers: stats.totalBuyers,
    activeBuyers: stats.activeBuyers,
    pendingBuyers: stats.pendingBuyers,
    refetch,
    // Pagination & Sorting Context
    currentPage,
    totalPages,
    onNextPage: handleNextPage,
    onPreviousPage: handlePreviousPage,
    sortField,
    sortOrder,
    onSort: handleSort,
    // CRUD Mutations
    createBuyer: createBuyerMutation.mutateAsync,
    isCreating: createBuyerMutation.isPending,
    updateBuyer: updateBuyerMutation.mutateAsync,
    isUpdating: updateBuyerMutation.isPending,
    deleteBuyer: deleteBuyerMutation.mutateAsync,
    isDeleting: deleteBuyerMutation.isPending,
  };
};

export default useBuyers;
