import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { stageService } from '../../../services/stage.service';

export const useStages = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const { data: stages = [], isLoading } = useQuery({
    queryKey: ['stages'],
    queryFn: () => stageService.getStages(),
    staleTime: 5 * 60 * 1000, // 5 minutes stale threshold
  });

  const filteredStages = useMemo(() => {
    return stages.filter((stage) => {
      const matchesSearch =
        stage.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        stage.code?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        stage.description?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus = statusFilter === 'all' || stage.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [stages, searchQuery, statusFilter]);

  const stats = useMemo(() => {
    const totalStages = stages.length;
    const activeStages = stages.filter((s) => s.status === 'active').length;
    const inactiveStages = stages.filter((s) => s.status === 'inactive').length;

    return {
      totalStages,
      activeStages,
      inactiveStages,
    };
  }, [stages]);

  return {
    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
    filteredStages,
    isLoading,
    stats,
  };
};

export default useStages;
