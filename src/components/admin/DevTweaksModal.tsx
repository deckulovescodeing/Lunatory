import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ShieldAlert,
  X,
  Database,
  Sliders,
  Sparkles,
  Zap,
  Radio,
  Camera,
  Volume2,
  RotateCcw,
  Download,
  Upload,
  Layers,
  Cpu,
  Eye,
  CheckCircle2,
  AlertTriangle,
  Play,
  KeyRound,
  Lock,
  Unlock,
  Activity,
  Maximize2,
  SlidersHorizontal,
  Flame,
  FileCode2,
  Truck,
  RefreshCw,
} from 'lucide-react';
import { InventoryItem, Store, User, UserRole, AppSettings } from '../../types';
import { SoundPlayer } from '../../utils/audio';
import { storage } from '../../services/storage';
import { p2pSync } from '../../services/p2pSync';

interface DevTweaksModalProps {
  isOpen: boolean;
  onClose: () => void;
  inventory: InventoryItem[];
  allStores: Store[];
  activeStore: Store;
  allUsers: User[];
  currentUser: User | null;
  settings: AppSettings;
  onUpdateInventory: (items: InventoryItem[]) => void;
  onUpdateSettings: (newSettings: Partial<AppSettings>) => void;
  onSelectUser?: (user: User) => void;
  onResetFactoryData: () => void;
  onLockDevMode: () => void;
}

