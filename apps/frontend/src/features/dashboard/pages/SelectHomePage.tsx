import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Home, ArrowRight, Building2, Calendar, HardHat, CheckCircle2, ShieldCheck } from 'lucide-react';
import { useUnitStore, ClientUnit } from '../../../store/unitStore';
import { useAuthStore } from '../../../store/authStore';
import { clientService } from '../../../services/client.service';

export const SelectHomePage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { units, activeUnit, setUnits, setActiveUnit } = useUnitStore();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log('[SELECT_HOME] Page mounted for user:', user?.email);
    console.log('[SELECT_HOME] Current unitStore state -> units.length:', units.length, '| activeUnit:', activeUnit?.unitName);
    
    clientService
      .getOwnedUnits()
      .then((data) => {
        console.log('[SELECT_HOME] RAW GET /api/v1/client/units response:', JSON.stringify(data, null, 2));
        if (Array.isArray(data)) {
          setUnits(data);
          console.log('[SELECT_HOME] Evaluation -> units.length:', data.length);
          if (data.length === 1) {
            console.log('[SELECT_HOME] Single unit found:', data[0].unitName, '-> Auto-selecting unit & navigating to /my-home');
            setActiveUnit(data[0]);
            navigate('/my-home', { replace: true });
          } else if (data.length > 1) {
            console.log('[SELECT_HOME] Multiple units found (', data.length, ') -> Displaying Select Your Home grid');
          } else {
            console.warn('[SELECT_HOME] No units found for user.');
          }
        }
      })
      .catch((err) => console.error('[SELECT_HOME] Error loading owned units:', err))
      .finally(() => setLoading(false));
  }, [setUnits, setActiveUnit, navigate, user?.email]);

  const handleSelectProperty = (unit: ClientUnit) => {
    console.log('[SELECT_HOME] User selected property card:', unit.unitName, '| ID:', unit.id);
    setActiveUnit(unit);
    navigate('/my-home');
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center space-y-4">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-brand-700 border-t-transparent dark:border-brand-400"></div>
        <p className="text-sm font-medium text-brand-600 dark:text-brand-400">Loading your properties...</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8 px-4 py-8 text-left">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-brand-950 via-brand-900 to-brand-850 p-8 text-white shadow-2xl dark:border dark:border-brand-800/50">
        <div className="absolute -right-12 -top-12 h-64 w-64 rounded-full bg-brand-500/10 blur-3xl" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="space-y-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-emerald-300 backdrop-blur-md border border-white/10">
              <ShieldCheck className="h-3.5 w-3.5" />
              Verified Portfolio
            </span>
            <h1 className="font-serif text-3xl font-bold tracking-tight">Select Your Home</h1>
            <p className="text-sm text-brand-200">
              Welcome <span className="font-semibold text-white">{user?.name || 'Homeowner'}</span>. Please choose the property you would like to manage.
            </p>
          </div>
          <div className="rounded-2xl bg-white/10 backdrop-blur-md px-5 py-3 border border-white/10 text-right">
            <span className="block text-[10px] uppercase font-semibold text-brand-300 tracking-wider">Properties Owned</span>
            <span className="text-xl font-bold text-white font-serif">{units.length} {units.length === 1 ? 'Property' : 'Properties'}</span>
          </div>
        </div>
      </div>

      {/* Property Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {units.map((unit) => (
          <div
            key={unit.id}
            className="group relative flex flex-col justify-between rounded-3xl border border-brand-200 bg-white p-6 shadow-md transition-all duration-200 hover:-translate-y-1 hover:shadow-xl dark:border-brand-800 dark:bg-brand-900"
          >
            <div className="space-y-4">
              {/* Unit Header Badge */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-brand-50 text-brand-700 dark:bg-brand-950 dark:text-brand-300">
                    <Home className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-serif text-lg font-bold text-brand-900 dark:text-white">
                      {unit.unitName}
                    </h3>
                    <p className="text-xs text-brand-500 font-medium">
                      {unit.projectName || 'GoodEarth Community'}
                    </p>
                  </div>
                </div>
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200/50">
                  <CheckCircle2 className="h-3 w-3" />
                  {unit.status || 'Active'}
                </span>
              </div>

              {/* Property Meta Details */}
              <div className="space-y-2.5 rounded-2xl bg-brand-50/50 p-4 dark:bg-brand-950/30 text-xs border border-brand-100 dark:border-brand-850">
                <div className="flex items-center justify-between text-brand-700 dark:text-brand-300">
                  <span className="flex items-center gap-1.5 text-brand-500 font-medium">
                    <Building2 className="h-3.5 w-3.5 text-brand-400" /> Project
                  </span>
                  <span className="font-semibold text-brand-900 dark:text-white">{unit.projectName || 'GoodEarth Community'}</span>
                </div>
                <div className="flex items-center justify-between text-brand-700 dark:text-brand-300">
                  <span className="flex items-center gap-1.5 text-brand-500 font-medium">
                    <Home className="h-3.5 w-3.5 text-brand-400" /> Unit Ref / Code
                  </span>
                  <span className="font-mono font-semibold text-brand-900 dark:text-white">{unit.unitId || unit.bookingId || unit.unitName}</span>
                </div>
                <div className="flex items-center justify-between text-brand-700 dark:text-brand-300">
                  <span className="flex items-center gap-1.5 text-brand-500 font-medium">
                    <HardHat className="h-3.5 w-3.5 text-brand-400" /> Construction Stage
                  </span>
                  <span className="font-semibold text-brand-800 dark:text-brand-200">{unit.constructionStage || 'Structure Completed'}</span>
                </div>
                <div className="flex items-center justify-between text-brand-700 dark:text-brand-300">
                  <span className="flex items-center gap-1.5 text-brand-500 font-medium">
                    <Calendar className="h-3.5 w-3.5 text-brand-400" /> Possession Date
                  </span>
                  <span className="font-semibold text-emerald-700 dark:text-emerald-400">{unit.possessionDate || 'Dec 2026'}</span>
                </div>
              </div>
            </div>

            {/* Open CTA Button */}
            <div className="pt-6">
              <button
                type="button"
                onClick={() => handleSelectProperty(unit)}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-brand-900 hover:bg-brand-950 text-white px-4 py-2.5 text-xs font-semibold shadow-md transition-all duration-150 cursor-pointer dark:bg-brand-700 dark:hover:bg-brand-600"
              >
                <span>Open Property</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SelectHomePage;
