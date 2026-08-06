import React from 'react';
import { Building, User, Hammer, Calendar, ChevronDown, CheckCircle2 } from 'lucide-react';
import { ClientHomeDetails } from '../../../../services/client.service';
import { useUnitStore, ClientUnit } from '../../../../store/unitStore';

interface ProjectHeaderProps {
  details?: ClientHomeDetails | null;
  isLoading?: boolean;
}

export const ProjectHeader: React.FC<ProjectHeaderProps> = ({ details, isLoading }) => {
  const { units, activeUnit, setActiveUnit } = useUnitStore();
  const [dropdownOpen, setDropdownOpen] = React.useState(false);

  if (isLoading) {
    return (
      <div className="w-full h-44 rounded-3xl bg-brand-100/50 dark:bg-brand-900/40 animate-pulse border border-brand-200/50 dark:border-brand-850" />
    );
  }

  const projectName = details?.project || activeUnit?.projectName || 'GoodEarth Community';
  const unitNumber = details?.unitNumber || details?.villa || activeUnit?.unitName || 'Unit Portfolio';
  const primaryBuyer = details?.primaryBuyer || 'Valued Homeowner';
  const constructionStage = details?.constructionStatus || 'In Progress';
  const possessionDate = details?.expectedHandover || details?.possessionDate || 'Scheduled';

  const handleUnitSelect = (unit: ClientUnit) => {
    setActiveUnit(unit);
    setDropdownOpen(false);
  };

  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-brand-950 via-brand-900 to-brand-850 p-6 sm:p-8 text-white shadow-2xl border border-brand-800/60">
      {/* Decorative Brand Accents */}
      <div className="absolute -top-24 -right-24 h-64 w-64 rounded-full bg-amber-500/10 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -left-24 h-64 w-64 rounded-full bg-brand-600/20 blur-3xl pointer-events-none" />

      <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        {/* Left Info Column */}
        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-semibold tracking-wide">
            <Building className="h-3.5 w-3.5 text-amber-400" />
            <span>Luxury Residence</span>
            <span className="h-1 w-1 rounded-full bg-amber-400" />
            <span className="text-amber-200/80">{projectName}</span>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <h1 className="font-serif text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-white">
              {unitNumber}
            </h1>

            {/* Property Switcher Dropdown (If > 1 unit) */}
            {units.length > 1 && (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 text-xs font-semibold text-white transition-all shadow-sm"
                >
                  <span>Switch Unit ({units.length})</span>
                  <ChevronDown className={`h-3.5 w-3.5 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {dropdownOpen && (
                  <div className="absolute left-0 mt-2 w-64 rounded-2xl bg-brand-900 border border-brand-700 shadow-2xl p-2 z-50 text-left">
                    <div className="px-3 py-2 text-[10px] font-bold text-brand-400 uppercase tracking-wider border-b border-brand-800">
                      Your Registered Properties
                    </div>
                    <div className="mt-1 space-y-1 max-h-48 overflow-y-auto">
                      {units.map((u) => (
                        <button
                          key={u.id}
                          onClick={() => handleUnitSelect(u)}
                          className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs text-left transition-colors ${
                            activeUnit?.id === u.id
                              ? 'bg-amber-500/20 text-amber-300 font-semibold border border-amber-500/30'
                              : 'text-brand-200 hover:bg-brand-800/80'
                          }`}
                        >
                          <span className="truncate">{u.unitName}</span>
                          {activeUnit?.id === u.id && <CheckCircle2 className="h-4 w-4 text-amber-400 shrink-0" />}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-4 text-xs text-brand-200/90 font-sans">
            <span className="flex items-center gap-1.5">
              <User className="h-3.5 w-3.5 text-amber-400" />
              <strong className="text-white font-medium">Primary Buyer:</strong> {primaryBuyer}
            </span>
          </div>
        </div>

        {/* Right Status Badges Column */}
        <div className="grid grid-cols-2 gap-3 sm:flex sm:items-center sm:gap-4 border-t border-white/10 lg:border-t-0 pt-4 lg:pt-0">
          {/* Construction Stage */}
          <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md min-w-[140px] space-y-1 text-left">
            <div className="flex items-center gap-1.5 text-[10px] font-bold text-amber-400/90 uppercase tracking-wider">
              <Hammer className="h-3.5 w-3.5" />
              Construction Stage
            </div>
            <div className="text-sm font-bold text-white truncate">
              {constructionStage}
            </div>
          </div>

          {/* Possession Date */}
          <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md min-w-[140px] space-y-1 text-left">
            <div className="flex items-center gap-1.5 text-[10px] font-bold text-amber-400/90 uppercase tracking-wider">
              <Calendar className="h-3.5 w-3.5" />
              Possession Date
            </div>
            <div className="text-sm font-bold text-white truncate">
              {possessionDate}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
