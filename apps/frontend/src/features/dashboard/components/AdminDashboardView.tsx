import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  GitMerge,
  CreditCard,
  CheckCircle,
  AlertTriangle,
  Building2,
  Search,
  ArrowUpRight,
} from 'lucide-react';
import { useAdminDashboard } from '../hooks/useAdminDashboard';
import { Card } from '../../../components/ui/Card';
import { StatCard } from '../../../components/ui/StatCard';
import { StatusBadge } from '../../../components/ui/StatusBadge';
import { LoadingScreen } from '../../../components/common/LoadingScreen';

interface SearchItem {
  id: string;
  type: 'Buyer' | 'Property' | 'Project' | 'Invoice';
  title: string;
  subtitle: string;
}

const SEARCH_DATABASE: SearchItem[] = [
  { id: 'b1', type: 'Buyer', title: 'Priyal Sharma', subtitle: 'Registrant of GoodEarth Malhar — Villa 14' },
  { id: 'b2', type: 'Buyer', title: 'Amit Patel', subtitle: 'Registrant of Malhar Phase II — Villa 22' },
  { id: 'b3', type: 'Buyer', title: 'Karan Singh', subtitle: 'Registrant of GoodEarth Malhar — Villa 05' },
  { id: 'p1', type: 'Property', title: 'Villa 14', subtitle: 'GoodEarth Malhar — Plot No. 34' },
  { id: 'p2', type: 'Property', title: 'Villa 22', subtitle: 'Malhar Phase II — Plot No. 12' },
  { id: 'pj1', type: 'Project', title: 'GoodEarth Malhar', subtitle: 'Kengeri, Bengaluru' },
  { id: 'pj2', type: 'Project', title: 'Malhar Phase II', subtitle: 'Kengeri, Bengaluru' },
  { id: 'i1', type: 'Invoice', title: 'INV-2026-0045', subtitle: 'Overdue: ₹2,50,000 — Villa 14' },
  { id: 'i2', type: 'Invoice', title: 'INV-2026-0046', subtitle: 'Pending: ₹12,15,000 — Villa 22' },
];

