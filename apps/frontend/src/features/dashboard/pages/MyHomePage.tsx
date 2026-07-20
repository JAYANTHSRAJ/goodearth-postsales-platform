import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  Building,
  MapPin,
  Compass,
  Layout,
  Maximize2,
  FileText,
  Clock,
  Mail,
  Phone,
  AlertTriangle,
  Download,
  Award,
  MessageSquare,
  ShieldCheck,
  CheckCircle2,
  Hammer,
} from 'lucide-react';
import { Card } from '../../../components/ui/Card';
import { StatusBadge } from '../../../components/ui/StatusBadge';
import { EmptyState } from '../../../components/ui/EmptyState';
import { LoadingScreen } from '../../../components/common/LoadingScreen';
import { clientService } from '../../../services/client.service';

export const MyHomePage: React.FC = () => {
  const [activeWorkflowId, setActiveWorkflowId] = useState<string | null>(null);
  const navigate = useNavigate();

  // Queries for client home details
  const { data: dashboard, isLoading: isDashboardLoading } = useQuery({
    queryKey: ['clientDashboard', activeWorkflowId],
    queryFn: () => clientService.getDashboard(activeWorkflowId),
  });

  const { data: home, isLoading: isHomeLoading } = useQuery({
    queryKey: ['clientHome', activeWorkflowId],
    queryFn: () => clientService.getHomeDetails(activeWorkflowId),
  });

  const { data: documents, isLoading: isDocsLoading } = useQuery({
    queryKey: ['clientDocuments'],
    queryFn: () => clientService.getDocuments(),
  });

  const { data: timeline, isLoading: isTimelineLoading } = useQuery({
    queryKey: ['clientTimeline'],
    queryFn: () => clientService.getTimeline(),
  });

  const isLoading = isDashboardLoading || isHomeLoading || isDocsLoading || isTimelineLoading;

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (!dashboard || !home) {
    return (
      <EmptyState
        title="Home Specifications Offline"
        description="We are unable to retrieve your homeowner profile information at this time."
        icon={AlertTriangle}
      />
    );
  }

  const currentWorkflowId = dashboard?.workflow?.id || 'prop-01';

  const properties = (dashboard as any)?.workflows?.map((w: any) => ({
    id: w.id,
    name: `${dashboard.project.projectName} — ${w.unitName || 'Villa ' + w.id.substring(0, 4)}`,
  })) || [
    { id: 'prop-01', name: `${home.project} — ${home.villa}` },
  ];

  // Group all documents from categories
  const allDocs = documents 
    ? [
        ...(documents.agreement || []),
        ...(documents.legal || []),
        ...(documents.design || []),
        ...(documents.other || []),
      ]
    : [];

  const handleDownloadDoc = (doc: any) => {
    alert(`Downloading: ${doc.fileName || 'document.pdf'}`);
  };

  // Convert raw filenames into user-friendly titles
  const getFriendlyDocName = (fileName: string) => {
    const lower = fileName.toLowerCase();
    if (lower.includes('agreement')) return 'Executed Homeowner Sale Agreement';
    if (lower.includes('allotment') || lower.includes('deed')) return 'Legal Plot Allotment Certificate';
    if (lower.includes('electrical')) return 'Master Automation & Electrical Layout';
    if (lower.includes('plumbing')) return 'Plumbing & Sanitary Line Blueprints';
    if (lower.includes('flooring') || lower.includes('selection')) return 'Finishes & Flooring Specification Manual';
    if (lower.includes('floor') || lower.includes('plan')) return 'Villa Floor Plan Layout Blueprint';
    
    // Fallback: clean up name
    return fileName
      .replace(/_/g, ' ')
      .replace(/\.pdf$/i, '')
      .split(' ')
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');
  };

  const getFriendlyDocDesc = (fileName: string) => {
    const lower = fileName.toLowerCase();
    if (lower.includes('agreement')) return 'Official bilateral signed agreement package';
    if (lower.includes('allotment') || lower.includes('deed')) return 'Stamp verified government land registration copy';
    if (lower.includes('design') || lower.includes('plan') || lower.includes('electrical') || lower.includes('plumbing')) {
      return 'Architectural drawing verified by GoodEarth Design Group';
    }
    return 'Official project reference document';
  };

  return (
    <div className="space-y-6 text-left">
      {/* 1. Page Header */}
      <div>
        <h1 className="font-serif text-3xl font-semibold text-brand-900 dark:text-white">
          My Home
        </h1>
        <p className="text-sm font-medium text-brand-500 dark:text-brand-400 mt-1">
          Everything about your GoodEarth home in one place.
        </p>
      </div>

      {/* 2. Prominent Current Property Selector */}
      <div className="rounded-2xl border border-brand-200 bg-white p-4 shadow-sm dark:border-brand-850 dark:bg-brand-900 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <Building className="h-4.5 w-4.5 text-brand-600" />
          <div>
            <span className="text-[10px] uppercase font-bold tracking-wider text-brand-400 font-mono">Current Property</span>
            <h4 className="text-sm font-bold text-brand-900 dark:text-white mt-0.5">{home.project} — {home.villa}</h4>
          </div>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-center">
          <select
            value={activeWorkflowId || currentWorkflowId}
            onChange={(e) => setActiveWorkflowId(e.target.value)}
            className="rounded-xl border border-brand-200 bg-white px-3.5 py-2 text-xs font-semibold outline-none focus:ring-2 focus:ring-brand-500/25 focus:border-brand-600 dark:border-brand-850 dark:bg-brand-900 dark:text-white cursor-pointer"
          >
            {properties.map((p: any) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* 3. Hero Property Banner with Glassmorphic Overlay */}
      <div className="relative rounded-3xl overflow-hidden aspect-[21/9] w-full shadow-lg group">
        <img
          src="https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=1200&auto=format&fit=crop"
          alt="GoodEarth Residence View"
          className="w-full h-full object-cover transform group-hover:scale-101 transition-transform duration-700"
        />
        {/* Absolute bottom-left overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-brand-950/90 via-brand-900/30 to-transparent flex flex-col justify-end p-6 sm:p-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl text-white backdrop-blur-md bg-white/10 p-4 sm:p-5 rounded-2xl border border-white/10 shadow-lg">
            <div>
              <span className="text-[9px] uppercase font-semibold text-brand-200 tracking-wider font-mono">Project Portfolio</span>
              <h3 className="text-sm font-bold mt-1 truncate">{home.project}</h3>
            </div>
            <div>
              <span className="text-[9px] uppercase font-semibold text-brand-200 tracking-wider font-mono">Villa Number</span>
              <h3 className="text-sm font-bold mt-1">{home.villa}</h3>
            </div>
            <div>
              <span className="text-[9px] uppercase font-semibold text-brand-200 tracking-wider font-mono">Current Progress</span>
              <h3 className="text-sm font-bold mt-1 truncate">{dashboard.currentStage?.name || home.constructionStatus}</h3>
            </div>
            <div>
              <span className="text-[9px] uppercase font-semibold text-brand-200 tracking-wider font-mono">Estimated Handover</span>
              <h3 className="text-sm font-bold mt-1">{home.expectedHandover || '—'}</h3>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Main grid container */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left 2 Columns */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* 9. Home Summary Card */}
          <Card title="Home Summary" subtitle="Key metrics detailing active progression and ownership care">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-2xl bg-brand-50/30 border border-brand-100 dark:bg-brand-950/10 dark:border-brand-850 flex items-center justify-between">
                <div>
                  <span className="text-[9px] uppercase font-bold text-brand-400 tracking-wider font-mono">Current Progress</span>
                  <h4 className="text-sm font-bold text-brand-900 dark:text-white mt-1">
                    {dashboard.currentStage?.name || home.constructionStatus}
                  </h4>
                </div>
                <StatusBadge label={`${dashboard.completionPercent || home.completionPercent || 0}% Completed`} type="info" />
              </div>

              <div className="p-4 rounded-2xl bg-brand-50/30 border border-brand-100 dark:bg-brand-950/10 dark:border-brand-850 flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-brand-100 dark:bg-brand-850 flex items-center justify-center font-bold text-brand-800 dark:text-brand-200 shrink-0">
                  SS
                </div>
                <div>
                  <span className="text-[9px] uppercase font-bold text-brand-400 tracking-wider font-mono">Care Manager</span>
                  <h4 className="text-xs font-bold text-brand-900 dark:text-white mt-0.5">Srishti Sharma</h4>
                  <p className="text-[10px] text-brand-450 mt-0.5">Assigned Coordinator</p>
                </div>
              </div>
            </div>
          </Card>

          {/* 10. Quick Actions Section */}
          <Card title="Quick Actions" subtitle="Navigate instantly to core homeowner modules">
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              <button
                onClick={() => navigate('/construction-updates')}
                className="p-3.5 rounded-2xl bg-white border border-brand-200 hover:border-brand-400 dark:bg-brand-900 dark:border-brand-800 dark:hover:border-brand-700 text-center transition-all shadow-sm flex flex-col items-center justify-center gap-1.5"
              >
                <Hammer className="h-5 w-5 text-brand-600" />
                <span className="text-[10px] font-bold text-brand-800 dark:text-brand-200">Construction</span>
              </button>

              <button
                onClick={() => navigate('/design-studio')}
                className="p-3.5 rounded-2xl bg-white border border-brand-200 hover:border-brand-400 dark:bg-brand-900 dark:border-brand-800 dark:hover:border-brand-700 text-center transition-all shadow-sm flex flex-col items-center justify-center gap-1.5"
              >
                <Layout className="h-5 w-5 text-brand-600" />
                <span className="text-[10px] font-bold text-brand-800 dark:text-brand-200">Design Studio</span>
              </button>

              <button
                onClick={() => navigate('/finance')}
                className="p-3.5 rounded-2xl bg-white border border-brand-200 hover:border-brand-400 dark:bg-brand-900 dark:border-brand-800 dark:hover:border-brand-700 text-center transition-all shadow-sm flex flex-col items-center justify-center gap-1.5"
              >
                <ShieldCheck className="h-5 w-5 text-brand-600" />
                <span className="text-[10px] font-bold text-brand-800 dark:text-brand-200">Finance</span>
              </button>

              <button
                onClick={() => {
                  const el = document.getElementById('docs-library-card');
                  if (el) el.scrollIntoView({ behavior: 'smooth' });
                }}
                className="p-3.5 rounded-2xl bg-white border border-brand-200 hover:border-brand-400 dark:bg-brand-900 dark:border-brand-800 dark:hover:border-brand-700 text-center transition-all shadow-sm flex flex-col items-center justify-center gap-1.5"
              >
                <FileText className="h-5 w-5 text-brand-600" />
                <span className="text-[10px] font-bold text-brand-800 dark:text-brand-200">Documents</span>
              </button>

              <button
                onClick={() => navigate('/support')}
                className="p-3.5 rounded-2xl bg-white border border-brand-200 hover:border-brand-400 dark:bg-brand-900 dark:border-brand-800 dark:hover:border-brand-700 text-center transition-all shadow-sm flex flex-col items-center justify-center gap-1.5 col-span-2 sm:col-span-1"
              >
                <MessageSquare className="h-5 w-5 text-brand-600" />
                <span className="text-[10px] font-bold text-brand-800 dark:text-brand-200">Support</span>
              </button>
            </div>
          </Card>

          {/* 4. Residence Specifications (Responsive Info Cards instead of Table) */}
          <Card title="Residence Specifications" subtitle="Architectural and spatial layout parameters">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 rounded-2xl border border-brand-150 bg-brand-50/10 dark:border-brand-850 dark:bg-brand-900/40 flex items-start gap-3">
                <Maximize2 className="h-5 w-5 text-brand-500 shrink-0 mt-0.5" />
                <div>
                  <span className="text-[9px] uppercase font-bold text-brand-400 tracking-wider font-mono">Super Built Area</span>
                  <p className="text-sm font-bold text-brand-900 dark:text-white mt-1">{home.area || '—'}</p>
                </div>
              </div>

              <div className="p-4 rounded-2xl border border-brand-150 bg-brand-50/10 dark:border-brand-850 dark:bg-brand-900/40 flex items-start gap-3">
                <Compass className="h-5 w-5 text-brand-500 shrink-0 mt-0.5" />
                <div>
                  <span className="text-[9px] uppercase font-bold text-brand-400 tracking-wider font-mono">Villa Facing</span>
                  <p className="text-sm font-bold text-brand-900 dark:text-white mt-1">{home.facing || 'East-Facing'}</p>
                </div>
              </div>

              <div className="p-4 rounded-2xl border border-brand-150 bg-brand-50/10 dark:border-brand-850 dark:bg-brand-900/40 flex items-start gap-3">
                <MapPin className="h-5 w-5 text-brand-500 shrink-0 mt-0.5" />
                <div>
                  <span className="text-[9px] uppercase font-bold text-brand-400 tracking-wider font-mono">Plot Location</span>
                  <p className="text-sm font-bold text-brand-900 dark:text-white mt-1">Plot No. {home.plot || '—'}</p>
                </div>
              </div>
            </div>
          </Card>

          {/* 7. Construction Milestones (Vertical Timeline with Dates, Icons, and Statuses) */}
          <Card title="Construction Milestones Timeline" subtitle="Development stages completed and active progress">
            <div className="space-y-4">
              {timeline && timeline.length > 0 ? (
                <div className="relative pl-6 ml-2 border-l border-brand-200 dark:border-brand-800 space-y-6 py-2">
                  {timeline.slice(0, 5).map((item, idx) => {
                    const isCompleted = idx > 0; // Simulated timeline: item 0 is current progress/active, rest are completed
                    return (
                      <div key={idx} className="relative pl-6 group">
                        {/* Dot indicator */}
                        <div className={`absolute left-[-31px] top-1.5 h-4.5 w-4.5 rounded-full border-2 flex items-center justify-center transition-colors ${
                          isCompleted
                            ? 'bg-green-600 border-green-600 text-white'
                            : 'bg-white border-brand-700 dark:bg-brand-900'
                        }`}>
                          {isCompleted ? (
                            <CheckCircle2 className="h-3 w-3" />
                          ) : (
                            <div className="h-1.5 w-1.5 rounded-full bg-brand-700 animate-ping" />
                          )}
                        </div>

                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-brand-100/50 dark:border-brand-850/40 pb-4">
                          <div>
                            <h4 className="text-xs font-semibold text-brand-900 dark:text-white flex items-center gap-2">
                              <span>{item.title}</span>
                              <StatusBadge label={isCompleted ? 'Completed' : 'Active Progress'} type={isCompleted ? 'success' : 'info'} />
                            </h4>
                            <p className="text-xs text-brand-500 mt-1 leading-relaxed">{item.description}</p>
                          </div>
                          <span className="text-[10px] font-mono font-bold text-brand-450 shrink-0 self-start sm:self-center bg-brand-50 dark:bg-brand-850 px-2 py-0.5 rounded">
                            {new Date(item.timestamp).toLocaleDateString('en-IN', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric',
                            })}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <EmptyState
                  title="No timeline events registered"
                  description="Milestone events will populate here as work progresses."
                  icon={Clock}
                />
              )}
            </div>
          </Card>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          
          {/* 5. Relationship Manager Card (Quick Actions) */}
          <Card title="Relationship Manager" subtitle="Personal homeowner care contact coordinator">
            <div className="space-y-4 pt-2 text-center sm:text-left">
              <div className="flex flex-col sm:flex-row items-center gap-3.5">
                <div className="h-14 w-14 rounded-full bg-brand-100 dark:bg-brand-800 flex items-center justify-center text-brand-800 dark:text-white font-bold text-lg shadow-sm border border-brand-200 dark:border-brand-750">
                  SS
                </div>
                <div>
                  <h4 className="text-base font-bold text-brand-900 dark:text-white">Srishti Sharma</h4>
                  <p className="text-xs text-brand-500 font-medium">Homeowner Care Lead</p>
                  <p className="text-[10px] text-accent-700 bg-accent-600/10 px-2 py-0.5 rounded mt-1 inline-block font-bold">GoodEarth Post-Sales</p>
                </div>
              </div>

              {/* Call, Email, and WhatsApp quick actions */}
              <div className="grid grid-cols-3 gap-2.5 border-t border-brand-100 dark:border-brand-850 pt-4 mt-2">
                <a
                  href="tel:+919876543210"
                  className="flex flex-col items-center justify-center p-2 rounded-xl bg-brand-50 hover:bg-brand-100 dark:bg-brand-950/20 dark:hover:bg-brand-850 transition-all border border-brand-200 dark:border-brand-800 text-brand-700 dark:text-brand-300 font-bold"
                >
                  <Phone className="h-4.5 w-4.5" />
                  <span className="text-[9px] mt-1">Call</span>
                </a>
                <a
                  href="mailto:srishti@goodearth.org"
                  className="flex flex-col items-center justify-center p-2 rounded-xl bg-brand-50 hover:bg-brand-100 dark:bg-brand-950/20 dark:hover:bg-brand-850 transition-all border border-brand-200 dark:border-brand-800 text-brand-700 dark:text-brand-300 font-bold"
                >
                  <Mail className="h-4.5 w-4.5" />
                  <span className="text-[9px] mt-1">Email</span>
                </a>
                <a
                  href="https://wa.me/919876543210"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex flex-col items-center justify-center p-2 rounded-xl bg-green-50/50 hover:bg-green-100/50 dark:bg-green-950/10 dark:hover:bg-green-900/20 transition-all border border-green-200/50 dark:border-green-900/30 text-green-700 dark:text-green-400 font-bold"
                >
                  <MessageSquare className="h-4.5 w-4.5" />
                  <span className="text-[9px] mt-1">WhatsApp</span>
                </a>
              </div>

              {/* Architect group */}
              <div className="border-t border-brand-100 dark:border-brand-850 pt-4 mt-2">
                <div className="flex items-start gap-3">
                  <Award className="h-5 w-5 text-brand-600 mt-0.5 shrink-0" />
                  <div>
                    <h4 className="text-xs font-bold text-brand-900 dark:text-white">Sustainable Design Group</h4>
                    <p className="text-[10px] text-brand-450 mt-0.5 leading-relaxed">Lead Architects & Landscape Designers</p>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* 6. Document Cards and download buttons */}
          <div id="docs-library-card">
            <Card title="Residence Documents" subtitle="Executed contracts & drawings library">
              {allDocs.length > 0 ? (
                <div className="space-y-3 pt-2">
                  {allDocs.map((doc) => (
                    <div
                      key={doc.id}
                      className="p-3 rounded-2xl border border-brand-150 bg-white hover:border-brand-300 dark:border-brand-850 dark:bg-brand-900 transition-all flex items-center justify-between gap-3 shadow-sm"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="p-2 rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-950 dark:text-brand-350 shrink-0">
                          <FileText className="h-5 w-5" />
                        </div>
                        <div className="min-w-0 text-left">
                          <p className="text-xs font-bold text-brand-900 dark:text-white truncate">{getFriendlyDocName(doc.fileName)}</p>
                          <p className="text-[10px] text-brand-450 mt-0.5 font-medium leading-normal">{getFriendlyDocDesc(doc.fileName)}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleDownloadDoc(doc)}
                        className="text-brand-600 hover:text-brand-800 p-2 rounded-xl hover:bg-brand-50 dark:hover:bg-brand-850 transition-colors shrink-0"
                        title="Download Document"
                      >
                        <Download className="h-4.5 w-4.5" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState
                  title="No documents library found"
                  description="Executed construction documents and design guidelines will list here."
                  icon={FileText}
                />
              )}
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MyHomePage;
