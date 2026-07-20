import React, { useState, useEffect, useMemo } from 'react';
import {
  DollarSign,
  Hammer,
  Sparkles,
  FileText,
  MessageSquare,
  Activity,
  CheckCheck,
  Archive,
  Inbox,
  Bell,
  Mail,
  MessageCircle,
} from 'lucide-react';
import { Card } from '../../../components/ui/Card';
import { EmptyState } from '../../../components/ui/EmptyState';
import { useNotifications } from '../hooks/useNotifications';

interface RichNotification {
  id: string;
  title: string;
  category: 'Payments' | 'Construction' | 'Design Studio' | 'Documents' | 'Support' | 'System';
  sentAt: string;
  timestampStr: string;
  isRead: boolean;
  actionRequired: boolean;
  type: 'email' | 'sms' | 'push' | 'system';
}

export const NotificationsPage: React.FC = () => {
  const { filteredNotifications, isLoading } = useNotifications();

  // Local state to make marking as read and archive interactive
  const [localNotifications, setLocalNotifications] = useState<RichNotification[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<string>('ALL');

  // Preferences state
  const [preferences, setPreferences] = useState({
    email: true,
    sms: true,
    whatsapp: true,
    push: false,
    construction: true,
    payments: true,
    design: true,
  });

  // Map incoming database notifications into rich homeowner notifications
  useEffect(() => {
    if (filteredNotifications.length > 0) {
      const mapped = filteredNotifications.map((n, idx) => {
        // Map category dynamically based on title keywords
        const getCategory = (title: string): 'Payments' | 'Construction' | 'Design Studio' | 'Documents' | 'Support' | 'System' => {
          const t = title.toLowerCase();
          if (t.includes('invoice') || t.includes('payment') || t.includes('receipt') || t.includes('draw')) return 'Payments';
          if (t.includes('structure') || t.includes('curing') || t.includes('foundation') || t.includes('brick')) return 'Construction';
          if (t.includes('drawing') || t.includes('design') || t.includes('layout') || t.includes('selection')) return 'Design Studio';
          if (t.includes('agreement') || t.includes('stamp') || t.includes('document')) return 'Documents';
          if (t.includes('ticket') || t.includes('support') || t.includes('coordination')) return 'Support';
          return 'System';
        };

        const category = getCategory(n.title);
        const actionRequired = category === 'Payments' && idx === 0; // mark the first payment notification as action required

        // Standardize sentAt timestamp
        const parts = n.sentAt.split('/');
        let formattedDateStr = n.sentAt;
        if (parts.length === 3) {
          const date = new Date(Number(parts[2]), Number(parts[1]) - 1, Number(parts[0]));
          formattedDateStr = date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
        }

        return {
          id: n.id || `notif_${idx}`,
          title: n.title,
          category,
          sentAt: n.sentAt,
          timestampStr: `${formattedDateStr}, ${idx === 0 ? '11:30 AM' : '03:45 PM'}`,
          isRead: n.status === 'sent', // 'sent' represents read in our hook mapping
          actionRequired,
          type: n.type,
        };
      });
      setLocalNotifications(mapped);
    }
  }, [filteredNotifications]);

  const handleMarkAsRead = (id: string) => {
    setLocalNotifications(
      localNotifications.map((n) => (n.id === id ? { ...n, isRead: true } : n))
    );
  };

  const handleArchive = (id: string) => {
    setLocalNotifications(localNotifications.filter((n) => n.id !== id));
  };

  const handleMarkAllAsRead = () => {
    setLocalNotifications(localNotifications.map((n) => ({ ...n, isRead: true })));
  };

  // Search & Filter Category tab logic
  const displayNotifications = useMemo(() => {
    return localNotifications.filter((n) => {
      const matchesSearch = n.title.toLowerCase().includes(searchQuery.toLowerCase()) || n.category.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesTab = activeTab === 'ALL' || n.category.toUpperCase() === activeTab.toUpperCase();
      return matchesSearch && matchesTab;
    });
  }, [localNotifications, searchQuery, activeTab]);

  // Aggregates for summary cards
  const summary = useMemo(() => {
    const unread = localNotifications.filter((n) => !n.isRead).length;
    const actionRequired = localNotifications.filter((n) => n.actionRequired).length;
    const total = localNotifications.length;

    // Estimate today's updates count
    const todayCount = localNotifications.filter((n) => {
      const todayStr = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
      return n.timestampStr.includes(todayStr) || n.sentAt === new Date().toLocaleDateString('en-IN');
    }).length;

    return {
      unread,
      todayUpdates: todayCount || (unread > 0 ? 1 : 0),
      actionRequired,
      total,
    };
  }, [localNotifications]);

  // Category Icon Map
  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Payments':
        return DollarSign;
      case 'Construction':
        return Hammer;
      case 'Design Studio':
        return Sparkles;
      case 'Documents':
        return FileText;
      case 'Support':
        return MessageSquare;
      default:
        return Activity;
    }
  };

  // Category Icon Color
  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'Payments':
        return 'bg-green-50 text-green-700 dark:bg-green-950/30 dark:text-green-300';
      case 'Construction':
        return 'bg-yellow-50 text-yellow-750 dark:bg-yellow-950/30 dark:text-yellow-300';
      case 'Design Studio':
        return 'bg-brand-50 text-brand-700 dark:bg-brand-950/30 dark:text-brand-300';
      case 'Documents':
        return 'bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-300';
      case 'Support':
        return 'bg-purple-50 text-purple-750 dark:bg-purple-950/30 dark:text-purple-300';
      default:
        return 'bg-brand-50 text-brand-700 dark:bg-brand-950/30 dark:text-brand-300';
    }
  };

  return (
    <div className="space-y-6 text-left">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-serif text-3xl font-semibold text-brand-900 dark:text-white">
            Inbox & Updates
          </h1>
          <p className="text-sm font-medium text-brand-500 dark:text-brand-400 mt-1">
            Recent transaction alerts, milestone releases, and customization change notifications.
          </p>
        </div>
        {localNotifications.some((n) => !n.isRead) && (
          <button
            onClick={handleMarkAllAsRead}
            className="inline-flex items-center gap-1.5 rounded-xl border border-brand-200 hover:bg-brand-50 px-4 py-2.5 text-xs font-bold transition-all shadow-sm bg-white dark:bg-brand-900 dark:border-brand-850 dark:hover:bg-brand-800"
          >
            <CheckCheck className="h-4 w-4 text-brand-700" />
            Mark all as read
          </button>
        )}
      </div>

      {/* 4. Top Summary Cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {/* Unread */}
        <div className="rounded-2xl border border-brand-200 bg-white p-5 shadow-sm dark:border-brand-800 dark:bg-brand-900">
          <span className="text-[10px] font-bold uppercase tracking-wider text-brand-450">Unread Alerts</span>
          <h3 className="text-2xl font-serif font-bold text-brand-900 dark:text-white mt-2">{summary.unread}</h3>
        </div>
        {/* Today's Updates */}
        <div className="rounded-2xl border border-brand-200 bg-white p-5 shadow-sm dark:border-brand-800 dark:bg-brand-900">
          <span className="text-[10px] font-bold uppercase tracking-wider text-brand-450">Today's Updates</span>
          <h3 className="text-2xl font-serif font-bold text-brand-900 dark:text-white mt-2">{summary.todayUpdates}</h3>
        </div>
        {/* Action Required */}
        <div className="rounded-2xl border border-brand-200 bg-white p-5 shadow-sm dark:border-brand-800 dark:bg-brand-900">
          <span className="text-[10px] font-bold uppercase tracking-wider text-red-500">Action Required</span>
          <h3 className="text-2xl font-serif font-bold text-red-650 mt-2">{summary.actionRequired}</h3>
        </div>
        {/* Total Notifications */}
        <div className="rounded-2xl border border-brand-200 bg-white p-5 shadow-sm dark:border-brand-800 dark:bg-brand-900">
          <span className="text-[10px] font-bold uppercase tracking-wider text-brand-450">Total Received</span>
          <h3 className="text-2xl font-serif font-bold text-brand-900 dark:text-white mt-2">{summary.total}</h3>
        </div>
      </div>

      {/* Split Inbox Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left column - Inbox Center */}
        <div className="lg:col-span-2 space-y-6">
          <Card title="Notification Center" subtitle="Recent transaction logs and development milestones">
            
            {/* Search & Tabs bar */}
            <div className="space-y-4 mb-4 mt-2">
              <input
                type="text"
                placeholder="Search updates..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-xl border border-brand-200 bg-brand-50/20 px-3.5 py-2.5 text-xs outline-none focus:ring-2 focus:ring-brand-500/25 dark:border-brand-850 dark:bg-brand-950/20 dark:text-white"
              />

              {/* Tabs */}
              <div className="flex flex-wrap gap-1.5 border-b border-brand-100 dark:border-brand-850 pb-3">
                {['ALL', 'PAYMENTS', 'CONSTRUCTION', 'DESIGN STUDIO', 'DOCUMENTS', 'SUPPORT', 'SYSTEM'].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`rounded-lg px-2.5 py-1.5 text-[9px] uppercase font-bold tracking-wider transition-all ${
                      activeTab === tab
                        ? 'bg-brand-700 text-white'
                        : 'bg-brand-50 text-brand-700 hover:bg-brand-100 dark:bg-brand-850 dark:text-brand-300 dark:hover:bg-brand-800'
                    }`}
                  >
                    {tab === 'DESIGN STUDIO' ? 'Studio' : tab}
                  </button>
                ))}
              </div>
            </div>

            {/* Notifications Cards Stream */}
            {isLoading ? (
              <div className="py-20 text-center text-xs text-brand-500 font-semibold font-mono uppercase tracking-wide">
                Loading notifications...
              </div>
            ) : displayNotifications.length > 0 ? (
              <div className="space-y-3 mt-4">
                {displayNotifications.map((notif) => {
                  const IconComp = getCategoryIcon(notif.category);
                  const colorClass = getCategoryColor(notif.category);

                  return (
                    <div
                      key={notif.id}
                      className={`p-4 rounded-2xl border transition-all flex items-start gap-3.5 relative ${
                        notif.isRead
                          ? 'border-brand-150 bg-white dark:border-brand-850 dark:bg-brand-900/40'
                          : 'border-brand-250 bg-brand-50/10 dark:border-brand-800 dark:bg-brand-900 shadow-sm'
                      }`}
                    >
                      {/* Unread dot indicator */}
                      {!notif.isRead && (
                        <span className="absolute top-4 left-4 flex h-2 w-2 rounded-full bg-accent-600" />
                      )}

                      {/* Icon */}
                      <div className={`p-2.5 rounded-xl shrink-0 ${colorClass} ${!notif.isRead ? 'ml-3' : ''}`}>
                        <IconComp className="h-4.5 w-4.5" />
                      </div>

                      {/* Content block */}
                      <div className="flex-1 min-w-0 text-left space-y-1">
                        <div className="flex items-center justify-between gap-4">
                          <div className="flex items-center gap-1.5">
                            <span className="text-[10px] font-bold uppercase tracking-wide font-mono text-brand-450 dark:text-brand-400">
                              {notif.category}
                            </span>
                            {notif.actionRequired && (
                              <span className="rounded bg-red-500/10 px-1.5 py-0.5 text-[8px] font-bold text-red-650 uppercase tracking-wide">
                                Action Required
                              </span>
                            )}
                          </div>
                          <span className="text-[9px] font-bold text-brand-400 font-mono shrink-0">
                            {notif.timestampStr}
                          </span>
                        </div>

                        <p className="text-xs font-bold text-brand-900 dark:text-white leading-relaxed">
                          {notif.title}
                        </p>

                        {/* Actions drawer */}
                        <div className="flex items-center gap-4 pt-2 text-[10px] font-bold border-t border-brand-100 dark:border-brand-850/50 mt-2">
                          {!notif.isRead && (
                            <button
                              onClick={() => handleMarkAsRead(notif.id)}
                              className="text-brand-700 hover:text-brand-900 flex items-center gap-1"
                            >
                              <CheckCheck className="h-3.5 w-3.5" />
                              Mark Read
                            </button>
                          )}
                          <button
                            onClick={() => handleArchive(notif.id)}
                            className="text-brand-450 hover:text-brand-650 flex items-center gap-1"
                          >
                            <Archive className="h-3.5 w-3.5" />
                            Archive
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="mt-6">
                <EmptyState
                  title="Your inbox is clear"
                  description="No notification logs found matching active tab categories."
                  icon={Inbox}
                />
              </div>
            )}
          </Card>
        </div>

        {/* Right column - Preferences Panel */}
        <div className="space-y-6">
          {/* 5. Communication Preferences with Toggle Switches */}
          <Card title="Preference Channels" subtitle="Manage alert dispatch channels and reminders">
            <div className="space-y-4 pt-2 text-xs font-semibold text-brand-700 dark:text-brand-200">
              
              {/* Email Notifications */}
              <div className="flex items-center justify-between py-2 border-b border-brand-100 dark:border-brand-850">
                <div className="flex items-start gap-2.5">
                  <Mail className="h-4.5 w-4.5 text-brand-500 mt-0.5 shrink-0" />
                  <div>
                    <span className="block font-bold">Email Alerts</span>
                    <p className="text-[10px] text-brand-450 mt-0.5 font-normal">Detailed copies sent to your inbox</p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={preferences.email}
                    onChange={(e) => setPreferences({ ...preferences, email: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-brand-200 peer-focus:outline-none rounded-full peer dark:bg-brand-800 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-brand-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-brand-600 peer-checked:bg-brand-700"></div>
                </label>
              </div>

              {/* SMS Transactional */}
              <div className="flex items-center justify-between py-2 border-b border-brand-100 dark:border-brand-850">
                <div className="flex items-start gap-2.5">
                  <Bell className="h-4.5 w-4.5 text-brand-500 mt-0.5 shrink-0" />
                  <div>
                    <span className="block font-bold">SMS Texts</span>
                    <p className="text-[10px] text-brand-450 mt-0.5 font-normal">Short SMS logs for milestones</p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={preferences.sms}
                    onChange={(e) => setPreferences({ ...preferences, sms: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-brand-200 peer-focus:outline-none rounded-full peer dark:bg-brand-800 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-brand-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-brand-600 peer-checked:bg-brand-700"></div>
                </label>
              </div>

              {/* WhatsApp Alert */}
              <div className="flex items-center justify-between py-2 border-b border-brand-100 dark:border-brand-850">
                <div className="flex items-start gap-2.5">
                  <MessageCircle className="h-4.5 w-4.5 text-brand-500 mt-0.5 shrink-0" />
                  <div>
                    <span className="block font-bold">WhatsApp Updates</span>
                    <p className="text-[10px] text-brand-450 mt-0.5 font-normal">Quick reminders on WhatsApp</p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={preferences.whatsapp}
                    onChange={(e) => setPreferences({ ...preferences, whatsapp: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-brand-200 peer-focus:outline-none rounded-full peer dark:bg-brand-800 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-brand-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-brand-600 peer-checked:bg-brand-700"></div>
                </label>
              </div>

              {/* Push Alerts */}
              <div className="flex items-center justify-between py-2 border-b border-brand-100 dark:border-brand-850">
                <div className="flex items-start gap-2.5">
                  <Bell className="h-4.5 w-4.5 text-brand-500 mt-0.5 shrink-0" />
                  <div>
                    <span className="block font-bold">Portal Push Notifications</span>
                    <p className="text-[10px] text-brand-450 mt-0.5 font-normal">Real-time alerts inside the dashboard</p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={preferences.push}
                    onChange={(e) => setPreferences({ ...preferences, push: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-brand-200 peer-focus:outline-none rounded-full peer dark:bg-brand-800 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-brand-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-brand-600 peer-checked:bg-brand-700"></div>
                </label>
              </div>

              {/* Construction updates */}
              <div className="flex items-center justify-between py-2 border-b border-brand-100 dark:border-brand-850">
                <div className="flex items-start gap-2.5">
                  <Hammer className="h-4.5 w-4.5 text-brand-500 mt-0.5 shrink-0" />
                  <div>
                    <span className="block font-bold">Construction Milestones</span>
                    <p className="text-[10px] text-brand-450 mt-0.5 font-normal">Slab cast curing alerts & civil logs</p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={preferences.construction}
                    onChange={(e) => setPreferences({ ...preferences, construction: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-brand-200 peer-focus:outline-none rounded-full peer dark:bg-brand-800 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-brand-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-brand-600 peer-checked:bg-brand-700"></div>
                </label>
              </div>

              {/* Payments Reminders */}
              <div className="flex items-center justify-between py-2 border-b border-brand-100 dark:border-brand-850">
                <div className="flex items-start gap-2.5">
                  <DollarSign className="h-4.5 w-4.5 text-brand-500 mt-0.5 shrink-0" />
                  <div>
                    <span className="block font-bold">Payment Reminders</span>
                    <p className="text-[10px] text-brand-450 mt-0.5 font-normal">Billing draws schedule alerts</p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={preferences.payments}
                    onChange={(e) => setPreferences({ ...preferences, payments: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-brand-200 peer-focus:outline-none rounded-full peer dark:bg-brand-800 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-brand-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-brand-600 peer-checked:bg-brand-700"></div>
                </label>
              </div>

              {/* Design Review Alerts */}
              <div className="flex items-center justify-between py-2">
                <div className="flex items-start gap-2.5">
                  <Sparkles className="h-4.5 w-4.5 text-brand-500 mt-0.5 shrink-0" />
                  <div>
                    <span className="block font-bold">Design Studio Alerts</span>
                    <p className="text-[10px] text-brand-450 mt-0.5 font-normal">Customization change order logs</p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={preferences.design}
                    onChange={(e) => setPreferences({ ...preferences, design: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-brand-200 peer-focus:outline-none rounded-full peer dark:bg-brand-800 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-brand-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-brand-600 peer-checked:bg-brand-700"></div>
                </label>
              </div>

            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default NotificationsPage;
