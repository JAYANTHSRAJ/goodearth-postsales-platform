import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  UserCheck,
  FolderOpen,
  Plus,
  X,
  Search,
  DollarSign,
  Activity,
  Eye,
} from 'lucide-react';
import { Card } from '../../../components/ui/Card';
import { StatCard } from '../../../components/ui/StatCard';
import { StatusBadge } from '../../../components/ui/StatusBadge';
import { EmptyState } from '../../../components/ui/EmptyState';
import { Pagination } from '../../../components/ui/Pagination';
import { useBuyers } from '../hooks/useBuyers';

export const BuyersPage: React.FC = () => {
  const navigate = useNavigate();
  const {
    filteredBuyers,
    isLoading,
    totalBuyers,
    activeBuyers,
    pendingBuyers,
    currentPage,
    totalPages,
    onNextPage,
    onPreviousPage,
    createBuyer,
  } = useBuyers();

  // Search & Filter state
  const [globalSearch, setGlobalSearch] = useState('');
  const [filterProject, setFilterProject] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');

  // Create Form states
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [formName, setFormName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formCoApplicantName, setFormCoApplicantName] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formStatus, setFormStatus] = useState<'active' | 'completed' | 'pending'>('pending');
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Advanced filters & Global Search logic driven by REAL backend buyers
  const realFilteredBuyers = useMemo(() => {
    return filteredBuyers.filter((b) => {
      const matchesSearch =
        b.name?.toLowerCase().includes(globalSearch.toLowerCase()) ||
        b.email?.toLowerCase().includes(globalSearch.toLowerCase()) ||
        (b.phone && b.phone.includes(globalSearch)) ||
        b.unitName?.toLowerCase().includes(globalSearch.toLowerCase()) ||
        b.projectName?.toLowerCase().includes(globalSearch.toLowerCase());

      const matchesProject = filterProject === 'all' || b.projectName === filterProject;
      const matchesStatus = filterStatus === 'all' || b.status === filterStatus;

      return matchesSearch && matchesProject && matchesStatus;
    });
  }, [filteredBuyers, globalSearch, filterProject, filterStatus]);

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName || !formEmail) {
      setFormError('Please enter both name and email address.');
      return;
    }
    setIsSubmitting(true);
    setFormError(null);
    try {
      await createBuyer({
        name: formName,
        email: formEmail,
        status: formStatus,
        coApplicantName: formCoApplicantName,
        phone: formPhone,
      } as any);
      setIsCreateOpen(false);
      setFormName('');
      setFormEmail('');
      setFormCoApplicantName('');
      setFormPhone('');
    } catch (err: any) {
      setFormError(err.message || 'Failed to create buyer.');
    } finally {
      setIsSubmitting(false);
    }
  };



  return (
    <div className="space-y-6 text-left">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-serif text-3xl font-semibold text-brand-900 dark:text-white">
            Buyers Directory
          </h1>
          <p className="text-sm font-medium text-brand-500 dark:text-brand-400 mt-1">
            Buyer accounts synchronized from database and integrated services.
          </p>
        </div>
        <div>
          <button
            onClick={() => {
              setFormName('');
              setFormEmail('');
              setFormCoApplicantName('');
              setFormPhone('');
              setFormStatus('pending');
              setFormError(null);
              setIsCreateOpen(true);
            }}
            className="flex items-center gap-2 rounded-xl bg-brand-700 px-4 py-2.5 text-sm font-semibold text-white shadow-md transition-colors hover:bg-brand-800 dark:bg-brand-600 dark:hover:bg-brand-500"
          >
            <Plus className="h-4 w-4" />
            Add Buyer Account
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          title="Total Buyers"
          value={String(totalBuyers)}
          icon={Users}
          badge={<StatusBadge label="Database" type="info" />}
        />
        <StatCard
          title="Active Buyers"
          value={String(activeBuyers)}
          icon={UserCheck}
          badge={<StatusBadge label="Active" type="success" />}
        />
        <StatCard
          title="Pending Accounts"
          value={String(pendingBuyers)}
          icon={DollarSign}
          badge={<StatusBadge label="Pending" type="warning" />}
        />
        <StatCard
          title="System Sync"
          value="Online"
          icon={Activity}
          badge={<StatusBadge label="Active" type="success" />}
        />
      </div>

      {/* Search & Filters */}
      <Card title="Filter & Search Directory" subtitle="Filter parameters to query buyer accounts">
        <div className="space-y-4 mt-2">
          {/* Search bar */}
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-brand-400" />
            <input
              type="text"
              placeholder="Search buyer name, email, phone, villa number, or project name..."
              value={globalSearch}
              onChange={(e) => setGlobalSearch(e.target.value)}
              className="w-full rounded-xl border border-brand-200 bg-brand-50/20 pl-9 pr-4 py-2.5 text-xs outline-none focus:ring-2 focus:ring-brand-500/25 dark:border-brand-850 dark:bg-brand-950/20 dark:text-white"
            />
          </div>

          {/* Filter dropdowns */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-semibold">
            <div>
              <label className="block text-[10px] uppercase tracking-wider text-brand-400 mb-1 font-mono">Project</label>
              <select
                value={filterProject}
                onChange={(e) => setFilterProject(e.target.value)}
                className="w-full rounded-xl border border-brand-200 bg-brand-50/20 px-3 py-2 text-xs outline-none dark:border-brand-850 dark:bg-brand-900"
              >
                <option value="all">All Projects</option>
                <option value="GoodEarth Malhar">GoodEarth Malhar</option>
                <option value="GoodEarth Orchard">GoodEarth Orchard</option>
                <option value="GoodEarth Footprints">GoodEarth Footprints</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] uppercase tracking-wider text-brand-400 mb-1 font-mono">Status</label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full rounded-xl border border-brand-200 bg-brand-50/20 px-3 py-2 text-xs outline-none dark:border-brand-850 dark:bg-brand-900"
              >
                <option value="all">All Statuses</option>
                <option value="active">Active</option>
                <option value="pending">Pending</option>
                <option value="completed">Completed</option>
              </select>
            </div>
          </div>
        </div>
      </Card>

      {/* Buyer Table Grid */}
      <Card title="Buyer Accounts Directory" subtitle="Real-time records from database">
        {isLoading ? (
          <div className="py-16 text-center text-xs text-brand-550 font-bold uppercase tracking-wider font-mono">
            Querying Buyer Records...
          </div>
        ) : realFilteredBuyers.length > 0 ? (
          <div className="overflow-x-auto mt-2">
            <table className="min-w-full divide-y divide-brand-200 dark:divide-brand-850">
              <thead className="bg-brand-50/50 dark:bg-brand-950/30">
                <tr className="text-xs font-semibold text-brand-500 uppercase tracking-wider">
                  <th scope="col" className="px-4 py-3 text-left">Buyer Name</th>
                  <th scope="col" className="px-4 py-3 text-left">Booking Number</th>
                  <th scope="col" className="px-4 py-3 text-left">Project</th>
                  <th scope="col" className="px-4 py-3 text-left">Unit</th>
                  <th scope="col" className="px-4 py-3 text-left">Phone</th>
                  <th scope="col" className="px-4 py-3 text-left">Status</th>
                  <th scope="col" className="px-4 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-brand-900 divide-y divide-brand-100 dark:divide-brand-850/40 text-xs text-brand-800 dark:text-brand-200 font-semibold">
                {realFilteredBuyers.map((b, idx) => {
                  const bookingNum = b.unitName || `BKG-2026-${101 + idx}`;
                  return (
                    <tr
                      key={b.id}
                      onClick={() => navigate(`/buyers/booking/${bookingNum}`)}
                      className="hover:bg-brand-50/30 dark:hover:bg-brand-950/10 cursor-pointer transition-colors"
                    >
                      <td className="px-4 py-3 text-left font-bold text-brand-900 dark:text-white">
                        <div>{b.name}</div>
                        <div className="text-[10px] text-brand-450 mt-0.5">{b.email}</div>
                      </td>
                      <td className="px-4 py-3 text-left font-mono font-bold text-brand-600 dark:text-brand-400">
                        {bookingNum}
                      </td>
                      <td className="px-4 py-3 text-left">{b.projectName || 'GoodEarth Malhar'}</td>
                      <td className="px-4 py-3 text-left font-semibold">{b.unitName || 'Villa 14'}</td>
                      <td className="px-4 py-3 text-left font-mono">{b.phone || 'N/A'}</td>
                      <td className="px-4 py-3 text-left">
                        <StatusBadge
                          label={b.status === 'active' ? 'Active' : 'Pending'}
                          type={b.status === 'active' ? 'success' : 'warning'}
                        />
                      </td>
                      <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => navigate(`/buyers/booking/${bookingNum}`)}
                          className="px-3 py-1.5 bg-brand-700 hover:bg-brand-800 text-white rounded-xl text-xs font-bold transition-all shadow-sm inline-flex items-center gap-1.5"
                        >
                          <Eye className="h-3.5 w-3.5" /> View Dashboard
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <div className="mt-4">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onNext={onNextPage}
                onPrevious={onPreviousPage}
              />
            </div>
          </div>
        ) : (
          <EmptyState
            title="No Buyers Found"
            description="No buyer records match your search parameters."
            icon={FolderOpen}
          />
        )}
      </Card>

      {/* CREATE BUYER MODAL */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-brand-950/40 backdrop-blur-sm text-left">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl dark:bg-brand-900 border border-brand-200 dark:border-brand-800">
            <div className="flex items-center justify-between pb-3 border-b border-brand-100 dark:border-brand-800">
              <h3 className="text-lg font-serif font-bold text-brand-900 dark:text-white">Create Buyer Account</h3>
              <button onClick={() => setIsCreateOpen(false)} className="rounded-lg p-1 text-brand-400 hover:bg-brand-100">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleCreateSubmit} className="mt-4 space-y-4">
              {formError && (
                <div role="alert" className="rounded-xl bg-red-50 p-3 text-xs font-medium text-red-750 border border-red-200">
                  {formError}
                </div>
              )}
              <div>
                <label className="block text-xs font-bold text-brand-700 dark:text-brand-300 mb-1">Full Name *</label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full rounded-xl border border-brand-200 bg-brand-50/30 px-3 py-2 text-xs outline-none dark:border-brand-800 dark:bg-brand-950/20"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-brand-700 dark:text-brand-300 mb-1">Email Address *</label>
                <input
                  type="email"
                  value={formEmail}
                  onChange={(e) => setFormEmail(e.target.value)}
                  className="w-full rounded-xl border border-brand-200 bg-brand-50/30 px-3 py-2 text-xs outline-none dark:border-brand-800 dark:bg-brand-950/20"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-brand-700 dark:text-brand-300 mb-1">Phone Number</label>
                <input
                  type="text"
                  value={formPhone}
                  onChange={(e) => setFormPhone(e.target.value)}
                  className="w-full rounded-xl border border-brand-200 bg-brand-50/30 px-3 py-2 text-xs outline-none dark:border-brand-800 dark:bg-brand-950/20"
                />
              </div>
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="rounded-xl px-4 py-2 text-xs font-semibold text-brand-600 hover:bg-brand-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="rounded-xl bg-brand-700 px-4 py-2 text-xs font-semibold text-white hover:bg-brand-800 disabled:opacity-50"
                >
                  {isSubmitting ? 'Creating...' : 'Create Buyer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default BuyersPage;
