import React, { useState } from 'react';
import {
  Bell,
  Check,
  ChevronDown,
  Moon,
  Sun,
  Sunrise,
  Sunset,
  Volume2,
  VolumeX,
  Wifi,
  WifiOff,
  RefreshCw,
  Settings,
  Sparkles,
  Store as StoreIcon,
  Shield,
  User as UserIcon,
  LogOut,
} from 'lucide-react';
import { AppNotification, AppSettings, Store, SyncState, TimeTheme, User } from '../../types';
import { LunaFox } from '../fox/LunaFox';
import { SoundPlayer } from '../../utils/audio';

interface AppHeaderProps {
  currentUser: User | null;
  activeStore: Store;
  allStores: Store[];
  settings: AppSettings;
  syncState: SyncState;
  notifications: AppNotification[];
  onSelectStore: (storeId: string) => void;
  onUpdateSettings: (newSettings: Partial<AppSettings>) => void;
  onOpenSettings: () => void;
  onOpenProfile: () => void;
  onOpenGuide: () => void;
  onLogout: () => void;
  onNotificationClick: (notif: AppNotification) => void;
  onMarkAllNotificationsRead: () => void;
  onTriggerSync: () => void;
}

export const AppHeader: React.FC<AppHeaderProps> = ({
  currentUser,
  activeStore,
  allStores,
  settings,
  syncState,
  notifications,
  onSelectStore,
  onUpdateSettings,
  onOpenSettings,
  onOpenProfile,
  onOpenGuide,
  onLogout,
  onNotificationClick,
  onMarkAllNotificationsRead,
  onTriggerSync,
}) => {
  const [showStoreDropdown, setShowStoreDropdown] = useState(false);
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);
  const [showThemeDropdown, setShowThemeDropdown] = useState(false);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const toggleSound = () => {
    const nextSound = !settings.soundEnabled;
    onUpdateSettings({ soundEnabled: nextSound });
    SoundPlayer.setSettings(!nextSound, settings.soundVolume);
    if (nextSound) {
      SoundPlayer.playFoxChirp();
    }
  };

  const cycleTheme = (theme: TimeTheme) => {
    onUpdateSettings({ themeMode: theme });
    setShowThemeDropdown(false);
    SoundPlayer.playCountBeep();
  };

  const getThemeIcon = () => {
    switch (settings.themeMode) {
      case 'night':
        return <Moon className="w-4 h-4 text-indigo-300" />;
      case 'morning':
        return <Sunrise className="w-4 h-4 text-amber-300" />;
      case 'day':
        return <Sun className="w-4 h-4 text-yellow-300" />;
      case 'sunset':
        return <Sunset className="w-4 h-4 text-orange-400" />;
      default:
        return <Sparkles className="w-4 h-4 text-cyan-300" />;
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full bg-[#0B0E14]/90 backdrop-blur-md border-b border-white/5 text-slate-100 select-none">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 h-16 sm:h-20 flex items-center justify-between gap-2">
        {/* Left: Lunatory Brand & Fox Avatar */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <div
            onClick={onOpenGuide}
            className="flex items-center gap-2 sm:gap-3 cursor-pointer group"
            title="Lunatory Inventory - Tap to speak with Luna"
          >
            <div className="w-9 h-9 sm:w-11 sm:h-11 bg-indigo-500/20 border border-indigo-400/30 rounded-2xl flex items-center justify-center relative transition-all group-hover:border-indigo-400/60 shadow-lg shadow-indigo-500/10 shrink-0">
              <LunaFox mood="idle" size="sm" />
              <span className="absolute -bottom-0.5 -right-0.5 flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500 shadow-[0_0_6px_#10b981]"></span>
              </span>
            </div>
            <div>
              <div className="flex items-center gap-1">
                <h1 className="text-base sm:text-xl font-semibold tracking-tight text-white font-heading">
                  Lunatory<span className="text-indigo-400 text-xs align-top ml-0.5 font-sans font-normal">™</span>
                </h1>
              </div>
              <p className="hidden xs:block text-[9px] sm:text-[10px] text-slate-500 uppercase tracking-widest font-medium truncate max-w-[120px] sm:max-w-[200px]">
                {activeStore.name}
              </p>
            </div>
          </div>

          {/* Store Switcher Pill */}
          <div className="relative ml-1 sm:ml-3">
            <button
              onClick={() => setShowStoreDropdown(!showStoreDropdown)}
              className="flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-medium transition-colors text-slate-300 hover:text-white"
            >
              <StoreIcon className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
              <span className="max-w-[75px] xs:max-w-[120px] sm:max-w-[170px] truncate font-medium">
                {activeStore.name}
              </span>
              <ChevronDown className="w-3 h-3 text-slate-400 ml-0.5 shrink-0" />
            </button>

            {showStoreDropdown && (
              <div className="absolute left-0 mt-2 w-64 bg-[#0B0E14]/95 border border-white/10 rounded-2xl shadow-2xl p-1.5 z-50 backdrop-blur-md animate-in fade-in slide-in-from-top-2">
                <div className="px-2.5 py-1.5 text-[10px] uppercase font-bold text-slate-500 tracking-widest">
                  Select Store Location
                </div>
                {allStores.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => {
                      onSelectStore(s.id);
                      setShowStoreDropdown(false);
                      SoundPlayer.playCountBeep();
                    }}
                    className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-xs text-left transition-colors ${
                      s.id === activeStore.id
                        ? 'bg-indigo-500/20 text-indigo-300 font-semibold border border-indigo-400/40'
                        : 'text-slate-300 hover:bg-white/5'
                    }`}
                  >
                    <div>
                      <div className="font-semibold text-white">{s.name}</div>
                      <div className="text-[10px] text-slate-500">{s.address}, {s.city}</div>
                    </div>
                    {s.id === activeStore.id && <Check className="w-4 h-4 text-indigo-400" />}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right: Actions, Sync, Theme, Notifications, User */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Sync Status Badge */}
          <button
            onClick={onTriggerSync}
            disabled={syncState.isSyncing}
            className={`hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
              !syncState.isOnline
                ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                : syncState.isSyncing
                ? 'bg-indigo-500/20 text-indigo-300 border-indigo-400/30 animate-pulse'
                : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
            }`}
            title={
              syncState.isOnline
                ? `Online - Synced (${syncState.queue.length} pending)`
                : 'Offline Mode - Changes saving locally'
            }
          >
            {!syncState.isOnline ? (
              <>
                <WifiOff className="w-3.5 h-3.5 text-amber-400" />
                <span>Offline ({syncState.queue.length})</span>
              </>
            ) : syncState.isSyncing ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-indigo-400" />
                <span>Syncing...</span>
              </>
            ) : (
              <>
                <div className="w-2 h-2 bg-emerald-500 rounded-full shadow-[0_0_8px_#10b981]"></div>
                <span>Online / Synced</span>
              </>
            )}
          </button>

          {/* Theme Sky Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowThemeDropdown(!showThemeDropdown)}
              className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-400 hover:text-white transition-colors"
              title="Change Sky Theme"
            >
              {getThemeIcon()}
            </button>

            {showThemeDropdown && (
              <div className="absolute right-0 mt-2 w-48 bg-[#0B0E14]/95 border border-white/10 rounded-2xl shadow-2xl p-1.5 z-50 backdrop-blur-md">
                <div className="px-2.5 py-1.5 text-[10px] uppercase font-bold text-slate-500 tracking-widest">
                  Sky Background
                </div>
                {[
                  { id: 'auto_time', label: 'Auto (Real Time)', icon: Sparkles },
                  { id: 'night', label: 'Starry Night', icon: Moon },
                  { id: 'morning', label: 'Soft Sunrise', icon: Sunrise },
                  { id: 'day', label: 'Cheerful Day', icon: Sun },
                  { id: 'sunset', label: 'Warm Sunset', icon: Sunset },
                ].map(({ id, label, icon: Icon }) => (
                  <button
                    key={id}
                    onClick={() => cycleTheme(id as TimeTheme)}
                    className={`w-full flex items-center gap-2 px-2.5 py-2 rounded-xl text-xs text-left transition-colors ${
                      settings.themeMode === id
                        ? 'bg-indigo-500/20 border border-indigo-400/40 text-indigo-300 font-semibold'
                        : 'text-slate-300 hover:bg-white/5'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{label}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Sound Toggle */}
          <button
            onClick={toggleSound}
            className={`p-2.5 rounded-xl border transition-colors ${
              settings.soundEnabled
                ? 'bg-white/5 hover:bg-white/10 border-white/10 text-indigo-300'
                : 'bg-rose-500/10 border-rose-500/30 text-slate-500 hover:text-slate-300'
            }`}
            title={settings.soundEnabled ? 'Mute Sounds' : 'Unmute Sounds'}
          >
            {settings.soundEnabled ? (
              <Volume2 className="w-4 h-4" />
            ) : (
              <VolumeX className="w-4 h-4" />
            )}
          </button>

          {/* Notifications Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowNotifDropdown(!showNotifDropdown)}
              className="relative p-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-400 hover:text-white transition-colors"
              title="Notifications"
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 min-w-4 px-1 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white shadow-sm">
                  {unreadCount}
                </span>
              )}
            </button>

            {showNotifDropdown && (
              <div className="absolute right-0 mt-2 w-80 bg-[#0B0E14]/95 border border-white/10 rounded-2xl shadow-2xl p-2 z-50 max-h-96 flex flex-col backdrop-blur-md">
                <div className="flex items-center justify-between px-3 py-2 border-b border-white/5">
                  <span className="text-xs font-bold text-white">Notifications</span>
                  {unreadCount > 0 && (
                    <button
                      onClick={onMarkAllNotificationsRead}
                      className="text-[11px] text-indigo-400 hover:underline font-medium"
                    >
                      Mark all read
                    </button>
                  )}
                </div>
                <div className="overflow-y-auto space-y-1.5 py-2 flex-1">
                  {notifications.length === 0 ? (
                    <div className="text-center py-6 text-xs text-slate-500">
                      No notifications yet!
                    </div>
                  ) : (
                    notifications.map((notif) => (
                      <div
                        key={notif.id}
                        onClick={() => {
                          onNotificationClick(notif);
                          setShowNotifDropdown(false);
                        }}
                        className={`p-3 rounded-xl text-xs cursor-pointer transition-colors ${
                          notif.read
                            ? 'bg-white/[0.02] text-slate-400'
                            : notif.priority === 'high'
                            ? 'bg-rose-500/10 text-rose-200 border border-rose-500/20'
                            : 'bg-indigo-500/10 text-indigo-200 border border-indigo-500/20'
                        }`}
                      >
                        <div className="font-semibold text-white">{notif.title}</div>
                        <div className="text-[11px] mt-0.5 line-clamp-2 text-slate-400">
                          {notif.message}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* User Profile Chip & Settings */}
          {currentUser && (
            <div className="flex items-center gap-1.5 sm:gap-2 pl-1 sm:pl-2 border-l border-white/10">
              <div
                onClick={onOpenProfile}
                className="cursor-pointer flex items-center gap-2 px-2.5 sm:px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition-colors group"
                title={`Profile: ${currentUser.name} • ${currentUser.title || currentUser.role}`}
              >
                <div
                  className="w-7 h-7 rounded-xl flex items-center justify-center text-xs font-bold text-white shadow-sm border border-white/20 shrink-0"
                  style={{ backgroundColor: currentUser.avatarColor || '#6366f1' }}
                >
                  {currentUser.avatarEmoji || currentUser.name.charAt(0)}
                </div>
                <div className="hidden sm:block text-left">
                  <div className="text-xs font-bold text-white leading-tight truncate max-w-[100px] group-hover:text-indigo-300">
                    {currentUser.name}
                  </div>
                  <div className="text-[10px] text-slate-400 font-medium truncate max-w-[105px]">
                    {currentUser.title || currentUser.role}
                  </div>
                </div>
              </div>

              <button
                onClick={onOpenSettings}
                className="p-2 sm:p-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-400 hover:text-white transition-colors"
                title="Settings & Sync"
              >
                <Settings className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
