import React, { useState } from 'react';
import { motion } from 'motion/react';
import {
  BarChart3,
  Download,
  DollarSign,
  TrendingDown,
  Package,
  Calendar,
  Sparkles,
  PieChart,
  FileSpreadsheet,
  CheckCircle2,
} from 'lucide-react';
import {
  Category,
  InventoryCountSession,
  InventoryItem,
  Store,
  WasteEntry,
} from '../../types';
import { SoundPlayer } from '../../utils/audio';

interface ReportsViewProps {
  activeStore: Store;
  inventory: InventoryItem[];
  categories: Category[];
  wasteEntries: WasteEntry[];
  countSessions: InventoryCountSession[];
  onExportInventoryCSV: () => void;
  onExportWasteCSV: () => void;
  onExportCountsCSV: () => void;
}

export const ReportsView: React.FC<ReportsViewProps> = ({
  activeStore,
  inventory,
  categories,
  wasteEntries,
  countSessions,
  onExportInventoryCSV,
  onExportWasteCSV,
  onExportCountsCSV,
}) => {
  const [activeTab, setActiveTab] = useState<'valuation' | 'waste' | 'counts'>('valuation');

  // Total inventory valuation
  const totalValuation = inventory.reduce(
    (acc, i) => acc + i.currentQuantity * i.costPerUnit,
    0
  );

  // Category valuation breakdown
  const categoryStats = categories.map((cat) => {
    const items = inventory.filter((i) => i.categoryId === cat.id);
    const catValue = items.reduce((acc, i) => acc + i.currentQuantity * i.costPerUnit, 0);
    const percent = totalValuation > 0 ? Math.round((catValue / totalValuation) * 100) : 0;
    return {
      category: cat,
      itemCount: items.length,
      value: catValue,
      percent,
    };
  });

  // Total waste stats
  const totalWaste = wasteEntries.reduce((acc, w) => acc + w.totalCost, 0);

  // Top waste items
  const wasteByItem: Record<string, { name: string; cost: number; qty: number; unit: string }> = {};
  wasteEntries.forEach((w) => {
    if (!wasteByItem[w.itemId]) {
      wasteByItem[w.itemId] = { name: w.itemName, cost: 0, qty: 0, unit: w.unitType };
    }
    wasteByItem[w.itemId].cost += w.totalCost;
    wasteByItem[w.itemId].qty += w.quantity;
  });

  const sortedWasteItems = Object.values(wasteByItem).sort((a, b) => b.cost - a.cost);

  // Par health score
  const onParCount = inventory.filter(
    (i) => i.currentQuantity > i.reorderThreshold && i.currentQuantity <= i.maxTarget
  ).length;
  const parHealthScore = Math.round((onParCount / (inventory.length || 1)) * 100);

  return (
    <div className="space-y-4 pb-24 select-none">
      {/* 1. Header & CSV Actions */}
      <div className="bg-slate-900/80 border border-white/10 rounded-2xl p-4 backdrop-blur-md flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
            <BarChart3 className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg sm:text-xl font-extrabold text-white font-heading">
              Analytics & Shift Reports
            </h1>
            <p className="text-xs text-slate-400">
              Financial valuation, food waste analysis & count audits
            </p>
          </div>
        </div>

        {/* Quick CSV Export Group */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            onClick={() => {
              onExportInventoryCSV();
              SoundPlayer.playSuccessFanfare();
            }}
            className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-slate-200 flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5 text-amber-400" />
            <span>Stock CSV</span>
          </button>
          <button
            onClick={() => {
              onExportWasteCSV();
              SoundPlayer.playSuccessFanfare();
            }}
            className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-slate-200 flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5 text-rose-400" />
            <span>Waste CSV</span>
          </button>
          <button
            onClick={() => {
              onExportCountsCSV();
              SoundPlayer.playSuccessFanfare();
            }}
            className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-slate-200 flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5 text-indigo-400" />
            <span>Audits CSV</span>
          </button>
        </div>
      </div>

      {/* 2. Top Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-4 rounded-2xl bg-slate-900/80 border border-white/10">
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Total Inventory Assets
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-amber-300 font-heading mt-1">
            ${totalValuation.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">
            Across {inventory.length} active SKUs
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/80 border border-white/10">
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Total Waste Recorded
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-rose-400 font-heading mt-1">
            ${(totalWaste || 0).toFixed(2)}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">
            {wasteEntries.length} logged incidents
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/80 border border-white/10">
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Par Compliance Health
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-emerald-400 font-heading mt-1">
            {parHealthScore}%
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">
            {onParCount} items strictly on target
          </div>
        </div>
      </div>

      {/* 3. Tab Selector */}
      <div className="flex items-center gap-1.5 bg-slate-950/60 p-1.5 rounded-2xl border border-slate-800">
        {[
          { id: 'valuation', label: 'Inventory Valuation by Category' },
          { id: 'waste', label: 'Waste Breakdown & Causes' },
          { id: 'counts', label: 'Recent Count Audit History' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => {
              setActiveTab(tab.id as any);
              SoundPlayer.playCountBeep();
            }}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all ${
              activeTab === tab.id
                ? 'bg-amber-400 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* 4. Tab Content */}
      {activeTab === 'valuation' && (
        <div className="bg-slate-900/80 border border-white/10 rounded-3xl p-5 backdrop-blur-md space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-300">
            Stock Valuation Breakdown by Department
          </h2>

          <div className="space-y-3">
            {categoryStats.map((stat) => (
              <div key={stat.category.id} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: stat.category.color }}
                    />
                    <span className="font-bold text-white">{stat.category.name}</span>
                    <span className="text-slate-400">({stat.itemCount} SKUs)</span>
                  </div>
                  <div className="font-bold text-slate-200">
                    ${(stat.value || 0).toFixed(2)}{' '}
                    <span className="text-slate-400 font-normal">({stat.percent}%)</span>
                  </div>
                </div>

                <div className="w-full h-2 rounded-full bg-slate-950 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      backgroundColor: stat.category.color,
                      width: `${stat.percent}%`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'waste' && (
        <div className="bg-slate-900/80 border border-white/10 rounded-3xl p-5 backdrop-blur-md space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-300">
            Top 5 Waste Items by Dollar Impact
          </h2>

          <div className="space-y-2.5">
            {sortedWasteItems.slice(0, 5).map((w, idx) => (
              <div
                key={idx}
                className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800 flex items-center justify-between gap-3 text-xs"
              >
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-full bg-rose-500/20 text-rose-300 font-bold flex items-center justify-center text-xs">
                    {idx + 1}
                  </span>
                  <div>
                    <div className="font-bold text-white">{w.name}</div>
                    <div className="text-[10px] text-slate-400">
                      {w.qty} {w.unit}s logged to waste
                    </div>
                  </div>
                </div>

                <div className="text-right font-extrabold text-rose-400 text-sm">
                  -${(w.cost || 0).toFixed(2)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'counts' && (
        <div className="bg-slate-900/80 border border-white/10 rounded-3xl p-5 backdrop-blur-md space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-300">
            Historical Count Sessions
          </h2>

          {countSessions.length === 0 ? (
            <div className="p-8 text-center text-slate-500 text-xs">
              No count sessions completed yet!
            </div>
          ) : (
            <div className="space-y-2.5">
              {countSessions.map((session) => (
                <div
                  key={session.id}
                  className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800 flex items-center justify-between gap-3 text-xs"
                >
                  <div>
                    <div className="font-bold text-white">
                      {session.location || 'Storewide'} Shift Count
                    </div>
                    <div className="text-[10px] text-slate-400 mt-0.5">
                      Completed by <strong className="text-slate-200">{session.countedBy.userName}</strong> ({session.countedBy.role}) on{' '}
                      {new Date(session.completedAt || session.startedAt).toLocaleString()}
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 uppercase">
                      {session.totalItemsCounted} items saved
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
