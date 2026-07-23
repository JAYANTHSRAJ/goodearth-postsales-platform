import React, { ComponentType, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Highlighter,
  CreditCard,
  Bell,
  User,
  Users,
  Building,
  GitMerge,
  Layers,
  FileText,
  FileSpreadsheet,
  Settings,
  Shield,
  X,
} from 'lucide-react';
import { useUIStore } from '../../store/uiStore';
import { useAuthStore } from '../../store/authStore';
import { useUnitStore } from '../../store/unitStore';
import { clientService } from '../../services/client.service';

interface NavItem {
  name: string;
  path: string;
  icon: ComponentType<{ className?: string }>;
  requiresUnit?: boolean;
}

const clientNavItems: NavItem[] = [
  { name: 'Applicant Information', path: '/client/applicant-info', icon: User, requiresUnit: false },
];

const crmNavItems: NavItem[] = [
  { name: 'Dashboard', path: '/', icon: LayoutDashboard },
  { name: 'Buyers', path: '/buyers', icon: Users },
  { name: 'Projects', path: '/projects', icon: Building },
  { name: 'Properties', path: '/properties', icon: Building },
  { name: 'Workflow', path: '/workflows', icon: GitMerge },
  { name: 'Construction', path: '/stages', icon: Layers },
  { name: 'Design Reviews', path: '/annotations', icon: Highlighter },
  { name: 'Documents', path: '/documents', icon: FileText },
  { name: 'Finance', path: '/payments', icon: CreditCard },
  { name: 'Notifications', path: '/notifications', icon: Bell },
  { name: 'Reports', path: '/reports', icon: FileSpreadsheet },
  { name: 'Settings', path: '/settings', icon: Settings },
  { name: 'Administration', path: '/admin', icon: Shield },
];

export const Sidebar: React.FC = () => {
  const { sidebarCollapsed, mobileSidebarOpen, toggleMobileSidebar } = useUIStore();
  const { user } = useAuthStore();
  const { setUnits } = useUnitStore();
  const location = useLocation();

  const isClient = user?.role === 'buyer';

  // Automatically fetch owned units for buyer on sidebar load
  useEffect(() => {
    if (isClient && user) {
      clientService
        .getOwnedUnits()
        .then((units) => {
          if (Array.isArray(units)) {
            setUnits(units);
          }
        })
        .catch((e) => console.error('Failed to load owned units', e));
    }
  }, [isClient, user]);

  const visibleNavItems = isClient ? clientNavItems : crmNavItems;

  const sidebarClass = `
    fixed inset-y-0 left-0 z-50 flex flex-col border-r border-brand-200 bg-white transition-all duration-300 dark:border-brand-800 dark:bg-brand-900
    lg:static lg:z-0
    ${sidebarCollapsed ? 'w-20' : 'w-64'}
    ${mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
  `;

  return (
    <>
      {/* Mobile Backdrop */}
      {mobileSidebarOpen && (
        <div
          onClick={toggleMobileSidebar}
          className="fixed inset-0 z-40 bg-brand-950/40 backdrop-blur-sm lg:hidden"
        />
      )}

      <aside className={sidebarClass}>
        {/* Header */}
        <div className="flex h-16 items-center justify-between px-4 border-b border-brand-100 dark:border-brand-800">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-brand-700 dark:bg-brand-500 flex items-center justify-center text-white font-serif font-bold text-lg">
              G
            </div>
            {!sidebarCollapsed && (
              <span className="font-serif text-sm font-semibold text-brand-800 dark:text-brand-200 uppercase tracking-wider">
                Post-Sales
              </span>
            )}
          </div>
          {mobileSidebarOpen && (
            <button
              onClick={toggleMobileSidebar}
              className="rounded-lg p-2 text-brand-600 hover:bg-brand-50 dark:text-brand-300 dark:hover:bg-brand-800 lg:hidden"
              aria-label="Close menu"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>

        {/* Navigation list */}
        <nav className="flex-1 space-y-1.5 px-3 py-4 overflow-y-auto">
          {visibleNavItems.map((item) => {
            const Icon = item.icon;
            const isItemActive = location.pathname === item.path || (location.pathname + location.search) === item.path;

            return (
              <NavLink
                key={item.name}
                to={item.path}
                className={({ isActive }) => `
                  flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium transition-all duration-200
                  ${
                    isActive || isItemActive
                      ? 'bg-brand-700 text-white shadow-md dark:bg-brand-600'
                      : 'text-brand-600 hover:bg-brand-50 hover:text-brand-900 dark:text-brand-300 dark:hover:bg-brand-800 dark:hover:text-white'
                  }
                `}
              >
                <Icon className="h-5 w-5 shrink-0" />
                {!sidebarCollapsed && <span className="truncate">{item.name}</span>}
              </NavLink>
            );
          })}
        </nav>
      </aside>
    </>
  );
};

export default Sidebar;
