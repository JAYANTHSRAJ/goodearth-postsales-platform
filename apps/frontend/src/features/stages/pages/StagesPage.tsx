import React, { useState, useMemo } from 'react';
import {
  Activity,
  Calendar,
  FolderOpen,
  Search,
  ArrowLeft,
  Camera,
  Video,
  AlertTriangle,
  CheckCircle,
  FileText,
  Users,
  ShieldAlert,
  Truck,
  BookOpen,
  Download,
  Eye,
} from 'lucide-react';
import { Card } from '../../../components/ui/Card';
import { StatCard } from '../../../components/ui/StatCard';
import { StatusBadge } from '../../../components/ui/StatusBadge';
import { EmptyState } from '../../../components/ui/EmptyState';
import { useStages } from '../hooks/useStages';

// Rich construction operation structure
interface ConstructionSite {
  id: string;
  projectName: string;
  unitName: string;
  buyerName: string;
  currentActivity: string;
  progressPercent: number;
  engineerName: string;
  inspectionStatus: 'Passed' | 'Failed' | 'Pending Review';
  riskLevel: 'Low' | 'Medium' | 'High';
  lastUpdate: string;
  dailyLogs: { date: string; log: string }[];
  photos: string[];
  videos: string[];
  materials: { name: string; required: string; status: 'Arrived' | 'Delayed' | 'Pending' }[];
  engineerNotes: string[];
  risks: { category: string; description: string; impact: string }[];
  timeline: { name: string; date: string; status: 'Completed' | 'Current' | 'Upcoming' }[];
  documents: { name: string; type: string; date: string }[];
}

