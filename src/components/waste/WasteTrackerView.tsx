import React, { useState } from 'react';
import { motion } from 'motion/react';
import {
  Trash2,
  AlertTriangle,
  Plus,
  DollarSign,
  Calendar,
  User as UserIcon,
  Download,
  Filter,
  CheckCircle2,
} from 'lucide-react';
import { Category, InventoryItem, User, WasteEntry, WasteReason } from '../../types';
import { LunaFox } from '../fox/LunaFox';
import { SoundPlayer } from '../../utils/audio';

interface WasteTrackerViewProps {
  storeId: string;
  currentUser: User;
  inventory: InventoryItem[];
  categories: Category[];
  wasteEntries: WasteEntry[];
  onLogWaste: (entry: WasteEntry) => void;
  preselectedItem?: InventoryItem | null;
}

export const WasteTrackerView: React.FC<WasteTrackerViewProps> = ({
  storeId,
  currentUser,
  inventory,
  categories,
  wasteEntries,
  onLogWaste,
  preselectedItem,
}) => {
  const [selectedItemId, setSelectedItemId] = useState<string>(
    preselectedItem ? preselectedItem.id : inventory[0]?.id || ''
  );
  const [quantity, setQuantity] = useState<number>(1);
  const [reason, setReason] = useState<WasteReason>('Hold time expired');
  const [notes, setNotes] = useState<string>('');
  const [successNotice, setSuccessNotice] = useState<string>('');

  const activeItem = inventory.find((i) => i.id === selectedItemId) || inventory[0];
  const unitCost = activeItem ? activeItem.costPerUnit : 0;
  const calculatedCost = activeItem ? quantity * unitCost : 0;

  // Waste reasons
  const reasonsList: WasteReason[] = [
    'Hold time expired',
    'Dropped / Spilled on floor',
    'Burnt / Overcooked on grill',
    'Damaged packaging / Case crushed',
    'Expired shelf date',
    'Quality inspection rejection',
    'Customer return / Remake',
    'Prep / Thaw loss',
    'Equipment failure / Freezer thaw',
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeItem || quantity <= 0) return;

    const newEntry: WasteEntry = {
      id: 'waste-' + Date.now() + '-' + Math.random().toString(36).substring(2, 5),
      storeId,
      itemId: activeItem.id,
      itemName: activeItem.name,
      quantity,
      unitType: activeItem.unitType,
      unitCost,
      totalCost: calculatedCost,
      reason,
      loggedBy: {
        userId: currentUser.id,
        userName: currentUser.name,
        role: currentUser.role,
      },
      timestamp: new Date().toISOString(),
      notes,
    };

    onLogWaste(newEntry);
    SoundPlayer.playTrashDropSound();
    setSuccessNotice(`Logged ${quantity} ${activeItem.unitType}s of ${activeItem.name} ($${(calculatedCost || 0).toFixed(2)})`);
    setTimeout(() => setSuccessNotice(''), 4000);

    // Reset fields
    setQuantity(1);
    setNotes('');
  };

  // Total waste stats
  const totalWasteAllTime = wasteEntries.reduce((acc, w) => acc + (w.totalCost || 0), 0);

  const todayStr = new Date().toISOString().split('T')[0];
  const todayWaste = wasteEntries.filter((w) => w.timestamp && w.timestamp.startsWith(todayStr));
  const todayCost = todayWaste.reduce((acc, w) => acc + (w.totalCost || 0), 0);

  return (
    <div className="space-y-4 pb-24 select-none">
      {/* 1. Header & Summary */}
      <div className="bg-slate-900/80 border border-white/10 rounded-2xl p-4 backdrop-blur-md flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-rose-500/20 text-rose-400 border border-rose-500/30">
            <Trash2 className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg sm:text-xl font-extrabold text-white font-heading">
              Shift Waste Tracker
            </h1>
            <p className="text-xs text-slate-400">
              Record food loss for inventory auditing & par calibration
            </p>
          </div>
        </div>

        {/* Today's Waste Pill */}
        <div className="flex items-center gap-3 bg-slate-950 px-4 py-2 rounded-xl border border-slate-800">
          <div>
            <div className="text-[10px] uppercase font-bold text-slate-400">Today’s Waste</div>
            <div className="text-base font-extrabold text-rose-400 font-heading">
              ${(todayCost || 0).toFixed(2)}
            </div>
          </div>
          <div className="h-6 w-px bg-slate-800" />
          <div>
            <div className="text-[10px] uppercase font-bold text-slate-400">Entries</div>
            <div className="text-base font-extrabold text-white font-heading">
              {todayWaste.length}
            </div>
          </div>
        </div>
      </div>

      {/* 2. New Waste Entry Form & Luna Reaction Card */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Entry Form */}
        <div className="lg:col-span-2 bg-slate-900/90 border border-slate-700/80 rounded-3xl p-5 sm:p-6 backdrop-blur-md shadow-xl">
          <h2 className="text-sm font-bold uppercase tracking-wider text-amber-300 mb-4 flex items-center gap-2">
            <Plus className="w-4 h-4" /> Record New Food Waste
          </h2>

          {successNotice && (
            <div className="mb-4 p-3 rounded-xl bg-emerald-950/80 border border-emerald-800 text-emerald-200 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>{successNotice}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Select Inventory Item *
              </label>
              <select
                value={selectedItemId}
                onChange={(e) => setSelectedItemId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-amber-400 font-semibold"
                required
              >
                {inventory.map((item) => (
                  <option key={item.id} value={item.id} className="bg-slate-900 text-white">
                    {item.name} ({item.packSize} • ${(item.costPerUnit || 0).toFixed(2)}/{item.unitType})
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Wasted Quantity ({activeItem?.unitType || 'units'}) *
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0.1"
                  value={quantity}
                  onChange={(e) => setQuantity(parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white font-bold"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Estimated Food Cost Loss
                </label>
                <div className="w-full bg-slate-950/60 border border-slate-800 rounded-xl px-3.5 py-2 text-xs font-extrabold text-rose-400 flex items-center gap-1">
                  <DollarSign className="w-3.5 h-3.5" />
                  <span>${(calculatedCost || 0).toFixed(2)}</span>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Waste Reason *
              </label>
              <select
                value={reason}
                onChange={(e) => setReason(e.target.value as WasteReason)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-amber-400"
              >
                {reasonsList.map((r) => (
                  <option key={r} value={r} className="bg-slate-900 text-white">
                    {r}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Notes / Root Cause (Optional)
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. Timer buzzed but tray left on warmer 20 mins late"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 rounded-2xl bg-rose-600 hover:bg-rose-500 active:scale-[0.98] text-white font-extrabold text-xs flex items-center justify-center gap-2 shadow-lg transition-all"
            >
              <Trash2 className="w-4 h-4" />
              <span>Log ${(calculatedCost || 0).toFixed(2)} Waste to Ledger</span>
            </button>
          </form>
        </div>

        {/* Luna Mascot Reaction Card */}
        <div className="bg-slate-900/80 border border-white/10 rounded-3xl p-5 backdrop-blur-md flex flex-col items-center text-center justify-center space-y-3">
          <LunaFox mood={calculatedCost > 20 ? 'worried' : 'idle'} size="lg" />
          <div>
            <h3 className="text-sm font-bold text-white font-heading">
              {calculatedCost > 20 ? 'High Food Waste Alert!' : 'Keep Kitchen Waste Low'}
            </h3>
            <p className="text-xs text-slate-300 mt-1 leading-relaxed">
              Tracking waste helps Hardee’s calculate true usage rates so we don’t over-order on Tuesday truck deliveries.
            </p>
          </div>
          <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-400/20 text-[11px] text-amber-200 text-left w-full">
            💡 <strong>Hardee’s Rule:</strong> Biscuits held over 20 minutes must be logged to waste before baking a fresh batch.
          </div>
        </div>
      </div>

      {/* 3. Waste Log History List */}
      <div className="bg-slate-900/80 border border-white/10 rounded-3xl p-5 backdrop-blur-md space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400">
            Recent Waste Entries ({wasteEntries.length})
          </h2>
          <span className="text-xs text-slate-400">
            Total Logged: <strong className="text-rose-400">${(totalWasteAllTime || 0).toFixed(2)}</strong>
          </span>
        </div>

        {wasteEntries.length === 0 ? (
          <div className="p-8 text-center text-slate-500 text-xs">
            No waste logged yet this week! Excellent kitchen efficiency.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <div className="space-y-2">
              {wasteEntries.map((w) => (
                <div
                  key={w.id}
                  className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 flex items-center justify-between gap-3 text-xs"
                >
                  <div className="min-w-0">
                    <div className="font-bold text-white truncate">{w.itemName}</div>
                    <div className="text-[10px] text-slate-400 flex items-center gap-1.5 mt-0.5">
                      <span className="text-amber-300 font-semibold">{w.reason}</span>
                      <span>•</span>
                      <span>{new Date(w.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      <span>•</span>
                      <span>By: {w.loggedBy.userName}</span>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <div className="font-extrabold text-rose-400">
                      -${((w.totalCost ?? ((w.unitCost || 0) * (w.quantity || 0))) || 0).toFixed(2)}
                    </div>
                    <div className="text-[10px] text-slate-400">
                      {w.quantity} {w.unitType}s
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
