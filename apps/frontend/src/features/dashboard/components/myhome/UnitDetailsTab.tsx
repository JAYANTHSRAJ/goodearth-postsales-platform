import React from 'react';
import {
  Building,
  Home,
  Layers,
  Grid,
  ArrowUpRight,
  Maximize2,
  Compass,
  BedDouble,
  Calendar,
  Clock,
  UserCheck,
  Users,
} from 'lucide-react';
import { ClientHomeDetails } from '../../../../services/client.service';

interface UnitDetailsTabProps {
  details?: ClientHomeDetails | null;
  isLoading?: boolean;
}

export const UnitDetailsTab: React.FC<UnitDetailsTabProps> = ({ details, isLoading }) => {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 12 }).map((_, i) => (
          <div
            key={i}
            className="h-28 rounded-2xl bg-brand-100/50 dark:bg-brand-900/40 animate-pulse border border-brand-200/50 dark:border-brand-850"
          />
        ))}
      </div>
    );
  }

  const items = [
    {
      label: 'Project Name',
      value: details?.project || 'GoodEarth Community',
      icon: Building,
      badge: 'Gated Community',
    },
    {
      label: 'Unit Number',
      value: details?.unitNumber || details?.villa || 'Unit 101',
      icon: Home,
      badge: 'Allocated',
    },
    {
      label: 'Block / Phase',
      value: details?.block || 'Phase 1 / Block A',
      icon: Layers,
      badge: 'Premium Sector',
    },
    {
      label: 'Unit Type',
      value: details?.unitType || '4 BHK Eco-Luxury Villa',
      icon: Grid,
      badge: 'Signature Series',
    },
    {
      label: 'Floor Specification',
      value: details?.floor || 'Ground + 2 Upper Floors',
      icon: ArrowUpRight,
      badge: 'Triplex Layout',
    },
    {
      label: 'Built-up Area',
      value: details?.area || '3,850 Sq. Ft.',
      icon: Maximize2,
      badge: 'Super Built Area',
    },
    {
      label: 'Orientation / Facing',
      value: details?.facing || 'East Facing',
      icon: Compass,
      badge: 'Vastu Compliant',
    },
    {
      label: 'Bedrooms & Configuration',
      value: details?.bedrooms || '4 Bedrooms + Servant Suite',
      icon: BedDouble,
      badge: 'Ensuite Bathrooms',
    },
    {
      label: 'Purchase / Booking Date',
      value: details?.purchaseDate || '2024-03-15',
      icon: Calendar,
      badge: 'Agreement Signed',
    },
    {
      label: 'Expected Possession Date',
      value: details?.expectedHandover || details?.possessionDate || '2025-12-31',
      icon: Clock,
      badge: 'On Schedule',
    },
    {
      label: 'Primary Homeowner',
      value: details?.primaryBuyer || 'Primary Buyer Name',
      icon: UserCheck,
      badge: 'Primary Account',
    },
    {
      label: 'Co-owner / Co-applicant',
      value: details?.coOwner || 'None Specified',
      icon: Users,
      badge: 'Joint Holder',
    },
  ];

  return (
    <div className="space-y-6 text-left">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-serif text-xl font-bold text-brand-900 dark:text-white">
            Property Specifications & Overview
          </h2>
          <p className="text-xs text-brand-500 dark:text-brand-400 mt-0.5">
            Architectural characteristics and ownership details registered with GoodEarth CRM.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {items.map((item, idx) => {
          const Icon = item.icon;
          return (
            <div
              key={idx}
              className="group relative rounded-2xl border border-brand-200/80 bg-white dark:bg-brand-900/90 dark:border-brand-800 p-5 shadow-sm hover:shadow-md hover:border-amber-500/40 dark:hover:border-amber-500/40 transition-all duration-300 flex flex-col justify-between"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="p-2.5 rounded-xl bg-brand-50 dark:bg-brand-850 text-brand-700 dark:text-brand-300 group-hover:bg-amber-500/10 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                  <Icon className="h-5 w-5" />
                </div>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-brand-100/70 text-brand-700 dark:bg-brand-800 dark:text-brand-300">
                  {item.badge}
                </span>
              </div>

              <div className="mt-4 space-y-1">
                <span className="block text-[11px] font-bold text-brand-400 dark:text-brand-400 uppercase tracking-wider">
                  {item.label}
                </span>
                <p className="text-base font-bold text-brand-900 dark:text-white truncate">
                  {item.value}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
