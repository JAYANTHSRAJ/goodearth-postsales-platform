import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Sparkles,
  MapPin,
  CheckCircle,
  XCircle,
  Clock,
  DollarSign,
  ZoomIn,
  ZoomOut,
  Maximize,
  Minimize,
  RefreshCw,
  Info,
  Calendar,
} from 'lucide-react';
import { Card } from '../../../components/ui/Card';
import { StatCard } from '../../../components/ui/StatCard';
import { StatusBadge } from '../../../components/ui/StatusBadge';
import { EmptyState } from '../../../components/ui/EmptyState';
import { clientService } from '../../../services/client.service';
import { changeRequestService } from '../../../services/changeRequest.service';
import { useAuthStore } from '../../../store/authStore';

interface Pin {
  id: string;
  x: number;
  y: number;
  label: string;
  comments: string[];
  submittedDate: string;
  status: 'Approved' | 'Pending Review' | 'Rejected' | 'Completed';
  estimatedCost: number;
  approvalTimeSLA: string;
}

export const DesignStudioPage: React.FC = () => {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  
  // Interactive Viewport States
  const [selectedPlan, setSelectedPlan] = useState<'ground' | 'first'>('ground');
  const [zoom, setZoom] = useState<number>(1);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [hoveredRoom, setHoveredRoom] = useState<string | null>(null);

  // Layer Toggles
  const [showStructuralLayer, setShowStructuralLayer] = useState(true);
  const [showElectricalLayer, setShowElectricalLayer] = useState(true);
  const [showPlumbingLayer, setShowPlumbingLayer] = useState(true);

  // Selection states
  const [activePinId, setActivePinId] = useState<string | null>(null);
  const [newComment, setNewComment] = useState('');

  const [pins, setPins] = useState<Pin[]>([
    {
      id: 'pin-1',
      x: 35,
      y: 45,
      label: 'Relocate dining area socket 2 feet right',
      comments: ['Assigned to electrical engineer for layout validation.'],
      submittedDate: '10 Jun 2026',
      status: 'Pending Review',
      estimatedCost: 1500,
      approvalTimeSLA: '2 Days remaining',
    },
    {
      id: 'pin-2',
      x: 65,
      y: 25,
      label: 'Upgrade kitchen counter to Italian marble finish',
      comments: ['Quotation generated and verified by civil engineer.'],
      submittedDate: '08 Jun 2026',
      status: 'Approved',
      estimatedCost: 45000,
      approvalTimeSLA: 'Approved',
    },
  ]);
  
  const [newPinLabel, setNewPinLabel] = useState('');
  const [tempCoords, setTempCoords] = useState<{ x: number; y: number } | null>(null);

  // Form states for creating a change request
  const [priority, setPriority] = useState('MEDIUM');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Queries
  const { data: dashboard } = useQuery({
    queryKey: ['clientDashboard'],
    queryFn: () => clientService.getDashboard(),
  });

  const { data: floorPlans } = useQuery({
    queryKey: ['clientFloorPlans'],
    queryFn: () => clientService.getFloorPlans(),
  });

  const createCRMutation = useMutation({
    mutationFn: (data: {
      workflowId: string;
      documentId: string;
      annotationId: string;
      requestedBy: string;
      priority: string;
      remarks: string;
    }) => changeRequestService.createRequest(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['changeRequests'] });
      setNewPinLabel('');
      setTempCoords(null);
      setSuccessMsg('Your customization request has been submitted successfully.');
      setTimeout(() => setSuccessMsg(null), 5000);
    },
    onError: (err: any) => {
      setErrorMsg(err.message || 'Error submitting request');
      setTimeout(() => setErrorMsg(null), 5000);
    },
  });

  const handleBlueprintClick = (e: React.MouseEvent<HTMLDivElement>) => {
    // Avoid double triggering if clicking active elements
    if ((e.target as HTMLElement).closest('.pin-element')) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const x = Math.round(((e.clientX - rect.left) / rect.width) * 100);
    const y = Math.round(((e.clientY - rect.top) / rect.height) * 100);
    setTempCoords({ x, y });
    setActivePinId(null); // Unselect active pin
  };

  const handleAddPin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tempCoords || !newPinLabel.trim()) return;

    const newPin: Pin = {
      id: 'pin-' + Math.random().toString(36).substring(7),
      x: tempCoords.x,
      y: tempCoords.y,
      label: newPinLabel,
      comments: ['Customization request received by Care Team.'],
      submittedDate: new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
      status: 'Pending Review',
      estimatedCost: priority === 'HIGH' ? 12000 : priority === 'MEDIUM' ? 3500 : 1000,
      approvalTimeSLA: '3 Days SLA',
    };
    
    setPins([...pins, newPin]);

    // Dispatch mutation if dashboard workflow exists
    if (dashboard && dashboard.workflow) {
      const activeWorkflowId = dashboard.workflow.id;
      const latestDocId = floorPlans?.latestDrawing?.id || 'doc_placeholder_uuid';

      createCRMutation.mutate({
        workflowId: activeWorkflowId,
        documentId: latestDocId,
        annotationId: 'ann_' + newPin.id,
        requestedBy: user?.name || 'Homeowner Client',
        priority,
        remarks: `[Design Request] ${newPinLabel}`,
      } as any);
    } else {
      setNewPinLabel('');
      setTempCoords(null);
      setSuccessMsg('Your customization request has been submitted successfully.');
      setTimeout(() => setSuccessMsg(null), 5000);
    }
  };

  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !activePinId) return;

    setPins(
      pins.map((p) => {
        if (p.id === activePinId) {
          return {
            ...p,
            comments: [...p.comments, newComment],
          };
        }
        return p;
      })
    );
    setNewComment('');
  };

  // Status mapping
  const mapStatusType = (status: string) => {
    const s = status.toUpperCase();
    if (s.includes('APPROVE') || s === 'APPROVED') return 'success';
    if (s.includes('REJECT') || s.includes('DECLINE') || s === 'REJECTED') return 'warning';
    if (s.includes('COMPLET') || s === 'COMPLETED') return 'success';
    return 'info'; // Pending Review
  };

  const getStatusLabel = (status: string) => {
    const s = status.toUpperCase();
    if (s.includes('APPROVE') || s === 'APPROVED') return 'Approved';
    if (s.includes('REJECT') || s.includes('DECLINE') || s === 'REJECTED') return 'Rejected';
    if (s.includes('COMPLET') || s === 'COMPLETED') return 'Completed';
    return 'Pending Review';
  };

  // Cost estimates aggregates
  const totalEstimates = pins.reduce((acc, p) => acc + p.estimatedCost, 0);
  const activePin = pins.find((p) => p.id === activePinId);

  // Realistic layout rooms dimensions
  const rooms = [
    { id: 'living', name: 'Living & Dining Room', style: { top: '5%', left: '5%', width: '45%', height: '50%' } },
    { id: 'kitchen', name: 'Modular Kitchen', style: { top: '5%', left: '55%', width: '40%', height: '30%' } },
    { id: 'master', name: 'Master Suite', style: { top: '60%', left: '5%', width: '50%', height: '35%' } },
    { id: 'guest', name: 'Guest Bedroom', style: { top: '40%', left: '60%', width: '35%', height: '35%' } },
    { id: 'deck', name: 'Eco Balcony Deck', style: { top: '80%', left: '60%', width: '35%', height: '15%' } },
  ];

  return (
    <div className={`space-y-6 ${isFullscreen ? 'fixed inset-0 z-50 bg-white dark:bg-brand-950 p-6 overflow-y-auto' : ''}`}>
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between text-left">
        <div>
          <h1 className="font-serif text-3xl font-semibold text-brand-900 dark:text-white flex items-center gap-2">
            Design Studio
            {isFullscreen && (
              <span className="text-xs uppercase font-mono font-bold text-accent-700 bg-accent-600/10 px-2 py-0.5 rounded">
                Fullscreen Canvas
              </span>
            )}
          </h1>
          <p className="text-sm font-medium text-brand-500 dark:text-brand-400 mt-1">
            Review your home's drawings and submit customization requests.
          </p>
        </div>
        {isFullscreen && (
          <button
            onClick={() => setIsFullscreen(false)}
            className="flex items-center gap-1.5 rounded-xl bg-brand-100 dark:bg-brand-850 hover:bg-brand-200 text-brand-800 dark:text-white px-3.5 py-2 text-xs font-semibold shadow-sm transition-colors"
          >
            <Minimize className="h-4 w-4" />
            Exit Fullscreen
          </button>
        )}
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-4">
        <StatCard
          title="Upgrade Estimate"
          value={`₹${totalEstimates.toLocaleString('en-IN')}`}
          icon={DollarSign}
          badge={<StatusBadge label="Running Cost" type="info" />}
        />
        <StatCard
          title="Approved Changes"
          value={String(pins.filter((p) => p.status === 'Approved' || p.status === 'Completed').length)}
          icon={CheckCircle}
          badge={<StatusBadge label="Locked In" type="success" />}
        />
        <StatCard
          title="Pending Requests"
          value={String(pins.filter((p) => p.status === 'Pending Review').length)}
          icon={Clock}
          badge={<StatusBadge label="In Review" type="warning" />}
        />
        <StatCard
          title="Rejected Options"
          value={String(pins.filter((p) => p.status === 'Rejected').length)}
          icon={XCircle}
          badge={<StatusBadge label="Audit Failed" type="warning" />}
        />
      </div>

      {/* Main Studio split view */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 text-left">
        {/* Left Interactive Blueprint View */}
        <div className="lg:col-span-2 space-y-6">
          <Card title="Interactive Villa Drawing Canvas" subtitle="Hover to inspect rooms. Click on the drawing layout to place a design request pin.">
            {/* Viewport Control Bar */}
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-brand-100 dark:border-brand-850 pb-3 mb-4">
              <div className="flex gap-2">
                <button
                  onClick={() => setSelectedPlan('ground')}
                  className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                    selectedPlan === 'ground'
                      ? 'bg-brand-700 text-white'
                      : 'bg-brand-55 text-brand-700 dark:bg-brand-800 dark:text-brand-300'
                  }`}
                >
                  Ground Floor
                </button>
                <button
                  onClick={() => setSelectedPlan('first')}
                  className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                    selectedPlan === 'first'
                      ? 'bg-brand-700 text-white'
                      : 'bg-brand-55 text-brand-700 dark:bg-brand-800 dark:text-brand-300'
                  }`}
                >
                  First Floor
                </button>
              </div>

              {/* Interactive Viewport Action Toolbar */}
              <div className="flex items-center gap-3 text-xs font-semibold text-brand-650 dark:text-brand-350">
                <div className="flex items-center gap-1 bg-brand-50/50 dark:bg-brand-850 border border-brand-200 dark:border-brand-800 rounded-xl p-1 shadow-sm">
                  <button
                    onClick={() => setZoom(Math.min(zoom + 0.25, 2.5))}
                    className="p-1.5 hover:bg-brand-100 rounded-lg hover:text-brand-900 transition-colors"
                    title="Zoom In"
                  >
                    <ZoomIn className="h-4 w-4" />
                  </button>
                  <span className="font-mono px-1.5 min-w-[45px] text-center">{Math.round(zoom * 100)}%</span>
                  <button
                    onClick={() => setZoom(Math.max(zoom - 0.25, 0.75))}
                    className="p-1.5 hover:bg-brand-100 rounded-lg hover:text-brand-900 transition-colors"
                    title="Zoom Out"
                  >
                    <ZoomOut className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => { setZoom(1); setPan({ x: 0, y: 0 }); }}
                    className="p-1.5 hover:bg-brand-100 rounded-lg hover:text-brand-900 transition-colors border-l border-brand-200 pl-2 ml-1"
                    title="Fit to Screen"
                  >
                    <RefreshCw className="h-3.5 w-3.5" />
                  </button>
                </div>

                <button
                  onClick={() => setIsFullscreen(!isFullscreen)}
                  className="flex items-center gap-1.5 rounded-xl border border-brand-200 dark:border-brand-850 hover:bg-brand-50 px-3 py-2 transition-all shadow-sm bg-white dark:bg-brand-900"
                >
                  <Maximize className="h-3.5 w-3.5" />
                  Fullscreen
                </button>

                <div className="hidden sm:flex items-center gap-3 ml-2 border-l border-brand-200 dark:border-brand-800 pl-4">
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input type="checkbox" checked={showStructuralLayer} onChange={(e) => setShowStructuralLayer(e.target.checked)} className="rounded accent-brand-700" />
                    <span>Structural</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input type="checkbox" checked={showElectricalLayer} onChange={(e) => setShowElectricalLayer(e.target.checked)} className="rounded accent-brand-700" />
                    <span>Electrical</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input type="checkbox" checked={showPlumbingLayer} onChange={(e) => setShowPlumbingLayer(e.target.checked)} className="rounded accent-brand-700" />
                    <span>Plumbing</span>
                  </label>
                </div>
              </div>
            </div>

            {/* Interactive Drawing container */}
            <div
              onClick={handleBlueprintClick}
              className="relative w-full h-[500px] rounded-2xl bg-brand-50/20 border-2 border-brand-200 flex items-center justify-center cursor-crosshair overflow-hidden dark:bg-brand-950/10 dark:border-brand-850"
            >
              {/* CAD blueprint simulator viewport */}
              <div 
                style={{ transform: `scale(${zoom}) translate(${pan.x}px, ${pan.y}px)` }}
                className="absolute inset-0 transition-transform duration-300 pointer-events-auto"
              >
                {/* CAD Gridlines Backdrop */}
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#f3f4f6_1px,transparent_1px),linear-gradient(to_bottom,#f3f4f6_1px,transparent_1px)] bg-[size:20px_20px] opacity-30 dark:opacity-10 pointer-events-none" />

                {/* SVG Architectural Floor Plan Schematic */}
                <svg className="absolute inset-0 w-full h-full text-brand-300/60 dark:text-brand-800/40 pointer-events-none" viewBox="0 0 800 500" fill="none" stroke="currentColor" strokeWidth="1.5">
                  {/* Outer Walls */}
                  <rect x="20" y="20" width="760" height="460" rx="4" strokeWidth="3" />
                  {/* Inner Partition Walls */}
                  <line x1="420" y1="20" x2="420" y2="250" strokeWidth="2.5" />
                  <line x1="420" y1="250" x2="780" y2="250" strokeWidth="2.5" />
                  <line x1="20" y1="280" x2="350" y2="280" strokeWidth="2.5" />
                  <line x1="350" y1="280" x2="350" y2="480" strokeWidth="2.5" />
                  
                  {/* Doors swing arcs and lines */}
                  {/* Living room entry door swing */}
                  <path d="M 20 150 A 60 60 0 0 1 80 90" strokeDasharray="3,3" />
                  <line x1="20" y1="150" x2="80" y2="150" />
                  {/* Kitchen door swing */}
                  <path d="M 420 100 A 40 40 0 0 0 380 60" strokeDasharray="3,3" />
                  <line x1="420" y1="100" x2="420" y2="60" />
                  {/* Master bedroom door swing */}
                  <path d="M 350 320 A 50 50 0 0 1 400 370" strokeDasharray="3,3" />
                  <line x1="350" y1="320" x2="350" y2="370" />
                  {/* Guest bedroom door swing */}
                  <path d="M 600 250 A 40 40 0 0 1 560 210" strokeDasharray="3,3" />
                  <line x1="600" y1="250" x2="560" y2="250" />

                  {/* Windows */}
                  <rect x="180" y="15" width="80" height="10" fill="white" strokeWidth="1" />
                  <line x1="180" y1="20" x2="260" y2="20" />
                  <rect x="580" y="15" width="80" height="10" fill="white" strokeWidth="1" />
                  <line x1="580" y1="20" x2="660" y2="20" />
                  <rect x="775" y="320" width="10" height="80" fill="white" strokeWidth="1" />
                  <line x1="780" y1="320" x2="780" y2="400" />
                </svg>

                {/* Simulated Rooms layout */}
                {rooms.map((room) => (
                  <div
                    key={room.id}
                    style={room.style}
                    onMouseEnter={() => setHoveredRoom(room.name)}
                    onMouseLeave={() => setHoveredRoom(null)}
                    className={`absolute border border-brand-250 dark:border-brand-800 bg-white/5 flex flex-col justify-between p-3.5 transition-all select-none ${
                      hoveredRoom === room.name 
                        ? 'bg-brand-500/10 dark:bg-brand-500/15 border-brand-500 shadow-md z-10 scale-[1.01]' 
                        : ''
                    }`}
                  >
                    <span className="text-[9px] font-bold text-brand-450 dark:text-brand-400 font-mono tracking-wider">{room.name}</span>
                    
                    {/* Simulated architectural layouts elements: windows and doors */}
                    <div className="flex gap-2">
                      <div className="h-1 w-8 bg-brand-400/50 rounded" title="Window" />
                      <div className="h-4 w-4 border-l-2 border-b-2 border-brand-400/50 rounded-bl-full" title="Swing Door" />
                    </div>
                  </div>
                ))}

                {/* Render Layer Elements */}
                {showStructuralLayer && (
                  <div className="absolute inset-4 border-2 border-brand-450/20 border-double pointer-events-none rounded-xl" />
                )}
                {showElectricalLayer && (
                  <div className="absolute top-1/4 left-1/3 h-2.5 w-2.5 bg-yellow-500 rounded-full animate-pulse pointer-events-none shadow shadow-yellow-500" title="Main distribution box location" />
                )}
                {showPlumbingLayer && (
                  <div className="absolute top-1/2 left-3/4 h-2.5 w-2.5 bg-blue-500 rounded-full animate-pulse pointer-events-none shadow shadow-blue-500" title="Hot water feed inlet line" />
                )}

                {/* Pins Render */}
                {pins.map((pin) => (
                  <div
                    key={pin.id}
                    style={{ left: `${pin.x}%`, top: `${pin.y}%` }}
                    className="absolute transform -translate-x-1/2 -translate-y-1/2 pin-element cursor-pointer group"
                    onClick={(e) => {
                      e.stopPropagation();
                      setActivePinId(pin.id);
                      setTempCoords(null);
                    }}
                  >
                    <div className="relative">
                      {/* Active highlight ring */}
                      {activePinId === pin.id && (
                        <span className="absolute -inset-2 rounded-full bg-accent-500/25 animate-ping" />
                      )}
                      
                      <MapPin className={`h-6.5 w-6.5 filter drop-shadow cursor-pointer transition-all duration-300 ${
                        activePinId === pin.id 
                          ? 'text-accent-600 scale-125 hover:scale-130' 
                          : 'text-brand-800 dark:text-accent-500 hover:scale-120'
                      }`} />
                    </div>
                    <div className="absolute left-1/2 -translate-x-1/2 bottom-8 bg-brand-950 text-white text-[10px] py-1 px-2.5 rounded-lg whitespace-nowrap shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 border border-brand-800">
                      {pin.label}
                    </div>
                  </div>
                ))}

                {/* Temporary/Active Click Coordinates Pin Indicator */}
                {tempCoords && (
                  <div
                    style={{ left: `${tempCoords.x}%`, top: `${tempCoords.y}%` }}
                    className="absolute transform -translate-x-1/2 -translate-y-1/2 pointer-events-none"
                  >
                    <MapPin className="h-6.5 w-6.5 text-accent-500 animate-bounce" />
                  </div>
                )}
              </div>

              {/* Float Room indicator label */}
              {hoveredRoom && (
                <div className="absolute top-4 left-4 bg-brand-900/90 backdrop-blur text-white text-[10px] py-1 px-2.5 rounded-lg border border-brand-800 pointer-events-none z-20 font-bold uppercase tracking-wider font-mono">
                  Room: {hoveredRoom}
                </div>
              )}

              <span className="absolute bottom-3 right-3 text-[10px] text-brand-450 font-semibold pointer-events-none bg-white/70 dark:bg-brand-900/80 px-2 py-0.5 rounded backdrop-blur">
                Scale: 1:50 (CAD Mode)
              </span>
            </div>

            {/* Pin placement prompt */}
            <div className="flex items-center gap-1.5 justify-center mt-2.5 text-brand-450 text-[10px] font-semibold">
              <Info className="h-3.5 w-3.5 text-brand-400" />
              <span>* Click anywhere on the drawing rooms above to place a customization request pin.</span>
            </div>
          </Card>
        </div>

        {/* Right Details & Action Panel */}
        <div className="space-y-6">
          {/* Submit Pin Customization Form */}
          {tempCoords ? (
            <Card title="New Customization Request" subtitle="Specify upgrade details for the selected pin location">
              {successMsg && (
                <div className="bg-brand-100 border border-brand-200 text-brand-800 text-xs font-semibold rounded-xl p-3 mb-3 dark:bg-brand-850 dark:border-brand-800 dark:text-white">
                  {successMsg}
                </div>
              )}
              {errorMsg && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-xs font-semibold rounded-xl p-3 mb-3">
                  {errorMsg}
                </div>
              )}
              <form onSubmit={handleAddPin} className="space-y-4">
                <div className="p-3 bg-brand-50/50 dark:bg-brand-950/20 border border-brand-100 dark:border-brand-850 rounded-xl">
                  <span className="text-[9px] uppercase font-bold text-brand-400 tracking-wider font-mono">Canvas Pin Coordinates</span>
                  <p className="text-xs font-bold text-brand-800 dark:text-brand-300 mt-1">X: {tempCoords.x}%, Y: {tempCoords.y}%</p>
                </div>
                
                <div>
                  <label className="block text-xs font-bold text-brand-700 dark:text-brand-300 mb-1">
                    Upgrade Selection Details
                  </label>
                  <textarea
                    rows={3}
                    value={newPinLabel}
                    onChange={(e) => setNewPinLabel(e.target.value)}
                    placeholder="e.g. Move dining room switchboard 2 feet to the right on the east wall..."
                    className="w-full rounded-xl border border-brand-200 bg-brand-50/30 px-3 py-2.5 text-xs outline-none focus:ring-2 focus:ring-brand-500/25 focus:border-brand-600 dark:border-brand-800 dark:bg-brand-950/20 dark:text-white"
                    required
                  />
                  <p className="text-[10px] text-brand-450 leading-relaxed mt-1">
                    <strong>Helper:</strong> Be extremely specific about location details and wall directions. Example: <em>"Shift socket 2 feet right on the north wall, next to the modular paneling."</em>
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-brand-700 dark:text-brand-300 mb-1">
                    Priority Level
                  </label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value)}
                    className="w-full rounded-xl border border-brand-200 bg-brand-50/30 px-3 py-2 text-xs font-semibold outline-none focus:ring-2 focus:ring-brand-500/25 focus:border-brand-600 dark:border-brand-800 dark:bg-brand-950/20 dark:text-white cursor-pointer"
                  >
                    <option value="LOW">Low - Aesthetic Adjustments</option>
                    <option value="MEDIUM">Medium - Electrical / Plumbing</option>
                    <option value="HIGH">High - Civil / Structural Modification</option>
                  </select>
                </div>
                
                <div className="flex gap-2 pt-2">
                  <button
                    type="submit"
                    className="flex-1 rounded-xl bg-brand-700 hover:bg-brand-800 text-white px-4 py-2.5 text-xs font-semibold shadow-sm transition-colors"
                  >
                    Submit Request
                  </button>
                  <button
                    type="button"
                    onClick={() => setTempCoords(null)}
                    className="rounded-xl bg-brand-100 hover:bg-brand-200 dark:bg-brand-800 text-brand-800 dark:text-white px-4 py-2.5 text-xs font-semibold transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </Card>
          ) : activePin ? (
            /* Selected Pin Details (Display Pin Details when Selected) */
            <Card title="Design Request Details" subtitle="Full breakdown and engineer logs for active request">
              <div className="space-y-4">
                <div className="p-3.5 rounded-2xl bg-brand-50/50 dark:bg-brand-950/20 border border-brand-150 dark:border-brand-800 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-[9px] font-bold text-brand-400 uppercase tracking-wider font-mono">Status Status</span>
                    <StatusBadge label={getStatusLabel(activePin.status)} type={mapStatusType(activePin.status)} />
                  </div>
                  <h4 className="text-sm font-bold text-brand-900 dark:text-white">{activePin.label}</h4>
                  
                  <div className="grid grid-cols-2 gap-3 pt-2.5 border-t border-brand-100 dark:border-brand-850 text-[10px] font-semibold text-brand-500">
                    <div>
                      <span>Submitted Date:</span>
                      <p className="text-brand-900 dark:text-white mt-0.5">{activePin.submittedDate}</p>
                    </div>
                    <div>
                      <span>Estimated Cost:</span>
                      <p className="text-brand-900 dark:text-white mt-0.5">₹{activePin.estimatedCost.toLocaleString('en-IN')}</p>
                    </div>
                  </div>
                  <div className="pt-2 text-[10px] text-brand-500 font-semibold border-t border-brand-100 dark:border-brand-850 flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5 text-brand-400" />
                    <span>Estimated Approval SLA: <strong className="text-brand-800 dark:text-brand-300">{activePin.approvalTimeSLA}</strong></span>
                  </div>
                </div>

                {/* Comment Thread Log */}
                <div className="space-y-2">
                  <span className="text-[10px] uppercase font-bold text-brand-400 tracking-wider font-mono">Care Team Remarks</span>
                  <div className="space-y-2 max-h-[140px] overflow-y-auto pr-1">
                    {activePin.comments.map((comment, idx) => (
                      <div key={idx} className="p-3 rounded-xl bg-brand-50/40 dark:bg-brand-850/40 text-xs">
                        <span className="text-[9px] uppercase font-bold text-brand-450 block font-mono">SYSTEM LOG</span>
                        <p className="text-brand-700 dark:text-brand-300 mt-1 leading-relaxed">{comment}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <form onSubmit={handleAddComment} className="border-t border-brand-100 dark:border-brand-850 pt-3 flex gap-2">
                  <input
                    type="text"
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Add follow-up remark..."
                    className="flex-1 rounded-xl border border-brand-200 bg-brand-50/20 px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-brand-500/25 focus:border-brand-600 dark:border-brand-800 dark:bg-brand-950/20 dark:text-white"
                    required
                  />
                  <button type="submit" className="rounded-xl bg-brand-700 hover:bg-brand-800 text-white px-3.5 text-xs font-semibold shadow-sm transition-colors">
                    Send
                  </button>
                </form>

                <button
                  onClick={() => setActivePinId(null)}
                  className="w-full text-center text-xs font-semibold text-brand-500 hover:text-brand-700 pt-1"
                >
                  Back to Requests List
                </button>
              </div>
            </Card>
          ) : (
            /* 5. My Requests Panel (Replaced Upgrades Review Stream) */
            <Card title="My Requests" subtitle="Interactive designs changes logs and approval SLAs">
              {pins.length > 0 ? (
                <div className="space-y-3.5 max-h-[400px] overflow-y-auto pr-1">
                  {pins.map((cr) => (
                    <div
                      key={cr.id}
                      onClick={() => setActivePinId(cr.id)}
                      className="p-3.5 rounded-2xl border border-brand-150 bg-white hover:border-brand-350 dark:border-brand-850 dark:bg-brand-900/40 transition-all flex flex-col gap-2.5 cursor-pointer shadow-sm group"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-brand-400 uppercase tracking-wide font-mono flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {cr.submittedDate}
                        </span>
                        <StatusBadge
                          label={getStatusLabel(cr.status)}
                          type={mapStatusType(cr.status)}
                        />
                      </div>
                      <p className="text-xs font-bold text-brand-900 dark:text-white leading-relaxed group-hover:text-brand-700">
                        {cr.label}
                      </p>
                      
                      <div className="flex items-center justify-between border-t border-brand-100 dark:border-brand-850 pt-2 text-[10px] text-brand-500 font-semibold">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5 text-brand-400" />
                          SLA: {cr.approvalTimeSLA}
                        </span>
                        <span className="text-brand-900 dark:text-white font-bold">
                          Est. cost: ₹{cr.estimatedCost.toLocaleString('en-IN')}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState
                  title="No upgrades submitted"
                  description="Use the drawing canvas to pin and submit customization requests."
                  icon={Sparkles}
                />
              )}
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default DesignStudioPage;
