import React, { useState, useEffect } from 'react';
import {
  LifeBuoy,
  PlusCircle,
  Clock,
  CheckCircle,
  MessageSquare,
  Paperclip,
  Send,
  Search,
  User,
  Download,
  AlertCircle,
  X,
  ChevronDown,
  ChevronUp,
  FileText,
  Video,
  Image as ImageIcon,
} from 'lucide-react';
import { Card } from '../../../components/ui/Card';
import { StatCard } from '../../../components/ui/StatCard';
import { StatusBadge } from '../../../components/ui/StatusBadge';
import { EmptyState } from '../../../components/ui/EmptyState';

interface SupportMessage {
  id: string;
  sender: 'Client' | 'GoodEarth Support';
  text: string;
  timestamp: string;
  attachments?: {
    name: string;
    type: 'image' | 'video' | 'pdf';
    url: string;
  }[];
}

interface SupportTicket {
  id: string;
  subject: string;
  category: 'Construction' | 'Finance' | 'Design Studio' | 'Documents' | 'Registration' | 'Handover' | 'Warranty' | 'General';
  description: string;
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED';
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  assignedCoordinator: string;
  createdAt: string;
  estimatedResolution: string;
  slaResponse: string;
  messages: SupportMessage[];
}

export const ClientSupportPage: React.FC = () => {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('ALL');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');

  // FAQ state
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);

  // New ticket form state
  const [showRaiseForm, setShowRaiseForm] = useState(false);
  const [subject, setSubject] = useState('');
  const [category, setCategory] = useState<'Construction' | 'Finance' | 'Design Studio' | 'Documents' | 'Registration' | 'Handover' | 'Warranty' | 'General'>('Construction');
  const [priority, setPriority] = useState<'LOW' | 'MEDIUM' | 'HIGH'>('MEDIUM');
  const [description, setDescription] = useState('');
  const [attachmentName, setAttachmentName] = useState<string | null>(null);
  const [attachmentType, setAttachmentType] = useState<'image' | 'video' | 'pdf'>('image');

  // Message reply state
  const [replyText, setReplyText] = useState('');
  const [replyAttachment, setReplyAttachment] = useState<{ name: string; type: 'image' | 'video' | 'pdf' } | null>(null);

  // Initial Seed Support Tickets
  useEffect(() => {
    const savedTickets = localStorage.getItem('goodearth_support_tickets_v2');
    if (savedTickets) {
      setTickets(JSON.parse(savedTickets));
    } else {
      const seedTickets: SupportTicket[] = [
        {
          id: 'GET-2026-9042',
          subject: 'Requesting black-matte finish shower fittings instead of chrome set',
          category: 'Design Studio',
          description: 'We would like to understand if we can request a custom black-finish shower mixer instead of the chrome series.',
          status: 'IN_PROGRESS',
          priority: 'MEDIUM',
          assignedCoordinator: 'Arun Kumar (Care Team)',
          createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
          estimatedResolution: '16 July 2026',
          slaResponse: 'Expected reply within 4 hours',
          messages: [
            {
              id: 'm1',
              sender: 'Client',
              text: 'We would like to understand if we can request a custom black-finish shower mixer instead of the chrome series.',
              timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
              attachments: [
                {
                  name: 'bathroom_moodboard.jpg',
                  type: 'image',
                  url: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?q=80&w=300',
                }
              ]
            },
            {
              id: 'm2',
              sender: 'GoodEarth Support',
              text: 'Hello! Yes, custom black-matte finishes can be sourced under premium upgrade orders. Our design studio catalog has been updated with these choices.',
              timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
            },
          ],
        },
        {
          id: 'GET-2026-8815',
          subject: 'Payment receipt confirmation for Stage 3 superstructure draw',
          category: 'Finance',
          description: 'Confirming receipt release transfer statement copy for the superstructure construction drawing invoice.',
          status: 'RESOLVED',
          priority: 'LOW',
          assignedCoordinator: 'Meera Nair (Finance)',
          createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
          estimatedResolution: 'Completed',
          slaResponse: 'Resolved',
          messages: [
            {
              id: 'm3',
              sender: 'Client',
              text: 'Confirming receipt release transfer statement copy for the superstructure construction drawing invoice.',
              timestamp: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
              attachments: [
                {
                  name: 'bank_transfer_slip.pdf',
                  type: 'pdf',
                  url: '#',
                }
              ]
            },
            {
              id: 'm4',
              sender: 'GoodEarth Support',
              text: 'Payment has been successfully verified and receipts are released in your Finance dashboard.',
              timestamp: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000).toISOString(),
            },
          ],
        }
      ];
      setTickets(seedTickets);
      localStorage.setItem('goodearth_support_tickets_v2', JSON.stringify(seedTickets));
    }
  }, []);

  const saveAndSetTickets = (newTickets: SupportTicket[]) => {
    setTickets(newTickets);
    localStorage.setItem('goodearth_support_tickets_v2', JSON.stringify(newTickets));
  };

  const handleRaiseTicket = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !description.trim()) return;

    const newTicket: SupportTicket = {
      id: `GET-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      subject,
      category,
      description,
      status: 'OPEN',
      priority,
      assignedCoordinator: 'Unassigned (Awaiting Review)',
      createdAt: new Date().toISOString(),
      estimatedResolution: 'Within 24-48 Hours',
      slaResponse: 'First response in 4 hours',
      messages: [
        {
          id: 'msg_' + Math.random().toString(36).substring(7),
          sender: 'Client',
          text: description,
          timestamp: new Date().toISOString(),
          attachments: attachmentName ? [
            {
              name: attachmentName,
              type: attachmentType,
              url: '#',
            }
          ] : [],
        },
      ],
    };

    const updated = [newTicket, ...tickets];
    saveAndSetTickets(updated);
    setSelectedTicketId(newTicket.id);
    setShowRaiseForm(false);
    setSubject('');
    setDescription('');
    setAttachmentName(null);
  };

  const handleSendReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim() || !selectedTicketId) return;

    const newMsg: SupportMessage = {
      id: 'msg_' + Math.random().toString(36).substring(7),
      sender: 'Client',
      text: replyText,
      timestamp: new Date().toISOString(),
      attachments: replyAttachment ? [
        {
          name: replyAttachment.name,
          type: replyAttachment.type,
          url: '#',
        }
      ] : [],
    };

    const updated = tickets.map((t) => {
      if (t.id === selectedTicketId) {
        return {
          ...t,
          status: 'IN_PROGRESS' as const,
          messages: [...t.messages, newMsg],
        };
      }
      return t;
    });

    saveAndSetTickets(updated);
    setReplyText('');
    setReplyAttachment(null);

    // Simulate agent reply after 2 seconds
    setTimeout(() => {
      const autoReply: SupportMessage = {
        id: 'msg_agent_' + Math.random().toString(36).substring(7),
        sender: 'GoodEarth Support',
        text: 'Hello. Thank you for your feedback. Our coordinator team has logged this message and will review it shortly.',
        timestamp: new Date().toISOString(),
      };

      const updatedWithReply = updated.map((t) => {
        if (t.id === selectedTicketId) {
          return {
            ...t,
            messages: [...t.messages, autoReply],
          };
        }
        return t;
      });
      saveAndSetTickets(updatedWithReply);
    }, 2000);
  };

  // Search & Filter processing
  const filteredTickets = tickets.filter((t) => {
    const matchesSearch = t.subject.toLowerCase().includes(searchQuery.toLowerCase()) || t.id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = filterCategory === 'ALL' || t.category === filterCategory;
    const matchesStatus = filterStatus === 'ALL' || t.status === filterStatus;
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const selectedTicket = tickets.find((t) => t.id === selectedTicketId);

  const stats = {
    active: tickets.filter((t) => t.status === 'OPEN' || t.status === 'IN_PROGRESS').length,
    resolved: tickets.filter((t) => t.status === 'RESOLVED').length,
    avgSLA: '2.5 Hours',
  };

  // Knowledge base FAQs
  const faqs = [
    { q: 'How do I submit snags or structural change requests?', a: 'You can navigate to the Design Studio to submit specific annotations on the floor plan drawing. For general structural snags, raise a ticket here under the "Construction" category.' },
    { q: 'What is the average SLA for finance receipts clearance?', a: 'Bank transfers or milestone payments clear within 24-48 business hours. Receipts are automatically generated and downloadable in the Finance dashboard.' },
    { q: 'Can I change my selection choices after they are locked?', a: 'Once a selection status shows "APPROVED" or "COMPLETED", it is locked into the procurement system. For modifications post-approval, please contact your relationship manager immediately.' },
    { q: 'How long does registration and stamp duty processing take?', a: 'Registration processing begins post handover and clearances. Typical timelines run between 15-30 business days depending on local municipal approvals.' },
  ];

  return (
    <div className="space-y-6 text-left">
      {/* Page Header */}
      <div>
        <h1 className="font-serif text-3xl font-semibold text-brand-900 dark:text-white">
          Support
        </h1>
        <p className="text-sm font-medium text-brand-500 dark:text-brand-400 mt-1">
          Track support tickets, communicate with post-sales coordinators, and access common FAQ queries.
        </p>
      </div>

      {/* 1. Homeowner Support Dashboard (Stats Row) */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
        <StatCard
          title="Active Requests"
          value={String(stats.active)}
          icon={Clock}
          badge={<StatusBadge label="Pending Review" type="warning" />}
        />
        <StatCard
          title="Resolved Requests"
          value={String(stats.resolved)}
          icon={CheckCircle}
          badge={<StatusBadge label="Completed" type="success" />}
        />
        <StatCard
          title="Average Response Time"
          value={stats.avgSLA}
          icon={LifeBuoy}
          badge={<StatusBadge label="SLA Standard" type="success" />}
        />
      </div>

      {/* Support Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Side: Tickets list & Filters */}
        <div className="space-y-4">
          <Card title="Support Requests" subtitle="Raise snags and coordinate finishes variations">
            
            {/* Search & Filters */}
            <div className="space-y-3 mb-4 mt-2">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-brand-400" />
                <input
                  type="text"
                  placeholder="Search ticket ID or query..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-xl border border-brand-200 bg-brand-50/20 pl-9 pr-4 py-2.5 text-xs outline-none focus:ring-2 focus:ring-brand-500/25 dark:border-brand-800 dark:bg-brand-950/20 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <label className="block text-[9px] uppercase font-bold text-brand-400 mb-1 font-mono">Category</label>
                  <select
                    value={filterCategory}
                    onChange={(e) => setFilterCategory(e.target.value)}
                    className="w-full rounded-xl border border-brand-200 bg-brand-50/20 px-2 py-2 text-[10px] outline-none dark:border-brand-850 dark:bg-brand-900"
                  >
                    <option value="ALL">All Categories</option>
                    <option value="Construction">Construction</option>
                    <option value="Finance">Finance</option>
                    <option value="Design Studio">Design Studio</option>
                    <option value="Documents">Documents</option>
                    <option value="Registration">Registration</option>
                    <option value="Handover">Handover</option>
                    <option value="Warranty">Warranty</option>
                    <option value="General">General</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[9px] uppercase font-bold text-brand-400 mb-1 font-mono">Status</label>
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="w-full rounded-xl border border-brand-200 bg-brand-50/20 px-2 py-2 text-[10px] outline-none dark:border-brand-850 dark:bg-brand-900"
                  >
                    <option value="ALL">All Statuses</option>
                    <option value="OPEN">Open</option>
                    <option value="IN_PROGRESS">In Progress</option>
                    <option value="RESOLVED">Resolved</option>
                  </select>
                </div>
              </div>

              {/* 1. Raise Support Ticket CTA */}
              <button
                onClick={() => {
                  setShowRaiseForm(true);
                  setSelectedTicketId(null);
                }}
                className="w-full rounded-xl bg-brand-700 hover:bg-brand-800 text-white py-2.5 text-xs font-bold shadow transition-all flex items-center justify-center gap-1.5"
              >
                <PlusCircle className="h-4.5 w-4.5" />
                Raise Support Ticket
              </button>
            </div>

            {/* 2. Rich support ticket list cards */}
            {filteredTickets.length > 0 ? (
              <div className="space-y-3.5 max-h-[380px] overflow-y-auto pr-1">
                {filteredTickets.map((t) => (
                  <div
                    key={t.id}
                    onClick={() => {
                      setSelectedTicketId(t.id);
                      setShowRaiseForm(false);
                    }}
                    className={`p-3.5 rounded-2xl cursor-pointer border transition-all flex flex-col gap-2.5 shadow-sm group ${
                      selectedTicketId === t.id
                        ? 'border-brand-700 bg-brand-50/20 dark:border-brand-400'
                        : 'border-brand-150 bg-white hover:border-brand-350 dark:border-brand-850 dark:bg-brand-900/40'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono text-brand-400 font-bold">{t.id}</span>
                      <StatusBadge
                        label={t.status === 'IN_PROGRESS' ? 'In Progress' : t.status}
                        type={t.status === 'RESOLVED' ? 'success' : 'warning'}
                      />
                    </div>

                    <h4 className="text-xs font-bold text-brand-900 dark:text-white leading-relaxed group-hover:text-brand-750">
                      {t.subject}
                    </h4>

                    <div className="flex items-center justify-between border-t border-brand-100 dark:border-brand-850 pt-2 text-[9px] text-brand-500 font-semibold font-mono">
                      <span>Category: {t.category}</span>
                      <span className="flex items-center gap-1">
                        <AlertCircle className={`h-3 w-3 ${t.priority === 'HIGH' ? 'text-red-500' : 'text-brand-400'}`} />
                        Priority: {t.priority}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[9px] text-brand-400 font-medium">
                      <span>Staff: {t.assignedCoordinator}</span>
                      <span>{new Date(t.createdAt).toLocaleDateString('en-IN')}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState
                title="No support tickets found"
                description="Need customization help? Raise a ticket or alter your search filter queries."
                icon={LifeBuoy}
              />
            )}
          </Card>
        </div>

        {/* Right Side: Support Workspace Conversation or Ticket Form */}
        <div className="lg:col-span-2 space-y-6">
          {showRaiseForm ? (
            /* Ticket Creation Form */
            <Card title="Raise Support Ticket" subtitle="Fill in details to open a new support request case">
              <form onSubmit={handleRaiseTicket} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-brand-700 dark:text-brand-300 mb-1">
                    Subject / Query Heading
                  </label>
                  <input
                    type="text"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="e.g. Inquiry about bedroom wooden floor paneling options"
                    className="w-full rounded-xl border border-brand-200 bg-brand-50/30 px-3 py-2.5 text-xs outline-none focus:ring-2 focus:ring-brand-500/25 focus:border-brand-600 dark:border-brand-800 dark:bg-brand-950/20 dark:text-white"
                    required
                  />
                </div>
                
                {/* categories list dropdown */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-brand-700 dark:text-brand-300 mb-1">
                      Query Category
                    </label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value as any)}
                      className="w-full rounded-xl border border-brand-200 bg-brand-50/30 px-3 py-2.5 text-xs font-semibold outline-none focus:ring-2 focus:ring-brand-500/25 focus:border-brand-600 dark:border-brand-800 dark:bg-brand-950/20 dark:text-white cursor-pointer"
                    >
                      <option value="Construction">Construction</option>
                      <option value="Finance">Finance</option>
                      <option value="Design Studio">Design Studio</option>
                      <option value="Documents">Documents</option>
                      <option value="Registration">Registration</option>
                      <option value="Handover">Handover</option>
                      <option value="Warranty">Warranty</option>
                      <option value="General">General</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-brand-700 dark:text-brand-300 mb-1">
                      Priority Level
                    </label>
                    <select
                      value={priority}
                      onChange={(e) => setPriority(e.target.value as any)}
                      className="w-full rounded-xl border border-brand-200 bg-brand-50/30 px-3 py-2.5 text-xs font-semibold outline-none focus:ring-2 focus:ring-brand-500/25 focus:border-brand-600 dark:border-brand-800 dark:bg-brand-950/20 dark:text-white cursor-pointer"
                    >
                      <option value="LOW">Low - General Inquiry</option>
                      <option value="MEDIUM">Medium - Materials / Customization</option>
                      <option value="HIGH">High - Snagging / Civil Delay</option>
                    </select>
                  </div>
                </div>

                {/* Attach File options */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-brand-700 dark:text-brand-300 mb-1">
                      Upload Snippets / Snags
                    </label>
                    <div className="flex items-center gap-2 border border-brand-200 bg-brand-50/30 rounded-xl px-3 py-2 dark:border-brand-800 dark:bg-brand-950/20">
                      <Paperclip className="h-4 w-4 text-brand-400 shrink-0" />
                      <input
                        type="file"
                        onChange={(e) => {
                          if (e.target.files && e.target.files[0]) {
                            setAttachmentName(e.target.files[0].name);
                          }
                        }}
                        className="hidden"
                        id="ticket-file"
                      />
                      <label htmlFor="ticket-file" className="text-xs font-semibold text-brand-700 dark:text-brand-300 cursor-pointer flex-1 truncate">
                        {attachmentName || 'Attach file...'}
                      </label>
                    </div>
                  </div>

                  {attachmentName && (
                    <div>
                      <label className="block text-xs font-bold text-brand-700 dark:text-brand-300 mb-1">
                        Attachment Type
                      </label>
                      <select
                        value={attachmentType}
                        onChange={(e) => setAttachmentType(e.target.value as any)}
                        className="w-full rounded-xl border border-brand-200 bg-brand-50/30 px-3 py-2 text-xs font-semibold outline-none dark:border-brand-800 dark:bg-brand-950/20 dark:text-white cursor-pointer"
                      >
                        <option value="image">Photo Preview (.jpg, .png)</option>
                        <option value="pdf">Document (.pdf)</option>
                        <option value="video">Clip / Video (.mp4)</option>
                      </select>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-brand-700 dark:text-brand-300 mb-1">
                    Describe your observation or inquiry in detail
                  </label>
                  <textarea
                    rows={4}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="e.g. Please clarify selection options for wooden floor patterns..."
                    className="w-full rounded-xl border border-brand-200 bg-brand-50/30 px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-brand-500/25 focus:border-brand-600 dark:border-brand-800 dark:bg-brand-950/20 dark:text-white"
                    required
                  />
                </div>
                <div className="flex gap-2 justify-end">
                  <button
                    type="submit"
                    className="rounded-xl bg-brand-700 hover:bg-brand-800 text-white px-5 py-2.5 text-xs font-bold shadow-sm transition-colors"
                  >
                    Submit Query
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowRaiseForm(false)}
                    className="rounded-xl bg-brand-100 hover:bg-brand-200 dark:bg-brand-800 text-brand-800 dark:text-white px-4 py-2.5 text-xs font-semibold transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </Card>
          ) : selectedTicket ? (
            /* 3. Conversation-style Support Workspace */
            <div className="space-y-4">
              <Card
                title={selectedTicket.subject}
                subtitle={`Ticket: ${selectedTicket.id} | Category: ${selectedTicket.category}`}
              >
                {/* SLA and staff assignment banner */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 rounded-2xl bg-brand-50/40 dark:bg-brand-950/20 border border-brand-100 dark:border-brand-850 text-xs font-semibold mb-4 text-brand-700 dark:text-brand-300">
                  <div className="flex items-center gap-1.5">
                    <User className="h-4 w-4 text-brand-450" />
                    <span>Coordinator: <strong className="text-brand-900 dark:text-white">{selectedTicket.assignedCoordinator}</strong></span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Clock className="h-4 w-4 text-brand-450" />
                    <span>SLA: <strong className="text-brand-900 dark:text-white">{selectedTicket.slaResponse}</strong></span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <CheckCircle className="h-4 w-4 text-brand-450" />
                    <span>Resolution: <strong className="text-brand-900 dark:text-white">{selectedTicket.estimatedResolution}</strong></span>
                  </div>
                </div>

                {/* Ticket timeline trace */}
                <div className="border-b border-brand-100 dark:border-brand-850 pb-3 mb-4 text-[9px] font-bold text-brand-400 uppercase tracking-wider font-mono flex flex-wrap gap-x-4 gap-y-1">
                  <span>Ticket Created: {new Date(selectedTicket.createdAt).toLocaleDateString('en-IN')}</span>
                  <span>•</span>
                  <span>Assigned to: {selectedTicket.assignedCoordinator}</span>
                  <span>•</span>
                  <span>Status: {selectedTicket.status}</span>
                </div>

                {/* Messages Stream */}
                <div className="space-y-4 max-h-[300px] overflow-y-auto pr-1 py-2 text-left">
                  {selectedTicket.messages.map((m) => {
                    const isClient = m.sender === 'Client';
                    return (
                      <div
                        key={m.id}
                        className={`flex flex-col max-w-[80%] rounded-2xl p-3.5 shadow-sm border ${
                          isClient
                            ? 'bg-brand-700 text-white border-brand-700 ml-auto rounded-tr-none'
                            : 'bg-brand-50 text-brand-900 border-brand-100 dark:bg-brand-850/80 dark:border-brand-800 dark:text-brand-100 mr-auto rounded-tl-none'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-4 text-[8px] font-bold opacity-75 uppercase tracking-wider mb-1 font-mono">
                          <span>{m.sender}</span>
                          <span>{new Date(m.timestamp).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                        <p className="text-xs leading-relaxed">{m.text}</p>
                        
                        {/* 5. Attachments previews for photos, videos, and PDFs */}
                        {m.attachments && m.attachments.length > 0 && (
                          <div className="mt-3 pt-2.5 border-t border-white/10 dark:border-brand-800 space-y-2">
                            {m.attachments.map((attach, aIdx) => (
                              <div key={aIdx} className="rounded-xl overflow-hidden bg-black/10 dark:bg-black/30 p-2.5 flex items-center justify-between gap-3 border border-white/5">
                                <div className="flex items-center gap-2 min-w-0">
                                  {attach.type === 'image' ? (
                                    <ImageIcon className="h-4.5 w-4.5 shrink-0" />
                                  ) : attach.type === 'video' ? (
                                    <Video className="h-4.5 w-4.5 shrink-0" />
                                  ) : (
                                    <FileText className="h-4.5 w-4.5 shrink-0" />
                                  )}
                                  <span className="text-[10px] font-bold truncate max-w-[150px]">{attach.name}</span>
                                </div>
                                <a
                                  href={attach.url}
                                  onClick={(e) => { e.preventDefault(); alert('Downloading support attachment...'); }}
                                  className="rounded-lg bg-white/10 hover:bg-white/20 p-1 text-white shrink-0"
                                >
                                  <Download className="h-3.5 w-3.5" />
                                </a>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Reply Form */}
                <form onSubmit={handleSendReply} className="border-t border-brand-100 dark:border-brand-850 pt-3 flex flex-col gap-2">
                  <div className="flex items-center gap-2 bg-brand-50/20 dark:bg-brand-950/20 rounded-xl px-3 py-2 border border-brand-200 dark:border-brand-800">
                    <input
                      type="text"
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      placeholder="Type follow-up message response..."
                      className="flex-1 bg-transparent text-xs outline-none dark:text-white"
                      required
                    />
                    
                    {/* Attachment trigger button */}
                    <button
                      type="button"
                      onClick={() => {
                        const rName = prompt('Enter filename to attach (e.g. site_issue.jpg):');
                        if (rName) {
                          setReplyAttachment({
                            name: rName,
                            type: rName.endsWith('.pdf') ? 'pdf' : rName.endsWith('.mp4') ? 'video' : 'image',
                          });
                        }
                      }}
                      className="text-brand-450 hover:text-brand-800 p-1 rounded-lg shrink-0"
                      title="Attach Snag Document"
                    >
                      <Paperclip className="h-4.5 w-4.5" />
                    </button>

                    <button
                      type="submit"
                      className="rounded-lg bg-brand-700 hover:bg-brand-800 text-white p-1.5 shrink-0 transition-all"
                    >
                      <Send className="h-4 w-4" />
                    </button>
                  </div>

                  {replyAttachment && (
                    <div className="flex items-center justify-between text-[10px] bg-brand-50 dark:bg-brand-850/60 px-3 py-1.5 rounded-xl border border-brand-150">
                      <span className="font-bold flex items-center gap-1">
                        <FileText className="h-3.5 w-3.5" />
                        Attached: {replyAttachment.name}
                      </span>
                      <button onClick={() => setReplyAttachment(null)} className="text-red-500">
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  )}
                </form>
              </Card>
            </div>
          ) : (
            <div className="h-full flex items-center justify-center p-12 border border-dashed border-brand-200 bg-white rounded-2xl dark:border-brand-800 dark:bg-brand-900">
              <div className="text-center space-y-2">
                <MessageSquare className="h-8 w-8 text-brand-350 mx-auto" />
                <h5 className="text-sm font-semibold text-brand-900 dark:text-white">No active ticket selected</h5>
                <p className="text-xs text-brand-450">Select an existing request or submit a new homeowner ticket query.</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 8. Homeowner Knowledge Base Accordion FAQs */}
      <div className="mt-8">
        <Card title="Homeowner Help & Knowledge Base" subtitle="Find answers to common post-sales and specifications questions">
          <div className="space-y-3 mt-3">
            {faqs.map((faq, idx) => (
              <div
                key={idx}
                className="rounded-2xl border border-brand-150 bg-white dark:border-brand-850 dark:bg-brand-900 overflow-hidden shadow-sm"
              >
                <button
                  onClick={() => setOpenFaqIndex(openFaqIndex === idx ? null : idx)}
                  className="w-full flex items-center justify-between p-4 text-xs font-bold text-brand-900 dark:text-white hover:bg-brand-50/50 transition-colors text-left"
                >
                  <span>{faq.q}</span>
                  {openFaqIndex === idx ? (
                    <ChevronUp className="h-4.5 w-4.5 text-brand-450" />
                  ) : (
                    <ChevronDown className="h-4.5 w-4.5 text-brand-450" />
                  )}
                </button>
                {openFaqIndex === idx && (
                  <div className="px-4 pb-4 text-xs text-brand-500 border-t border-brand-50 pt-3 dark:border-brand-850 leading-relaxed">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default ClientSupportPage;
