import React from 'react';
import {
  LayoutDashboard,
  Package,
  QrCode,
  Calculator,
  Trash2,
  Truck,
  BarChart3,
  ShieldAlert,
  Sparkles,
  Settings,
  Radio,
} from 'lucide-react';
import { UserRole } from '../../types';
import { SoundPlayer } from '../../utils/audio';

export type NavTab = 
  | 'dashboard'
  | 'inventory'
  | 'count'
  | 'scan'
  | 'orders'
  | 'truck_day'
  | 'waste'
  | 'reports'
  | 'admin'
  | 'settings';

interface BottomNavigationProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  userRole: UserRole;
  lowStockCount: number;
  peersCount?: number;
}

export const BottomNavigation: React.FC<BottomNavigationProps> = ({
  currentTab,
  onSelectTab,
  userRole,
  lowStockCount,
  peersCount = 0,
}) => {
  const isManagerOrAdmin = userRole === 'manager' || userRole === 'gm' || userRole === 'admin';
  const isGmOrAdmin = userRole === 'gm' || userRole === 'admin';
  const isAdmin = userRole === 'admin';

  // Primary mobile bottom tabs (5 tabs with center elevated scanner)
  const mobileTabs: Array<{
    id: NavTab;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: number;
    highlight?: boolean;
    hasPeerDot?: boolean;
  }> = [
    { id: 'dashboard', label: 'Home', icon: LayoutDashboard },
    { id: 'inventory', label: 'Items', icon: Package, badge: lowStockCount > 0 ? lowStockCount : undefined },
    { id: 'scan', label: 'Scan', icon: QrCode, highlight: true },
    { id: 'count', label: 'Count', icon: Calculator },
    { id: 'settings', label: 'Settings', icon: Settings, hasPeerDot: peersCount > 0 },
  ];

  // Secondary tabs
  const secondaryTabs: Array<{
    id: NavTab;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    requiresAdmin?: boolean;
  }> = [
    { id: 'waste', label: 'Waste Log', icon: Trash2 },
    { id: 'orders', label: 'Truck Orders', icon: Truck },
    { id: 'reports', label: 'Reports & Stats', icon: BarChart3 },
    ...(isGmOrAdmin ? [{ id: 'admin' as NavTab, label: isAdmin ? 'Admin / Dev' : 'GM Operations', icon: ShieldAlert, requiresAdmin: true }] : []),
  ];

  const handleTabClick = (tab: NavTab) => {
    onSelectTab(tab);
    SoundPlayer.playCountBeep();
  };

  return (
    <>
      {/* Desktop Top Sub-Bar for Quick Category / Extra Tabs */}
      {isManagerOrAdmin && (
        <div className="hidden lg:block bg-[#0B0E14]/90 border-b border-white/5 py-2 px-6 select-none backdrop-blur-md">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mr-2">
                Operations:
              </span>
              {secondaryTabs.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => handleTabClick(id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                    currentTab === id
                      ? 'bg-indigo-500/20 border border-indigo-400/40 text-indigo-300 shadow-sm'
                      : 'text-slate-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{label}</span>
                </button>
              ))}
            </div>
            
            <div className="text-xs text-slate-400 flex items-center gap-3">
              {peersCount > 0 && (
                <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                  <Radio className="w-3.5 h-3.5 animate-pulse" />
                  <span>{peersCount} Nearby Device{peersCount > 1 ? 's' : ''} Synced</span>
                </div>
              )}
              <div className="flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                <span>Hardee’s Harrogate Offline Mesh Engine</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Secondary Quick Bar (just above bottom nav if on mobile and manager) */}
      <div className="lg:hidden fixed bottom-16 inset-x-0 z-30 bg-[#0B0E14]/90 backdrop-blur-md border-t border-white/5 px-2 py-1 flex items-center justify-center gap-1 overflow-x-auto">
        <button
          onClick={() => handleTabClick('waste')}
          className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold flex items-center gap-1 shrink-0 ${
            currentTab === 'waste' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' : 'text-slate-400 hover:text-white'
          }`}
        >
          <Trash2 className="w-3 h-3" />
          <span>Waste</span>
        </button>
        <button
          onClick={() => handleTabClick('orders')}
          className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold flex items-center gap-1 shrink-0 ${
            currentTab === 'orders' ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30' : 'text-slate-400 hover:text-white'
          }`}
        >
          <Truck className="w-3 h-3" />
          <span>Orders</span>
        </button>
        <button
          onClick={() => handleTabClick('reports')}
          className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold flex items-center gap-1 shrink-0 ${
            currentTab === 'reports' ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30' : 'text-slate-400 hover:text-white'
          }`}
        >
          <BarChart3 className="w-3 h-3" />
          <span>Reports</span>
        </button>
        {isGmOrAdmin && (
          <button
            onClick={() => handleTabClick('admin')}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold flex items-center gap-1 shrink-0 ${
              currentTab === 'admin' ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30' : 'text-slate-400 hover:text-white'
            }`}
          >
            <ShieldAlert className="w-3 h-3" />
            <span>{isAdmin ? 'Admin' : 'GM'}</span>
          </button>
        )}
      </div>

      {/* Mobile Bottom Navigation Bar */}
      <nav className="fixed bottom-0 inset-x-0 z-40 bg-[#0B0E14]/95 backdrop-blur-xl border-t border-white/10 text-white select-none lg:hidden pb-safe">
        <div className="grid grid-cols-5 h-16 max-w-lg mx-auto px-1">
          {mobileTabs.map(({ id, label, icon: Icon, badge, highlight, hasPeerDot }) => {
            const isActive = currentTab === id;
            return (
              <button
                key={id}
                onClick={() => handleTabClick(id)}
                className={`relative flex flex-col items-center justify-center py-1 transition-all ${
                  isActive ? 'text-indigo-300' : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                {highlight ? (
                  <div
                    className={`p-2.5 -mt-5 rounded-full border transition-all shadow-lg ${
                      isActive
                        ? 'bg-indigo-500 text-white border-indigo-300 shadow-indigo-500/30'
                        : 'bg-indigo-600/80 text-white border-white/20 shadow-indigo-500/20'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                  </div>
                ) : (
                  <div className="relative">
                    <Icon className={`w-5 h-5 transition-transform ${isActive ? 'scale-110 text-indigo-300' : ''}`} />
                    {badge !== undefined && (
                      <span className="absolute -top-1.5 -right-2.5 flex h-4 min-w-4 px-1 items-center justify-center rounded-full bg-rose-500 text-[9px] font-bold text-white shadow-sm">
                        {badge}
                      </span>
                    )}
                    {hasPeerDot && (
                      <span className="absolute -top-1 -right-1 flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500 shadow-[0_0_6px_#10b981]"></span>
                      </span>
                    )}
                  </div>
                )}
                <span className={`text-[10px] mt-1 font-medium ${isActive ? 'font-bold text-indigo-300' : ''}`}>
                  {label}
                </span>
                {isActive && !highlight && (
                  <span className="absolute bottom-1 w-1.5 h-1.5 rounded-full bg-indigo-400 shadow-[0_0_6px_#818cf8]" />
                )}
              </button>
            );
          })}
        </div>
      </nav>

      {/* Desktop Main Navigation Bar (when on wide screens) */}
      <div className="hidden lg:block bg-[#0B0E14]/85 border-b border-white/5 px-6 select-none backdrop-blur-md">
        <div className="max-w-7xl mx-auto flex items-center justify-between py-2.5">
          <div className="flex items-center gap-2">
            {[
              { id: 'dashboard' as NavTab, label: 'Home', icon: LayoutDashboard },
              { id: 'inventory' as NavTab, label: 'Items', icon: Package, badge: lowStockCount > 0 ? lowStockCount : undefined },
              { id: 'scan' as NavTab, label: 'Barcode & Camera Scan', icon: QrCode },
              { id: 'count' as NavTab, label: 'Count Audits', icon: Calculator },
              { id: 'waste' as NavTab, label: 'Waste Tracking', icon: Trash2 },
            ].map(({ id, label, icon: Icon, badge }) => {
              const isActive = currentTab === id;
              return (
                <button
                  key={id}
                  onClick={() => handleTabClick(id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all relative ${
                    isActive
                      ? 'bg-indigo-500/20 border border-indigo-400/40 text-indigo-300 shadow-sm'
                      : 'text-slate-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{label}</span>
                  {badge !== undefined && (
                    <span className="px-1.5 py-0.2 text-[10px] font-bold rounded-full bg-rose-500 text-white">
                      {badge}
                    </span>
                  )}
                </button>
              );
            })}

            {isManagerOrAdmin && (
              <>
                <div className="h-6 w-px bg-white/10 mx-1" />
                {[
                  { id: 'orders' as NavTab, label: 'Truck Orders', icon: Truck },
                  { id: 'reports' as NavTab, label: 'Reports', icon: BarChart3 },
                  ...(isGmOrAdmin ? [{ id: 'admin' as NavTab, label: isAdmin ? 'Admin / Dev' : 'GM Operations', icon: ShieldAlert }] : []),
                ].map(({ id, label, icon: Icon }) => {
                  const isActive = currentTab === id;
                  return (
                    <button
                      key={id}
                      onClick={() => handleTabClick(id)}
                      className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-semibold transition-all ${
                        isActive
                          ? 'bg-indigo-500/20 border border-indigo-400/40 text-indigo-300 shadow-sm'
                          : 'text-slate-400 hover:text-white hover:bg-white/5'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span>{label}</span>
                    </button>
                  );
                })}
              </>
            )}
          </div>

          {/* Right Side Settings Tab in Desktop Nav */}
          <div>
            <button
              onClick={() => handleTabClick('settings')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all border ${
                currentTab === 'settings'
                  ? 'bg-indigo-500/20 border-indigo-400/40 text-indigo-300 shadow-sm'
                  : 'bg-white/5 hover:bg-white/10 border-white/10 text-slate-300 hover:text-white'
              }`}
            >
              <Settings className="w-4 h-4 text-indigo-400" />
              <span>Settings & Sync</span>
              {peersCount > 0 && (
                <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  {peersCount} Nearby
                </span>
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

