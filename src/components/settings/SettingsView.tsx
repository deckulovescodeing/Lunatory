import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Settings as SettingsIcon,
  Wifi,
  WifiOff,
  Radio,
  Server,
  HardDrive,
  RefreshCw,
  QrCode,
  Download,
  Upload,
  CheckCircle2,
  AlertTriangle,
  Volume2,
  VolumeX,
  Moon,
  Sun,
  Sunrise,
  Sunset,
  Sparkles,
  Smartphone,
  Laptop,
  Tablet,
  Store as StoreIcon,
  Shield,
  LogOut,
  Send,
  Camera,
  Layers,
  Clock,
  Check,
  FileSpreadsheet,
  HelpCircle,
  Database,
  ArrowDownUp,
  Sliders,
  ShieldAlert,
  Terminal,
  Wrench,
} from 'lucide-react';
import {
  AppSettings,
  NearbyPeer,
  ServerSyncConfig,
  Store,
  SyncBundlePayload,
  SyncState,
  TimeTheme,
  User,
} from '../../types';
import { storage } from '../../services/storage';
import { p2pSync } from '../../services/p2pSync';
import { SoundPlayer } from '../../utils/audio';
import { LunaFox } from '../fox/LunaFox';
import { StoreManagerSection } from './StoreManagerSection';
import { CompanionAppDownloadSection } from './CompanionAppDownloadSection';

