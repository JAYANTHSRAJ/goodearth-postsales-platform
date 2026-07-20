import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { clientService } from '../../../services/client.service';
import { stageService } from '../../../services/stage.service';

export const useDashboard = () => {
  const { data: dashboard, isLoading: isDashboardLoading } = useQuery({
    queryKey: ['clientDashboard'],
    queryFn: () => clientService.getDashboard(),
    staleTime: 60 * 1000,
  });

  const { data: home, isLoading: isHomeLoading } = useQuery({
    queryKey: ['clientHome'],
    queryFn: () => clientService.getHomeDetails(),
    staleTime: 60 * 1000,
  });

  const { data: finance, isLoading: isFinanceLoading } = useQuery({
    queryKey: ['clientFinance'],
    queryFn: () => clientService.getFinanceSummary(),
    staleTime: 60 * 1000,
  });

  const { data: timeline, isLoading: isTimelineLoading } = useQuery({
    queryKey: ['clientTimeline'],
    queryFn: () => clientService.getTimeline(),
    staleTime: 60 * 1000,
  });

  const { data: stages = [] } = useQuery({
    queryKey: ['stages'],
    queryFn: () => stageService.getStages(),
    staleTime: 5 * 60 * 1000,
  });

  const isLoading = isDashboardLoading || isHomeLoading || isFinanceLoading || isTimelineLoading;

  const dashboardData = useMemo(() => {
    if (!dashboard || !home || !finance) return null;

    // 1. Calculate Timeline Steps
    const activeStages = [...stages]
      .filter((s) => s.status === 'active')
      .sort((a, b) => a.sequenceOrder - b.sequenceOrder);

    const currentStageId = dashboard.currentStage?.id;
    const currentStage = activeStages.find((s) => s.id === currentStageId);

    const timelineSteps = activeStages.map((stage) => {
      let status: 'completed' | 'current' | 'pending' = 'pending';
      if (currentStage) {
        if (stage.sequenceOrder < currentStage.sequenceOrder) {
          status = 'completed';
        } else if (stage.sequenceOrder === currentStage.sequenceOrder) {
          status = 'current';
        }
      }
      return {
        id: stage.id,
        name: stage.name,
        status,
        date: status === 'current' ? 'Current' : undefined,
      };
    });

    // 2. Sum up Paid Amount
    const paidSum = (finance.receipts || []).reduce((acc, r) => acc + (r.amount || 0), 0);
    const totalContract = paidSum + (finance.outstandingBalance || 0);


    const paidPercent = totalContract > 0 
      ? `${Math.round((paidSum / totalContract) * 100)}%` 
      : '0%';

    const formatCurrency = (amount: number) => {
      return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 0,
      }).format(amount);
    };

    // 3. Outstanding balance and due date
    const unpaidInvoices = (finance.invoices || []).filter(
      (inv) => inv.status !== 'PAID' && inv.status !== 'void'
    );
    const nextDueDateStr = unpaidInvoices.length > 0 && unpaidInvoices[0].dueDate
      ? new Date(unpaidInvoices[0].dueDate).toLocaleDateString('en-IN', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
        })
      : '';

    // 4. Pending decisions (Change requests requiring attention)
    const decisions = (dashboard.pendingChangeRequests || []).map((cr) => {
      return {
        id: cr.id,
        title: `Verify customized revision details: ${cr.remarks || 'Electrical/Civil modifications'}`,
        daysLeft: 7, // Default decision SLA
      };
    });

    // 5. Activities list from timeline logs
    const activities = (timeline || [])
      .slice(0, 5) // Display top 5
      .map((event, idx) => {
        const timeDiff = new Date().getTime() - new Date(event.timestamp).getTime();
        const daysAgo = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
        const dateText = daysAgo === 0 
          ? 'Today' 
          : daysAgo === 1 
            ? 'Yesterday' 
            : `${daysAgo} days ago`;

        return {
          id: `${event.timestamp}-${idx}`,
          description: `${event.title}: ${event.description}`,
          date: dateText,
        };
      });

    return {
      customer: {
        name: dashboard.buyer.fullName,
        projectName: dashboard.project.projectName,
        unitName: home.villa,
      },
      unit: {
        block: home.plot,
        layout: home.villa,
        area: home.area,
        status: home.constructionStatus,
      },
      stage: {
        name: dashboard.currentStage?.name || home.constructionStatus,
        progressPercent: dashboard.completionPercent || home.completionPercent || 0,
        estHandoff: home.expectedHandover,
      },
      payment: {
        paid: formatCurrency(paidSum),
        paidPercent,
        outstanding: formatCurrency(finance.outstandingBalance || 0),
        dueDate: nextDueDateStr,
      },
      upgrade: {
        title: 'Premium Upgrade Customisation Option',
        description: 'Design selections for customized premium finishing options are active for this villa unit.',
      },
      decisions,
      activities,
      timelineSteps,
    };
  }, [dashboard, home, finance, timeline, stages]);

  return {
    dashboardData,
    isLoading,
  };
};

export default useDashboard;