export const DevTweaksModal: React.FC<DevTweaksModalProps> = ({
  isOpen,
  onClose,
  inventory,
  allStores,
  activeStore,
  allUsers,
  currentUser,
  settings,
  onUpdateInventory,
  onUpdateSettings,
  onSelectUser,
  onResetFactoryData,
  onLockDevMode,
}) => {
  const [activeTab, setActiveTab] = useState<'inventory' | 'scanner' | 'ui_perf' | 'network' | 'godmode' | 'raw_json'>('inventory');

  // Raw Database JSON
  const [jsonText, setJsonText] = useState('');
  const [jsonError, setJsonError] = useState<string | null>(null);
  const [jsonSuccess, setJsonSuccess] = useState<string | null>(null);

  // Par Multiplier
  const [parMultiplier, setParMultiplier] = useState<number>(1.0);

  // Sound test
  const [soundFeedback, setSoundFeedback] = useState<string | null>(null);

  // Latency simulation
  const [simLatency, setSimLatency] = useState<number>(0);

  // Mesh packets log
  const [meshLogs, setMeshLogs] = useState<string[]>([]);

  // Barcode Injection Target
  const [selectedInjectItem, setSelectedInjectItem] = useState<string>(inventory[0]?.id || '');

  // Load current DB into JSON editor when tab opens
  useEffect(() => {
    if (isOpen && activeTab === 'raw_json') {
      const fullBackup = storage.exportFullBackupJSON();
      setJsonText(fullBackup);
      setJsonError(null);
      setJsonSuccess(null);
    }
  }, [isOpen, activeTab]);

  if (!isOpen) return null;

  // 1. Inventory Simulations
  const handleApplyParMultiplier = (multiplier: number) => {
    setParMultiplier(multiplier);
    const updated = inventory.map((i) => ({
      ...i,
      parLevel: Math.max(1, Math.round(i.parLevel * multiplier)),
    }));
    onUpdateInventory(updated);
    storage.saveInventory(activeStore.id, updated);
    SoundPlayer.playSuccessFanfare();
  };

  const handleSimulateLunchRush = () => {
    const updated = inventory.map((i) => {
      // Fast food items reduced by 50-80%
      if (
        i.name.toLowerCase().includes('beef') ||
        i.name.toLowerCase().includes('fry') ||
        i.name.toLowerCase().includes('fries') ||
        i.name.toLowerCase().includes('bacon') ||
        i.name.toLowerCase().includes('bun') ||
        i.name.toLowerCase().includes('cheese') ||
        i.name.toLowerCase().includes('cup')
      ) {
        return { ...i, currentQuantity: Math.max(1, Math.floor(i.currentQuantity * 0.35)) };
      }
      return i;
    });
    onUpdateInventory(updated);
    storage.saveInventory(activeStore.id, updated);
    SoundPlayer.playAlertChime();
    alert('⚡ Lunch Rush simulated! Angus Beef, Bacon, Fries, and Buns depleted to critical levels.');
  };

  const handleSimulateBiscuitShortage = () => {
    const updated = inventory.map((i) => {
      if (
        i.name.toLowerCase().includes('biscuit') ||
        i.name.toLowerCase().includes('flour') ||
        i.name.toLowerCase().includes('buttermilk') ||
        i.name.toLowerCase().includes('egg') ||
        i.name.toLowerCase().includes('sausage')
      ) {
        return { ...i, currentQuantity: 0 };
      }
      return i;
    });
    onUpdateInventory(updated);
    storage.saveInventory(activeStore.id, updated);
    SoundPlayer.playAlertChime();
    alert('🥐 Biscuit Flour & Breakfast items depleted to ZERO (0)!');
  };

  const handleSimulateTruckRestock = () => {
    const updated = inventory.map((i) => ({
      ...i,
      currentQuantity: i.parLevel + Math.floor(Math.random() * 2),
    }));
    onUpdateInventory(updated);
    storage.saveInventory(activeStore.id, updated);
    SoundPlayer.playSuccessFanfare();
    alert('🚚 US Foods Truck delivery simulated! All store items restocked to full 100% Par levels.');
  };

  const handleRandomizeVariances = () => {
    const updated = inventory.map((i) => {
      const delta = Math.floor(Math.random() * 5) - 2; // -2 to +2
      return {
        ...i,
        currentQuantity: Math.max(0, i.currentQuantity + delta),
      };
    });
    onUpdateInventory(updated);
    storage.saveInventory(activeStore.id, updated);
    SoundPlayer.playCountBeep();
    alert('🎲 Random variances injected into inventory ledger for audit testing.');
  };

  const handleZeroAllStock = () => {
    if (confirm('Are you sure you want to set ALL items on-hand quantity to 0?')) {
      const updated = inventory.map((i) => ({ ...i, currentQuantity: 0 }));
      onUpdateInventory(updated);
      storage.saveInventory(activeStore.id, updated);
      SoundPlayer.playDecrementSound();
    }
  };

  // 2. Raw JSON Database Apply
  const handleApplyJson = () => {
    try {
      setJsonError(null);
      const parsed = JSON.parse(jsonText);
      const res = storage.importFullBackupJSON(jsonText);
      if (res.success) {
        setJsonSuccess('✓ Database updated successfully from Raw JSON!');
        SoundPlayer.playSuccessFanfare();
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      } else {
        setJsonError(res.message);
        SoundPlayer.playAlertChime();
      }
    } catch (e: any) {
      setJsonError('JSON Parse Error: ' + e.message);
      SoundPlayer.playAlertChime();
    }
  };

  // 3. Sound Effects Testing
  const handleTestSound = (soundName: string, fn: () => void) => {
    fn();
    setSoundFeedback(`Played: ${soundName}`);
    setTimeout(() => setSoundFeedback(null), 2000);
  };

  // 4. Mesh Ping
  const handleSendMeshPing = () => {
    storage.broadcastCurrentStoreState(activeStore.id);
    const now = new Date().toLocaleTimeString();
    setMeshLogs((prev) => [`[${now}] Broadcast STORE_SYNC packet to channel 'lunatory_mesh_channel'`, ...prev]);
    SoundPlayer.playScanSuccess();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md select-none">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative w-full max-w-5xl bg-[#0B0E14] border border-indigo-500/50 rounded-3xl shadow-2xl text-white overflow-hidden max-h-[92vh] flex flex-col"
      >
        {/* Top Master Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-purple-950/80 via-slate-900 to-indigo-950/80 border-b border-white/10 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-gradient-to-tr from-amber-400 to-orange-500 text-slate-950 font-black shadow-lg shadow-amber-500/20">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-black font-heading text-white tracking-tight">
                  Developer Options & Master Tweaks
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-400 text-slate-950 uppercase tracking-widest">
                  Unlocked
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Direct simulation controls, inventory ledger overrides, raw database JSON, and audio/visual debuggers.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                if (confirm('Re-lock Developer Mode? It will hide developer options until the build number is tapped 7 times again.')) {
                  onLockDevMode();
                  onClose();
                }
              }}
              className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-rose-500/20 hover:border-rose-500/40 border border-white/10 text-xs font-semibold text-slate-300 hover:text-rose-300 flex items-center gap-1.5 transition-colors"
              title="Lock Developer Mode"
            >
              <Lock className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Lock Mode</span>
            </button>

            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="px-6 py-2.5 bg-slate-950 border-b border-white/5 flex items-center gap-2 overflow-x-auto shrink-0 scrollbar-none">
          {[
            { id: 'inventory', label: 'Store & Inventory Simulator', icon: Sliders },
            { id: 'raw_json', label: 'Raw DB JSON Editor', icon: FileCode2 },
            { id: 'scanner', label: 'Scanner & Hardware', icon: Camera },
            { id: 'ui_perf', label: 'UI & Performance', icon: Cpu },
            { id: 'network', label: 'P2P Mesh & Offline Sim', icon: Radio },
            { id: 'godmode', label: 'God Mode & Access', icon: KeyRound },
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => {
                setActiveTab(id as any);
                SoundPlayer.playCountBeep();
              }}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 ${
                activeTab === id
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{label}</span>
            </button>
          ))}
        </div>

        {/* Main Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {/* TAB 1: INVENTORY & SCENARIO ENGINE */}
          {activeTab === 'inventory' && (
            <div className="space-y-6">
              {/* Scenario Generator */}
              <div className="bg-slate-900/80 border border-white/10 rounded-3xl p-5 space-y-4">
                <div className="flex items-center gap-2">
                  <Flame className="w-5 h-5 text-amber-400" />
                  <h3 className="text-sm font-bold uppercase tracking-wider text-white">
                    One-Tap Operational Scenarios
                  </h3>
                </div>
                <p className="text-xs text-slate-400">
                  Instantly configure inventory state to test count variances, ordering triggers, and low stock warnings.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                  <button
                    onClick={handleSimulateLunchRush}
                    className="p-4 rounded-2xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-left transition-all group"
                  >
                    <div className="font-extrabold text-xs text-amber-300 group-hover:text-amber-200">
                      ⚡ Lunch Rush Wave
                    </div>
                    <div className="text-[11px] text-slate-400 mt-1 leading-snug">
                      Depletes Angus Beef, Bacon, Buns, & Fries to critical reorder levels.
                    </div>
                  </button>

                  <button
                    onClick={handleSimulateBiscuitShortage}
                    className="p-4 rounded-2xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-left transition-all group"
                  >
                    <div className="font-extrabold text-xs text-rose-300 group-hover:text-rose-200">
                      🥐 Biscuit Mix Out-of-Stock
                    </div>
                    <div className="text-[11px] text-slate-400 mt-1 leading-snug">
                      Sets biscuit flour, eggs, and sausage to 0 for emergency transfer testing.
                    </div>
                  </button>

                  <button
                    onClick={handleSimulateTruckRestock}
                    className="p-4 rounded-2xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-left transition-all group"
                  >
                    <div className="font-extrabold text-xs text-emerald-300 group-hover:text-emerald-200">
                      🚚 US Foods Delivery
                    </div>
                    <div className="text-[11px] text-slate-400 mt-1 leading-snug">
                      Fills every product in the store back to 100% full par level.
                    </div>
                  </button>

                  <button
                    onClick={handleRandomizeVariances}
                    className="p-4 rounded-2xl bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/30 text-left transition-all group"
                  >
                    <div className="font-extrabold text-xs text-indigo-300 group-hover:text-indigo-200">
                      🎲 Random Count Drift
                    </div>
                    <div className="text-[11px] text-slate-400 mt-1 leading-snug">
                      Injects slight realistic variances (±15%) across random shelf items.
                    </div>
                  </button>
                </div>
              </div>

              {/* Par Multipliers & Quick Bulk Adjusters */}
              <div className="bg-slate-900/80 border border-white/10 rounded-3xl p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-white">
                    Store Par Multiplier ({parMultiplier}x)
                  </h3>
                  <span className="text-xs text-slate-400">Scale par levels for high-volume weekends</span>
                </div>

                <div className="flex items-center gap-2">
                  {[0.5, 0.75, 1.0, 1.25, 1.5, 2.0].map((mult) => (
                    <button
                      key={mult}
                      onClick={() => handleApplyParMultiplier(mult)}
                      className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
                        parMultiplier === mult
                          ? 'bg-amber-400 text-slate-950 shadow-md'
                          : 'bg-slate-950 border border-slate-800 text-slate-300 hover:text-white'
                      }`}
                    >
                      {mult}x Par
                    </button>
                  ))}
                </div>

                <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
                  <span className="text-xs text-slate-400 font-medium">Emergency bulk operations:</span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleZeroAllStock}
                      className="px-3.5 py-1.5 rounded-xl bg-rose-600/20 hover:bg-rose-600/30 border border-rose-500/30 text-rose-300 text-xs font-bold"
                    >
                      Zero All On-Hand Stock (0)
                    </button>
                    <button
                      onClick={() => {
                        if (confirm('Reset to factory baseline Hardee’s Harrogate data?')) {
                          onResetFactoryData();
                          onClose();
                        }
                      }}
                      className="px-3.5 py-1.5 rounded-xl bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/30 text-purple-300 text-xs font-bold"
                    >
                      Factory Reset Seed Data
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: RAW DATABASE JSON EDITOR */}
          {activeTab === 'raw_json' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold uppercase tracking-wider text-white">
                    Raw Database JSON Inspector & Live Editor
                  </h3>
                  <p className="text-xs text-slate-400">
                    Directly view or modify the full local database structure in real-time.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      const fullBackup = storage.exportFullBackupJSON();
                      setJsonText(fullBackup);
                      setJsonSuccess('Reloaded database snapshot.');
                      setTimeout(() => setJsonSuccess(null), 2000);
                    }}
                    className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-semibold text-slate-300 flex items-center gap-1"
                  >
                    <RefreshCw className="w-3.5 h-3.5" /> Refresh
                  </button>
                </div>
              </div>

              {jsonError && (
                <div className="p-3 rounded-2xl bg-rose-500/20 border border-rose-500/40 text-rose-300 text-xs font-semibold flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{jsonError}</span>
                </div>
              )}

              {jsonSuccess && (
                <div className="p-3 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-semibold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{jsonSuccess}</span>
                </div>
              )}

              <textarea
                value={jsonText}
                onChange={(e) => setJsonText(e.target.value)}
                rows={14}
                className="w-full bg-slate-950 border border-slate-700 rounded-2xl p-4 text-xs font-mono text-emerald-400 placeholder-slate-600 focus:outline-none focus:border-indigo-400 leading-relaxed"
                spellCheck={false}
              />

              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400">
                  Lines: {jsonText.split('\n').length} • Size: {(new Blob([jsonText]).size / 1024).toFixed(1)} KB
                </span>
                <button
                  onClick={handleApplyJson}
                  className="px-5 py-2.5 bg-gradient-to-r from-amber-400 to-orange-400 text-slate-950 text-xs font-black rounded-xl shadow-lg flex items-center gap-2 transition-transform active:scale-95"
                >
                  <Upload className="w-4 h-4" />
                  <span>Apply Raw JSON to Storage</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 3: SCANNER & HARDWARE SIMULATOR */}
          {activeTab === 'scanner' && (
            <div className="space-y-6">
              {/* Barcode Injector */}
              <div className="bg-slate-900/80 border border-white/10 rounded-3xl p-5 space-y-4">
                <h3 className="text-sm font-bold uppercase tracking-wider text-white">
                  Hardware Barcode Gun Injection Simulator
                </h3>
                <p className="text-xs text-slate-400">
                  Simulate scanning any inventory barcode without a physical laser scanner.
                </p>

                <div className="flex flex-col sm:flex-row items-center gap-2">
                  <select
                    value={selectedInjectItem}
                    onChange={(e) => setSelectedInjectItem(e.target.value)}
                    className="w-full sm:flex-1 bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                  >
                    {inventory.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.name} (UPC: {item.barcode || item.sku})
                      </option>
                    ))}
                  </select>

                  <button
                    onClick={() => {
                      const item = inventory.find((i) => i.id === selectedInjectItem);
                      if (item) {
                        SoundPlayer.playScanSuccess();
                        alert(`📡 Injected laser barcode scan for: ${item.name} (${item.barcode || item.sku})`);
                      }
                    }}
                    className="w-full sm:w-auto px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-md"
                  >
                    <Zap className="w-4 h-4" /> Inject Laser Scan Event
                  </button>
                </div>
              </div>

              {/* Sound Engine Test Bench */}
              <div className="bg-slate-900/80 border border-white/10 rounded-3xl p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-white">
                    Web Audio Synthesizer Test Bench
                  </h3>
                  {soundFeedback && (
                    <span className="text-xs font-bold text-amber-300 animate-pulse">
                      {soundFeedback}
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  <button
                    onClick={() => handleTestSound('Scan Beep', () => SoundPlayer.playScanSuccess())}
                    className="p-3 rounded-xl bg-slate-950 border border-slate-800 hover:border-indigo-400 text-xs font-semibold text-slate-300 text-left flex items-center justify-between"
                  >
                    <span>Laser Scan Beep</span>
                    <Play className="w-3.5 h-3.5 text-indigo-400" />
                  </button>

                  <button
                    onClick={() => handleTestSound('Count Increment', () => SoundPlayer.playCountBeep())}
                    className="p-3 rounded-xl bg-slate-950 border border-slate-800 hover:border-indigo-400 text-xs font-semibold text-slate-300 text-left flex items-center justify-between"
                  >
                    <span>Count +1 Click</span>
                    <Play className="w-3.5 h-3.5 text-indigo-400" />
                  </button>

                  <button
                    onClick={() => handleTestSound('Success Fanfare', () => SoundPlayer.playSuccessFanfare())}
                    className="p-3 rounded-xl bg-slate-950 border border-slate-800 hover:border-indigo-400 text-xs font-semibold text-slate-300 text-left flex items-center justify-between"
                  >
                    <span>Success Fanfare</span>
                    <Play className="w-3.5 h-3.5 text-indigo-400" />
                  </button>

                  <button
                    onClick={() => handleTestSound('Alert Chime', () => SoundPlayer.playAlertChime())}
                    className="p-3 rounded-xl bg-slate-950 border border-slate-800 hover:border-indigo-400 text-xs font-semibold text-slate-300 text-left flex items-center justify-between"
                  >
                    <span>Alert / Warning</span>
                    <Play className="w-3.5 h-3.5 text-indigo-400" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: UI & PERFORMANCE */}
          {activeTab === 'ui_perf' && (
            <div className="space-y-6">
              <div className="bg-slate-900/80 border border-white/10 rounded-3xl p-5 space-y-4">
                <h3 className="text-sm font-bold uppercase tracking-wider text-white">
                  Visual Theme & Atmosphere Override
                </h3>

                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
                  {[
                    { id: 'dawn', label: 'Dawn Prep (5 AM)', color: '#FF7E5F' },
                    { id: 'morning', label: 'Morning Rush (8 AM)', color: '#FDB813' },
                    { id: 'noon', label: 'Noon Peak (12 PM)', color: '#38BDF8' },
                    { id: 'sunset', label: 'Golden Sunset (6 PM)', color: '#F97316' },
                    { id: 'night', label: 'Aurora Night (11 PM)', color: '#6366F1' },
                  ].map((t) => (
                    <button
                      key={t.id}
                      onClick={() => {
                        onUpdateSettings({ themeMode: t.id as any });
                        SoundPlayer.playCountBeep();
                      }}
                      className={`p-3 rounded-2xl border text-left transition-all ${
                        settings.themeMode === t.id
                          ? 'bg-indigo-600/30 border-indigo-400 text-white shadow-md'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      <div className="w-3 h-3 rounded-full mb-2" style={{ backgroundColor: t.color }} />
                      <div className="text-xs font-bold">{t.label}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="bg-slate-900/80 border border-white/10 rounded-3xl p-5 space-y-3">
                <h3 className="text-sm font-bold uppercase tracking-wider text-white">
                  Hardware & Audio Toggles
                </h3>

                <div className="space-y-2">
                  <label className="flex items-center justify-between p-3 rounded-2xl bg-slate-950 border border-slate-800 cursor-pointer">
                    <span className="text-xs font-semibold text-slate-200">Audio Synthesizer Sound Effects</span>
                    <input
                      type="checkbox"
                      checked={settings.soundEnabled}
                      onChange={(e) => {
                        onUpdateSettings({ soundEnabled: e.target.checked });
                        SoundPlayer.setSettings(!e.target.checked, settings.soundVolume || 0.5);
                      }}
                      className="w-4 h-4 accent-amber-400 rounded"
                    />
                  </label>

                  <label className="flex items-center justify-between p-3 rounded-2xl bg-slate-950 border border-slate-800 cursor-pointer">
                    <span className="text-xs font-semibold text-slate-200">P2P Mesh Background Broadcasting</span>
                    <input
                      type="checkbox"
                      checked={settings.p2pMeshEnabled !== false}
                      onChange={(e) => onUpdateSettings({ p2pMeshEnabled: e.target.checked })}
                      className="w-4 h-4 accent-amber-400 rounded"
                    />
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: P2P MESH & OFFLINE SIM */}
          {activeTab === 'network' && (
            <div className="space-y-6">
              <div className="bg-slate-900/80 border border-white/10 rounded-3xl p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-white">
                    Broadcast Channel Packet Sniffer
                  </h3>
                  <button
                    onClick={handleSendMeshPing}
                    className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-1.5"
                  >
                    <Radio className="w-3.5 h-3.5" /> Send Test Mesh Ping
                  </button>
                </div>

                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 font-mono text-xs text-slate-300 min-h-[140px] max-h-56 overflow-y-auto space-y-1">
                  {meshLogs.length === 0 ? (
                    <span className="text-slate-600 italic">No packet events captured yet. Tap Send Test Mesh Ping above.</span>
                  ) : (
                    meshLogs.map((log, idx) => <div key={idx}>{log}</div>)
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 6: GOD MODE & ACCESS */}
          {activeTab === 'godmode' && (
            <div className="space-y-6">
              <div className="bg-slate-900/80 border border-white/10 rounded-3xl p-5 space-y-4">
                <h3 className="text-sm font-bold uppercase tracking-wider text-white">
                  Instant Role Permission Overrider (God Mode)
                </h3>
                <p className="text-xs text-slate-400">
                  Switch the active terminal session between staff roles without entering PIN codes.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {allUsers.map((u) => (
                    <button
                      key={u.id}
                      onClick={() => {
                        if (onSelectUser) {
                          onSelectUser(u);
                          SoundPlayer.playSuccessFanfare();
                        }
                      }}
                      className={`p-4 rounded-2xl border text-left transition-all ${
                        currentUser?.id === u.id
                          ? 'bg-amber-500/20 border-amber-400 text-white shadow-md'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-extrabold text-white">{u.name}</span>
                        <span className="px-1.5 py-0.2 rounded bg-indigo-500/20 text-indigo-300 text-[9px] uppercase font-bold">
                          {u.role}
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-400 mt-1">
                        PIN: {u.pinCode} • {u.title || 'Staff'}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};
