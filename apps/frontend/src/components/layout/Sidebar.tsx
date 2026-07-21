import { ComponentType } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Home,
  Highlighter,
  Hammer,
  CreditCard,
  ClipboardCheck,
  LifeBuoy,
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

interface NavItem {
  name: string;
  path: string;
  icon: ComponentType<{ className?: string }>;
}

const clientNavItems: NavItem[] = [
  { name: 'Dashboard', path: '/', icon: LayoutDashboard },
  { name: 'My Home', path: '/my-home', icon: Home },
  { name: 'Design Studio', path: '/design-studio', icon: Highlighter },
  { name: 'Construction Updates', path: '/construction-updates', icon: Hammer },
  { name: 'Finance', path: '/finance', icon: CreditCard },
  { name: 'My Selections', path: '/selections', icon: ClipboardCheck },
  { name: 'Support', path: '/support', icon: LifeBuoy },
  { name: 'Notifications', path: '/notifications', icon: Bell },
  { name: 'Profile', path: '/profile', icon: User },
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

  const isClient = user?.role === 'buyer';
  let visibleNavItems = isClient ? clientNavItems : crmNavItems;

  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const currentStageParam = searchParams.get('stage');

  if (isClient && user?.onboardingStage && user.onboardingStage !== 'COMPLETED') {
    const stage = user.onboardingStage;
    const items = [];
    if (stage === 'PROFILE_PENDING' || stage === 'KYC_PENDING' || stage === 'PAYMENT_PENDING') {
      items.push({ name: 'Profile', path: '/onboarding?stage=PROFILE_PENDING', icon: User, stageKey: 'PROFILE_PENDING' });
    }
    if (stage === 'KYC_PENDING' || stage === 'PAYMENT_PENDING') {
      items.push({ name: 'KYC', path: '/onboarding?stage=KYC_PENDING', icon: ClipboardCheck, stageKey: 'KYC_PENDING' });
    }
    if (stage === 'PAYMENT_PENDING') {
      items.push({ name: 'Booking Payment', path: '/onboarding?stage=PAYMENT_PENDING', icon: CreditCard, stageKey: 'PAYMENT_PENDING' });
    }
    visibleNavItems = items;
  }

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
            const isItemActive = (item as any).stageKey
              ? (currentStageParam === (item as any).stageKey || (!currentStageParam && (user?.onboardingStage || 'PROFILE_PENDING') === (item as any).stageKey))
              : (location.pathname === item.path);

            return (
              <NavLink
                key={item.name}
                to={item.path}
                className={`
                  relative flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium transition-all duration-200 group
                  ${
                    isItemActive
                      ? 'bg-brand-100 text-brand-900 dark:bg-brand-800 dark:text-white font-semibold'
                      : 'text-brand-600 hover:bg-brand-50 hover:text-brand-900 dark:text-brand-400 dark:hover:bg-brand-800/40 dark:hover:text-white'
                  }
                `}
                onClick={() => {
                  if (mobileSidebarOpen) toggleMobileSidebar();
                }}
              >
                {/* Active Accent Left Border */}
                {isItemActive && (
                  <span className="absolute left-1 top-2.5 bottom-2.5 w-1 rounded bg-accent-600 dark:bg-accent-400" />
                )}
                <Icon className="h-5 w-5 shrink-0 transition-transform group-hover:scale-105" />
                {!sidebarCollapsed && <span className="truncate">{item.name}</span>}
              </NavLink>
            );
          })}
        </nav>

        {/* Footer info (collapsible) */}
        {!sidebarCollapsed && (
          <div className="border-t border-brand-100 p-4 dark:border-brand-800">
            <div className="rounded-xl bg-brand-50 p-3 dark:bg-brand-950/40">
              <p className="text-xs font-semibold text-brand-800 dark:text-brand-200">
                Environment:
              </p>
              <p className="text-[10px] font-mono text-brand-500 dark:text-brand-400 mt-0.5">
                {import.meta.env.VITE_APP_ENV || 'development'}
              </p>
            </div>
          </div>
        )}
      </aside>
    </>
  );
};
