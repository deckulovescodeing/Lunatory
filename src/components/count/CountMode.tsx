import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Calculator,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Plus,
  Minus,
  RotateCcw,
  Sparkles,
  AlertTriangle,
  Send,
  Building2,
  Check,
  Search,
  ListFilter,
  QrCode,
  Layers,
  BarChart3,
} from 'lucide-react';
import {
  Category,
  CountEntry,
  InventoryCountSession,
  InventoryItem,
  StorageLocation,
  User,
} from '../../types';
import { LunaFox } from '../fox/LunaFox';
import { SoundPlayer } from '../../utils/audio';
import { WalkAroundCountScanner } from './WalkAroundCountScanner';

interface CountModeProps {
  storeId: string;
  currentUser: User;
  inventory: InventoryItem[];
  categories: Category[];
  activeSession: InventoryCountSession | null;
  onSaveActiveSession: (session: InventoryCountSession | null) => void;
  onSubmitCountSession: (session: InventoryCountSession) => void;
  onUpdateItemQuantity?: (itemId: string, newQuantity: number) => void;
  onOpenItemDetail?: (item: InventoryItem) => void;
}

export const CountMode: React.FC<CountModeProps> = ({
  storeId,
  currentUser,
  inventory,
  categories,
  activeSession,
  onSaveActiveSession,
  onSubmitCountSession,
  onUpdateItemQuantity,
  onOpenItemDetail,
}) => {
  // Count Mode Sub-View: 'scanner' (Walk around & scan box/shelf with quick adjust popup), 'stepper' (sequential card), 'review'
  const [countViewMode, setCountViewMode] = useState<'scanner' | 'stepper' | 'review'>('scanner');

  // Storage Location selection
  const [selectedLocation, setSelectedLocation] = useState<string>('all');
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [countsMap, setCountsMap] = useState<Record<string, number>>(() => {
    if (activeSession?.entries) {
      const map: Record<string, number> = {};
      activeSession.entries.forEach((e) => {
        map[e.itemId] = e.countedQuantity;
      });
      return map;
    }
    return {};
  });

  const [searchFilter, setSearchFilter] = useState<string>('');

  // Handle single item update from walk-around scanner
  const handleItemCountUpdate = (itemId: string, newQty: number) => {
    setCountsMap((prev) => ({
      ...prev,
      [itemId]: newQty,
    }));
    if (onUpdateItemQuantity) {
      onUpdateItemQuantity(itemId, newQty);
    }
  };

  // Filtered list for current location
  const countItems = useMemo(() => {
    return inventory.filter((item) => {
      if (selectedLocation !== 'all' && item.storageLocation !== selectedLocation) {
        return false;
      }
      if (searchFilter.trim()) {
        const q = searchFilter.toLowerCase().trim();
        return item.name.toLowerCase().includes(q) || item.sku.toLowerCase().includes(q);
      }
      return true;
    });
  }, [inventory, selectedLocation, searchFilter]);

  const currentItem = countItems[currentIndex] || countItems[0];
  const currentCount = currentItem ? countsMap[currentItem.id] ?? currentItem.currentQuantity : 0;

  const totalCountedCount = Object.keys(countsMap).length;
  const progressPercent = countItems.length > 0 ? Math.round((totalCountedCount / countItems.length) * 100) : 0;

  const handleUpdateItemCount = (qty: number) => {
    if (!currentItem) return;
    const newQty = Math.max(0, qty);
    setCountsMap((prev) => ({
      ...prev,
      [currentItem.id]: newQty,
    }));
    if (onUpdateItemQuantity) {
      onUpdateItemQuantity(currentItem.id, newQty);
    }
  };

  const handleDelta = (delta: number) => {
    const next = Math.max(0, currentCount + delta);
    handleUpdateItemCount(next);
    if (delta > 0) {
      SoundPlayer.playCountBeep(1 + Math.min(0.5, delta * 0.05));
    } else {
      SoundPlayer.playDecrementSound();
    }
  };

  const handleNext = () => {
    if (currentIndex < countItems.length - 1) {
      setCurrentIndex((i) => i + 1);
      SoundPlayer.playCountBeep();
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex((i) => i - 1);
      SoundPlayer.playDecrementSound();
    }
  };

  // Review variance calculations
  const reviewEntries: CountEntry[] = useMemo(() => {
    return countItems.map((item) => {
      const counted = countsMap[item.id] !== undefined ? countsMap[item.id] : item.currentQuantity;
      const variance = counted - item.currentQuantity;
      const dollarVariance = variance * item.costPerUnit;
      return {
        itemId: item.id,
        itemName: item.name,
        expectedQuantity: item.currentQuantity,
        countedQuantity: counted,
        variance,
        dollarVariance,
        unitType: item.unitType,
      };
    });
  }, [countItems, countsMap]);

  const totalDollarVariance = reviewEntries.reduce((acc, e) => acc + e.dollarVariance, 0);

  const handleSubmitFinal = () => {
    const session: InventoryCountSession = {
      id: 'session-' + Date.now(),
      storeId,
      status: 'completed',
      countedBy: {
        userId: currentUser.id,
        userName: currentUser.name,
        role: currentUser.role,
      },
      startedAt: activeSession?.startedAt || new Date().toISOString(),
      completedAt: new Date().toISOString(),
      location: selectedLocation as StorageLocation | 'All Locations',
      entries: reviewEntries,
      totalItemsCounted: reviewEntries.length,
      notes: `Shift count finalized by ${currentUser.name}`,
    };

    onSubmitCountSession(session);
    SoundPlayer.playSuccessFanfare();
    setCountViewMode('scanner');
  };

  const locations = [
    'All Locations',
    'Walk-in Freezer',
    'Walk-in Cooler',
    'Dry Storage Room',
    'Front Counter / Dispenser',
    'Kitchen Prep Line',
    'Chemical / Supply Rack',
  ];

  return (
    <div className="space-y-4 pb-24 select-none">
      {/* 1. Header with Mode Switcher */}
      <div className="bg-slate-900/80 border border-white/10 rounded-3xl p-4 backdrop-blur-md flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-amber-400 text-slate-950 shadow-md">
            <Calculator className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg sm:text-xl font-extrabold text-white font-heading">
              Store Count & Audits
            </h1>
            <p className="text-xs text-slate-400">
              Auditing as <strong className="text-white">{currentUser.name}</strong> • Hardee’s Harrogate
            </p>
          </div>
        </div>

        {/* Count View Switcher Buttons */}
        <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-2xl border border-slate-800">
          <button
            onClick={() => {
              setCountViewMode('scanner');
              SoundPlayer.playCountBeep();
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              countViewMode === 'scanner'
                ? 'bg-gradient-to-r from-amber-400 to-orange-400 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <QrCode className="w-3.5 h-3.5" />
            <span>Walk & Scan</span>
          </button>

          <button
            onClick={() => {
              setCountViewMode('stepper');
              SoundPlayer.playCountBeep();
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              countViewMode === 'stepper'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Step Counter</span>
          </button>

          <button
            onClick={() => {
              setCountViewMode('review');
              SoundPlayer.playCountBeep();
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              countViewMode === 'review'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>Review & Submit</span>
          </button>
        </div>
      </div>

      {/* Progress Bar (Visible in Stepper or Review mode) */}
      {countViewMode !== 'scanner' && (
        <div className="bg-slate-900/80 border border-white/10 rounded-2xl p-3 backdrop-blur-md">
          <div className="flex items-center justify-between text-xs mb-1.5 font-semibold">
            <span className="text-slate-300">
              Progress: {totalCountedCount} of {countItems.length} items verified
            </span>
            <span className="text-amber-300">{progressPercent}%</span>
          </div>
          <div className="w-full h-2 rounded-full bg-slate-950 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-amber-400 to-emerald-400 rounded-full transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      )}

      {/* SUB-VIEW 1: WALK-AROUND SCANNER & ADJUST POP-UP */}
      {countViewMode === 'scanner' && (
        <WalkAroundCountScanner
          inventory={inventory}
          currentUser={currentUser}
          onUpdateItemQuantity={(id, qty) => {
            handleItemCountUpdate(id, qty);
          }}
          onRecordCountEntry={(entry) => {
            setCountsMap((prev) => ({
              ...prev,
              [entry.itemId]: entry.countedQuantity,
            }));
          }}
          onOpenItemDetail={onOpenItemDetail}
        />
      )}

      {/* SUB-VIEW 2: STEPPER CARD RAPID COUNTER */}
      {countViewMode === 'stepper' && (
        currentItem && (
          <motion.div
            key={currentItem.id}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="bg-slate-900/90 border border-indigo-500/30 rounded-3xl p-5 sm:p-6 backdrop-blur-md shadow-2xl space-y-5"
          >
            {/* Location Selector */}
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs text-slate-400 font-bold uppercase">Location Filter:</span>
              <select
                value={selectedLocation}
                onChange={(e) => {
                  setSelectedLocation(e.target.value);
                  setCurrentIndex(0);
                  SoundPlayer.playCountBeep();
                }}
                className="bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-xs font-semibold text-white focus:outline-none focus:border-amber-400"
              >
                {locations.map((loc) => (
                  <option key={loc} value={loc === 'All Locations' ? 'all' : loc}>
                    {loc}
                  </option>
                ))}
              </select>
            </div>

            {/* Top: Current Item Info & Nav Index */}
            <div className="flex items-start justify-between gap-3 border-b border-slate-800 pb-4">
              <div className="min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="px-2 py-0.5 text-[10px] font-bold bg-indigo-600 text-white rounded">
                    {currentItem.storageLocation}
                  </span>
                  <span className="text-xs font-mono text-slate-400">SKU: {currentItem.sku}</span>
                </div>
                <h2 className="text-xl sm:text-2xl font-extrabold text-white font-heading truncate">
                  {currentItem.name}
                </h2>
                <p className="text-xs text-slate-300 mt-0.5">
                  Pack Size: <strong className="text-white">{currentItem.packSize}</strong> • Par: {currentItem.parLevel} {currentItem.unitType}s
                </p>
              </div>

              <div className="shrink-0 hidden xs:block">
                <LunaFox mood="counting" size="md" />
              </div>
            </div>

            {/* Middle: Giant Count Display & Fast Adjustment */}
            <div className="p-6 rounded-2xl bg-slate-950/80 border border-slate-800 text-center space-y-3 shadow-inner">
              <div className="text-xs uppercase font-bold tracking-wider text-slate-400">
                Shelf Count ({currentItem.unitType}s)
              </div>

              <div className="flex items-center justify-center gap-4">
                <button
                  onClick={() => handleDelta(-1)}
                  className="w-14 h-14 rounded-2xl bg-slate-800 hover:bg-slate-700 active:bg-rose-600 border border-slate-700 text-rose-300 font-extrabold text-2xl flex items-center justify-center shadow-md transition-all active:scale-95"
                >
                  <Minus className="w-6 h-6" />
                </button>

                <div className="min-w-[120px]">
                  <span className="text-5xl sm:text-6xl font-black text-white font-heading">
                    {currentCount}
                  </span>
                  <div className="text-xs text-slate-400 font-semibold mt-1">
                    System Expected: {currentItem.currentQuantity}
                  </div>
                </div>

                <button
                  onClick={() => handleDelta(+1)}
                  className="w-14 h-14 rounded-2xl bg-slate-800 hover:bg-slate-700 active:bg-emerald-600 border border-slate-700 text-emerald-300 font-extrabold text-2xl flex items-center justify-center shadow-md transition-all active:scale-95"
                >
                  <Plus className="w-6 h-6" />
                </button>
              </div>

              {/* Variance Pill */}
              <div className="pt-1">
                {currentCount !== currentItem.currentQuantity ? (
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    Variance: {currentCount - currentItem.currentQuantity > 0 ? '+' : ''}
                    {currentCount - currentItem.currentQuantity} {currentItem.unitType}s ($
                    {(((currentCount - (currentItem.currentQuantity || 0)) * (currentItem.costPerUnit || 0))).toFixed(2)})
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                    <Check className="w-3.5 h-3.5" /> Matches System On-Hand
                  </span>
                )}
              </div>
            </div>

            {/* Quick Bulk Increment Buttons */}
            <div className="grid grid-cols-4 gap-2.5">
              <button
                onClick={() => handleDelta(+1)}
                className="py-3 rounded-2xl bg-indigo-900/60 hover:bg-indigo-800/80 active:bg-amber-400 active:text-slate-950 border border-indigo-700/60 font-bold text-sm text-indigo-100 shadow-sm transition-all"
              >
                +1 Case
              </button>
              <button
                onClick={() => handleDelta(+5)}
                className="py-3 rounded-2xl bg-indigo-900/60 hover:bg-indigo-800/80 active:bg-amber-400 active:text-slate-950 border border-indigo-700/60 font-bold text-sm text-indigo-100 shadow-sm transition-all"
              >
                +5 Cases
              </button>
              <button
                onClick={() => handleDelta(+10)}
                className="py-3 rounded-2xl bg-indigo-900/60 hover:bg-indigo-800/80 active:bg-amber-400 active:text-slate-950 border border-indigo-700/60 font-bold text-sm text-indigo-100 shadow-sm transition-all"
              >
                +10 Cases
              </button>
              <button
                onClick={() => handleUpdateItemCount(0)}
                className="py-3 rounded-2xl bg-rose-950/60 hover:bg-rose-900/80 active:bg-rose-600 border border-rose-800/60 font-bold text-sm text-rose-200 shadow-sm transition-all"
              >
                Zero (0)
              </button>
            </div>

            {/* Bottom Nav: Previous Item & Next Item */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-800">
              <button
                onClick={handlePrev}
                disabled={currentIndex === 0}
                className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 disabled:opacity-30 text-xs font-semibold text-slate-300 flex items-center gap-1.5 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Previous</span>
              </button>

              <span className="text-xs font-bold text-slate-400">
                Item {currentIndex + 1} of {countItems.length}
              </span>

              <button
                onClick={handleNext}
                disabled={currentIndex === countItems.length - 1}
                className="px-5 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 disabled:opacity-30 text-xs font-extrabold text-slate-950 flex items-center gap-1.5 shadow-md transition-all active:scale-95"
              >
                <span>Save & Next</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )
      )}

      {/* SUB-VIEW 3: REVIEW VARIANCE & FINAL SUBMISSION */}
      {countViewMode === 'review' && (
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-slate-900/90 border border-white/10 rounded-3xl p-5 sm:p-6 backdrop-blur-md space-y-4"
        >
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h2 className="text-lg font-bold text-white font-heading">
                Count Variance & Summary Review
              </h2>
              <p className="text-xs text-slate-400">
                Verify adjustments before committing to the store ledger
              </p>
            </div>
            <div className="text-right">
              <div className="text-xs text-slate-400 font-semibold">Total Cost Variance</div>
              <div
                className={`text-lg font-extrabold font-heading ${
                  totalDollarVariance < 0
                    ? 'text-rose-400'
                    : totalDollarVariance > 0
                    ? 'text-emerald-400'
                    : 'text-slate-200'
                }`}
              >
                {totalDollarVariance < 0 ? '-' : '+'}${Math.abs(totalDollarVariance || 0).toFixed(2)}
              </div>
            </div>
          </div>

          <div className="max-h-96 overflow-y-auto space-y-2 pr-1">
            {reviewEntries.map((entry) => {
              const hasDiff = entry.variance !== 0;
              return (
                <div
                  key={entry.itemId}
                  className={`p-3 rounded-2xl border flex items-center justify-between gap-3 text-xs ${
                    hasDiff
                      ? 'bg-slate-950/80 border-amber-500/40'
                      : 'bg-slate-950/40 border-slate-800 text-slate-300'
                  }`}
                >
                  <div className="min-w-0">
                    <div className="font-bold text-white truncate">{entry.itemName}</div>
                    <div className="text-[10px] text-slate-400">
                      Expected: {entry.expectedQuantity} {entry.unitType}s
                    </div>
                  </div>

                  <div className="flex items-center gap-4 shrink-0">
                    <div className="text-right">
                      <div className="font-extrabold text-white">
                        {entry.countedQuantity} {entry.unitType}s
                      </div>
                      <div
                        className={`text-[10px] font-bold ${
                          entry.variance < 0
                            ? 'text-rose-400'
                            : entry.variance > 0
                            ? 'text-emerald-400'
                            : 'text-slate-400'
                        }`}
                      >
                        {entry.variance > 0 ? `+${entry.variance}` : entry.variance} ({entry.dollarVariance >= 0 ? '+' : '-'}${Math.abs(entry.dollarVariance || 0).toFixed(2)})
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-slate-800">
            <button
              onClick={() => setCountViewMode('scanner')}
              className="px-4 py-2 text-xs font-semibold text-slate-300 bg-white/5 hover:bg-white/10 rounded-xl"
            >
              Back to Scanner
            </button>
            <button
              onClick={handleSubmitFinal}
              className="px-6 py-2.5 bg-gradient-to-r from-amber-400 to-orange-400 hover:from-amber-300 hover:to-orange-300 text-slate-950 text-xs font-extrabold rounded-xl shadow-lg flex items-center gap-2 transition-transform active:scale-95"
            >
              <Send className="w-4 h-4" />
              <span>Submit & Apply New Counts</span>
            </button>
          </div>
        </motion.div>
      )}
    </div>
  );
};
