import React, { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  Home,
  Building,
  ArrowRight,
  AlertTriangle,
} from 'lucide-react';
import { Card } from '../../../components/ui/Card';
import { StatusBadge } from '../../../components/ui/StatusBadge';
import { LoadingScreen } from '../../../components/common/LoadingScreen';
import { clientService } from '../../../services/client.service';
import { useUnitStore, ClientUnit } from '../../../store/unitStore';

export const MyHomePage: React.FC = () => {
  const navigate = useNavigate();
  const { units, activeUnit, setUnits, setActiveUnit } = useUnitStore();

  const { data: fetchedUnits, isLoading } = useQuery({
    queryKey: ['clientUnits'],
    queryFn: () => clientService.getOwnedUnits(),
  });

  useEffect(() => {
    if (fetchedUnits && Array.isArray(fetchedUnits)) {
      setUnits(fetchedUnits);
    }
  }, [fetchedUnits, setUnits]);

  if (isLoading) {
    return <LoadingScreen />;
  }

  const handleSelectUnit = (unit: ClientUnit) => {
    setActiveUnit(unit);
    const isCompleted = unit.isKycVerified || unit.kycStatus === 'SUBMITTED' || unit.kycStatus === 'VERIFIED';
    if (isCompleted) {
      navigate('/');
    } else {
      navigate('/onboarding?stage=KYC_PENDING');
    }
  };

  return (
    <div className="space-y-6 text-left max-w-5xl mx-auto pb-12">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-brand-900 via-brand-850 to-brand-950 p-6 sm:p-8 text-white shadow-xl">
        <div className="relative z-10 space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-800/80 border border-brand-700/50 text-[11px] font-semibold text-brand-200">
            <Home className="h-3.5 w-3.5 text-brand-400" />
            Homeowner Property Portfolio
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold tracking-tight">
            My Homes & Properties
          </h1>
          <p className="text-xs sm:text-sm text-brand-200 leading-relaxed max-w-2xl">
            Select an active property unit below to access its independent dashboard, construction updates, design studio, documents, and support services.
          </p>
        </div>
      </div>

      {/* Property Cards Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-serif text-xl font-bold text-brand-900 dark:text-white flex items-center gap-2">
            <Building className="h-5 w-5 text-brand-600" />
            Registered Units ({units.length})
          </h2>
        </div>

        {units.length === 0 ? (
          <Card>
            <div className="p-8 text-center space-y-3">
              <AlertTriangle className="h-10 w-10 text-brand-400 mx-auto" />
              <h3 className="text-base font-bold text-brand-900 dark:text-white">No Registered Properties Found</h3>
              <p className="text-xs text-brand-500 max-w-md mx-auto">
                If you recently booked a GoodEarth villa or apartment, please wait while our CRM syncs your deal record.
              </p>
            </div>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {units.map((unit) => {
              const isSelected = activeUnit?.id === unit.id;
              const isCompleted = unit.isKycVerified || unit.kycStatus === 'SUBMITTED' || unit.kycStatus === 'VERIFIED';

              return (
                <div
                  key={unit.id}
                  className={`relative rounded-2xl border p-6 transition-all duration-300 shadow-sm flex flex-col justify-between space-y-5 bg-white dark:bg-brand-900 ${
                    isSelected
                      ? 'border-brand-500 ring-2 ring-brand-500/20 dark:border-brand-600'
                      : 'border-brand-200/80 hover:border-brand-400 dark:border-brand-850'
                  }`}
                >
                  {/* Top Status & Badge */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-brand-400 font-mono">
                        {unit.projectCode ? `Project: ${unit.projectName} (${unit.projectCode})` : (unit.projectName || 'GoodEarth Community')}
                      </span>
                      <h3 className="text-lg font-bold text-brand-900 dark:text-white">
                        {unit.unitName}
                      </h3>
                    </div>

                    <StatusBadge
                      label={isCompleted ? 'KYC Completed' : 'KYC Pending'}
                      type={isCompleted ? 'success' : 'warning'}
                    />
                  </div>

                  {/* Summary Details */}
                  <div className="p-3.5 rounded-xl bg-brand-50/60 dark:bg-brand-950/40 border border-brand-100 dark:border-brand-850 grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <span className="block text-[10px] text-brand-400 font-bold uppercase">Lifecycle Status</span>
                      <span className="font-semibold text-brand-800 dark:text-brand-200">
                        {unit.status || 'Active Onboarding'}
                      </span>
                    </div>

                    <div>
                      <span className="block text-[10px] text-brand-400 font-bold uppercase">Document Vault</span>
                      <span className={`font-semibold ${isCompleted ? 'text-green-600' : 'text-amber-600'}`}>
                        {isCompleted ? 'Verified' : 'Verification Required'}
                      </span>
                    </div>
                  </div>

                  {/* Action Trigger */}
                  <div className="flex items-center justify-between pt-2 border-t border-brand-100 dark:border-brand-850">
                    <span className="text-[11px] text-brand-500 font-medium">
                      {isSelected ? '✓ Currently Active Unit' : 'Click to select unit'}
                    </span>

                    <button
                      type="button"
                      onClick={() => handleSelectUnit(unit)}
                      className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs transition-all shadow-sm ${
                        isCompleted
                          ? 'bg-brand-700 hover:bg-brand-800 text-white'
                          : 'bg-amber-600 hover:bg-amber-700 text-white'
                      }`}
                    >
                      {isCompleted ? 'Open Portal' : 'Continue KYC'}
                      <ArrowRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default MyHomePage;