export const AdminDashboardView: React.FC = () => {
  const { data: stats, isLoading, error, refetch } = useAdminDashboard();
  const navigate = useNavigate();

  // Search states
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchItem[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);

  // Operational Tabs states
  const [activeOpsTab, setActiveOpsTab] = useState<'reviews' | 'payments' | 'delayed' | 'tickets'>('reviews');

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    if (query.trim() === '') {
      setSearchResults([]);
      setShowDropdown(false);
      return;
    }

    const filtered = SEARCH_DATABASE.filter(
      (item) =>
        item.title.toLowerCase().includes(query.toLowerCase()) ||
        item.subtitle.toLowerCase().includes(query.toLowerCase()) ||
        item.type.toLowerCase().includes(query.toLowerCase())
    );
    setSearchResults(filtered);
    setShowDropdown(true);
  };

  const handleSearchSelect = (item: SearchItem) => {
    setSearchQuery(item.title);
    setShowDropdown(false);
    alert(`Navigating to verified database view for ${item.type}: ${item.title}`);
  };

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (error || !stats) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center dark:border-red-900/50 dark:bg-red-950/20">
        <AlertTriangle className="mx-auto h-12 w-12 text-red-600 dark:text-red-400 mb-3" />
        <h3 className="text-lg font-semibold text-red-800 dark:text-red-300">Failed to load admin stats</h3>
        <p className="mt-1 text-sm text-red-600 dark:text-red-400">
          {(error as any)?.message || 'An error occurred while communicating with the server.'}
        </p>
        <button
          onClick={() => refetch()}
          className="mt-4 rounded-xl bg-red-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-600"
        >
          Retry Load
        </button>
      </div>
    );
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="space-y-6">
      {/* 1. Global Search Bar & Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between text-left">
        <div>
          <h1 className="font-serif text-3xl font-semibold text-brand-900 dark:text-white">
            Administrative Console
          </h1>
          <p className="text-sm font-medium text-brand-500 dark:text-brand-400 mt-1">
            Real-time operations summary, project workloads, and client change review management
          </p>
        </div>

        {/* Global Search input */}
        <div className="relative w-full sm:w-[350px]">
          <div className="flex items-center gap-2 bg-white dark:bg-brand-900 border border-brand-200 dark:border-brand-800 rounded-2xl px-3 py-2 shadow-sm focus-within:ring-2 focus-within:ring-brand-500/25">
            <Search className="h-4.5 w-4.5 text-brand-400 shrink-0" />
            <input
              type="text"
              value={searchQuery}
              onChange={handleSearchChange}
              onFocus={() => { if (searchQuery.trim()) setShowDropdown(true); }}
              onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
              placeholder="Search Buyers, Properties, Projects..."
              className="w-full bg-transparent text-xs font-semibold text-brand-900 dark:text-white outline-none"
            />
          </div>

          {/* Results Dropdown */}
          {showDropdown && searchResults.length > 0 && (
            <div className="absolute top-11 left-0 right-0 z-20 bg-white dark:bg-brand-900 border border-brand-200 dark:border-brand-800 rounded-2xl shadow-xl max-h-[300px] overflow-y-auto p-2 space-y-1">
              {searchResults.map((item) => (
                <div
                  key={item.id}
                  onClick={() => handleSearchSelect(item)}
                  className="p-2.5 rounded-xl hover:bg-brand-50/50 dark:hover:bg-brand-850 cursor-pointer flex items-center justify-between text-left"
                >
                  <div>
                    <h5 className="text-xs font-semibold text-brand-900 dark:text-white">{item.title}</h5>
                    <p className="text-[10px] text-brand-450 mt-0.5">{item.subtitle}</p>
                  </div>
                  <span className="rounded bg-brand-100 dark:bg-brand-800 px-2 py-0.5 text-[8px] font-bold text-brand-700 dark:text-brand-350 uppercase tracking-wide">
                    {item.type}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 2. Main Stats Grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard
          title="Total Buyers"
          value={String(stats.totalBuyers)}
          icon={Users}
          badge={<StatusBadge label="Synced" type="info" />}
        />
        <StatCard
          title="Active Workflows"
          value={String(stats.activeWorkflows)}
          icon={GitMerge}
          badge={<StatusBadge label="In Progress" type="success" />}
        />
        <StatCard
          title="Total Invoiced"
          value={formatCurrency(stats.totalInvoiced)}
          icon={CreditCard}
          badge={<StatusBadge label="Billed" type="info" />}
        />
        <StatCard
          title="Total Receipts"
          value={formatCurrency(stats.totalPaid)}
          icon={CheckCircle}
          badge={<StatusBadge label="Received" type="success" />}
        />
        <StatCard
          title="Outstanding"
          value={formatCurrency(stats.outstandingBalance)}
          icon={AlertTriangle}
          badge={<StatusBadge label="Pending" type="warning" />}
        />
      </div>

      {/* 3. Distribution Layout Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Project Workloads */}
        <Card title="Project Portfolios" subtitle="Villas Allocation & Workflows per Project">
          {Object.keys(stats.projectWorkloads).length > 0 ? (
            <div className="space-y-4 pt-2">
              {Object.entries(stats.projectWorkloads).map(([name, count]) => (
                <div key={name} className="flex items-center justify-between border-b border-brand-100 dark:border-brand-800 pb-2 last:border-none last:pb-0">
                  <div className="flex items-center gap-3 text-left">
                    <Building2 className="h-5 w-5 text-brand-400 dark:text-brand-500" />
                    <div>
                      <span className="text-sm font-semibold text-brand-800 dark:text-brand-200">{name}</span>
                    </div>
                  </div>
                  <span className="rounded-full bg-brand-100 px-3 py-1 text-xs font-bold text-brand-800 dark:bg-brand-800 dark:text-brand-200">
                    {count} active
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-10 text-center text-sm text-brand-400 dark:text-brand-500">
              No project portfolios configured.
            </div>
          )}
        </Card>

        {/* Center: Project Progress (Renamed from Stage Progression) */}
        <Card title="Project Progress" subtitle="Current Milestone Distribution Summary">
          {Object.keys(stats.stageCounts).length > 0 ? (
            <div className="space-y-4 pt-2">
              {Object.entries(stats.stageCounts).map(([stage, count]) => (
                <div key={stage} className="space-y-1.5 text-left">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-brand-700 dark:text-brand-300">{stage}</span>
                    <span className="text-brand-900 dark:text-white">{count} unit(s)</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-brand-100 dark:bg-brand-800">
                    <div
                      className="h-2 rounded-full bg-accent-600 dark:bg-accent-500"
                      style={{
                        width: `${Math.min(100, (count / (stats.activeWorkflows || 1)) * 100)}%`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-10 text-center text-sm text-brand-400 dark:text-brand-500">
              No active milestones logged.
            </div>
          )}
        </Card>

        {/* Right: Operational Tabs Center (Replaced Integration Monitors) */}
        <Card title="Operations Control Center" subtitle="Tasks requiring post-sales coordinator clearances">
          {/* Tab buttons */}
          <div className="flex border-b border-brand-100 dark:border-brand-850 pb-2 mb-3 gap-2">
            <button
              onClick={() => setActiveOpsTab('reviews')}
              className={`pb-1 text-[10px] font-bold uppercase tracking-wider transition-colors ${
                activeOpsTab === 'reviews' ? 'border-b-2 border-brand-700 text-brand-900 dark:text-white' : 'text-brand-400 hover:text-brand-700'
              }`}
            >
              Reviews
            </button>
            <button
              onClick={() => setActiveOpsTab('payments')}
              className={`pb-1 text-[10px] font-bold uppercase tracking-wider transition-colors ${
                activeOpsTab === 'payments' ? 'border-b-2 border-brand-700 text-brand-900 dark:text-white' : 'text-brand-400 hover:text-brand-700'
              }`}
            >
              Payments
            </button>
            <button
              onClick={() => setActiveOpsTab('delayed')}
              className={`pb-1 text-[10px] font-bold uppercase tracking-wider transition-colors ${
                activeOpsTab === 'delayed' ? 'border-b-2 border-brand-700 text-brand-900 dark:text-white' : 'text-brand-400 hover:text-brand-700'
              }`}
            >
              Delays
            </button>
            <button
              onClick={() => setActiveOpsTab('tickets')}
              className={`pb-1 text-[10px] font-bold uppercase tracking-wider transition-colors ${
                activeOpsTab === 'tickets' ? 'border-b-2 border-brand-700 text-brand-900 dark:text-white' : 'text-brand-400 hover:text-brand-700'
              }`}
            >
              Tickets
            </button>
          </div>

          <div className="space-y-3 text-left min-h-[160px] max-h-[160px] overflow-y-auto pr-1">
            {activeOpsTab === 'reviews' && (
              <div className="space-y-2">
                {stats.pendingReviews && stats.pendingReviews.length > 0 ? (
                  stats.pendingReviews.map((item) => (
                    <div key={item.id} className="p-2 rounded-lg bg-brand-50/50 dark:bg-brand-850 border border-brand-100 dark:border-brand-800 flex justify-between items-center text-xs">
                      <div>
                        <h5 className="font-semibold text-brand-900 dark:text-white">{item.title}</h5>
                        <p className="text-[10px] text-brand-450 mt-0.5">{item.subtitle}</p>
                      </div>
                      <button onClick={() => navigate('/annotations')} className="text-brand-650 hover:underline"><ArrowUpRight className="h-4 w-4" /></button>
                    </div>
                  ))
                ) : (
                  <div className="py-10 text-center text-xs text-brand-400 dark:text-brand-500">
                    No pending reviews logged.
                  </div>
                )}
              </div>
            )}

            {activeOpsTab === 'payments' && (
              <div className="space-y-2">
                {stats.overduePayments && stats.overduePayments.length > 0 ? (
                  stats.overduePayments.map((item) => (
                    <div key={item.id} className="p-2 rounded-lg bg-brand-50/50 dark:bg-brand-850 border border-brand-100 dark:border-brand-800 flex justify-between items-center text-xs">
                      <div>
                        <h5 className="font-semibold text-brand-900 dark:text-white">{item.title}</h5>
                        <p className="text-[10px] text-brand-450 mt-0.5">{item.subtitle}</p>
                      </div>
                      <button onClick={() => navigate('/payments')} className="text-brand-650 hover:underline"><ArrowUpRight className="h-4 w-4" /></button>
                    </div>
                  ))
                ) : (
                  <div className="py-10 text-center text-xs text-brand-400 dark:text-brand-500">
                    No pending/overdue payments logged.
                  </div>
                )}
              </div>
            )}

            {activeOpsTab === 'delayed' && (
              <div className="space-y-2">
                {stats.projectDelays && stats.projectDelays.length > 0 ? (
                  stats.projectDelays.map((item) => (
                    <div key={item.id} className="p-2 rounded-lg bg-brand-50/50 dark:bg-brand-850 border border-brand-100 dark:border-brand-800 flex justify-between items-center text-xs">
                      <div>
                        <h5 className="font-semibold text-brand-900 dark:text-white">{item.title}</h5>
                        <p className="text-[10px] text-brand-450 mt-0.5">{item.subtitle}</p>
                      </div>
                      <button onClick={() => navigate('/projects')} className="text-brand-650 hover:underline"><ArrowUpRight className="h-4 w-4" /></button>
                    </div>
                  ))
                ) : (
                  <div className="py-10 text-center text-xs text-brand-400 dark:text-brand-500">
                    No delayed milestones logged.
                  </div>
                )}
              </div>
            )}

            {activeOpsTab === 'tickets' && (
              <div className="space-y-2">
                {stats.openTickets && stats.openTickets.length > 0 ? (
                  stats.openTickets.map((item) => (
                    <div key={item.id} className="p-2 rounded-lg bg-brand-50/50 dark:bg-brand-850 border border-brand-100 dark:border-brand-800 flex justify-between items-center text-xs">
                      <div>
                        <h5 className="font-semibold text-brand-900 dark:text-white">{item.title}</h5>
                        <p className="text-[10px] text-brand-450 mt-0.5">{item.subtitle}</p>
                      </div>
                      <button onClick={() => alert('Support ticket detail simulation')} className="text-brand-650 hover:underline"><ArrowUpRight className="h-4 w-4" /></button>
                    </div>
                  ))
                ) : (
                  <div className="py-10 text-center text-xs text-brand-400 dark:text-brand-500">
                    No support tickets logged.
                  </div>
                )}
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* 4. Today's Activity Feed */}
      <Card title="Today's Operational Activity Feed" subtitle="Real-time log of homeowner submissions, payment clearances, and site audit logs">
        <div className="relative border-l border-brand-150 dark:border-brand-800 pl-4 space-y-4 text-left ml-2 pt-2">
          {stats.recentActivity && stats.recentActivity.length > 0 ? (
            stats.recentActivity.map((item) => (
              <div key={item.id} className="relative pl-6">
                <div className="absolute left-[-21px] top-1.5 h-2.5 w-2.5 rounded-full bg-green-600 ring-4 ring-white dark:ring-brand-900" />
                <div className="flex items-center justify-between gap-4">
                  <span className="text-xs font-semibold text-brand-850 dark:text-white">{item.title}</span>
                  <span className="text-[9px] font-mono text-brand-400">Today</span>
                </div>
                <p className="text-[10px] text-brand-500 mt-0.5">{item.subtitle}</p>
              </div>
            ))
          ) : (
            <div className="py-10 text-center text-sm text-brand-400 dark:text-brand-500">
              No operational activities logged today.
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};

export default AdminDashboardView;
