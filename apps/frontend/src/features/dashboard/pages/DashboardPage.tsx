import React from 'react';
import {
  CreditCard,
  AlertTriangle,
  Hammer,
  History,
  Building,
} from 'lucide-react';
import { Card } from '../../../components/ui/Card';
import { StatCard } from '../../../components/ui/StatCard';
import { StatusBadge } from '../../../components/ui/StatusBadge';
import { EmptyState } from '../../../components/ui/EmptyState';
import { LoadingScreen } from '../../../components/common/LoadingScreen';
import { useDashboard } from '../hooks/useDashboard';
import { useAuthStore } from '../../../store/authStore';
import { AdminDashboardView } from '../components/AdminDashboardView';
import { JourneyEngine } from '../components/JourneyEngine';

import { useUnitStore } from '../../../store/unitStore';
import { useNavigate } from 'react-router-dom';

const ClientDashboardPage: React.FC = () => {
  const { dashboardData, isLoading } = useDashboard();
  const { units, activeUnit, setActiveUnit } = useUnitStore();
  const navigate = useNavigate();

  React.useEffect(() => {
    if (!activeUnit && !isLoading) {
      navigate('/my-home');
    }
  }, [activeUnit, isLoading, navigate]);

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (!dashboardData) {
    return (
      <EmptyState
        title="Dashboard Offline"
        description="Unable to load client portal specifications. Please verify your connection status."
        icon={AlertTriangle}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Property Switcher & Header */}
      <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between text-left p-6 rounded-3xl bg-brand-50/40 border border-brand-100/50 dark:bg-brand-950/10 dark:border-brand-850">
        <div>
          <h1 className="font-serif text-3.5xl font-semibold text-brand-900 dark:text-white">
            Welcome Home
          </h1>
          <p className="text-sm font-semibold text-brand-500 mt-1">
            Your GoodEarth homeowner dashboard
          </p>
        </div>
        <div className="flex items-center gap-3 bg-white dark:bg-brand-900 border border-brand-200 dark:border-brand-800 rounded-2xl p-3 shadow-sm min-w-[320px]">
          <Building className="h-5 w-5 text-brand-600 shrink-0" />
          <div className="flex-1">
            <span className="text-[9px] uppercase font-bold text-brand-400 block tracking-wider font-mono">Active Residence</span>
            <select
              value={activeUnit?.id || ''}
              onChange={(e) => {
                const target = units.find((u) => u.id === e.target.value);
                if (target) setActiveUnit(target);
              }}
              className="w-full bg-transparent text-xs font-bold text-brand-900 dark:text-white outline-none cursor-pointer mt-0.5"
            >
              {units.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.projectName ? `${u.projectName} — ${u.unitName}` : u.unitName}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Main split UI */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 text-left">
        {/* Left 2/3 - Guided Homeowner Journey Timeline */}
        <div className="lg:col-span-2 space-y-6">
          <JourneyEngine />
        </div>

        {/* Right Column - Status cards */}
        <div className="space-y-6">
          {/* Financial summary card */}
          <StatCard
            title="Outstanding Amount"
            value={dashboardData.payment.outstanding || '₹0.00'}
            subtext={
              dashboardData.payment.dueDate ? `Next draw due on ${dashboardData.payment.dueDate}` : 'No immediate draw outstanding'
            }
            icon={CreditCard}
            badge={<StatusBadge label="Due" type="warning" />}
          />

          {/* Construction Phase Progress */}
          <StatCard
            title="Current Progress"
            value={dashboardData.stage.name || 'Structural Work'}
            subtext={`Estimated Handover: ${dashboardData.stage.estHandoff || '—'}`}
            icon={Hammer}
            badge={<StatusBadge label={`${dashboardData.stage.progressPercent}% Done`} type="info" />}
          />

          {/* Recent site audit summary */}
          <Card title="Recent Site Updates" subtitle="Latest logs from project site engineers">
            {dashboardData.activities.length > 0 ? (
              <div className="space-y-3">
                {dashboardData.activities.slice(0, 3).map((act) => (
                  <div key={act.id} className="text-xs border-b border-brand-100 dark:border-brand-850 pb-2 last:border-none">
                    <div className="flex justify-between text-[10px] text-brand-400 font-semibold mb-0.5">
                      <span>SITE UPDATE</span>
                      <span>{act.date}</span>
                    </div>
                    <p className="text-brand-800 dark:text-brand-200 leading-relaxed font-medium">
                      {act.description}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState
                title="No site updates"
                description="Updates will register as site construction moves forward."
                icon={History}
              />
            )}
          </Card>
        </div>
      </div>
    </div>
  );
};

export const DashboardPage: React.FC = () => {
  const { user } = useAuthStore();

  // If the user is an admin or employee, display the administrative console instead
  if (user?.role === 'admin' || user?.role === 'employee') {
    return <AdminDashboardView />;
  }

  return <ClientDashboardPage />;
};

export default DashboardPage;
