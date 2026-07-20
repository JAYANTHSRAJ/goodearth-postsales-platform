import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { workflowService } from '../../../services/workflow.service';
import { Workflow } from '../types/workflows.types';

export const useWorkflows = () => {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [stageFilter, setStageFilter] = useState('all');

  // Pagination & Sorting States
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;
  const [sortField, setSortField] = useState<keyof Workflow>('buyerName');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  const { data: workflows = [], isLoading, refetch } = useQuery({
    queryKey: ['workflows'],
    queryFn: () => workflowService.getWorkflows(),
    staleTime: 5 * 60 * 1000,
  });

  const filteredWorkflows = useMemo(() => {
    return workflows.filter((workflow) => {
      const matchesSearch =
        workflow.buyerName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        workflow.projectName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        workflow.unitName?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStage = stageFilter === 'all' || workflow.currentStage === stageFilter;

      return matchesSearch && matchesStage;
    });
  }, [workflows, searchQuery, stageFilter]);

  const sortedWorkflows = useMemo(() => {
    const sorted = [...filteredWorkflows];
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
  }, [filteredWorkflows, sortField, sortOrder]);

  const totalPages = Math.max(1, Math.ceil(sortedWorkflows.length / pageSize));

  const paginatedWorkflows = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return sortedWorkflows.slice(startIndex, startIndex + pageSize);
  }, [sortedWorkflows, currentPage]);

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

  const handleSort = (field: keyof Workflow) => {
    if (sortField === field) {
      setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
    setCurrentPage(1);
  };

  const stats = useMemo(() => {
    const totalWorkflows = workflows.length;
    const activeWorkflows = workflows.filter((w) => w.status === 'active').length;
    const completedWorkflows = workflows.filter((w) => w.status === 'completed').length;

    return {
      totalWorkflows,
      activeWorkflows,
      completedWorkflows,
    };
  }, [workflows]);

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      workflowService.updateWorkflowStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workflows'] });
    },
  });

  return {
    searchQuery,
    setSearchQuery,
    stageFilter,
    setStageFilter,
    filteredWorkflows: paginatedWorkflows,
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
    // Transitions
    updateWorkflowStatus: updateStatusMutation.mutateAsync,
    isUpdatingStatus: updateStatusMutation.isPending,
  };
};

export default useWorkflows;
