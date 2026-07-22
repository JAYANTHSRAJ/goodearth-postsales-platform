import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Clock, CheckCircle2, XCircle, AlertCircle, RefreshCw, Eye, Search } from 'lucide-react';
import { Card } from '../../../components/ui/Card';
import { clientService } from '../../../services/client.service';

export const AdminKycDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchFilter, setSearchFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const { data: rawApps, isLoading, refetch } = useQuery({
    queryKey: ['adminAllKycApplications'],
    queryFn: () => clientService.getAdminAllKycApplications(),
  });

  const applications = (rawApps as any)?.data || rawApps || [];

  const pendingCount = applications.filter((a: any) => a.status === 'SUBMITTED').length;
  const approvedCount = applications.filter((a: any) => a.status === 'APPROVED').length;
  const rejectedCount = applications.filter((a: any) => a.status === 'REJECTED').length;
  const modReqCount = applications.filter((a: any) => a.status === 'MODIFICATION_REQUESTED').length;

  const filtered = applications.filter((app: any) => {
    const matchesStatus = statusFilter === 'ALL' || app.status === statusFilter;
    const matchesSearch = !searchFilter ||
      (app.unitName && app.unitName.toLowerCase().includes(searchFilter.toLowerCase())) ||
      (app.formData?.primaryApplicant?.firstName && app.formData.primaryApplicant.firstName.toLowerCase().includes(searchFilter.toLowerCase())) ||
      (app.formData?.primaryApplicant?.email && app.formData.primaryApplicant.email.toLowerCase().includes(searchFilter.toLowerCase()));
    return matchesStatus && matchesSearch;
  });

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12 text-left">
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] font-bold tracking-wider uppercase text-brand-600 dark:text-brand-300">
            Administrative Management Portal
          </span>
          <h1 className="text-2xl font-bold text-brand-950 dark:text-white">KYC Verification & Sync Dashboard</h1>
        </div>
        <button
          type="button"
          onClick={() => refetch()}
          className="px-4 py-2 rounded-xl bg-brand-900 text-white font-semibold text-xs flex items-center gap-2 shadow hover:bg-brand-800 self-start sm:self-auto"
        >
          <RefreshCw className="h-3.5 w-3.5" /> Refresh Dashboard
        </button>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          icon={<Clock className="h-5 w-5 text-amber-600" />}
          title="Pending Verification"
          value={pendingCount}
          subtitle="Requires Coordinator Approval"
          color="border-amber-500/20 bg-amber-500/5"
        />
        <MetricCard
          icon={<CheckCircle2 className="h-5 w-5 text-emerald-600" />}
          title="Approved & Verified"
          value={approvedCount}
          subtitle="Ready for Title Deed Registry"
          color="border-emerald-500/20 bg-emerald-500/5"
        />
        <MetricCard
          icon={<AlertCircle className="h-5 w-5 text-purple-600" />}
          title="Modification Requested"
          value={modReqCount}
          subtitle="Awaiting Buyer Correction"
          color="border-purple-500/20 bg-purple-500/5"
        />
        <MetricCard
          icon={<XCircle className="h-5 w-5 text-red-600" />}
          title="Rejected Applications"
          value={rejectedCount}
          subtitle="Failed Regulatory Checks"
          color="border-red-500/20 bg-red-500/5"
        />
      </div>

      {/* Applications Table Card */}
      <Card title="Submitted Customer KYC Applications" subtitle="Review customer identity submissions, document proofs, and downstream sync statuses">
        <div className="space-y-4 pt-2">
          {/* Controls Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="relative w-full sm:w-72">
              <Search className="h-4 w-4 text-brand-400 absolute left-3 top-3" />
              <input
                type="text"
                placeholder="Search unit, buyer name, or email..."
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                className="w-full pl-9 pr-4 py-2 rounded-xl border border-brand-200 dark:border-brand-850 bg-brand-50/30 dark:bg-brand-950/20 text-xs outline-none focus:ring-2 focus:ring-brand-500/20 dark:text-white"
              />
            </div>

            <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto">
              {['ALL', 'SUBMITTED', 'APPROVED', 'REJECTED', 'MODIFICATION_REQUESTED'].map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setStatusFilter(st)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                    statusFilter === st
                      ? 'bg-brand-900 text-white dark:bg-brand-100 dark:text-brand-950'
                      : 'bg-brand-100 dark:bg-brand-850 text-brand-600 dark:text-brand-300 hover:bg-brand-200'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto border border-brand-100 dark:border-brand-850 rounded-xl">
            <table className="w-full text-left text-xs">
              <thead className="bg-brand-50/50 dark:bg-brand-950/50 text-brand-700 dark:text-brand-300 font-bold uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3">Property Unit</th>
                  <th className="px-4 py-3">Primary Applicant</th>
                  <th className="px-4 py-3">Submission Date</th>
                  <th className="px-4 py-3">KYC Status</th>
                  <th className="px-4 py-3 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-100 dark:divide-brand-850">
                {isLoading ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-brand-400">
                      Loading applications...
                    </td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-brand-400">
                      No KYC applications match the selected criteria.
                    </td>
                  </tr>
                ) : (
                  filtered.map((app: any) => {
                    const primary = app.formData?.primaryApplicant || {};
                    return (
                      <tr key={app.id} className="hover:bg-brand-50/30 dark:hover:bg-brand-950/20 transition-colors">
                        <td className="px-4 py-3.5 font-bold text-brand-950 dark:text-white">
                          {app.unitName || 'Villa / Plot Unit'}
                        </td>
                        <td className="px-4 py-3.5 space-y-0.5">
                          <span className="font-semibold text-brand-900 dark:text-white block">
                            {primary.firstName} {primary.lastName}
                          </span>
                          <span className="text-[10px] text-brand-400 block">{primary.email}</span>
                        </td>
                        <td className="px-4 py-3.5 text-brand-600 dark:text-brand-300">
                          {app.submittedAt ? new Date(app.submittedAt).toLocaleDateString() : '—'}
                        </td>
                        <td className="px-4 py-3.5">
                          <StatusBadge status={app.status} />
                        </td>
                        <td className="px-4 py-3.5 text-center">
                          <button
                            type="button"
                            onClick={() => navigate(`/admin/kyc/${app.id}`)}
                            className="px-3 py-1.5 rounded-lg bg-brand-900 text-white font-semibold text-xs inline-flex items-center gap-1 hover:bg-brand-800 shadow-sm"
                          >
                            <Eye className="h-3.5 w-3.5" /> Review Application
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </Card>
    </div>
  );
};

const MetricCard: React.FC<{ icon: React.ReactNode; title: string; value: number; subtitle: string; color: string }> = ({
  icon,
  title,
  value,
  subtitle,
  color,
}) => (
  <div className={`p-5 rounded-2xl border ${color} space-y-2 text-left`}>
    <div className="flex items-center justify-between">
      <span className="text-xs font-bold text-brand-700 dark:text-brand-300">{title}</span>
      {icon}
    </div>
    <div className="text-2xl font-black text-brand-950 dark:text-white">{value}</div>
    <span className="text-[10px] text-brand-400 block">{subtitle}</span>
  </div>
);

const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  switch (status) {
    case 'SUBMITTED':
      return <span className="px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-300 text-[10px] font-bold">SUBMITTED</span>;
    case 'APPROVED':
      return <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 text-[10px] font-bold">APPROVED</span>;
    case 'REJECTED':
      return <span className="px-2.5 py-1 rounded-full bg-red-500/10 text-red-700 dark:text-red-300 text-[10px] font-bold">REJECTED</span>;
    case 'MODIFICATION_REQUESTED':
      return <span className="px-2.5 py-1 rounded-full bg-purple-500/10 text-purple-700 dark:text-purple-300 text-[10px] font-bold">MODIFICATION REQUESTED</span>;
    default:
      return <span className="px-2.5 py-1 rounded-full bg-brand-100 text-brand-600 text-[10px] font-bold">{status}</span>;
  }
};