interface SettingsViewProps {
  currentUser: User | null;
  activeStore: Store;
  allStores?: Store[];
  settings: AppSettings;
  syncState: SyncState;
  onSelectStore?: (storeId: string) => void;
  onSaveStore?: (store: Store) => void;
  onDeleteStore?: (storeId: string) => void;
  onUpdateSettings: (newSettings: Partial<AppSettings>) => void;
  onLogout: () => void;
  onOpenGuide?: () => void;
  onToggleOfflineSim?: () => void;
  isDevUnlocked?: boolean;
  onOpenDevTweaks?: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  currentUser,
  activeStore,
  allStores = [],
  settings,
  syncState,
  onSelectStore,
  onSaveStore,
  onDeleteStore,
  onUpdateSettings,
  onLogout,
  onOpenGuide,
  onToggleOfflineSim,
  isDevUnlocked = false,
  onOpenDevTweaks,
}) => {
  // Local state for tabs in settings - default to stores management or sync
  const [activeSubSection, setActiveSubSection] = useState<'stores' | 'companion_app' | 'sync' | 'p2p' | 'server' | 'theme_audio' | 'backup'>('stores');

  // Server sync form state
  const [serverUrl, setServerUrl] = useState(settings.serverSync?.serverUrl || window.location.origin);
  const [apiToken, setApiToken] = useState(settings.serverSync?.apiToken || '');
  const [serverEnabled, setServerEnabled] = useState(settings.serverSync?.enabled || false);
  const [autoSyncInterval, setAutoSyncInterval] = useState(settings.serverSync?.autoSyncIntervalSec || 0);
  const [isTestingServer, setIsTestingServer] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; latencyMs: number; message: string; version?: string } | null>(null);
  const [serverActionLoading, setServerActionLoading] = useState<string | null>(null);
  const [serverActionMessage, setServerActionMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // P2P State
  const [deviceName, setDeviceName] = useState(settings.deviceName || 'Kitchen Terminal');
  const [p2pEnabled, setP2pEnabled] = useState(settings.p2pMeshEnabled !== false);
  const [nearbyPeers, setNearbyPeers] = useState<NearbyPeer[]>([]);
  const [isBroadcasting, setIsBroadcasting] = useState(false);
  const [broadcastSuccess, setBroadcastSuccess] = useState(false);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string | null>(null);
  const [isGeneratingQr, setIsGeneratingQr] = useState(false);
  const [manualJsonInput, setManualJsonInput] = useState('');
  const [manualImportMsg, setManualImportMsg] = useState<{ success: boolean; text: string } | null>(null);

  // Backup & Restore
  const [backupStatus, setBackupStatus] = useState<string | null>(null);

  // Sync state tracking from P2P service
  useEffect(() => {
    setNearbyPeers(p2pSync.getNearbyPeers());
    const unsub = p2pSync.onPeersChanged((peers) => {
      setNearbyPeers(peers);
    });
    return () => unsub();
  }, []);

  // Update server state if settings change
  useEffect(() => {
    if (settings.serverSync) {
      setServerUrl(settings.serverSync.serverUrl || window.location.origin);
      setApiToken(settings.serverSync.apiToken || '');
      setServerEnabled(settings.serverSync.enabled);
      setAutoSyncInterval(settings.serverSync.autoSyncIntervalSec || 0);
    }
    if (settings.deviceName) {
      setDeviceName(settings.deviceName);
    }
  }, [settings]);

  // Handle Server test
  const handleTestServer = async () => {
    setIsTestingServer(true);
    setTestResult(null);
    SoundPlayer.playCountBeep();
    try {
      const res = await storage.testServerConnection(serverUrl, apiToken);
      setTestResult(res);
      if (res.success) {
        SoundPlayer.playSuccessFanfare();
      } else {
        SoundPlayer.playAlertChime();
      }
    } catch (e: any) {
      setTestResult({
        success: false,
        latencyMs: 0,
        message: e.message || 'Connection test failed',
      });
      SoundPlayer.playAlertChime();
    } finally {
      setIsTestingServer(false);
    }
  };

  // Save server settings
  const handleSaveServerConfig = () => {
    const newConfig: ServerSyncConfig = {
      enabled: serverEnabled,
      serverUrl: serverUrl.trim(),
      apiToken: apiToken.trim(),
      autoSyncIntervalSec: autoSyncInterval,
      serverStatus: serverEnabled ? (settings.serverSync?.serverStatus || 'idle') : 'disabled',
      lastServerSync: settings.serverSync?.lastServerSync,
    };
    onUpdateSettings({ serverSync: newConfig });
    setServerActionMessage({ type: 'success', text: 'Server configuration saved successfully!' });
    SoundPlayer.playCountBeep();
    setTimeout(() => setServerActionMessage(null), 4000);
  };

  // Push to server
  const handlePushToServer = async () => {
    setServerActionLoading('push');
    setServerActionMessage(null);
    try {
      const res = await storage.pushToServer(serverUrl, apiToken, activeStore.id);
      if (res.success) {
        setServerActionMessage({ type: 'success', text: res.message });
        SoundPlayer.playSuccessFanfare();
      } else {
        setServerActionMessage({ type: 'error', text: res.message });
        SoundPlayer.playAlertChime();
      }
    } catch (e: any) {
      setServerActionMessage({ type: 'error', text: e.message });
    } finally {
      setServerActionLoading(null);
    }
  };

  // Pull from server
  const handlePullFromServer = async () => {
    setServerActionLoading('pull');
    setServerActionMessage(null);
    try {
      const res = await storage.pullFromServer(serverUrl, apiToken, activeStore.id);
      if (res.success) {
        setServerActionMessage({ type: 'success', text: res.message });
        SoundPlayer.playSuccessFanfare();
      } else {
        setServerActionMessage({ type: 'error', text: res.message });
        SoundPlayer.playAlertChime();
      }
    } catch (e: any) {
      setServerActionMessage({ type: 'error', text: e.message });
    } finally {
      setServerActionLoading(null);
    }
  };

  // 2-Way Sync
  const handleTwoWaySync = async () => {
    setServerActionLoading('twoway');
    setServerActionMessage(null);
    try {
      const res = await storage.twoWaySync(serverUrl, apiToken, activeStore.id);
      if (res.success) {
        setServerActionMessage({ type: 'success', text: 'Two-way synchronization completed successfully!' });
        SoundPlayer.playSuccessFanfare();
      } else {
        setServerActionMessage({ type: 'error', text: res.message });
        SoundPlayer.playAlertChime();
      }
    } catch (e: any) {
      setServerActionMessage({ type: 'error', text: e.message });
    } finally {
      setServerActionLoading(null);
    }
  };

  // Handle P2P Broadcast
  const handleBroadcastMesh = () => {
    setIsBroadcasting(true);
    SoundPlayer.playCountBeep();
    storage.broadcastCurrentStoreState(activeStore.id);
    setTimeout(() => {
      setIsBroadcasting(false);
      setBroadcastSuccess(true);
      setTimeout(() => setBroadcastSuccess(false), 3000);
    }, 600);
  };

  // Generate Offline QR Code
  const handleGenerateQrSync = async () => {
    setIsGeneratingQr(true);
    try {
      const bundle = storage.createSyncBundle(activeStore.id);
      const url = await p2pSync.generateQRCodeDataURL(bundle);
      setQrCodeDataUrl(url);
      SoundPlayer.playCountBeep();
    } catch (err: any) {
      alert('Could not generate QR: ' + err.message);
    } finally {
      setIsGeneratingQr(false);
    }
  };

  // Handle Manual JSON Import
  const handleImportManualJson = () => {
    if (!manualJsonInput.trim()) return;
    try {
      const parsed = JSON.parse(manualJsonInput);
      if (parsed.type === 'FULL_SYNC' || parsed.inventory) {
        const res = storage.importFullBackupJSON(manualJsonInput);
        setManualImportMsg({ success: res.success, text: res.message });
        if (res.success) {
          SoundPlayer.playSuccessFanfare();
          setManualJsonInput('');
        }
      } else {
        const res = storage.handleIncomingSyncBundle(parsed as SyncBundlePayload);
        setManualImportMsg({ success: res.success, text: res.message });
        if (res.success) {
          SoundPlayer.playSuccessFanfare();
          setManualJsonInput('');
        }
      }
    } catch (e: any) {
      setManualImportMsg({ success: false, text: 'Invalid JSON: ' + e.message });
      SoundPlayer.playAlertChime();
    }
  };

  // Theme & Audio helpers
  const handleThemeChange = (theme: TimeTheme) => {
    onUpdateSettings({ themeMode: theme });
    SoundPlayer.playCountBeep();
  };

  const handleVolumeChange = (vol: number) => {
    onUpdateSettings({ soundVolume: vol });
    SoundPlayer.setSettings(!settings.soundEnabled, vol);
    SoundPlayer.playFoxChirp();
  };

  // Backup downloads
  const handleDownloadBackup = () => {
    const jsonStr = storage.exportFullBackupJSON();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `hardees-${activeStore.storeNumber}-backup-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setBackupStatus('Backup exported to file successfully!');
    setTimeout(() => setBackupStatus(null), 3000);
  };

  const handleDownloadCSV = () => {
    const csvStr = storage.exportInventoryCSV();
    const blob = new Blob([csvStr], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `hardees-inventory-${activeStore.storeNumber}-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6 pb-24 text-white select-none">
      {/* Top Banner & Header */}
      <div className="bg-gradient-to-r from-slate-900/90 via-indigo-950/70 to-slate-900/90 border border-white/10 rounded-3xl p-6 shadow-2xl relative overflow-hidden backdrop-blur-xl">
        <div className="absolute right-6 top-1/2 -translate-y-1/2 opacity-10 pointer-events-none hidden md:block">
          <SettingsIcon className="w-56 h-56 text-indigo-400" />
        </div>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-indigo-600/30 border border-indigo-400/30 flex items-center justify-center text-indigo-400 shadow-inner">
              <LunaFox mood="happy" size="md" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-black font-heading text-white tracking-tight">
                  System Settings & Sync Hub
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  v2.4.0 Offline-First
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1 max-w-xl">
                Configure offline storage, sync with nearby devices via local mesh, or connect to a custom server whenever you choose to host one.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isDevUnlocked && (
              <button
                onClick={() => {
                  SoundPlayer.playCountBeep();
                  if (onOpenDevTweaks) onOpenDevTweaks();
                }}
                className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-300 hover:to-orange-400 text-slate-950 font-black text-xs flex items-center gap-2 shadow-lg shadow-amber-500/25 transition-all active:scale-95 animate-pulse"
                title="Developer Master Options Unlocked"
              >
                <Terminal className="w-4 h-4 text-slate-950" />
                <span>Developer Options & Tweaks</span>
              </button>
            )}

            <button
              onClick={handleBroadcastMesh}
              disabled={isBroadcasting}
              className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-indigo-600/30 transition-all active:scale-95 disabled:opacity-50"
            >
              <Radio className={`w-4 h-4 ${isBroadcasting ? 'animate-spin' : 'animate-pulse'}`} />
              <span>{isBroadcasting ? 'Broadcasting...' : 'Sync Nearby Devices'}</span>
            </button>
          </div>
        </div>

        {/* Sub-Navigation Tabs - Responsive Grid/Pills with complete visibility */}
        <div className="flex flex-wrap items-center gap-2 mt-6 pt-4 border-t border-white/10">
          {[
            { id: 'stores', label: 'Stores & Delivery Schedule', icon: StoreIcon, badge: `${allStores.length}` },
            { id: 'companion_app', label: 'Companion App & Packages', icon: Server, badge: 'Win/Linux/Android' },
            { id: 'sync', label: 'Offline & Sync Overview', icon: Layers },
            { id: 'p2p', label: `P2P Nearby Mesh (${nearbyPeers.length})`, icon: Radio },
            { id: 'server', label: 'Custom Server Hosting', icon: Server },
            { id: 'theme_audio', label: 'Theme & Audio', icon: Sparkles },
            { id: 'backup', label: 'Backup & Database', icon: Database },
          ].map(({ id, label, icon: Icon, badge }) => (
            <button
              key={id}
              onClick={() => {
                setActiveSubSection(id as any);
                SoundPlayer.playCountBeep();
              }}
              className={`px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 ${
                activeSubSection === id
                  ? 'bg-amber-400 text-slate-950 font-black shadow-lg shadow-amber-400/20 border border-amber-300'
                  : 'text-slate-300 bg-slate-950/60 hover:text-white hover:bg-slate-800 border border-slate-800'
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${activeSubSection === id ? 'text-slate-950' : 'text-slate-400'}`} />
              <span>{label}</span>
              {badge && (
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                  activeSubSection === id ? 'bg-slate-950/20 text-slate-950' : 'bg-slate-800 text-amber-300'
                }`}>
                  {badge}
                </span>
              )}
            </button>
          ))}

          {isDevUnlocked && (
            <button
              onClick={() => {
                SoundPlayer.playCountBeep();
                if (onOpenDevTweaks) onOpenDevTweaks();
              }}
              className="px-3.5 py-2.5 rounded-xl text-xs font-black transition-all flex items-center gap-2 shrink-0 bg-amber-400/20 text-amber-300 border border-amber-400/50 hover:bg-amber-400/30 shadow-md"
            >
              <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
              <span>Master Tweaks Window</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Content Area based on active tab */}
      <AnimatePresence mode="wait">
        {/* TAB 0: STORES & DELIVERY SCHEDULE */}
        {activeSubSection === 'stores' && (
          <motion.div
            key="stores"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <StoreManagerSection
              allStores={allStores.length > 0 ? allStores : [activeStore]}
              activeStore={activeStore}
              currentUser={currentUser}
              onSelectStore={(id) => {
                if (onSelectStore) onSelectStore(id);
                else storage.setActiveStoreId(id);
              }}
              onSaveStore={(st) => {
                if (onSaveStore) onSaveStore(st);
                else storage.saveStore(st);
              }}
              onDeleteStore={(id) => {
                if (onDeleteStore) onDeleteStore(id);
                else storage.deleteStore(id);
              }}
            />
          </motion.div>
        )}

        {/* TAB 0.5: COMPANION APP & MULTI-STORE PACKAGES */}
        {activeSubSection === 'companion_app' && (
          <motion.div
            key="companion_app"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <CompanionAppDownloadSection />
          </motion.div>
        )}

        {/* TAB 1: SYNC & OFFLINE ARCHITECTURE OVERVIEW */}
        {activeSubSection === 'sync' && (
          <motion.div
            key="sync"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-6"
          >
            {/* Mode 1: Pure Standalone Offline */}
            <div className="bg-slate-900/80 border border-slate-700/80 rounded-3xl p-6 flex flex-col justify-between shadow-lg relative overflow-hidden">
              <div className="space-y-4">
                <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
                  <HardDrive className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center justify-between">
                    <h3 className="text-base font-bold text-white">100% Offline-First</h3>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      Active
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                    Zero server required. All store inventory, daily counts, waste logs, and truck deliveries are stored locally in your browser storage.
                  </p>
                </div>

                <div className="p-3 rounded-2xl bg-slate-950/60 border border-white/5 space-y-1.5 text-xs text-slate-300">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>Works in walk-in freezers without Wi-Fi</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>Instant barcode & camera label scanning</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>Full manual JSON & CSV backup exports</span>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-white/5 flex items-center justify-between text-xs text-slate-400">
                <span>Local Storage Engine</span>
                <span className="font-semibold text-slate-200">Ready & Stable</span>
              </div>
            </div>

            {/* Mode 2: Nearby Device Mesh */}
            <div className="bg-slate-900/80 border border-indigo-500/40 rounded-3xl p-6 flex flex-col justify-between shadow-lg relative overflow-hidden">
              <div className="space-y-4">
                <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                  <Radio className="w-5 h-5 animate-pulse" />
                </div>
                <div>
                  <div className="flex items-center justify-between">
                    <h3 className="text-base font-bold text-white">P2P Nearby Sync</h3>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      nearbyPeers.length > 0
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        : 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                    }`}>
                      {nearbyPeers.length} Peer{nearbyPeers.length === 1 ? '' : 's'} Online
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                    Automatically shares counts and stock updates with other store iPads, tablets, or terminals on the local network in real-time.
                  </p>
                </div>

                <div className="p-3 rounded-2xl bg-slate-950/60 border border-white/5 space-y-1.5 text-xs text-slate-300">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                    <span>Cross-device real-time sync</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                    <span>Air-gapped QR code sync support</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                    <span>Automatic conflict resolution</span>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-white/5 flex items-center justify-between">
                <button
                  onClick={() => setActiveSubSection('p2p')}
                  className="w-full py-2 rounded-xl bg-indigo-600/30 hover:bg-indigo-600/50 border border-indigo-500/40 text-indigo-300 font-bold text-xs flex items-center justify-center gap-1.5 transition-all"
                >
                  <Radio className="w-3.5 h-3.5" />
                  <span>Configure Nearby Mesh</span>
                </button>
              </div>
            </div>

            {/* Mode 3: Optional Central Server */}
            <div className="bg-slate-900/80 border border-slate-700/80 rounded-3xl p-6 flex flex-col justify-between shadow-lg relative overflow-hidden">
              <div className="space-y-4">
                <div className="w-10 h-10 rounded-2xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-purple-400">
                  <Server className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center justify-between">
                    <h3 className="text-base font-bold text-white">Self-Hosted Server</h3>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      settings.serverSync?.enabled
                        ? settings.serverSync?.serverStatus === 'connected'
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        : 'bg-slate-800 text-slate-400 border border-white/10'
                    }`}>
                      {settings.serverSync?.enabled ? (settings.serverSync?.serverStatus === 'connected' ? 'Connected' : 'Configured') : 'Optional / Off'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                    Have a central PC or server hosted in your back office or cloud? Connect it anytime with 2-way sync, or leave it off with zero penalty.
                  </p>
                </div>

                <div className="p-3 rounded-2xl bg-slate-950/60 border border-white/5 space-y-1.5 text-xs text-slate-300">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                    <span>REST API sync endpoints included</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                    <span>Configurable auto-sync interval</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                    <span>Full push, pull & ping diagnostics</span>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-white/5 flex items-center justify-between">
                <button
                  onClick={() => setActiveSubSection('server')}
                  className="w-full py-2 rounded-xl bg-purple-600/30 hover:bg-purple-600/50 border border-purple-500/40 text-purple-300 font-bold text-xs flex items-center justify-center gap-1.5 transition-all"
                >
                  <Server className="w-3.5 h-3.5" />
                  <span>Configure Server Hosting</span>
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* TAB 2: P2P NEARBY MESH & AIR-GAPPED QR SYNC */}
        {activeSubSection === 'p2p' && (
          <motion.div
            key="p2p"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            {/* Device Identity & Mesh Toggle */}
            <div className="bg-slate-900/80 border border-slate-700/80 rounded-3xl p-6 shadow-xl space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <Radio className="w-5 h-5 text-indigo-400" />
                    <span>Nearby Device Mesh Network</span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Broadcast inventory updates and sync count sessions across all store devices automatically.
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-xs font-medium text-slate-300">Enable P2P Mesh</span>
                  <button
                    onClick={() => {
                      const next = !p2pEnabled;
                      setP2pEnabled(next);
                      onUpdateSettings({ p2pMeshEnabled: next });
                      SoundPlayer.playCountBeep();
                    }}
                    className={`w-12 h-6 rounded-full transition-colors relative p-0.5 ${
                      p2pEnabled ? 'bg-indigo-600' : 'bg-slate-800 border border-slate-700'
                    }`}
                  >
                    <div
                      className={`w-5 h-5 rounded-full bg-white transition-transform ${
                        p2pEnabled ? 'translate-x-6' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1.5">
                    This Terminal's Device Name
                  </label>
                  <input
                    type="text"
                    value={deviceName}
                    onChange={(e) => {
                      setDeviceName(e.target.value);
                      onUpdateSettings({ deviceName: e.target.value });
                    }}
                    placeholder="e.g. Kitchen Line Tablet 1, Walk-In iPad, Drive-Thru Station"
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-950/80 border border-slate-700 text-white text-xs focus:outline-none focus:border-indigo-400"
                  />
                  <span className="text-[11px] text-slate-500 mt-1 block">
                    Identifies your terminal when broadcasting counts to teammates.
                  </span>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1.5">
                    Assigned Store Location
                  </label>
                  <div className="px-4 py-2.5 rounded-xl bg-slate-950/80 border border-slate-700 text-white text-xs flex items-center justify-between">
                    <span className="font-semibold text-slate-200">
                      {activeStore.name} (#{activeStore.storeNumber})
                    </span>
                    <span className="text-[10px] text-emerald-400 font-bold bg-emerald-500/20 px-2 py-0.5 rounded">
                      Matching Mesh ID
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-500 mt-1 block">
                    Devices on the same store ID automatically peer with one another.
                  </span>
                </div>
              </div>
            </div>

            {/* Discovered Nearby Devices Grid */}
            <div className="bg-slate-900/80 border border-slate-700/80 rounded-3xl p-6 shadow-xl space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-white flex items-center gap-2">
                    <Smartphone className="w-4 h-4 text-emerald-400" />
                    <span>Discovered Store Terminals ({nearbyPeers.length})</span>
                  </h4>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Active terminals transmitting on this store's local frequency.
                  </p>
                </div>

                <button
                  onClick={handleBroadcastMesh}
                  disabled={isBroadcasting}
                  className="px-3 py-1.5 rounded-xl bg-indigo-600/30 hover:bg-indigo-600/50 border border-indigo-500/30 text-indigo-300 font-bold text-xs flex items-center gap-1.5 transition-all"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isBroadcasting ? 'animate-spin' : ''}`} />
                  <span>Broadcast Now</span>
                </button>
              </div>

              {nearbyPeers.length === 0 ? (
                <div className="p-8 rounded-2xl bg-slate-950/60 border border-dashed border-slate-800 text-center space-y-3">
                  <div className="w-12 h-12 rounded-full bg-slate-800/80 text-slate-400 flex items-center justify-center mx-auto">
                    <Radio className="w-6 h-6 animate-pulse text-indigo-400" />
                  </div>
                  <div className="max-w-sm mx-auto">
                    <p className="text-sm font-bold text-slate-300">Listening for nearby store devices...</p>
                    <p className="text-xs text-slate-500 mt-1">
                      Open this app in another browser tab, iPad, or tablet connected to the same store to test real-time P2P sync.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {nearbyPeers.map((peer) => (
                    <div
                      key={peer.peerId}
                      className="p-4 rounded-2xl bg-slate-950/80 border border-indigo-500/30 flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
                          <Tablet className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="font-bold text-white text-xs">{peer.deviceName}</div>
                          <div className="text-[10px] text-slate-400">
                            {peer.userName} • <span className="text-emerald-400 font-medium">Online</span>
                          </div>
                        </div>
                      </div>

                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
                    </div>
                  ))}
                </div>
              )}

              {broadcastSuccess && (
                <div className="p-3 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs font-semibold flex items-center gap-2">
                  <Check className="w-4 h-4" />
                  <span>Store snapshot broadcasted to all active mesh peers successfully!</span>
                </div>
              )}
            </div>

            {/* Air-Gapped Manual QR Code Transfer & JSON Importer */}
            <div className="bg-slate-900/80 border border-slate-700/80 rounded-3xl p-6 shadow-xl space-y-4">
              <div>
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <QrCode className="w-4 h-4 text-amber-400" />
                  <span>Air-Gapped QR Code & Direct Payload Sync</span>
                </h4>
                <p className="text-xs text-slate-400 mt-0.5">
                  Transfer data between tablets without Wi-Fi by displaying a high-density QR code or pasting a sync bundle.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Generate QR */}
                <div className="p-5 rounded-2xl bg-slate-950/80 border border-white/5 flex flex-col items-center text-center space-y-3">
                  <div className="w-10 h-10 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center">
                    <QrCode className="w-5 h-5" />
                  </div>
                  <div>
                    <h5 className="font-bold text-white text-xs">Share Terminal Data via QR</h5>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Generate a QR code of current inventory and counts for another device to scan.
                    </p>
                  </div>

                  {qrCodeDataUrl ? (
                    <div className="p-3 bg-white rounded-2xl shadow-xl">
                      <img src={qrCodeDataUrl} alt="Store Sync QR" className="w-44 h-44 object-contain" />
                    </div>
                  ) : (
                    <button
                      onClick={handleGenerateQrSync}
                      disabled={isGeneratingQr}
                      className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-2 shadow-lg shadow-amber-500/20 transition-all"
                    >
                      <QrCode className="w-4 h-4" />
                      <span>{isGeneratingQr ? 'Encoding...' : 'Generate Sync QR Code'}</span>
                    </button>
                  )}
                </div>

                {/* Paste / Manual Import */}
                <div className="p-5 rounded-2xl bg-slate-950/80 border border-white/5 space-y-3">
                  <div className="flex items-center gap-2">
                    <Upload className="w-4 h-4 text-indigo-400" />
                    <h5 className="font-bold text-white text-xs">Manual Sync Bundle / JSON Import</h5>
                  </div>
                  <textarea
                    rows={4}
                    value={manualJsonInput}
                    onChange={(e) => setManualJsonInput(e.target.value)}
                    placeholder="Paste exported sync bundle JSON or backup string here..."
                    className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-[11px] font-mono focus:outline-none focus:border-indigo-400"
                  />
                  <button
                    onClick={handleImportManualJson}
                    disabled={!manualJsonInput.trim()}
                    className="w-full py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 disabled:opacity-40 transition-all"
                  >
                    <ArrowDownUp className="w-3.5 h-3.5" />
                    <span>Merge Sync Bundle</span>
                  </button>

                  {manualImportMsg && (
                    <div className={`p-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 ${
                      manualImportMsg.success
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                    }`}>
                      {manualImportMsg.success ? <Check className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
                      <span>{manualImportMsg.text}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* TAB 3: CUSTOM SELF-HOSTED SERVER HOSTING */}
        {activeSubSection === 'server' && (
          <motion.div
            key="server"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            <div className="bg-slate-900/80 border border-slate-700/80 rounded-3xl p-6 shadow-xl space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <Server className="w-5 h-5 text-purple-400" />
                    <span>Custom / Self-Hosted Server Configuration</span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Connect this terminal to a central Node.js/Express server or cloud instance whenever you choose to run one.
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-xs font-medium text-slate-300">Enable Server Sync</span>
                  <button
                    onClick={() => {
                      const next = !serverEnabled;
                      setServerEnabled(next);
                      SoundPlayer.playCountBeep();
                    }}
                    className={`w-12 h-6 rounded-full transition-colors relative p-0.5 ${
                      serverEnabled ? 'bg-purple-600' : 'bg-slate-800 border border-slate-700'
                    }`}
                  >
                    <div
                      className={`w-5 h-5 rounded-full bg-white transition-transform ${
                        serverEnabled ? 'translate-x-6' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
              </div>

              {/* Server Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1.5">
                    Server Base URL
                  </label>
                  <input
                    type="text"
                    value={serverUrl}
                    onChange={(e) => setServerUrl(e.target.value)}
                    placeholder="e.g. http://192.168.1.50:3000 or https://hardees-inventory.local"
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-950/80 border border-slate-700 text-white text-xs font-mono focus:outline-none focus:border-purple-400"
                  />
                  <span className="text-[11px] text-slate-500 mt-1 block">
                    The backend endpoint providing `/api/sync/*` routes.
                  </span>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1.5">
                    API Authorization Token (Optional)
                  </label>
                  <input
                    type="password"
                    value={apiToken}
                    onChange={(e) => setApiToken(e.target.value)}
                    placeholder="Bearer token or API Secret Key"
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-950/80 border border-slate-700 text-white text-xs font-mono focus:outline-none focus:border-purple-400"
                  />
                  <span className="text-[11px] text-slate-500 mt-1 block">
                    Passed in the `Authorization: Bearer` header if your server requires authentication.
                  </span>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1.5">
                    Automatic Background Sync Interval
                  </label>
                  <select
                    value={autoSyncInterval}
                    onChange={(e) => setAutoSyncInterval(parseInt(e.target.value, 10))}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-950/80 border border-slate-700 text-white text-xs focus:outline-none focus:border-purple-400"
                  >
                    <option value={0}>Manual Only (No background polling)</option>
                    <option value={30}>Every 30 seconds</option>
                    <option value={60}>Every 1 minute</option>
                    <option value={300}>Every 5 minutes</option>
                    <option value={900}>Every 15 minutes</option>
                  </select>
                  <span className="text-[11px] text-slate-500 mt-1 block">
                    Pushes latest updates automatically when terminal is idle.
                  </span>
                </div>

                <div className="flex flex-col justify-end">
                  <div className="flex gap-2">
                    <button
                      onClick={handleTestServer}
                      disabled={isTestingServer}
                      className="flex-1 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 border border-white/20 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${isTestingServer ? 'animate-spin' : ''}`} />
                      <span>{isTestingServer ? 'Pinging Server...' : 'Test Connection'}</span>
                    </button>
                    <button
                      onClick={handleSaveServerConfig}
                      className="px-6 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-purple-600/30 transition-all"
                    >
                      <Check className="w-4 h-4" />
                      <span>Save Config</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Ping Result Banner */}
              {testResult && (
                <div className={`p-4 rounded-2xl border text-xs font-medium flex items-center justify-between ${
                  testResult.success
                    ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
                    : 'bg-rose-500/15 border-rose-500/30 text-rose-300'
                }`}>
                  <div className="flex items-center gap-2.5">
                    {testResult.success ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                    ) : (
                      <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
                    )}
                    <div>
                      <div className="font-bold">{testResult.message}</div>
                      {testResult.version && (
                        <div className="text-[11px] opacity-80">Server Software Version: {testResult.version}</div>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-mono font-bold text-xs">{testResult.latencyMs}ms</div>
                    <div className="text-[10px] opacity-75">Roundtrip Ping</div>
                  </div>
                </div>
              )}
            </div>

            {/* Server Action Controls: Push, Pull, 2-Way Sync */}
            <div className="bg-slate-900/80 border border-slate-700/80 rounded-3xl p-6 shadow-xl space-y-4">
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <ArrowDownUp className="w-4 h-4 text-purple-400" />
                <span>Manual Server Data Exchange</span>
              </h4>
              <p className="text-xs text-slate-400">
                Instantly synchronize your local store inventory, waste, and count records with the central backend.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                <button
                  onClick={handlePushToServer}
                  disabled={serverActionLoading !== null}
                  className="p-4 rounded-2xl bg-slate-950/80 hover:bg-slate-950 border border-purple-500/30 text-left transition-all group disabled:opacity-50"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="w-8 h-8 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Upload className="w-4 h-4" />
                    </div>
                    {serverActionLoading === 'push' && <RefreshCw className="w-3.5 h-3.5 animate-spin text-purple-400" />}
                  </div>
                  <div className="font-bold text-white text-xs">Push Store to Server</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">Upload local counts & inventory snapshot</div>
                </button>

                <button
                  onClick={handlePullFromServer}
                  disabled={serverActionLoading !== null}
                  className="p-4 rounded-2xl bg-slate-950/80 hover:bg-slate-950 border border-purple-500/30 text-left transition-all group disabled:opacity-50"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="w-8 h-8 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Download className="w-4 h-4" />
                    </div>
                    {serverActionLoading === 'pull' && <RefreshCw className="w-3.5 h-3.5 animate-spin text-purple-400" />}
                  </div>
                  <div className="font-bold text-white text-xs">Pull Latest from Server</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">Fetch remote updates & merge locally</div>
                </button>

                <button
                  onClick={handleTwoWaySync}
                  disabled={serverActionLoading !== null}
                  className="p-4 rounded-2xl bg-purple-900/30 hover:bg-purple-900/40 border border-purple-400/40 text-left transition-all group disabled:opacity-50"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="w-8 h-8 rounded-xl bg-purple-500/30 text-purple-300 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <RefreshCw className="w-4 h-4" />
                    </div>
                    {serverActionLoading === 'twoway' && <RefreshCw className="w-3.5 h-3.5 animate-spin text-purple-300" />}
                  </div>
                  <div className="font-bold text-white text-xs">Full 2-Way Synchronize</div>
                  <div className="text-[10px] text-purple-300/80 mt-0.5">Push updates then pull remote state</div>
                </button>
              </div>

              {serverActionMessage && (
                <div className={`p-3 rounded-xl text-xs font-semibold flex items-center gap-2 ${
                  serverActionMessage.type === 'success'
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                }`}>
                  {serverActionMessage.type === 'success' ? <Check className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
                  <span>{serverActionMessage.text}</span>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* TAB 4: THEME & AUDIO PREFERENCES */}
        {activeSubSection === 'theme_audio' && (
          <motion.div
            key="theme_audio"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            {/* Sky Theme Selector */}
            <div className="bg-slate-900/80 border border-slate-700/80 rounded-3xl p-6 shadow-xl space-y-4">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <span>Sky Canvas & Time-of-Day Themes</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Select your aesthetic preference or synchronize dynamically with your store's local clock.
                </p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 pt-2">
                {[
                  { id: 'auto_time', label: 'Auto Sky', desc: 'Sync with real clock', icon: Sparkles },
                  { id: 'night', label: 'Starry Night', desc: 'Deep indigo & stars', icon: Moon },
                  { id: 'morning', label: 'Soft Sunrise', desc: 'Warm gentle dawn', icon: Sunrise },
                  { id: 'day', label: 'Cheerful Day', desc: 'Bright sunny blue', icon: Sun },
                  { id: 'sunset', label: 'Warm Sunset', desc: 'Gold & rose horizon', icon: Sunset },
                ].map(({ id, label, desc, icon: Icon }) => (
                  <button
                    key={id}
                    onClick={() => handleThemeChange(id as TimeTheme)}
                    className={`p-3.5 rounded-2xl border text-left transition-all ${
                      settings.themeMode === id
                        ? 'bg-indigo-600 border-amber-400/80 text-white shadow-lg'
                        : 'bg-slate-950/70 border-slate-800 text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 font-bold mb-1">
                      <Icon className="w-4 h-4" />
                      <span>{label}</span>
                    </div>
                    <div className="text-[10px] text-slate-400 opacity-90">{desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Audio & Sound Effects */}
            <div className="bg-slate-900/80 border border-slate-700/80 rounded-3xl p-6 shadow-xl space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <Volume2 className="w-4 h-4 text-amber-400" />
                    <span>Sound Effects & Mascot Audio</span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Audio chimes for scanner confirmations, count updates, and Luna fox mascots.
                  </p>
                </div>

                <button
                  onClick={() => {
                    const next = !settings.soundEnabled;
                    onUpdateSettings({ soundEnabled: next });
                    SoundPlayer.setSettings(!next, settings.soundVolume);
                    if (next) SoundPlayer.playFoxChirp();
                  }}
                  className={`px-4 py-2 rounded-xl font-bold text-xs transition-all ${
                    settings.soundEnabled
                      ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                      : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {settings.soundEnabled ? 'Enabled' : 'Muted'}
                </button>
              </div>

              {settings.soundEnabled && (
                <div className="pt-2">
                  <div className="flex items-center justify-between text-xs text-slate-300 mb-1.5">
                    <span>Master Audio Volume</span>
                    <span className="font-mono font-bold text-amber-400">{Math.round(settings.soundVolume * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={settings.soundVolume}
                    onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                    className="w-full accent-amber-400"
                  />
                </div>
              )}
            </div>

            {/* Current Session & Logout */}
            {currentUser && (
              <div className="bg-indigo-950/40 border border-indigo-900/40 rounded-3xl p-6 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-2xl bg-amber-400 text-slate-950 font-black text-lg flex items-center justify-center shadow-md">
                    {currentUser.name.charAt(0)}
                  </div>
                  <div>
                    <div className="font-bold text-white text-sm">{currentUser.name}</div>
                    <div className="text-xs text-amber-300 uppercase tracking-wider font-semibold">
                      {currentUser.role} • Security PIN: {currentUser.pinCode}
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5">
                      Store: {activeStore.name} (#{activeStore.storeNumber})
                    </div>
                  </div>
                </div>

                <button
                  onClick={onLogout}
                  className="px-5 py-2.5 rounded-xl bg-rose-600/20 hover:bg-rose-600/30 border border-rose-500/30 text-rose-300 text-xs font-bold flex items-center gap-2 self-start sm:self-auto transition-all"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign Out Session</span>
                </button>
              </div>
            )}
          </motion.div>
        )}

        {/* TAB 5: BACKUP & DATABASE EXPORT */}
        {activeSubSection === 'backup' && (
          <motion.div
            key="backup"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            <div className="bg-slate-900/80 border border-slate-700/80 rounded-3xl p-6 shadow-xl space-y-4">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Database className="w-4 h-4 text-emerald-400" />
                  <span>Store Database Export & Cold Backup</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Export complete backups of your inventory catalog, session counts, truck deliveries, and waste entries.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div className="p-5 rounded-2xl bg-slate-950/80 border border-white/5 space-y-3">
                  <div className="flex items-center gap-2.5">
                    <Download className="w-4 h-4 text-emerald-400" />
                    <h5 className="font-bold text-white text-xs">Export Complete JSON Database</h5>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Comprehensive full store state backup compatible with any Lunatory terminal restore.
                  </p>
                  <button
                    onClick={handleDownloadBackup}
                    className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20 transition-all"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download JSON Backup</span>
                  </button>
                </div>

                <div className="p-5 rounded-2xl bg-slate-950/80 border border-white/5 space-y-3">
                  <div className="flex items-center gap-2.5">
                    <FileSpreadsheet className="w-4 h-4 text-indigo-400" />
                    <h5 className="font-bold text-white text-xs">Export Inventory CSV Spreadsheet</h5>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Excel and Google Sheets compatible table with SKUs, barcodes, quantities, and pars.
                  </p>
                  <button
                    onClick={handleDownloadCSV}
                    className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/20 transition-all"
                  >
                    <FileSpreadsheet className="w-4 h-4" />
                    <span>Download CSV Sheet</span>
                  </button>
                </div>
              </div>

              {backupStatus && (
                <div className="p-3 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs font-semibold flex items-center gap-2">
                  <Check className="w-4 h-4" />
                  <span>{backupStatus}</span>
                </div>
              )}
            </div>

            {/* Reset Defaults */}
            <div className="bg-slate-900/80 border border-slate-700/80 rounded-3xl p-6 shadow-xl space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h4 className="text-sm font-bold text-white flex items-center gap-2 text-rose-300">
                    <AlertTriangle className="w-4 h-4 text-rose-400" />
                    <span>Reset to Hardee's Harrogate Seed Data</span>
                  </h4>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Resets all inventory items, US Foods delivery orders, categories, and logs to initial defaults.
                  </p>
                </div>

                <button
                  onClick={() => {
                    if (window.confirm('Reset all store data to Hardee’s Harrogate defaults?')) {
                      storage.resetToDefaults();
                      SoundPlayer.playSuccessFanfare();
                      alert('Data has been reset to defaults.');
                    }
                  }}
                  className="px-4 py-2 rounded-xl bg-rose-600/20 hover:bg-rose-600/30 border border-rose-500/30 text-rose-300 font-bold text-xs self-start sm:self-auto transition-all"
                >
                  Reset Defaults
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