export const StagesPage: React.FC = () => {
  const {
    filteredStages,
    isLoading,
  } = useStages();

  // Selected Construction site ID for 360 Workspace
  const [selectedSiteId, setSelectedSiteId] = useState<string | null>(null);
  const [workspaceTab, setWorkspaceTab] = useState<'overview' | 'logs' | 'photos' | 'videos' | 'inspections' | 'materials' | 'notes' | 'risks' | 'timeline' | 'documents'>('overview');

  // Search & Filter state
  const [globalSearch, setGlobalSearch] = useState('');
  const [filterProject, setFilterProject] = useState('all');
  const [filterStage, setFilterStage] = useState('all');
  const [filterEngineer, setFilterEngineer] = useState('all');
  const [filterInspection, setFilterInspection] = useState('all');
  const [filterRisk, setFilterRisk] = useState('all');

  // Interactive Quality inspection checklist
  const [inspectionsList, setInspectionsList] = useState([
    { name: 'Slab reinforcement inspection', status: 'Passed', remarks: 'Grade 500 Steel compliance verified.' },
    { name: 'Electrical conduits groove inspection', status: 'Passed', remarks: 'Grooves match the approved schematic.' },
    { name: 'Plumbing line leak pressure check', status: 'Pending Review', remarks: 'Pressure testing is scheduled for tomorrow.' },
  ]);
  const [newInspectName, setNewInspectName] = useState('');
  const [newInspectRemarks, setNewInspectRemarks] = useState('');

  // Daily Site Logs state
  const [siteLogsList, setSiteLogsList] = useState([
    { date: '12 Jul 2026', log: 'Excavation completed for rain-water recharge tanks.' },
    { date: '13 Jul 2026', log: 'Pre-curing block masonry executed on first-floor walls.' },
  ]);
  const [newLogText, setNewLogText] = useState('');

  // Daily notes state
  const [siteNotesList, setSiteNotesList] = useState([
    'Site Engineer Note: Suggest extra curing for north-facing columns due to high wind drying.',
    'Site Engineer Note: Verify plumbing fixture sample matches selection specs before ordering.',
  ]);
  const [newNoteText, setNewNoteText] = useState('');

  // Materials inventory tracking
  const [materialsList] = useState<{ name: string; required: string; status: 'Arrived' | 'Delayed' | 'Pending' }[]>([
    { name: 'River Sand Alternative (M-Sand)', required: '10 Tons', status: 'Arrived' },
    { name: 'Terracotta Roof Tiles', required: '800 Pcs', status: 'Pending' },
    { name: 'European White Oak Planks', required: '120 SqM', status: 'Delayed' },
  ]);

  // Risks list
  const [risksList] = useState([
    { category: 'Material Shortage', description: 'Wood selections delivery delayed by cargo reschedules.', impact: 'High' },
    { category: 'Weather', description: 'Heavy monsoon rains slowing masonry curing.', impact: 'Medium' },
  ]);

  // Extended Construction Sites Mapper from hook stages
  const constructionSites: ConstructionSite[] = useMemo(() => {
    return filteredStages.map((s, idx): ConstructionSite => {
      const projects = ['GoodEarth Malhar', 'GoodEarth Orchard', 'GoodEarth Footprints'];
      const villas = ['Villa 14', 'Villa 15', 'Villa 16'];
      const buyers = ['Jayanth S Raj', 'Rohan Sharma', 'Anjali Menon'];
      const engineers = ['Prasad Hegde', 'Ankit Roy', 'Suresh Gowda'];

      return {
        id: `site-${s.id}`,
        projectName: projects[idx % projects.length],
        unitName: villas[idx % villas.length],
        buyerName: buyers[idx % buyers.length],
        currentActivity: idx === 0 ? 'Flooring Curing & Polishing' : 'Conduits Groove Cutting',
        progressPercent: idx === 0 ? 80 : 45,
        engineerName: engineers[idx % engineers.length],
        inspectionStatus: idx === 0 ? 'Passed' : 'Pending Review',
        riskLevel: idx === 0 ? 'Low' : 'Medium',
        lastUpdate: '13 Jul 2026',
        dailyLogs: siteLogsList,
        photos: [
          'https://images.unsplash.com/photo-1541888946425-d81bb19240f5?w=400&q=80',
          'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=400&q=80',
        ],
        videos: ['conduit_layout_first_floor.mp4', 'brickwork_inspection.mp4'],
        materials: materialsList,
        engineerNotes: siteNotesList,
        risks: risksList,
        timeline: [
          { name: 'Excavation & Footings', date: '10 Feb 2026', status: 'Completed' },
          { name: 'Slab Casting', date: '25 Mar 2026', status: 'Completed' },
          { name: 'Conduits Groove Cutting', date: '18 Jul 2026', status: 'Current' },
          { name: 'Plastering & Painting', date: '10 Sep 2026', status: 'Upcoming' },
        ],
        documents: [
          { name: 'Plan_Sanction_Order.pdf', type: 'Sanction', date: '15 Jan 2026' },
          { name: 'Approved_Structural_Blueprint.dwg', type: 'Blueprint', date: '22 Feb 2026' },
        ],
      };
    });
  }, [filteredStages, siteLogsList, siteNotesList, materialsList, risksList]);

  // Client search and filter logic
  const filteredSites = useMemo(() => {
    return constructionSites.filter((site) => {
      const matchesSearch =
        site.projectName.toLowerCase().includes(globalSearch.toLowerCase()) ||
        site.unitName.toLowerCase().includes(globalSearch.toLowerCase()) ||
        site.buyerName.toLowerCase().includes(globalSearch.toLowerCase()) ||
        site.engineerName.toLowerCase().includes(globalSearch.toLowerCase()) ||
        site.currentActivity.toLowerCase().includes(globalSearch.toLowerCase());

      const matchesProject = filterProject === 'all' || site.projectName === filterProject;
      const matchesEngineer = filterEngineer === 'all' || site.engineerName === filterEngineer;
      const matchesInspection = filterInspection === 'all' || site.inspectionStatus === filterInspection;
      const matchesRisk = filterRisk === 'all' || site.riskLevel === filterRisk;

      // Filter stage matches
      const matchesStage = filterStage === 'all' || 
        (filterStage === 'active' && site.progressPercent < 90);

      return (
        matchesSearch &&
        matchesProject &&
        matchesEngineer &&
        matchesInspection &&
        matchesRisk &&
        matchesStage
      );
    });
  }, [constructionSites, globalSearch, filterProject, filterEngineer, filterInspection, filterRisk, filterStage]);

  const activeSite = useMemo(() => {
    return constructionSites.find((site) => site.id === selectedSiteId);
  }, [constructionSites, selectedSiteId]);

  // Operations checklists controls
  const handleAddInspection = (status: 'Passed' | 'Failed') => {
    if (!newInspectName) return;
    setInspectionsList([
      ...inspectionsList,
      { name: newInspectName, status, remarks: newInspectRemarks || 'Checklist item evaluated by Site PM.' },
    ]);
    setNewInspectName('');
    setNewInspectRemarks('');
  };

  const handleAddSiteLog = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLogText) return;
    setSiteLogsList([
      { date: '13 Jul 2026', log: newLogText },
      ...siteLogsList,
    ]);
    setNewLogText('');
  };

  const handleAddNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNoteText) return;
    setSiteNotesList([
      `Site Engineer Note: ${newNoteText}`,
      ...siteNotesList,
    ]);
    setNewNoteText('');
  };

  // Quick actions simulation
  const triggerQuickAction = (action: string) => {
    alert(`Construction Operations Trigger: Action [${action}] executed successfully.`);
  };

  return (
    <div className="space-y-6 text-left">
      
      {/* 360° WORKSPACE OR MAIN LIST VIEW */}
      {activeSite ? (
        /* ================= 360° CONSTRUCTION SITE WORKSPACE ================= */
        <div className="space-y-6">
          {/* Header back navigation */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSelectedSiteId(null)}
              className="rounded-xl border border-brand-200 hover:bg-brand-50 p-2 text-brand-800 dark:bg-brand-900 dark:border-brand-850 dark:text-white"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <div>
              <h2 className="text-xl font-bold font-serif text-brand-900 dark:text-white">Construction Operations Workspace</h2>
              <p className="text-xs text-brand-450">Administrative operations center to track daily site logs, checklists, drone photos, and risk factors</p>
            </div>
          </div>

          {/* Construction Site Summary Header */}
          <div className="rounded-3xl border border-brand-200 bg-white p-6 shadow-md dark:border-brand-850 dark:bg-brand-900">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h3 className="text-2xl font-serif font-bold text-brand-900 dark:text-white">{activeSite.projectName} — {activeSite.unitName}</h3>
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-brand-450 mt-1.5 font-semibold">
                  <span>Homeowner: {activeSite.buyerName}</span>
                  <span>•</span>
                  <span>Site Engineer: {activeSite.engineerName}</span>
                  <span>•</span>
                  <span>Activity: {activeSite.currentActivity}</span>
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => triggerQuickAction('Upload Drone Photo')} className="rounded-xl bg-brand-700 hover:bg-brand-800 text-white px-4 py-2 text-xs font-semibold shadow-sm transition-colors">
                  Upload Photos
                </button>
                <button onClick={() => triggerQuickAction('Create Quality Checklist')} className="rounded-xl bg-brand-100 hover:bg-brand-200 dark:bg-brand-800 dark:text-white px-4 py-2 text-xs font-semibold transition-colors">
                  Log Inspection
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 md:grid-cols-5 mt-6 pt-6 border-t border-brand-100 dark:border-brand-850 text-xs font-semibold text-brand-500">
              <div>
                <span>Site Progress</span>
                <div className="flex items-center gap-2 mt-1">
                  <span className="font-bold text-brand-900 dark:text-white">{activeSite.progressPercent}%</span>
                  <div className="flex-1 h-1.5 bg-brand-100 rounded-full overflow-hidden">
                    <div className="h-1.5 bg-brand-700 rounded-full" style={{ width: `${activeSite.progressPercent}%` }} />
                  </div>
                </div>
              </div>
              <div>
                <span>Inspection Status</span>
                <div className="mt-1">
                  <StatusBadge label={activeSite.inspectionStatus} type={activeSite.inspectionStatus === 'Passed' ? 'success' : 'warning'} />
                </div>
              </div>
              <div>
                <span>Risk Index Level</span>
                <div className="mt-1">
                  <StatusBadge label={activeSite.riskLevel} type={activeSite.riskLevel === 'Low' ? 'success' : 'warning'} />
                </div>
              </div>
              <div>
                <span>Scheduled Activity</span>
                <p className="text-sm font-bold text-brand-900 dark:text-white mt-1">Conduits groove cutting</p>
              </div>
              <div>
                <span>Last Site Check</span>
                <p className="text-sm font-bold text-brand-900 dark:text-white mt-1">{activeSite.lastUpdate}</p>
              </div>
            </div>
          </div>

          {/* Workspace Tabs layout */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            
            {/* Left side menu tabs */}
            <div className="space-y-6">
              <Card title="Workspace Tabs" subtitle="Site filter categories">
                <div className="flex flex-col gap-1 text-xs font-bold text-left">
                  {([
                    { id: 'overview', label: 'Overview Statistics' },
                    { id: 'logs', label: 'Daily Site Logs' },
                    { id: 'photos', label: 'Progress Photos' },
                    { id: 'videos', label: 'Video uploads' },
                    { id: 'inspections', label: 'Quality Inspections' },
                    { id: 'materials', label: 'Material Tracking' },
                    { id: 'notes', label: 'Engineer Notes' },
                    { id: 'risks', label: 'Issues & Risks' },
                    { id: 'timeline', label: 'Milestone Timeline' },
                    { id: 'documents', label: 'Documents & drawings' },
                  ] as const).map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setWorkspaceTab(tab.id)}
                      className={`w-full rounded-xl px-4 py-2.5 text-left transition-all ${
                        workspaceTab === tab.id
                          ? 'bg-brand-700 text-white'
                          : 'bg-white hover:bg-brand-50 text-brand-750 dark:bg-brand-900 dark:text-brand-300 dark:hover:bg-brand-850'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              </Card>

              {/* CRM Actions */}
              <Card title="CRM Operations Actions" subtitle="Civil construction tasks">
                <div className="grid grid-cols-2 gap-2 text-center text-[10px] font-bold">
                  <button onClick={() => triggerQuickAction('Log construction delay')} className="p-3 rounded-xl border border-brand-200 hover:border-brand-400 bg-white dark:bg-brand-900 dark:border-brand-800 transition-all">
                    Log Delay
                  </button>
                  <button onClick={() => triggerQuickAction('Assign project Site Engineer')} className="p-3 rounded-xl border border-brand-200 hover:border-brand-400 bg-white dark:bg-brand-900 dark:border-brand-800 transition-all">
                    Assign Engineer
                  </button>
                  <button onClick={() => triggerQuickAction('Generate Progress Sheet')} className="p-3 rounded-xl border border-brand-200 hover:border-brand-400 bg-white dark:bg-brand-900 dark:border-brand-800 transition-all">
                    Progress Sheet
                  </button>
                  <button onClick={() => triggerQuickAction('Notify CRM coordinates')} className="p-3 rounded-xl border border-brand-200 hover:border-brand-400 bg-white dark:bg-brand-900 dark:border-brand-800 transition-all">
                    Notify CRM
                  </button>
                </div>
              </Card>
            </div>

            {/* Central Workspace Context */}
            <div className="lg:col-span-2 space-y-6">
              
              {/* TAB 1: Overview */}
              {workspaceTab === 'overview' && (
                <Card title="Overview Statistics" subtitle="General construction scope outline">
                  <div className="space-y-4 pt-2 text-xs">
                    <div>
                      <span className="text-[10px] text-brand-400 font-bold uppercase tracking-wider block">Scope Description</span>
                      <p className="font-semibold text-brand-900 mt-1 dark:text-white leading-relaxed">
                        Excavation and foundation work executed. Clay masonry walls on ground floor completed. Currently structural lintel casting and electrical grooving is ongoing.
                      </p>
                    </div>
                    <div className="grid grid-cols-2 gap-4 pt-3 border-t border-brand-100 dark:border-brand-850">
                      <div>
                        <span className="text-[10px] text-brand-400 font-bold uppercase tracking-wider block">Active Labor Team</span>
                        <p className="font-semibold text-brand-900 mt-1 dark:text-white">12 Skilled masons, 4 operators</p>
                      </div>
                      <div>
                        <span className="text-[10px] text-brand-400 font-bold uppercase tracking-wider block">Last Inspection Check</span>
                        <p className="font-semibold text-brand-900 mt-1 dark:text-white">Passed on 10 Jul 2026</p>
                      </div>
                    </div>
                  </div>
                </Card>
              )}

              {/* TAB 2: Daily Site Logs */}
              {workspaceTab === 'logs' && (
                <Card title="Daily Site Logs" subtitle="Daily operations journal entries">
                  <div className="space-y-4 pt-2">
                    <form onSubmit={handleAddSiteLog} className="space-y-2.5">
                      <input
                        type="text"
                        placeholder="Log daily site activity progress..."
                        value={newLogText}
                        onChange={(e) => setNewLogText(e.target.value)}
                        className="w-full rounded-xl border border-brand-200 bg-white px-3 py-2 text-xs outline-none dark:border-brand-800 dark:bg-brand-950/20"
                      />
                      <button type="submit" className="rounded-lg bg-brand-700 hover:bg-brand-800 text-white px-3 py-1.5 text-[10px] font-bold">
                        Add Log Entry
                      </button>
                    </form>

                    <div className="space-y-3 mt-4">
                      {siteLogsList.map((logItem, idx) => (
                        <div key={idx} className="p-3.5 rounded-2xl bg-brand-50/20 border border-brand-100 text-xs font-semibold space-y-1">
                          <span className="text-[10px] text-brand-400 block font-mono">{logItem.date}</span>
                          <p className="text-brand-900 dark:text-white leading-relaxed">{logItem.log}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </Card>
              )}

              {/* TAB 3: Progress Photos */}
              {workspaceTab === 'photos' && (
                <Card title="Progress Photos" subtitle="Drone uploads and site camera logs">
                  <div className="grid grid-cols-2 gap-4 pt-2">
                    {activeSite.photos.map((ph, idx) => (
                      <div key={idx} className="rounded-2xl overflow-hidden border border-brand-100 relative group">
                        <img src={ph} alt="Progress check" className="h-32 w-full object-cover" />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all">
                          <button onClick={() => triggerQuickAction('Zoom Photo')} className="text-white text-xs font-bold bg-brand-700 px-3 py-1.5 rounded-xl">
                            Zoom Fullscreen
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              )}

              {/* TAB 4: Video Uploads */}
              {workspaceTab === 'videos' && (
                <Card title="Video Uploads" subtitle="Interactive engineer video briefings">
                  <div className="space-y-3 pt-2">
                    {activeSite.videos.map((vid, idx) => (
                      <div key={idx} className="p-3 rounded-2xl bg-brand-50/20 border border-brand-100 flex items-center justify-between text-xs font-semibold">
                        <div className="flex items-center gap-2.5">
                          <Video className="h-4.5 w-4.5 text-brand-600" />
                          <span>{vid}</span>
                        </div>
                        <button onClick={() => triggerQuickAction('Play Video clip')} className="rounded-lg bg-brand-700 hover:bg-brand-800 text-white px-2.5 py-1 text-[9px] font-bold">
                          Play Clip
                        </button>
                      </div>
                    ))}
                  </div>
                </Card>
              )}

              {/* TAB 5: Quality Inspections */}
              {workspaceTab === 'inspections' && (
                <Card title="Quality Inspection Checklists" subtitle="Civil quality checklist items passes and failures">
                  <div className="space-y-4 pt-2">
                    <div className="space-y-3 p-4 rounded-2xl bg-brand-50/20 border border-brand-100">
                      <h4 className="text-xs font-bold text-brand-900">Add checklist inspection item</h4>
                      <input
                        type="text"
                        placeholder="e.g. Concrete slump test verification"
                        value={newInspectName}
                        onChange={(e) => setNewInspectName(e.target.value)}
                        className="w-full rounded-xl border border-brand-200 bg-white px-3 py-1.5 text-xs outline-none"
                      />
                      <input
                        type="text"
                        placeholder="Evaluation remarks..."
                        value={newInspectRemarks}
                        onChange={(e) => setNewInspectRemarks(e.target.value)}
                        className="w-full rounded-xl border border-brand-200 bg-white px-3 py-1.5 text-xs outline-none"
                      />
                      <div className="flex gap-2">
                        <button type="button" onClick={() => handleAddInspection('Passed')} className="rounded-lg bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 text-[10px] font-bold">
                          Inspect & Pass
                        </button>
                        <button type="button" onClick={() => handleAddInspection('Failed')} className="rounded-lg bg-red-650 hover:bg-red-700 text-white px-3 py-1.5 text-[10px] font-bold">
                          Inspect & Fail
                        </button>
                      </div>
                    </div>

                    <div className="space-y-3 mt-4">
                      {inspectionsList.map((ins, idx) => (
                        <div key={idx} className="p-3.5 rounded-2xl bg-white border border-brand-100 flex items-center justify-between text-xs font-semibold shadow-sm">
                          <div>
                            <span className="font-bold text-brand-900 block">{ins.name}</span>
                            <p className="text-[10px] text-brand-450 italic mt-0.5">Remarks: "{ins.remarks}"</p>
                          </div>
                          <span className={`rounded px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider ${
                            ins.status === 'Passed' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-750'
                          }`}>
                            {ins.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </Card>
              )}

              {/* TAB 6: Material Tracking */}
              {workspaceTab === 'materials' && (
                <Card title="Material Supply Tracking" subtitle="Logistics status of site building supplies">
                  <div className="space-y-3 pt-2">
                    {materialsList.map((mat, idx) => (
                      <div key={idx} className="p-3.5 rounded-2xl bg-white border border-brand-100 flex items-center justify-between text-xs font-semibold shadow-sm">
                        <div className="flex items-center gap-2.5">
                          <Truck className="h-4.5 w-4.5 text-brand-500" />
                          <div>
                            <h4 className="font-bold text-brand-900">{mat.name}</h4>
                            <span className="text-[9px] text-brand-400 block mt-0.5">Required supply amount: {mat.required}</span>
                          </div>
                        </div>
                        <StatusBadge label={mat.status} type={mat.status === 'Arrived' ? 'success' : mat.status === 'Delayed' ? 'warning' : 'neutral'} />
                      </div>
                    ))}
                  </div>
                </Card>
              )}

              {/* TAB 7: Engineer Notes */}
              {workspaceTab === 'notes' && (
                <Card title="Site Engineer Notes" subtitle="Technical instructions logged by supervising site PM">
                  <div className="space-y-4 pt-2">
                    <form onSubmit={handleAddNote} className="space-y-2.5">
                      <input
                        type="text"
                        placeholder="Log new engineer site notes..."
                        value={newNoteText}
                        onChange={(e) => setNewNoteText(e.target.value)}
                        className="w-full rounded-xl border border-brand-200 bg-white px-3 py-2 text-xs outline-none dark:border-brand-800 dark:bg-brand-950/20"
                      />
                      <button type="submit" className="rounded-lg bg-brand-700 hover:bg-brand-800 text-white px-3 py-1.5 text-[10px] font-bold">
                        Add Note
                      </button>
                    </form>

                    <div className="space-y-3 mt-4">
                      {siteNotesList.map((note, idx) => (
                        <div key={idx} className="p-4 rounded-2xl bg-amber-50/20 border border-amber-200 text-xs font-semibold text-brand-800 flex items-start gap-2.5">
                          <BookOpen className="h-4.5 w-4.5 text-amber-600 shrink-0 mt-0.5" />
                          <p className="leading-relaxed">{note}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </Card>
              )}

              {/* TAB 8: Issues & Risks */}
              {workspaceTab === 'risks' && (
                <Card title="Construction Site Risks" subtitle="Delays escalations and weather impact logs">
                  <div className="space-y-3 pt-2">
                    {risksList.map((risk, idx) => (
                      <div key={idx} className="p-4 rounded-2xl bg-red-50/20 border border-red-200 flex items-start gap-3 text-xs font-semibold">
                        <AlertTriangle className="h-5 w-5 text-red-650 shrink-0 mt-0.5" />
                        <div>
                          <h5 className="font-bold text-red-900">Category: {risk.category}</h5>
                          <p className="text-[10px] text-red-750 mt-1">{risk.description}</p>
                          <span className="text-[9px] bg-red-100 text-red-700 px-2 py-0.5 rounded font-bold mt-1.5 inline-block">Impact Index: {risk.impact}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              )}

              {/* TAB 9: Milestone Timeline */}
              {workspaceTab === 'timeline' && (
                <Card title="Milestone Timeline" subtitle="Development checklist dates">
                  <div className="relative pl-6 ml-2 border-l border-brand-200 dark:border-brand-850 space-y-6 py-2 text-xs">
                    {activeSite.timeline.map((step, idx) => (
                      <div key={idx} className="relative pl-6">
                        <div className={`absolute left-[-31px] top-1.5 h-4.5 w-4.5 rounded-full border-2 border-white flex items-center justify-center ${
                          step.status === 'Completed' ? 'bg-green-600' : step.status === 'Current' ? 'bg-yellow-500' : 'bg-brand-100'
                        }`} />
                        <div className="flex items-baseline justify-between gap-4 font-semibold">
                          <span className="text-brand-900 dark:text-white">{step.name}</span>
                          <span className="text-[9px] text-brand-400 font-mono">{step.date}</span>
                        </div>
                        <p className="text-[10px] text-brand-450 mt-1">Status: {step.status}</p>
                      </div>
                    ))}
                  </div>
                </Card>
              )}

              {/* TAB 10: Documents */}
              {workspaceTab === 'documents' && (
                <Card title="NOC Drawings & Documents" subtitle="Government approvals file archives">
                  <div className="space-y-3 pt-2">
                    {activeSite.documents.map((doc, idx) => (
                      <div key={idx} className="p-3 rounded-2xl bg-white border border-brand-100 flex items-center justify-between text-xs font-semibold">
                        <div className="flex items-center gap-2.5">
                          <FileText className="h-4.5 w-4.5 text-brand-500" />
                          <div>
                            <h4 className="font-bold text-brand-900">{doc.name}</h4>
                            <span className="text-[9px] text-brand-400 block mt-0.5">Type: {doc.type} | Created: {doc.date}</span>
                          </div>
                        </div>
                        <button onClick={() => triggerQuickAction('Download Document')} className="text-brand-500 hover:text-brand-850">
                          <Download className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </Card>
              )}

            </div>

            {/* Right sidebar: Upload Center */}
            <div className="space-y-6">
              <Card title="Engineer Upload Center" subtitle="Direct media logs uploads portal">
                <div className="space-y-4 pt-2 text-xs font-bold text-center">
                  <div className="p-6 rounded-2xl border-2 border-dashed border-brand-200 hover:border-brand-400 bg-brand-50/20 flex flex-col items-center justify-center gap-2 cursor-pointer" onClick={() => triggerQuickAction('Upload Progress Media')}>
                    <Camera className="h-8 w-8 text-brand-400" />
                    <span>Upload progress photos</span>
                    <span className="text-[9px] text-brand-400 font-medium">JPEG, PNG up to 20MB</span>
                  </div>

                  <div className="p-6 rounded-2xl border-2 border-dashed border-brand-200 hover:border-brand-400 bg-brand-50/20 flex flex-col items-center justify-center gap-2 cursor-pointer" onClick={() => triggerQuickAction('Upload Drone Video')}>
                    <Video className="h-8 w-8 text-brand-400" />
                    <span>Upload drone videos</span>
                    <span className="text-[9px] text-brand-400 font-medium">MP4 clips up to 100MB</span>
                  </div>

                  <div className="p-6 rounded-2xl border-2 border-dashed border-brand-200 hover:border-brand-400 bg-brand-50/20 flex flex-col items-center justify-center gap-2 cursor-pointer" onClick={() => triggerQuickAction('Upload PDF inspection Report')}>
                    <FileText className="h-8 w-8 text-brand-400" />
                    <span>Upload PDF inspection reports</span>
                    <span className="text-[9px] text-brand-400 font-medium">Clearance certificates NOCs</span>
                  </div>
                </div>
              </Card>
            </div>

          </div>
        </div>
      ) : (
        /* ================= MAIN CONSTRUCTION MODULE LIST VIEW ================= */
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between text-left">
            <div>
              <h1 className="font-serif text-3xl font-semibold text-brand-900 dark:text-white">
                Construction Operations Center
              </h1>
              <p className="text-sm font-medium text-brand-500 dark:text-brand-400 mt-1">
                Real-time supervisor checklists, drone photo galleries, and engineering milestones.
              </p>
            </div>
          </div>

          {/* 1. KPI Dashboard */}
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-6">
            <StatCard
              title="Active Sites"
              value="3"
              icon={Activity}
              badge={<StatusBadge label="Curing Phase" type="info" />}
            />
            <StatCard
              title="Delayed Activities"
              value="1"
              icon={AlertTriangle}
              badge={<StatusBadge label="High Risk" type="warning" />}
            />
            <StatCard
              title="Quality Inspections"
              value="4"
              icon={CheckCircle}
              badge={<StatusBadge label="Check Complete" type="success" />}
            />
            <StatCard
              title="Engineer Visits"
              value="8"
              icon={Users}
              badge={<StatusBadge label="This Month" type="info" />}
            />
            <StatCard
              title="Upcoming Milestones"
              value="2"
              icon={Calendar}
              badge={<StatusBadge label="SLA Target" type="success" />}
            />
            <StatCard
              title="Critical Risks"
              value="0"
              icon={ShieldAlert}
              badge={<StatusBadge label="On Track" type="success" />}
            />
          </div>

          {/* 2 & 3. Search and Advanced Filters */}
          <Card title="Filter & Search Construction Sites" subtitle="Advanced filter parameters to query supervisor logs">
            <div className="space-y-4 mt-2">
              {/* Global search */}
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-brand-400" />
                <input
                  type="text"
                  placeholder="Search project name, villa plot, supervisor engineer, or buyer name..."
                  value={globalSearch}
                  onChange={(e) => setGlobalSearch(e.target.value)}
                  className="w-full rounded-xl border border-brand-200 bg-brand-50/20 pl-9 pr-4 py-2.5 text-xs outline-none focus:ring-2 focus:ring-brand-500/25 dark:border-brand-850 dark:bg-brand-950/20 dark:text-white"
                />
              </div>

              {/* Advanced filter panels */}
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-5 text-[10px] font-bold">
                
                {/* Project Filter */}
                <div>
                  <label className="block text-[8px] uppercase tracking-wider text-brand-400 mb-1 font-mono">Project</label>
                  <select
                    value={filterProject}
                    onChange={(e) => setFilterProject(e.target.value)}
                    className="w-full rounded-xl border border-brand-200 bg-brand-50/20 px-2 py-2 text-[10px] outline-none dark:border-brand-850 dark:bg-brand-900"
                  >
                    <option value="all">All Projects</option>
                    <option value="GoodEarth Malhar">GoodEarth Malhar</option>
                    <option value="GoodEarth Orchard">GoodEarth Orchard</option>
                    <option value="GoodEarth Footprints">GoodEarth Footprints</option>
                  </select>
                </div>

                {/* Stage Filter */}
                <div>
                  <label className="block text-[8px] uppercase tracking-wider text-brand-400 mb-1 font-mono">Stage</label>
                  <select
                    value={filterStage}
                    onChange={(e) => setFilterStage(e.target.value)}
                    className="w-full rounded-xl border border-brand-200 bg-brand-50/20 px-2 py-2 text-[10px] outline-none dark:border-brand-850 dark:bg-brand-900"
                  >
                    <option value="all">All Stages</option>
                    <option value="active">Under Active Build</option>
                  </select>
                </div>

                {/* Engineer Filter */}
                <div>
                  <label className="block text-[8px] uppercase tracking-wider text-brand-400 mb-1 font-mono">Engineer</label>
                  <select
                    value={filterEngineer}
                    onChange={(e) => setFilterEngineer(e.target.value)}
                    className="w-full rounded-xl border border-brand-200 bg-brand-50/20 px-2 py-2 text-[10px] outline-none dark:border-brand-850 dark:bg-brand-900"
                  >
                    <option value="all">All Engineers</option>
                    <option value="Prasad Hegde">Prasad Hegde</option>
                    <option value="Ankit Roy">Ankit Roy</option>
                    <option value="Suresh Gowda">Suresh Gowda</option>
                  </select>
                </div>

                {/* Inspection Status */}
                <div>
                  <label className="block text-[8px] uppercase tracking-wider text-brand-400 mb-1 font-mono">Inspection Status</label>
                  <select
                    value={filterInspection}
                    onChange={(e) => setFilterInspection(e.target.value)}
                    className="w-full rounded-xl border border-brand-200 bg-brand-50/20 px-2 py-2 text-[10px] outline-none dark:border-brand-850 dark:bg-brand-900"
                  >
                    <option value="all">All Inspections</option>
                    <option value="Passed">Passed Checklists</option>
                    <option value="Pending Review">Pending Reviews</option>
                  </select>
                </div>

                {/* Risk Level */}
                <div>
                  <label className="block text-[8px] uppercase tracking-wider text-brand-400 mb-1 font-mono">Risk Level</label>
                  <select
                    value={filterRisk}
                    onChange={(e) => setFilterRisk(e.target.value)}
                    className="w-full rounded-xl border border-brand-200 bg-brand-50/20 px-2 py-2 text-[10px] outline-none dark:border-brand-850 dark:bg-brand-900"
                  >
                    <option value="all">All Risks</option>
                    <option value="Low">Low Risk</option>
                    <option value="Medium">Medium Risk</option>
                    <option value="High">High Risk</option>
                  </select>
                </div>

              </div>
            </div>
          </Card>

          {/* 4. Construction Table */}
          <Card title="Construction Sites Directory" subtitle="Master list of registered villa building projects">
            {isLoading ? (
              <div className="py-20 text-center text-xs text-brand-550 font-bold uppercase tracking-wider font-mono">
                Querying Construction Sites...
              </div>
            ) : filteredSites.length > 0 ? (
              <div className="overflow-x-auto mt-2">
                <table className="min-w-full divide-y divide-brand-200 dark:divide-brand-850">
                  <thead className="bg-brand-50/50 dark:bg-brand-950/30">
                    <tr className="text-xs font-semibold text-brand-500 uppercase tracking-wider">
                      <th scope="col" className="px-4 py-3 text-left">Project Details</th>
                      <th scope="col" className="px-4 py-3 text-left">Villa plot</th>
                      <th scope="col" className="px-4 py-3 text-left">Current Activity</th>
                      <th scope="col" className="px-4 py-3 text-left">Progress %</th>
                      <th scope="col" className="px-4 py-3 text-left">Engineer</th>
                      <th scope="col" className="px-4 py-3 text-left">Inspection</th>
                      <th scope="col" className="px-4 py-3 text-left">Risk level</th>
                      <th scope="col" className="px-4 py-3 text-left">Last Update</th>
                      <th scope="col" className="px-4 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-brand-900 divide-y divide-brand-100 dark:divide-brand-850/40 text-xs text-brand-800 dark:text-brand-200 font-semibold">
                    {filteredSites.map((site) => (
                      <tr key={site.id} className="hover:bg-brand-50/30 dark:hover:bg-brand-950/10">
                        <td className="px-4 py-3 text-left font-bold text-brand-900 dark:text-white">{site.projectName}</td>
                        <td className="px-4 py-3 text-left">
                          <div className="font-bold">{site.unitName}</div>
                          <div className="text-[10px] text-brand-450 mt-0.5">Buyer: {site.buyerName}</div>
                        </td>
                        <td className="px-4 py-3 text-left truncate max-w-[150px]">{site.currentActivity}</td>
                        <td className="px-4 py-3 text-left">
                          <div className="flex items-center gap-2 max-w-[125px]">
                            <span className="font-bold shrink-0">{site.progressPercent}%</span>
                            <div className="flex-1 h-1 bg-brand-100 rounded-full overflow-hidden">
                              <div className="h-1 bg-brand-700 rounded-full" style={{ width: `${site.progressPercent}%` }} />
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-left">{site.engineerName}</td>
                        <td className="px-4 py-3 text-left">
                          <StatusBadge label={site.inspectionStatus} type={site.inspectionStatus === 'Passed' ? 'success' : 'warning'} />
                        </td>
                        <td className="px-4 py-3 text-left">
                          <StatusBadge label={site.riskLevel} type={site.riskLevel === 'Low' ? 'success' : 'warning'} />
                        </td>
                        <td className="px-4 py-3 text-left">{site.lastUpdate}</td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex justify-end gap-1.5">
                            <button
                              onClick={() => {
                                setSelectedSiteId(site.id);
                                setWorkspaceTab('overview');
                              }}
                              className="rounded-lg p-1.5 text-brand-500 hover:bg-brand-50 hover:text-brand-900"
                              title="Construction 360 Workspace"
                            >
                              <Eye className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <EmptyState
                title="No construction sites matching filters"
                description="Adjust search tags or filter choices to query operations."
                icon={FolderOpen}
              />
            )}
          </Card>
        </div>
      )}

    </div>
  );
};

export default StagesPage;
