import React, { useState } from 'react';
import { Menu, Sun, Moon, Bell, User, LogOut, ChevronDown, Home } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { useUIStore } from '../../store/uiStore';
import { useAuthStore } from '../../store/authStore';
import { useUnitStore } from '../../store/unitStore';

export const Header: React.FC = () => {
  const queryClient = useQueryClient();
  const { theme, toggleTheme, toggleSidebar, toggleMobileSidebar } = useUIStore();
  const { isAuthenticated, user, logout } = useAuthStore();
  const { units, activeUnit, setActiveUnit } = useUnitStore();
  const [profileOpen, setProfileOpen] = useState(false);
  const [unitSelectOpen, setUnitSelectOpen] = useState(false);

  const isClient = user?.role === 'buyer';

  const handleSelectUnit = (unit: any) => {
    setActiveUnit(unit);
    setUnitSelectOpen(false);
    // Invalidate queries so active views automatically refresh
    queryClient.invalidateQueries();
  };

  return (
    <header className="sticky top-0 z-40 flex h-16 w-full items-center justify-between border-b border-brand-200 bg-white/90 backdrop-blur-md px-4 shadow-sm transition-all duration-300 dark:border-brand-800 dark:bg-brand-900/90">
      {/* Left: Toggles & Branding */}
      <div className="flex items-center gap-3">
        {/* Mobile menu trigger */}
        <button
          onClick={toggleMobileSidebar}
          className="rounded-lg p-2 text-brand-600 hover:bg-brand-50 focus:outline-none dark:text-brand-300 dark:hover:bg-brand-800 lg:hidden"
          aria-label="Toggle mobile menu"
        >
          <Menu className="h-5 w-5" />
        </button>

        {/* Desktop collapse trigger */}
        <button
          onClick={toggleSidebar}
          className="hidden rounded-lg p-2 text-brand-600 hover:bg-brand-50 focus:outline-none dark:text-brand-300 dark:hover:bg-brand-800 lg:block"
          aria-label="Toggle sidebar"
        >
          <Menu className="h-5 w-5" />
        </button>

        <span className="font-serif text-lg font-semibold tracking-wide text-brand-900 dark:text-white sm:text-xl">
          GoodEarth <span className="text-accent-600 dark:text-accent-400">Post-Sales</span>
        </span>
      </div>

      {/* Center: Active Unit Selector for Buyers */}
      {isClient && units.length > 0 && (
        <div className="relative hidden sm:block">
          <button
            type="button"
            onClick={() => setUnitSelectOpen(!unitSelectOpen)}
            className="flex items-center gap-2 rounded-xl bg-brand-50/80 px-3.5 py-1.5 border border-brand-200 text-xs font-semibold text-brand-900 dark:bg-brand-950/40 dark:border-brand-800 dark:text-white hover:border-brand-400 transition-all shadow-sm"
          >
            <Home className="h-4 w-4 text-brand-600 dark:text-brand-400" />
            <span>Active Unit:</span>
            <span className="font-bold text-brand-700 dark:text-brand-300 underline underline-offset-2">
              {activeUnit ? activeUnit.unitName : 'Select Property'}
            </span>
            <ChevronDown className="h-3.5 w-3.5 text-brand-400" />
          </button>

          {unitSelectOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setUnitSelectOpen(false)} />
              <div className="absolute left-0 mt-2 w-64 origin-top-left rounded-xl border border-brand-200 bg-white py-2 shadow-xl ring-1 ring-black/5 dark:border-brand-800 dark:bg-brand-900 z-20">
                <div className="px-3 py-1.5 border-b border-brand-100 dark:border-brand-800 text-[10px] font-bold uppercase tracking-wider text-brand-400">
                  Switch Active Property Unit
                </div>
                <div className="max-h-60 overflow-y-auto py-1">
                  {units.map((unit) => {
                    const isSelected = activeUnit?.id === unit.id;
                    return (
                      <button
                        key={unit.id}
                        type="button"
                        onClick={() => handleSelectUnit(unit)}
                        className={`w-full text-left px-4 py-2.5 text-xs font-semibold flex items-center justify-between transition-colors ${
                          isSelected
                            ? 'bg-brand-100 text-brand-900 dark:bg-brand-800 dark:text-white font-bold'
                            : 'text-brand-700 hover:bg-brand-50 dark:text-brand-300 dark:hover:bg-brand-800/50'
                        }`}
                      >
                        <div>
                          <div className="font-bold">{unit.unitName}</div>
                          {unit.projectName && (
                            <div className="text-[10px] text-brand-400 font-normal">{unit.projectName}</div>
                          )}
                        </div>
                        {isSelected && <span className="text-green-600 font-bold text-xs">✓ Active</span>}
                      </button>
                    );
                  })}
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* Right: Actions & User Info */}
      <div className="flex items-center gap-2 sm:gap-4">
        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="rounded-lg p-2 text-brand-600 hover:bg-brand-50 focus:outline-none dark:text-brand-300 dark:hover:bg-brand-800"
          aria-label="Toggle theme"
        >
          {theme === 'light' ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
        </button>

        {/* Notifications Mock */}
        <button
          className="relative rounded-lg p-2 text-brand-600 hover:bg-brand-50 focus:outline-none dark:text-brand-300 dark:hover:bg-brand-800"
          aria-label="View notifications"
        >
          <Bell className="h-5 w-5" />
          <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-accent-500" />
        </button>

        {/* Profile Dropdown */}
        {isAuthenticated && (
          <div className="relative">
            <button
              onClick={() => setProfileOpen(!profileOpen)}
              className="flex items-center gap-2 rounded-lg p-1.5 hover:bg-brand-50 dark:hover:bg-brand-800 transition-colors"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-100 text-brand-700 dark:bg-brand-800 dark:text-brand-300">
                <User className="h-4 w-4" />
              </div>
              <ChevronDown className="h-4 w-4 text-brand-500" />
            </button>

            {profileOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setProfileOpen(false)} />
                <div className="absolute right-0 mt-2 w-48 origin-top-right rounded-xl border border-brand-200 bg-white py-1 shadow-lg ring-1 ring-black/5 focus:outline-none dark:border-brand-800 dark:bg-brand-900 z-20">
                  <div className="border-b border-brand-100 px-4 py-2 dark:border-brand-800">
                    <p className="text-xs font-semibold text-brand-800 dark:text-brand-300">
                      {user?.name || 'Session Active'}
                    </p>
                    <p className="text-[10px] text-brand-400 font-mono truncate">{user?.email}</p>
                  </div>
                  <button
                    onClick={() => {
                      logout();
                      setProfileOpen(false);
                    }}
                    className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20"
                  >
                    <LogOut className="h-4 w-4" />
                    Sign out
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </header>
  );
};
