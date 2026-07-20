import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Clock,
  FolderOpen,
  Lock,
  CheckCircle2,
  ZoomIn,
  X,
  Plus,
  Minus,
} from 'lucide-react';
import { Card } from '../../../components/ui/Card';
import { StatusBadge } from '../../../components/ui/StatusBadge';
import { EmptyState } from '../../../components/ui/EmptyState';
import { clientService } from '../../../services/client.service';
import { changeRequestService } from '../../../services/changeRequest.service';
import { useAuthStore } from '../../../store/authStore';

export interface OptionDetail {
  name: string;
  image: string;
  finish: string;
  additionalCost: number;
}

export interface SelectionItem {
  id: string;
  category: string;
  name: string;
  options: OptionDetail[];
  selectedOptionName: string | null;
  status: 'PENDING' | 'SUBMITTED' | 'APPROVED' | 'REJECTED' | 'COMPLETED';
  deadline: string;
  remainingDays: number;
}

export const MySelectionsPage: React.FC = () => {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [activeCategory, setActiveCategory] = useState<string>('Flooring');
  
  // Selection States
  const [selectedOptionsLocal, setSelectedOptionsLocal] = useState<Record<string, string>>({});
  const [compareList, setCompareList] = useState<OptionDetail[]>([]);
  const [zoomImage, setZoomImage] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Queries
  const { data: dashboard } = useQuery({
    queryKey: ['clientDashboard'],
    queryFn: () => clientService.getDashboard(),
  });

  const { data: changeRequests = [] } = useQuery({
    queryKey: ['changeRequests'],
    queryFn: () => changeRequestService.listRequests(),
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
      setSuccessMsg('Your interior selection preference has been locked successfully.');
      setTimeout(() => setSuccessMsg(null), 5000);
    },
  });

  // Material Options detailed database
  const defaultSelections: SelectionItem[] = [
    {
      id: 'sel-01',
      category: 'Flooring',
      name: 'Master Bedroom Flooring Material',
      deadline: '20 July 2026',
      remainingDays: 7,
      status: 'APPROVED',
      selectedOptionName: 'Engineered Oak',
      options: [
        { name: 'Teak Wood Plank', image: 'https://images.unsplash.com/photo-1581858726788-75bc0f6a952d?q=80&w=400&auto=format&fit=crop', finish: 'Burmese Teakwood Matte Polish', additionalCost: 25000 },
        { name: 'Engineered Oak', image: 'https://images.unsplash.com/photo-1588854337236-6889d631faa8?q=80&w=400&auto=format&fit=crop', finish: 'Multi-layer Oak Floor Planks', additionalCost: 0 },
        { name: 'Italian Marble Tiles', image: 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?q=80&w=400&auto=format&fit=crop', finish: 'Polished Bianco Lasa Italian Marble', additionalCost: 65000 },
      ],
    },
    {
      id: 'sel-02',
      category: 'Flooring',
      name: 'Living Room Flooring Material',
      deadline: '25 July 2026',
      remainingDays: 12,
      status: 'PENDING',
      selectedOptionName: null,
      options: [
        { name: 'Crema Marfil Marble', image: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?q=80&w=400&auto=format&fit=crop', finish: 'Mirror Polished Crema Slabs', additionalCost: 40000 },
        { name: 'Vitrified Glazed Tiles', image: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?q=80&w=400&auto=format&fit=crop', finish: 'Double Charge Glazed Tiles', additionalCost: 0 },
      ],
    },
    {
      id: 'sel-03',
      category: 'Kitchen',
      name: 'Kitchen Cabinet Finish Type',
      deadline: '30 July 2026',
      remainingDays: 17,
      status: 'SUBMITTED',
      selectedOptionName: 'Matte Acrylic Finish',
      options: [
        { name: 'Matte Acrylic Finish', image: 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?q=80&w=400&auto=format&fit=crop', finish: 'Soft-touch Anti-fingerprint Acrylic', additionalCost: 15000 },
        { name: 'Veneer Wood Finish', image: 'https://images.unsplash.com/photo-1600585154526-990dced4db0d?q=80&w=400&auto=format&fit=crop', finish: 'Natural Walnut Veneer Satin PU', additionalCost: 45000 },
      ],
    },
    {
      id: 'sel-04',
      category: 'Bathroom',
      name: 'Master Bathroom Sanitary Fixtures',
      deadline: '10 August 2026',
      remainingDays: 28,
      status: 'APPROVED',
      selectedOptionName: 'Kohler Premium Line',
      options: [
        { name: 'Kohler Premium Line', image: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?q=80&w=400&auto=format&fit=crop', finish: 'Vitreous China & Brushed Bronze Fittings', additionalCost: 15000 },
        { name: 'Grohe Chrome Set', image: 'https://images.unsplash.com/photo-1507652313519-d4e9174996dd?q=80&w=400&auto=format&fit=crop', finish: 'Dual-flush Eco Chrome Fixtures', additionalCost: 0 },
      ],
    },
  ];

  // Map state based on database change requests
  const selections = defaultSelections.map((item) => {
    const matchedCR = changeRequests.find((cr) => cr.remarks.includes(item.name));
    if (matchedCR) {
      return {
        ...item,
        status: (matchedCR.status === 'APPROVED' ? 'APPROVED' : matchedCR.status === 'REJECTED' ? 'REJECTED' : 'SUBMITTED') as any,
      };
    }
    return item;
  });

  const categories = ['Flooring', 'Kitchen', 'Bathroom', 'Wardrobes', 'Doors', 'Windows', 'Landscape'];

  const handleSelectOption = (itemId: string, optionName: string) => {
    setSelectedOptionsLocal({
      ...selectedOptionsLocal,
      [itemId]: optionName,
    });
  };

  const handleSubmitSelection = (item: SelectionItem) => {
    const selectedVal = selectedOptionsLocal[item.id];
    if (!selectedVal) return;

    if (dashboard && dashboard.workflow) {
      createCRMutation.mutate({
        workflowId: dashboard.workflow.id,
        documentId: 'doc_placeholder_uuid',
        annotationId: 'ann_' + item.id,
        requestedBy: user?.name || 'Homeowner Client',
        priority: 'MEDIUM',
        remarks: `[My Selections Upgrade] ${item.name}: Chosen Option - ${selectedVal}`,
      });
    }
  };

  const handleToggleCompare = (option: OptionDetail) => {
    if (compareList.some((c) => c.name === option.name)) {
      setCompareList(compareList.filter((c) => c.name !== option.name));
    } else {
      if (compareList.length >= 2) {
        alert('You can compare a maximum of two materials side-by-side.');
        return;
      }
      setCompareList([...compareList, option]);
    }
  };

  const filteredItems = selections.filter((s) => s.category === activeCategory);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Homeowner progress calculations
  const totalItemsCount = selections.length;
  const completedCount = selections.filter((s) => s.status === 'APPROVED' || s.status === 'COMPLETED').length;
  const completionPercent = totalItemsCount > 0 ? Math.round((completedCount / totalItemsCount) * 100) : 0;
  const nextRequired = selections.find((s) => s.status === 'PENDING')?.name || 'None pending';

  // Cost breakdowns calculations
  const approvedExtraCost = selections
    .filter((s) => s.status === 'APPROVED' || s.status === 'COMPLETED')
    .reduce((sum, s) => {
      const selectedDetail = s.options.find((opt) => opt.name === s.selectedOptionName);
      return sum + (selectedDetail?.additionalCost || 0);
    }, 0);

  const pendingExtraCost = selections
    .filter((s) => s.status === 'SUBMITTED')
    .reduce((sum, s) => {
      const selectedDetail = s.options.find((opt) => opt.name === s.selectedOptionName);
      return sum + (selectedDetail?.additionalCost || 0);
    }, 0);

  return (
    <div className="space-y-6 text-left">
      {/* Page Title */}
      <div>
        <h1 className="font-serif text-3xl font-semibold text-brand-900 dark:text-white">
          My Selections
        </h1>
        <p className="text-sm font-medium text-brand-500 dark:text-brand-400 mt-1">
          Lock in custom finishes, electrical layouts, modular kitchen templates, and premium upgrade selections.
        </p>
      </div>

      {/* 1. Homeowner Progress Hero Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-800 to-brand-950 p-6 text-white shadow-xl">
        <div className="absolute right-0 top-0 h-40 w-40 transform translate-x-10 -translate-y-10 rounded-full bg-white/5 blur-3xl pointer-events-none" />
        <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
          <div className="space-y-2">
            <span className="inline-flex items-center gap-1 rounded-full bg-white/10 px-3 py-1 text-[10px] font-mono tracking-wider uppercase">
              Ownership Selections progress
            </span>
            <h3 className="text-xl font-bold font-serif">{completedCount} of {totalItemsCount} Completed</h3>
            <p className="text-xs text-brand-200">Milestone choices locked into construction blueprints</p>
          </div>

          <div className="space-y-2">
            <span className="text-[10px] uppercase font-bold text-brand-200 font-mono">Completion Rate</span>
            <div className="flex items-center gap-3">
              <span className="text-2xl font-serif font-bold">{completionPercent}%</span>
              <div className="flex-1 h-2 rounded-full bg-white/20 overflow-hidden">
                <div className="h-2 rounded-full bg-accent-500 transition-all duration-500" style={{ width: `${completionPercent}%` }} />
              </div>
            </div>
          </div>

          <div className="space-y-1 border-t md:border-t-0 md:border-l border-white/15 pt-4 md:pt-0 md:pl-6 text-xs text-left">
            <span className="text-[10px] uppercase font-bold text-brand-200 font-mono">Next Required Selection</span>
            <h4 className="font-bold text-white mt-1 truncate max-w-[250px]">{nextRequired}</h4>
            <p className="text-[10px] text-brand-300 mt-1">Please confirm selections before civil target date.</p>
          </div>
        </div>
      </div>

      {/* Main split selection UI */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* Left column category list menu */}
        <div className="space-y-6">
          <div className="space-y-2">
            <span className="text-[10px] uppercase font-bold text-brand-400 tracking-wider pl-1 font-mono">Finish Categories</span>
            <div className="flex flex-row overflow-x-auto gap-2 lg:flex-col lg:overflow-x-visible">
              {categories.map((cat) => {
                const totalInCat = selections.filter((s) => s.category === cat).length;
                const completedInCat = selections.filter((s) => s.category === cat && (s.status === 'APPROVED' || s.status === 'COMPLETED')).length;
                const progressVal = totalInCat > 0 ? Math.round((completedInCat / totalInCat) * 100) : 0;
                const isPending = selections.some((s) => s.category === cat && s.status === 'PENDING');

                return (
                  <button
                    key={cat}
                    onClick={() => setActiveCategory(cat)}
                    className={`flex flex-col gap-1 w-full rounded-2xl px-4 py-3 text-xs font-semibold transition-all shrink-0 border text-left ${
                      activeCategory === cat
                        ? 'bg-brand-700 text-white border-brand-700 shadow-md'
                        : 'bg-white hover:bg-brand-50 text-brand-700 border-brand-200 dark:bg-brand-900 dark:text-brand-300 dark:border-brand-850 dark:hover:bg-brand-850'
                    }`}
                  >
                    <div className="flex justify-between items-center w-full">
                      <span>{cat}</span>
                      {isPending && (
                        <span className="h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse" />
                      )}
                    </div>
                    {/* 4. Progress indicators for every category */}
                    {totalInCat > 0 && (
                      <div className="w-full mt-2 space-y-1">
                        <div className="flex justify-between text-[9px] font-mono text-brand-450 dark:text-brand-400">
                          <span>{completedInCat}/{totalInCat} Selected</span>
                          <span>{progressVal}%</span>
                        </div>
                        <div className="h-1 w-full bg-brand-100 dark:bg-brand-800 rounded-full overflow-hidden">
                          <div
                            className={`h-1 rounded-full ${activeCategory === cat ? 'bg-white' : 'bg-brand-700'}`}
                            style={{ width: `${progressVal}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 6. Cost Summary Panel */}
          <Card title="Selections Cost Summary" subtitle="Upgrades and customized extras invoice details">
            <div className="space-y-3 pt-2 text-xs font-semibold">
              <div className="flex justify-between border-b border-brand-100 dark:border-brand-850 pb-2">
                <span className="text-brand-500">Standard Package:</span>
                <span className="text-brand-900 dark:text-white">Included</span>
              </div>
              <div className="flex justify-between border-b border-brand-100 dark:border-brand-850 pb-2">
                <span className="text-brand-500">Premium Upgrades:</span>
                <span className="text-brand-900 dark:text-white">₹1,50,000</span>
              </div>
              <div className="flex justify-between border-b border-brand-100 dark:border-brand-850 pb-2">
                <span className="text-brand-500">Approved Extras:</span>
                <span className="text-brand-700">₹{approvedExtraCost.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-brand-500">Pending Approvals:</span>
                <span className="text-brand-900 dark:text-white">₹{pendingExtraCost.toLocaleString('en-IN')}</span>
              </div>
            </div>
          </Card>
        </div>

        {/* Right selection options list */}
        <div className="lg:col-span-3 space-y-6">
          
          {/* Side-by-Side Comparison display */}
          {compareList.length > 0 && (
            <Card title="Material Options Comparison" subtitle="Side-by-side specification evaluation">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 p-2">
                {compareList.map((comp) => (
                  <div key={comp.name} className="p-4 rounded-2xl border border-brand-200 bg-brand-50/10 dark:border-brand-850 dark:bg-brand-950/20 relative">
                    <button
                      onClick={() => handleToggleCompare(comp)}
                      className="absolute top-3 right-3 text-brand-400 hover:text-brand-700 rounded-full p-1"
                    >
                      <X className="h-4.5 w-4.5" />
                    </button>
                    <img src={comp.image} alt={comp.name} className="h-32 w-full object-cover rounded-xl shadow" />
                    <h5 className="font-bold text-brand-900 dark:text-white mt-3 text-sm">{comp.name}</h5>
                    <div className="mt-2.5 space-y-1.5 text-xs text-brand-600 dark:text-brand-350">
                      <p><strong>Finish:</strong> {comp.finish}</p>
                      <p><strong>Upcharge cost:</strong> {comp.additionalCost > 0 ? `₹${comp.additionalCost.toLocaleString('en-IN')}` : 'Included in Package'}</p>
                    </div>
                  </div>
                ))}
              </div>
              {compareList.length === 1 && (
                <p className="text-[10px] text-brand-450 text-center mt-2">
                  * Choose one more option below to start comparing side-by-side.
                </p>
              )}
            </Card>
          )}

          <Card title={`${activeCategory} Specifications`} subtitle={`Select custom layout parameters for active construction phases`}>
            {successMsg && (
              <div className="bg-brand-100 border border-brand-200 text-brand-800 text-xs font-semibold rounded-xl p-3 mb-3 dark:bg-brand-850 dark:border-brand-800 dark:text-white">
                {successMsg}
              </div>
            )}
            
            {filteredItems.length > 0 ? (
              <div className="space-y-8 divide-y divide-brand-100 dark:divide-brand-850">
                {filteredItems.map((item) => {
                  const localSelectedName = selectedOptionsLocal[item.id] || item.selectedOptionName;
                  const isInteractive = item.status === 'PENDING' || item.status === 'REJECTED';

                  return (
                    <div key={item.id} className="pt-6 first:pt-0 space-y-4">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div>
                          <h4 className="text-sm font-bold text-brand-900 dark:text-white">
                            {item.name}
                          </h4>
                          {/* 5. Deadline and remaining days */}
                          {isInteractive && (
                            <p className="text-[10px] text-brand-450 mt-1 flex items-center gap-1.5 font-semibold">
                              <Clock className="h-3.5 w-3.5 text-brand-400" />
                              <span>Selection Deadline: <strong className="text-brand-800 dark:text-brand-300">{item.deadline}</strong> ({item.remainingDays} days left)</span>
                            </p>
                          )}
                        </div>
                        <StatusBadge
                          label={item.status}
                          type={
                            item.status === 'APPROVED' || item.status === 'COMPLETED'
                              ? 'success'
                              : item.status === 'PENDING'
                                ? 'neutral'
                                : 'info'
                          }
                        />
                      </div>

                      {/* 2. Options selection layout as rich visual cards */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        {item.options.map((opt) => {
                          const isChosen = localSelectedName === opt.name;
                          const isComparing = compareList.some((c) => c.name === opt.name);
                          
                          return (
                            <div
                              key={opt.name}
                              className={`rounded-2xl border p-3 cursor-pointer transition-all flex flex-col justify-between group shadow-sm ${
                                isChosen
                                  ? 'border-brand-700 bg-brand-50/20 dark:border-brand-400'
                                  : 'border-brand-200 bg-white hover:bg-brand-50/50 dark:border-brand-850 dark:bg-brand-900 hover:-translate-y-0.5'
                              }`}
                            >
                              <div className="relative aspect-video w-full overflow-hidden bg-brand-50 rounded-xl">
                                <img
                                  src={opt.image}
                                  alt={opt.name}
                                  className="h-full w-full object-cover"
                                />
                                {/* 9. Support image fullscreen zoom */}
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setZoomImage(opt.image);
                                  }}
                                  className="absolute top-2 right-2 bg-brand-900/80 hover:bg-brand-900 p-1.5 rounded-lg text-white opacity-0 group-hover:opacity-100 transition-opacity"
                                  title="Zoom Image"
                                >
                                  <ZoomIn className="h-3.5 w-3.5" />
                                </button>
                              </div>

                              <div className="mt-3 text-left space-y-1">
                                <h5 className="text-xs font-bold text-brand-900 dark:text-white">{opt.name}</h5>
                                <p className="text-[10px] text-brand-450 leading-relaxed truncate">{opt.finish}</p>
                                <div className="pt-2 flex justify-between items-baseline">
                                  <span className="text-[10px] text-brand-400 font-mono uppercase tracking-wide">Additional Cost</span>
                                  <span className="text-xs font-bold text-brand-900 dark:text-white">
                                    {opt.additionalCost > 0 ? `₹${opt.additionalCost.toLocaleString('en-IN')}` : 'Included'}
                                  </span>
                                </div>
                              </div>

                              {/* Toggle compare and select actions */}
                              <div className="flex gap-2 mt-4 pt-2 border-t border-brand-100 dark:border-brand-850">
                                {isInteractive ? (
                                  <>
                                    <button
                                      type="button"
                                      onClick={() => handleSelectOption(item.id, opt.name)}
                                      className={`flex-1 text-[10px] font-bold py-1.5 px-2 rounded-xl transition-all ${
                                        isChosen
                                          ? 'bg-brand-700 text-white'
                                          : 'bg-brand-100 text-brand-800 dark:bg-brand-800 dark:text-white hover:bg-brand-200'
                                      }`}
                                    >
                                      {isChosen ? 'Selected' : 'Choose'}
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleToggleCompare(opt)}
                                      className={`p-1.5 rounded-xl border text-[10px] font-bold ${
                                        isComparing
                                          ? 'border-brand-700 text-brand-700 bg-brand-50/20 dark:border-brand-400 dark:text-brand-300'
                                          : 'border-brand-200 text-brand-450 hover:border-brand-400'
                                      }`}
                                    >
                                      {isComparing ? <Minus className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
                                    </button>
                                  </>
                                ) : (
                                  <div className="w-full flex items-center justify-between text-[10px] text-brand-450 font-bold">
                                    <span>Locked Specification</span>
                                    <Lock className="h-3.5 w-3.5 text-brand-300 shrink-0" />
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* 10. Sticky / Context Action Panel under each selection */}
                      {isInteractive && selectedOptionsLocal[item.id] && (
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-brand-50/40 dark:bg-brand-950/20 p-4 rounded-2xl border border-brand-100 dark:border-brand-850 mt-3 animate-fade-in">
                          <div className="space-y-1">
                            <span className="text-[9px] uppercase font-bold text-accent-700 bg-accent-600/10 px-2 py-0.5 rounded font-mono">Proposed Choice</span>
                            <h5 className="text-xs font-bold text-brand-900 dark:text-white mt-1">
                              {selectedOptionsLocal[item.id]} (Additional cost: {
                                formatCurrency(item.options.find((o) => o.name === selectedOptionsLocal[item.id])?.additionalCost || 0)
                              })
                            </h5>
                          </div>
                          <div className="flex gap-2.5 w-full sm:w-auto shrink-0">
                            <button
                              onClick={() => handleSubmitSelection(item)}
                              className="flex-1 sm:flex-none rounded-xl bg-brand-700 hover:bg-brand-800 text-white px-4 py-2.5 text-xs font-bold shadow-sm transition-colors"
                            >
                              Approve Selection
                            </button>
                            <button
                              onClick={() => {
                                setSelectedOptionsLocal({ ...selectedOptionsLocal, [item.id]: '' });
                              }}
                              className="rounded-xl bg-brand-100 hover:bg-brand-200 dark:bg-brand-800 text-brand-850 dark:text-white px-3.5 py-2.5 text-xs font-semibold"
                            >
                              Request Change
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <EmptyState
                title="No active selections"
                description="There are no selection requirements registered in this category."
                icon={FolderOpen}
              />
            )}
          </Card>

          {/* 7. Chronological Selection History Timeline */}
          <Card title="Selection History" subtitle="Audit timeline of confirmed interior options">
            <div className="relative pl-6 ml-2 border-l border-brand-200 dark:border-brand-800 space-y-6 py-2 text-left text-xs">
              <div className="relative pl-6">
                <div className="absolute left-[-31px] top-1.5 h-4.5 w-4.5 rounded-full border-2 border-white bg-green-600 text-white flex items-center justify-center dark:border-brand-900">
                  <CheckCircle2 className="h-3 w-3" />
                </div>
                <div className="flex items-baseline justify-between gap-4">
                  <span className="font-bold text-brand-900 dark:text-white">Master Bathroom Sanitary Fixtures Approved</span>
                  <span className="text-[9px] text-brand-400 font-mono">10 Jun 2026</span>
                </div>
                <p className="text-brand-500 mt-1 leading-relaxed">Chosen: Kohler Premium Line (+ ₹15,000) locked into plumbing layouts.</p>
              </div>

              <div className="relative pl-6">
                <div className="absolute left-[-31px] top-1.5 h-4.5 w-4.5 rounded-full border-2 border-white bg-green-600 text-white flex items-center justify-center dark:border-brand-900">
                  <CheckCircle2 className="h-3 w-3" />
                </div>
                <div className="flex items-baseline justify-between gap-4">
                  <span className="font-bold text-brand-900 dark:text-white">Master Bedroom Flooring Material Approved</span>
                  <span className="text-[9px] text-brand-400 font-mono">08 Jun 2026</span>
                </div>
                <p className="text-brand-500 mt-1 leading-relaxed">Chosen: Engineered Oak (+ ₹0) confirmed for bedroom flooring layers.</p>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Image Preview Fullscreen Modal */}
      {zoomImage && (
        <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex flex-col justify-between p-4 sm:p-6 text-white">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-bold tracking-wider text-brand-400 font-mono">Material Preview</span>
            <button
              onClick={() => setZoomImage(null)}
              className="rounded-full bg-white/10 hover:bg-white/20 p-2 text-white transition-all shadow-md"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <div className="flex-1 flex items-center justify-center max-h-[70vh] overflow-hidden my-4">
            <img src={zoomImage} alt="Material Zoom View" className="max-w-full max-h-[60vh] object-contain rounded-2xl shadow-2xl" />
          </div>
          <div className="max-w-xl mx-auto w-full text-center p-4 rounded-xl bg-white/5 border border-white/10">
            <p className="text-xs text-white/80 leading-relaxed">GoodEarth architectural finish guidelines specify only premium eco-friendly materials and low-VOC paints.</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default MySelectionsPage;
