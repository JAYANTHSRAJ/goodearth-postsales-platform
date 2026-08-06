import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Home, FileSpreadsheet, FolderGit2, Hammer, Users, CreditCard, HelpCircle, AlertCircle, RefreshCw } from 'lucide-react';
import { clientService } from '../../../services/client.service';
import { useUnitStore } from '../../../store/unitStore';
import { ProjectHeader } from '../components/myhome/ProjectHeader';
import { UnitDetailsTab } from '../components/myhome/UnitDetailsTab';
import { FloorPlansTab } from '../components/myhome/FloorPlansTab';
import { DocumentsTab } from '../components/myhome/DocumentsTab';
import { ProjectUpdatesTab } from '../components/myhome/ProjectUpdatesTab';
import { FamilyAccessTab } from '../components/myhome/FamilyAccessTab';
import { Card } from '../../../components/ui/Card';

export type TabType = 'unit-details' | 'floor-plans' | 'documents' | 'project-updates' | 'family-access' | 'finance' | 'support';

export const MyHomePage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('unit-details');
  const { activeUnit } = useUnitStore();

  const {
    data: homeDetails,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ['clientHomeDetails', activeUnit?.id || activeUnit?.workflowId],
    queryFn: () => clientService.getHomeDetails(activeUnit?.workflowId || null),
  });

  const tabs = [
    { id: 'unit-details' as TabType, label: 'Overview & Specs', icon: Home },
    { id: 'floor-plans' as TabType, label: 'Floor Plans', icon: FileSpreadsheet, priority: true },
    { id: 'documents' as TabType, label: 'Documents', icon: FolderGit2 },
    { id: 'project-updates' as TabType, label: 'Construction Progress', icon: Hammer },
    { id: 'family-access' as TabType, label: 'Family Members', icon: Users },
    { id: 'finance' as TabType, label: 'Payments', icon: CreditCard },
    { id: 'support' as TabType, label: 'Support', icon: HelpCircle },
  ];

  const handleNavigateTab = (tabId: string) => {
    setActiveTab(tabId as TabType);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (isError) {
    return (
      <div className="space-y-6 text-left max-w-7xl mx-auto pb-16">
        <Card>
          <div className="p-8 text-center space-y-4">
            <AlertCircle className="h-10 w-10 text-red-500 mx-auto" />
            <h3 className="text-lg font-bold text-brand-900 dark:text-white">Unable to Load My Home Dashboard</h3>
            <p className="text-xs text-brand-500 dark:text-brand-400 max-w-md mx-auto">
              {(error as Error)?.message || 'A network error occurred while querying your property details from Zoho CRM.'}
            </p>
            <button
              onClick={() => refetch()}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-600 text-white transition-colors shadow-md"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Retry Connection
            </button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 text-left max-w-7xl mx-auto pb-16">
      {/* 1. Luxury Project Header */}
      <ProjectHeader details={homeDetails} isLoading={isLoading} />

      {/* 2. Navigation Tabs Bar */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none border-b border-brand-200/80 dark:border-brand-800">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`group flex items-center gap-2.5 px-4 sm:px-5 py-3 rounded-2xl text-xs sm:text-sm font-bold transition-all duration-200 shrink-0 ${
                isActive
                  ? 'bg-brand-900 text-white shadow-md dark:bg-amber-500 dark:text-brand-950'
                  : 'text-brand-600 hover:text-brand-900 hover:bg-brand-100/60 dark:text-brand-300 dark:hover:text-white dark:hover:bg-brand-850'
              }`}
            >
              <Icon className={`h-4 w-4 ${isActive ? 'text-amber-400 dark:text-brand-950' : 'text-brand-400 group-hover:text-brand-700'}`} />
              <span>{tab.label}</span>
              {tab.priority && (
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                  isActive ? 'bg-amber-400 text-brand-950 dark:bg-brand-950 dark:text-amber-300' : 'bg-amber-500/15 text-amber-600 dark:text-amber-400'
                }`}>
                  Zoho CRM
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* 3. Active Tab Content Rendering */}
      <div className="transition-all duration-300">
        {activeTab === 'unit-details' && (
          <UnitDetailsTab details={homeDetails} isLoading={isLoading} onNavigateTab={handleNavigateTab} />
        )}
        {activeTab === 'floor-plans' && <FloorPlansTab />}
        {activeTab === 'documents' && <DocumentsTab />}
        {activeTab === 'project-updates' && <ProjectUpdatesTab />}
        {activeTab === 'family-access' && <FamilyAccessTab details={homeDetails} />}
        {activeTab === 'finance' && <DocumentsTab />}
        {activeTab === 'support' && <DocumentsTab />}
      </div>
    </div>
  );
};

export default MyHomePage;
