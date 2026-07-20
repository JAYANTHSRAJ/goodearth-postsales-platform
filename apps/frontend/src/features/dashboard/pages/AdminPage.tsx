import React, { useState, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useLocation } from 'react-router-dom';
import {
  Activity,
  AlertTriangle,
  CheckCircle,
  Clock,
  RefreshCw,
  X,
  Globe,
  Users,
  Shield,
  Key,
  Mail,
  HardDrive,
  Play,
  Search,
  Plus,
} from 'lucide-react';
import { Card } from '../../../components/ui/Card';
import { StatCard } from '../../../components/ui/StatCard';
import { StatusBadge } from '../../../components/ui/StatusBadge';
import { useWebhookMonitor, WebhookEvent } from '../hooks/useWebhookMonitor';
import { api } from '../../../services/api';

// Mocks database for System Admin Center
interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: string;
  department: string;
  status: 'Active' | 'Inactive' | 'Locked';
  lastLogin: string;
}

export const AdminPage: React.FC = () => {
  const location = useLocation();
  const getInitialTab = () => {
    if (location.pathname === '/reports') return 'reports';
    if (location.pathname === '/settings') return 'settings';
    return 'users'; // default to User Management in System Admin Center
  };

  const [activeTab, setActiveTab] = useState<string>(getInitialTab());

  useEffect(() => {
    if (location.pathname === '/reports') setActiveTab('reports');
    else if (location.pathname === '/settings') setActiveTab('settings');
    else if (location.pathname === '/admin') setActiveTab('users');
  }, [location.pathname]);

  const [selectedEvent, setSelectedEvent] = useState<WebhookEvent | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<string | null>(null);

  const [saveStatus, setSaveStatus] = useState<string | null>(null);
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [syncInterval, setSyncInterval] = useState<string>('60');
  const [autoSyncEnabled, setAutoSyncEnabled] = useState<string>('true');

  const { events, stats, isLoading, replayEvent } = useWebhookMonitor();

  // Query for system settings
  const { isLoading: isSettingsLoading, refetch: refetchSettings } = useQuery({
    queryKey: ['systemSettings-admin-center-v2'],
    queryFn: async () => {
      const data = await api.get<any[]>('/admin/settings');
      const intervalSetting = data.find((s) => s.key === 'SYNC_INTERVAL_MINUTES');
      const autoSyncSetting = data.find((s) => s.key === 'ZOHO_AUTO_SYNC_ENABLED');
      if (intervalSetting) setSyncInterval(intervalSetting.value);
      if (autoSyncSetting) setAutoSyncEnabled(autoSyncSetting.value);
      return data;
    },
    enabled: activeTab === 'settings' || activeTab === 'integrations',
  });

  const { data: activations, refetch: refetchActivations } = useQuery({
    queryKey: ['adminPortalActivations'],
    queryFn: async () => {
      return api.get<any[]>('/admin/onboarding/activations');
    },
    enabled: activeTab === 'onboarding',
  });

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingSettings(true);
    setSaveStatus('Saving settings to database...');
    try {
      await api.put('/admin/settings/SYNC_INTERVAL_MINUTES', { value: syncInterval });
      await api.put('/admin/settings/ZOHO_AUTO_SYNC_ENABLED', { value: autoSyncEnabled });
      setSaveStatus('Settings updated successfully.');
      refetchSettings();
    } catch (err: any) {
      setSaveStatus(`Error saving settings: ${err.message || 'Network error'}`);
    } finally {
      setIsSavingSettings(false);
      setTimeout(() => setSaveStatus(null), 5000);
    }
  };

  const handleSyncCRM = async (type: 'buyers' | 'projects') => {
    setIsSyncing(true);
    setSyncStatus(`Initiating Zoho ${type} sync...`);
    try {
      await api.post(`/${type}/sync`, {});
      setSyncStatus(`Zoho ${type} synchronisation triggered successfully.`);
    } catch (err: any) {
      setSyncStatus(`Sync failed: ${err.message || 'Network error'}`);
    } finally {
      setIsSyncing(false);
      setTimeout(() => setSyncStatus(null), 5000);
    }
  };

  const handleReplay = async (id: string) => {
    try {
      await replayEvent(id);
      setSelectedEvent(null);
      alert('Webhook replay event dispatched successfully.');
    } catch (err: any) {
      alert(`Replay failed: ${err.message || 'Network error'}`);
    }
  };

  // Administration state parameters
  const [usersList, setUsersList] = useState<AdminUser[]>([
    { id: 'usr-1', name: 'Arun Kumar', email: 'arun@goodearth.com', role: 'CRM Coordinator', department: 'Post-Sales', status: 'Active', lastLogin: '13 Jul 2026, 04:30 PM' },
    { id: 'usr-2', name: 'Meera Nair', email: 'meera@goodearth.com', role: 'Design Architect', department: 'Design Studio', status: 'Active', lastLogin: '13 Jul 2026, 02:15 PM' },
    { id: 'usr-3', name: 'Prasad Hegde', email: 'prasad@goodearth.com', role: 'Site Engineer', department: 'Construction Ops', status: 'Active', lastLogin: '12 Jul 2026, 05:00 PM' },
    { id: 'usr-4', name: 'Suresh Gowda', email: 'suresh@goodearth.com', role: 'Finance Supervisor', department: 'Accounts', status: 'Active', lastLogin: '13 Jul 2026, 11:30 AM' },
  ]);

  const [globalSearch, setGlobalSearch] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [filterDept, setFilterDept] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');

  const [auditLogs, setAuditLogs] = useState<string[]>([
    'User arun@goodearth.com logged in successfully.',
    'System configuration update: Zoho Sync Interval set to 30 mins.',
    'Role change: Meera Nair assigned permission lock overrides for Flooring module.',
    'Database backup generated successfully to target cloud storage.',
  ]);

  // Client filtering
  const filteredUsers = useMemo(() => {
    return usersList.filter((u: AdminUser) => {
      const matchesSearch =
        u.name.toLowerCase().includes(globalSearch.toLowerCase()) ||
        u.email.toLowerCase().includes(globalSearch.toLowerCase()) ||
        u.role.toLowerCase().includes(globalSearch.toLowerCase());

      const matchesRole = filterRole === 'all' || u.role === filterRole;
      const matchesDept = filterDept === 'all' || u.department === filterDept;
      const matchesStatus = filterStatus === 'all' || u.status === filterStatus;

      return matchesSearch && matchesRole && matchesDept && matchesStatus;
    });
  }, [usersList, globalSearch, filterRole, filterDept, filterStatus]);

  // Admin Actions Override
  const handleUserAction = (userId: string, action: string) => {
    alert(`System Admin Override: Action [${action}] dispatched for User [${userId}].`);
    if (action === 'Deactivate') {
      setUsersList((prev: AdminUser[]) =>
        prev.map((u: AdminUser) => (u.id === userId ? { ...u, status: 'Inactive' } : u))
      );
    }
    const newLog = `Admin action: ${action} executed for User ${userId}.`;
    setAuditLogs([newLog, ...auditLogs]);
  };

  const triggerQuickAction = (action: string) => {
    alert(`System Admin Command: [${action}] dispatched successfully.`);
    const newLog = `System admin action: ${action} executed.`;
    setAuditLogs([newLog, ...auditLogs]);
  };

  return (
    <div className="space-y-6 text-left">
      
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-serif text-3xl font-semibold text-brand-900 dark:text-white flex items-center gap-2">
            <Shield className="h-8 w-8 text-brand-700" />
            System Administration Center
          </h1>
          <p className="text-sm font-medium text-brand-500 dark:text-brand-400 mt-1">
            Enterprise SUPER_ADMIN dashboard to manage permission matrices, organizational workflows, and background synchronization jobs.
          </p>
        </div>
      </div>

      {/* TOP KPI Dashboard (8 KPIs) */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-8">
        <StatCard
          title="Total Users"
          value="48 Users"
          icon={Users}
          badge={<StatusBadge label="Registered" type="info" />}
        />
        <StatCard
          title="Active Users"
          value="45 Active"
          icon={CheckCircle}
          badge={<StatusBadge label="SLA Standard" type="success" />}
        />
        <StatCard
          title="Active Sessions"
          value="12 Sessions"
          icon={Clock}
          badge={<StatusBadge label="Live Now" type="success" />}
        />
        <StatCard
          title="RBAC Roles"
          value="6 Roles"
          icon={Shield}
          badge={<StatusBadge label="Permissions" type="info" />}
        />
        <StatCard
          title="Failed Logins"
          value="0"
          icon={AlertTriangle}
          badge={<StatusBadge label="No Threats" type="success" />}
        />
        <StatCard
          title="API Integrations"
          value="4 Synced"
          icon={Globe}
          badge={<StatusBadge label="Active Zoho" type="success" />}
        />
        <StatCard
          title="System Health"
          value="100% Online"
          icon={Activity}
          badge={<StatusBadge label="CPU Stable" type="success" />}
        />
        <StatCard
          title="Storage Usage"
          value="14 MB / 10 GB"
          icon={HardDrive}
          badge={<StatusBadge label="WorkDrive" type="info" />}
        />
      </div>

      {/* Tab Controls Navigation */}
      <div className="flex flex-wrap border-b border-brand-200 dark:border-brand-850 text-xs font-bold gap-x-2">
        {([
          { id: 'users', label: 'User Management' },
          { id: 'permissions', label: 'Roles & Permissions' },
          { id: 'organization', label: 'Organization Org' },
          { id: 'integrations', label: 'Zoho Integrations' },
          { id: 'onboarding', label: 'Portal Activation' },
          { id: 'templates', label: 'Notification Templates' },
          { id: 'audit', label: 'Audit Activity Logs' },
          { id: 'health', label: 'System Health monitor' },
          { id: 'recovery', label: 'Backup & Recovery' },
        ] as const).map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`border-b-2 px-4 py-3 transition-all duration-150 ${
              activeTab === tab.id
                ? 'border-brand-700 text-brand-900 dark:border-brand-400 dark:text-white'
                : 'border-transparent text-brand-450 hover:text-brand-900'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Main split grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* Central Workspace Tab Context */}
        <div className="lg:col-span-3 space-y-6">
          
          {/* TAB 1: User Management */}
          {activeTab === 'users' && (
            <div className="space-y-6">
              {/* Search and Filters */}
              <Card title="Query User Accounts" subtitle="Advanced filter parameters to search staff accounts">
                <div className="space-y-4 mt-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-brand-400" />
                    <input
                      type="text"
                      placeholder="Search users by name, email, role, or department..."
                      value={globalSearch}
                      onChange={(e) => setGlobalSearch(e.target.value)}
                      className="w-full rounded-xl border border-brand-200 bg-brand-50/20 pl-9 pr-4 py-2.5 text-xs outline-none focus:ring-2 focus:ring-brand-500/25 dark:border-brand-850 dark:bg-brand-950/20"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 text-[10px] font-bold">
                    <div>
                      <label className="block text-[8px] uppercase tracking-wider text-brand-400 mb-1 font-mono">Role</label>
                      <select value={filterRole} onChange={(e) => setFilterRole(e.target.value)} className="w-full rounded-xl border border-brand-200 bg-brand-50/20 px-2 py-2 text-[10px] outline-none">
                        <option value="all">All Roles</option>
                        <option value="CRM Coordinator">CRM Coordinator</option>
                        <option value="Design Architect">Design Architect</option>
                        <option value="Site Engineer">Site Engineer</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[8px] uppercase tracking-wider text-brand-400 mb-1 font-mono">Department</label>
                      <select value={filterDept} onChange={(e) => setFilterDept(e.target.value)} className="w-full rounded-xl border border-brand-200 bg-brand-50/20 px-2 py-2 text-[10px] outline-none">
                        <option value="all">All Departments</option>
                        <option value="Post-Sales">Post-Sales</option>
                        <option value="Design Studio">Design Studio</option>
                        <option value="Construction Ops">Construction Ops</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[8px] uppercase tracking-wider text-brand-400 mb-1 font-mono">Status</label>
                      <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="w-full rounded-xl border border-brand-200 bg-brand-50/20 px-2 py-2 text-[10px] outline-none">
                        <option value="all">All Statuses</option>
                        <option value="Active">Active</option>
                        <option value="Inactive">Inactive</option>
                      </select>
                    </div>
                  </div>
                </div>
              </Card>

              {/* Users Directory Table */}
              <Card title="User Accounts Directory" subtitle="System roles and departments assigned to active coordinator profiles">
                <div className="overflow-x-auto mt-2 text-xs font-semibold">
                  <table className="min-w-full divide-y divide-brand-200 dark:divide-brand-850">
                    <thead className="bg-brand-50/50 dark:bg-brand-950/30">
                      <tr className="text-brand-500 uppercase tracking-wider text-[10px] font-bold">
                        <th className="px-4 py-2.5 text-left">User Name</th>
                        <th className="px-4 py-2.5 text-left">Email Address</th>
                        <th className="px-4 py-2.5 text-left">RBAC Role</th>
                        <th className="px-4 py-2.5 text-left">Department</th>
                        <th className="px-4 py-2.5 text-left">Status</th>
                        <th className="px-4 py-2.5 text-left">Last Login</th>
                        <th className="px-4 py-2.5 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-brand-100 dark:divide-brand-850/40 text-brand-800 dark:text-brand-200">
                      {filteredUsers.map((u) => (
                        <tr key={u.id}>
                          <td className="px-4 py-3 text-left font-bold">{u.name}</td>
                          <td className="px-4 py-3 text-left font-mono">{u.email}</td>
                          <td className="px-4 py-3 text-left">{u.role}</td>
                          <td className="px-4 py-3 text-left">{u.department}</td>
                          <td className="px-4 py-3 text-left">
                            <StatusBadge label={u.status} type={u.status === 'Active' ? 'success' : 'warning'} />
                          </td>
                          <td className="px-4 py-3 text-left">{u.lastLogin}</td>
                          <td className="px-4 py-3 text-right">
                            <div className="flex justify-end gap-1.5">
                              <button onClick={() => handleUserAction(u.id, 'Reset Password')} className="text-[10px] bg-brand-100 hover:bg-brand-200 px-2 py-1 rounded-xl">
                                Reset Pass
                              </button>
                              <button onClick={() => handleUserAction(u.id, 'Deactivate')} className="text-[10px] bg-red-50 text-red-650 hover:bg-red-100 px-2 py-1 rounded-xl">
                                Lock
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            </div>
          )}

          {/* TAB 2: Roles & Permissions */}
          {activeTab === 'permissions' && (
            <Card title="RBAC Permission Matrix Grid" subtitle="Control module levels locks across coordinator roles">
              <div className="overflow-x-auto text-xs font-semibold">
                <table className="min-w-full divide-y divide-brand-200 dark:divide-brand-850">
                  <thead className="bg-brand-50/50">
                    <tr className="text-brand-500 uppercase tracking-wider text-[10px] font-bold">
                      <th className="px-4 py-2.5 text-left">System Module</th>
                      <th className="px-4 py-2.5 text-center">Super Admin</th>
                      <th className="px-4 py-2.5 text-center">CRM Coordinator</th>
                      <th className="px-4 py-2.5 text-center">Site Engineer</th>
                      <th className="px-4 py-2.5 text-center">Homeowner Client</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-brand-100 text-brand-800 dark:text-brand-200">
                    <tr>
                      <td className="px-4 py-3 text-left font-bold">Override locks & Approve stages</td>
                      <td className="px-4 py-3 text-center text-green-700 font-bold">Granted</td>
                      <td className="px-4 py-3 text-center text-green-700 font-bold">Granted</td>
                      <td className="px-4 py-3 text-center text-red-650">Restricted</td>
                      <td className="px-4 py-3 text-center text-red-650">Restricted</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 text-left font-bold">Verify documents & blueprints</td>
                      <td className="px-4 py-3 text-center text-green-700 font-bold">Granted</td>
                      <td className="px-4 py-3 text-center text-green-700 font-bold">Granted</td>
                      <td className="px-4 py-3 text-center text-green-700 font-bold">Granted</td>
                      <td className="px-4 py-3 text-center text-red-650">Restricted</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 text-left font-bold">Razorpay payment reconciliation</td>
                      <td className="px-4 py-3 text-center text-green-700 font-bold">Granted</td>
                      <td className="px-4 py-3 text-center text-red-650">Restricted</td>
                      <td className="px-4 py-3 text-center text-red-650">Restricted</td>
                      <td className="px-4 py-3 text-center text-red-650">Restricted</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </Card>
          )}

          {/* TAB 3: Organization */}
          {activeTab === 'organization' && (
            <Card title="GoodEarth Organization Directory" subtitle="Departments and coordinator staff teams">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-xs font-semibold pt-2">
                <div className="p-4 rounded-2xl bg-brand-50/20 border border-brand-100">
                  <h4 className="font-bold text-brand-900 block border-b pb-1.5">Post-Sales Team</h4>
                  <p className="mt-2 text-brand-450">CRM Coordinators: Arun Kumar, Suresh Gowda</p>
                </div>
                <div className="p-4 rounded-2xl bg-brand-50/20 border border-brand-100">
                  <h4 className="font-bold text-brand-900 block border-b pb-1.5">Design Studio</h4>
                  <p className="mt-2 text-brand-450">Design Architects: Meera Nair, Karan Grover</p>
                </div>
                <div className="p-4 rounded-2xl bg-brand-50/20 border border-brand-100">
                  <h4 className="font-bold text-brand-900 block border-b pb-1.5">Construction Ops</h4>
                  <p className="mt-2 text-brand-450">Site Engineers: Prasad Hegde, Ankit Roy</p>
                </div>
              </div>
            </Card>
          )}

          {/* TAB 4: Integrations */}
          {(activeTab === 'integrations' || activeTab === 'settings') && (
            <div className="space-y-6">
              {/* Sync Health & Zoho connectivity status */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <Card title="Zoho CRM Web Drive Integration" subtitle="Connectivity credentials sync settings">
                  <div className="space-y-3.5 text-xs font-semibold">
                    <div className="flex justify-between border-b pb-2">
                      <span className="text-brand-500">Sync status:</span>
                      <span className="text-green-700 font-bold">ONLINE</span>
                    </div>
                    <div className="flex justify-between border-b pb-2">
                      <span className="text-brand-500">Auto Sync enabled:</span>
                      <span className="text-brand-900">{autoSyncEnabled}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-brand-500">Auto Sync interval:</span>
                      <span className="text-brand-900">{syncInterval} mins</span>
                    </div>
                  </div>
                </Card>

                {/* Configuration form editor */}
                <Card title="Update Sync Configurations" subtitle="Save intervals and parameters to PostgreSQL database">
                  {isSettingsLoading ? (
                    <div className="py-6 text-center text-xs text-brand-500">Querying settings...</div>
                  ) : (
                    <form onSubmit={handleSaveSettings} className="space-y-4">
                      {saveStatus && (
                        <div className="p-2.5 rounded-lg bg-green-50 text-[10px] font-bold text-green-700 border border-green-200">
                          {saveStatus}
                        </div>
                      )}
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[8px] uppercase tracking-wider text-brand-400 mb-1 font-mono">Sync Interval (Minutes)</label>
                          <input
                            type="number"
                            value={syncInterval}
                            onChange={(e) => setSyncInterval(e.target.value)}
                            className="w-full rounded-xl border border-brand-200 bg-brand-50/20 px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-brand-500/25 dark:border-brand-850 dark:bg-brand-900"
                          />
                        </div>
                        <div>
                          <label className="block text-[8px] uppercase tracking-wider text-brand-400 mb-1 font-mono">Auto Sync Trigger</label>
                          <select
                            value={autoSyncEnabled}
                            onChange={(e) => setAutoSyncEnabled(e.target.value)}
                            className="w-full rounded-xl border border-brand-200 bg-brand-50/20 px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-brand-500/25 dark:border-brand-850 dark:bg-brand-900"
                          >
                            <option value="true">Enabled</option>
                            <option value="false">Disabled</option>
                          </select>
                        </div>
                      </div>
                      <button type="submit" disabled={isSavingSettings} className="w-full bg-brand-700 hover:bg-brand-800 text-white rounded-xl py-2 text-xs font-bold transition-all">
                        {isSavingSettings ? 'Saving...' : 'Save Config'}
                      </button>
                    </form>
                  )}
                </Card>
              </div>

              {/* Integration triggers actions */}
              <Card title="Manual Zoho synchronization logs" subtitle="Re-trigger sync webhooks">
                {syncStatus && (
                  <div className="p-2.5 rounded-lg bg-green-50 text-[10px] font-bold text-green-700 border border-green-200 mb-3">
                    {syncStatus}
                  </div>
                )}
                <div className="grid grid-cols-2 gap-2 text-[10px] font-bold">
                  <button onClick={() => handleSyncCRM('buyers')} disabled={isSyncing} className="p-3 bg-brand-700 hover:bg-brand-800 text-white rounded-xl">
                    Sync Buyers List
                  </button>
                  <button onClick={() => handleSyncCRM('projects')} disabled={isSyncing} className="p-3 bg-brand-100 hover:bg-brand-200 rounded-xl">
                    Sync Projects List
                  </button>
                </div>
              </Card>

              {/* Webhooks table logs */}
              <Card title="Webhook Monitor events log" subtitle="Real-time transaction queue from Zoho CRM and Razorpay webhooks">
                {isLoading ? (
                  <div className="py-10 text-center text-xs text-brand-450">Loading webhooks queue...</div>
                ) : (
                  <div className="overflow-x-auto text-xs font-semibold">
                    <table className="min-w-full divide-y divide-brand-200 dark:divide-brand-850">
                      <thead className="bg-brand-50/50">
                        <tr className="text-brand-500 uppercase tracking-wider text-[10px] font-bold">
                          <th className="px-4 py-2 text-left">Provider</th>
                          <th className="px-4 py-2 text-left">Event Type</th>
                          <th className="px-4 py-2 text-left">Status</th>
                          <th className="px-4 py-2 text-left">Retries</th>
                          <th className="px-4 py-2 text-left">Created At</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-brand-100">
                        {events.slice(0, 5).map((e) => (
                          <tr key={e.id} className="cursor-pointer hover:bg-brand-50/30" onClick={() => setSelectedEvent(e)}>
                            <td className="px-4 py-2 text-left font-bold">{e.provider}</td>
                            <td className="px-4 py-2 text-left">{e.eventType}</td>
                            <td className="px-4 py-2 text-left">
                              <StatusBadge label={e.status} type={e.status === 'PROCESSED' ? 'success' : 'warning'} />
                            </td>
                            <td className="px-4 py-2 text-left font-mono">{e.retryCount}</td>
                            <td className="px-4 py-2 text-left font-mono text-[9px]">{new Date(e.createdAt).toLocaleDateString('en-IN')}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </Card>
            </div>
          )}

          {/* TAB 5: Notification Templates */}
          {activeTab === 'templates' && (
            <Card title="Post-Sales Automated Notifications Templates" subtitle="Configure automated messaging rules">
              <div className="space-y-4 pt-2 text-xs font-semibold">
                <div className="p-3.5 rounded-2xl bg-brand-50/20 border border-brand-100 text-left space-y-2">
                  <h4 className="font-bold text-brand-900 flex items-center gap-1.5">
                    <Mail className="h-4 w-4 text-brand-650" />
                    Agreement Signing reminder Email template
                  </h4>
                  <p className="text-[10px] text-brand-450 italic">Subject: GoodEarth Post-Sales Agreement drafts are ready for signature check</p>
                </div>
                <div className="p-3.5 rounded-2xl bg-brand-50/20 border border-brand-100 text-left space-y-2">
                  <h4 className="font-bold text-brand-900 flex items-center gap-1.5">
                    <Globe className="h-4 w-4 text-brand-650" />
                    Customization choice layout lock-in SMS template
                  </h4>
                  <p className="text-[10px] text-brand-450 italic">Text: Dear homeowner, your flooring and electrical customization choices lock-in deadline is tomorrow.</p>
                </div>
              </div>
            </Card>
          )}

          {/* TAB 6: Audit Logs */}
          {activeTab === 'audit' && (
            <Card title="Security & RBAC Configuration Audit Logs" subtitle="Chronological history logs of administrative modifications">
              <div className="relative pl-4 border-l border-brand-200 mt-2 text-xs font-semibold space-y-4">
                {auditLogs.map((log, idx) => (
                  <div key={idx} className="relative pl-4">
                    <div className="absolute left-[-21px] top-1.5 h-2 w-2 rounded-full bg-brand-700" />
                    <span className="text-brand-900 dark:text-white">{log}</span>
                    <p className="text-[9px] text-brand-400 mt-0.5">Logged today, 05:00 PM</p>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* TAB 7: System Health */}
          {activeTab === 'health' && (
            <Card title="System Services Diagnostics" subtitle="PostgreSQL database, webhook queue execution status, and server parameters">
              <div className="space-y-6 pt-2">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs font-semibold">
                  <div className="p-4 rounded-2xl bg-brand-50/20 border border-brand-100 space-y-2">
                    <span className="font-bold text-brand-900 block border-b pb-1.5">PostgreSQL Database</span>
                    <div className="flex justify-between mt-1 text-[10px]">
                      <span className="text-brand-500">Connection Status:</span>
                      <span className="text-green-700 font-bold">ONLINE</span>
                    </div>
                  </div>
                  <div className="p-4 rounded-2xl bg-brand-50/20 border border-brand-100 space-y-2">
                    <span className="font-bold text-brand-900 block border-b pb-1.5">Webhook queues backlog</span>
                    <div className="flex justify-between mt-1 text-[10px]">
                      <span className="text-brand-500">Backlog queue length:</span>
                      <span className="text-brand-900 font-bold">0 Pending</span>
                    </div>
                  </div>
                </div>

                {/* Webhook statistics dashboard */}
                {stats && (
                  <div className="p-4 rounded-2xl bg-brand-50/20 border border-brand-100 space-y-2 text-xs font-semibold">
                    <span className="font-bold text-brand-900 block border-b pb-1.5 text-xs">Live Webhook Monitoring Telemetry</span>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-2 text-[10px]">
                      <div>Pending Queue: {stats.pendingQueue}</div>
                      <div>Processed Today: {stats.processedToday}</div>
                      <div>Failed Today: {stats.failedToday}</div>
                      <div>Average Processing Duration: {stats.averageProcessingTimeMs ? stats.averageProcessingTimeMs.toFixed(0) : '0'} ms</div>
                    </div>
                  </div>
                )}
              </div>
            </Card>
          )}

          {/* TAB 8: Backup & Recovery */}
          {activeTab === 'recovery' && (
            <Card title="Manual Database Backups and recovery" subtitle="Generate snapshot restore points">
              <div className="space-y-4 pt-2 text-xs font-semibold">
                <div className="p-3.5 rounded-2xl bg-brand-50/20 border border-brand-100 flex items-center justify-between">
                  <div>
                    <span className="font-bold text-brand-900 block">Weekly_Snapshot_Backup_2026-07-10.sql</span>
                    <span className="text-[9px] text-brand-400 block font-mono">SHA-256 Checksum: 092b781c...</span>
                  </div>
                  <button onClick={() => triggerQuickAction('Restore snapshot')} className="rounded-lg bg-brand-700 text-white px-3 py-1.5 text-[9px] font-bold">
                    Restore
                  </button>
                </div>
              </div>
            </Card>
          )}

          {activeTab === 'onboarding' && (
            <Card title="Portal Activation Management" subtitle="Manage client portal activation statuses, welcome emails, and password overrides">
              <div className="space-y-4">
                <div className="flex justify-end">
                  <button
                    onClick={() => refetchActivations()}
                    className="flex items-center gap-1.5 rounded-xl bg-brand-50 hover:bg-brand-100 dark:bg-brand-850 px-3.5 py-2 text-xs font-bold transition-all border border-brand-200 dark:border-brand-800"
                  >
                    <RefreshCw className="h-4 w-4" />
                    Refresh
                  </button>
                </div>
                <div className="overflow-x-auto rounded-2xl border border-brand-200 dark:border-brand-850">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-brand-50/50 dark:bg-brand-950/20 text-brand-500 font-bold border-b border-brand-200 dark:border-brand-850">
                        <th className="p-4">Customer Name</th>
                        <th className="p-4">Email</th>
                        <th className="p-4">Portal Activated</th>
                        <th className="p-4">Account Activated</th>
                        <th className="p-4">First Login Completed</th>
                        <th className="p-4">Last Login</th>
                        <th className="p-4">Last OTP Sent</th>
                        <th className="p-4">Sync Status</th>
                        <th className="p-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-brand-100 dark:divide-brand-850">
                      {activations && activations.length > 0 ? (
                        activations.map((act: any) => (
                          <tr key={act.buyerId} className="hover:bg-brand-50/20 dark:hover:bg-brand-950/10">
                            <td className="p-4 font-bold text-brand-900 dark:text-white">{act.fullName}</td>
                            <td className="p-4 font-medium">{act.email}</td>
                            <td className="p-4">
                              <StatusBadge
                                label={act.portalActivated ? 'Activated' : 'Inactive'}
                                type={act.portalActivated ? 'success' : 'warning'}
                              />
                            </td>
                            <td className="p-4">
                              <StatusBadge
                                label={act.accountActivated ? 'Activated' : 'Inactive'}
                                type={act.accountActivated ? 'success' : 'warning'}
                              />
                            </td>
                            <td className="p-4">
                              <StatusBadge
                                label={act.firstLoginCompleted ? 'Completed' : 'Pending'}
                                type={act.firstLoginCompleted ? 'success' : 'warning'}
                              />
                            </td>
                            <td className="p-4 font-medium text-brand-450">
                              {act.lastLogin ? new Date(act.lastLogin).toLocaleString() : '—'}
                            </td>
                            <td className="p-4 font-medium text-brand-450">
                              {act.lastOtpSent ? new Date(act.lastOtpSent).toLocaleString() : '—'}
                            </td>
                            <td className="p-4">
                              <StatusBadge
                                label={act.syncStatus}
                                type={act.syncStatus === 'SUCCESS' ? 'success' : 'warning'}
                              />
                            </td>
                            <td className="p-4 text-right space-y-1 sm:space-y-0 sm:space-x-2">
                              <button
                                onClick={async () => {
                                  try {
                                    await api.post(`/admin/onboarding/${act.buyerId}/resend-email`, {});
                                    alert('Activation email resent successfully.');
                                    refetchActivations();
                                  } catch (err) {
                                    alert('Failed to resend activation email.');
                                  }
                                }}
                                className="px-2 py-1 rounded border border-brand-200 hover:border-brand-400 text-[10px] font-bold transition-all cursor-pointer"
                              >
                                Resend Welcome Email
                              </button>
                              <button
                                onClick={async () => {
                                  try {
                                    await api.post(`/admin/onboarding/${act.buyerId}/force-reset`, {});
                                    alert('Forced password reset successful.');
                                    refetchActivations();
                                  } catch (err) {
                                    alert('Failed to force password reset.');
                                  }
                                }}
                                className="px-2 py-1 rounded border border-yellow-300 hover:border-yellow-500 text-yellow-700 text-[10px] font-bold transition-all cursor-pointer"
                              >
                                Force Password Reset
                              </button>
                              {act.accountLocked ? (
                                <button
                                  onClick={async () => {
                                    try {
                                      await api.post(`/admin/onboarding/${act.buyerId}/unlock`, {});
                                      alert('Account unlocked successfully.');
                                      refetchActivations();
                                    } catch (err) {
                                      alert('Failed to unlock account.');
                                    }
                                  }}
                                  className="px-2 py-1 rounded bg-green-50 text-green-700 hover:bg-green-100 text-[10px] font-bold transition-all cursor-pointer"
                                >
                                  Unlock Account
                                </button>
                              ) : (
                                <button
                                  onClick={async () => {
                                    try {
                                      await api.post(`/admin/onboarding/${act.buyerId}/lock`, {});
                                      alert('Account locked successfully.');
                                      refetchActivations();
                                    } catch (err) {
                                      alert('Failed to lock account.');
                                    }
                                  }}
                                  className="px-2 py-1 rounded bg-red-50 text-red-700 hover:bg-red-100 text-[10px] font-bold transition-all cursor-pointer"
                                >
                                  Lock Account
                                </button>
                              )}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={9} className="p-8 text-center text-brand-400">
                            No deals onboarding records found.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </Card>
          )}

        </div>

        {/* Right sidebar quick actions panel */}
        <div className="space-y-6">
          <Card title="System Operations Actions" subtitle="RBAC administration control panel">
            <div className="flex flex-col gap-2 text-xs font-bold text-left">
              <button onClick={() => triggerQuickAction('Create User')} className="w-full rounded-xl p-3 border border-brand-150 bg-white hover:bg-brand-50 flex items-center justify-between dark:bg-brand-900 dark:border-brand-850 dark:text-white">
                <span>Create User</span>
                <Plus className="h-3.5 w-3.5 text-brand-500" />
              </button>
              <button onClick={() => triggerQuickAction('Create Role')} className="w-full rounded-xl p-3 border border-brand-150 bg-white hover:bg-brand-50 flex items-center justify-between dark:bg-brand-900 dark:border-brand-850 dark:text-white">
                <span>Create Role</span>
                <Key className="h-3.5 w-3.5 text-brand-500" />
              </button>
              <button onClick={() => triggerQuickAction('Trigger manual sync job')} className="w-full rounded-xl p-3 border border-brand-150 bg-white hover:bg-brand-50 flex items-center justify-between dark:bg-brand-900 dark:border-brand-850 dark:text-white">
                <span>Run Synchronization</span>
                <RefreshCw className="h-3.5 w-3.5 text-brand-500" />
              </button>
              <button onClick={() => triggerQuickAction('Run Database Backup')} className="w-full rounded-xl p-3 border border-brand-150 bg-white hover:bg-brand-50 flex items-center justify-between dark:bg-brand-900 dark:border-brand-850 dark:text-white">
                <span>Generate Backup</span>
                <HardDrive className="h-3.5 w-3.5 text-brand-500" />
              </button>
              <button onClick={() => triggerQuickAction('Restart active queues background jobs')} className="w-full rounded-xl p-3 border border-brand-150 bg-white hover:bg-brand-50 flex items-center justify-between dark:bg-brand-900 dark:border-brand-850 dark:text-white">
                <span>Restart Jobs</span>
                <Play className="h-3.5 w-3.5 text-brand-500" />
              </button>
            </div>
          </Card>
        </div>

      </div>

      {/* Webhook Payload Details Modal */}
      {selectedEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-brand-950/40 backdrop-blur-sm text-left">
          <div className="w-full max-w-xl rounded-2xl bg-white p-6 shadow-2xl dark:bg-brand-900 border border-brand-200 dark:border-brand-800">
            <div className="flex items-center justify-between pb-3 border-b border-brand-100 dark:border-brand-800">
              <h3 className="text-lg font-serif font-bold text-brand-900 dark:text-white">Webhook Transaction Details</h3>
              <button onClick={() => setSelectedEvent(null)} className="rounded-lg p-1 text-brand-400 hover:bg-brand-100 dark:hover:bg-brand-850">
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="mt-4 space-y-4 max-h-[50vh] overflow-y-auto pr-1 text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-[10px] uppercase font-semibold text-brand-400 tracking-wider">Event Provider</span>
                  <p className="text-sm font-semibold text-brand-900 dark:text-white mt-0.5">{selectedEvent.provider}</p>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-semibold text-brand-400 tracking-wider">Event Name</span>
                  <p className="text-sm font-semibold text-brand-900 dark:text-white mt-0.5">{selectedEvent.eventType}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-[10px] uppercase font-semibold text-brand-400 tracking-wider">Retry Attempts</span>
                  <p className="text-sm font-semibold text-brand-900 dark:text-white mt-0.5">{selectedEvent.retryCount} times</p>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-semibold text-brand-400 tracking-wider">Reconciled Status</span>
                  <p className="text-sm font-semibold text-brand-900 dark:text-white mt-0.5">{selectedEvent.status}</p>
                </div>
              </div>
              <div>
                <span className="text-[10px] uppercase font-semibold text-brand-400 tracking-wider font-mono">Payload Payload Content</span>
                <pre className="mt-1 bg-brand-50 dark:bg-brand-950 p-3 rounded-lg overflow-x-auto text-[10px] font-mono whitespace-pre-wrap max-h-48 border border-brand-100">
                  {JSON.stringify(selectedEvent.payload, null, 2)}
                </pre>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3 pt-3 border-t border-brand-100">
              <button onClick={() => setSelectedEvent(null)} className="rounded-xl bg-brand-100 hover:bg-brand-200 px-4 py-2.5 text-xs font-semibold">
                Close view
              </button>
              <button onClick={() => handleReplay(selectedEvent.id)} className="rounded-xl bg-brand-700 hover:bg-brand-800 text-white px-4 py-2.5 text-xs font-bold">
                Replay Event
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default AdminPage;
