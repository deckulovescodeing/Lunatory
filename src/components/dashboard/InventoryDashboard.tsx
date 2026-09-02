import React from 'react';
import { motion } from 'motion/react';
import {
  AlertTriangle,
  ArrowRight,
  Calculator,
  CheckCircle2,
  DollarSign,
  Package,
  QrCode,
  Sparkles,
  Trash2,
  TrendingDown,
  Truck,
  Wifi,
  WifiOff,
} from 'lucide-react';
import {
  AppNotification,
  Category,
  InventoryCountSession,
  InventoryItem,
  Store,
  SyncState,
  TruckOrder,
  User,
  WasteEntry,
} from '../../types';
import { FoxTipCard } from '../fox/FoxTipCard';
import { NavTab } from '../layout/BottomNavigation';
import { SoundPlayer } from '../../utils/audio';

interface InventoryDashboardProps {
  currentUser: User;
  activeStore: Store;
  inventory: InventoryItem[];
  categories: Category[];
  wasteEntries: WasteEntry[];
  truckOrders: TruckOrder[];
  activeCountSession: InventoryCountSession | null;
  syncState: SyncState;
  onNavigate: (tab: NavTab) => void;
  onOpenItemDetail: (item: InventoryItem) => void;
  onOpenGuide: () => void;
}

export const InventoryDashboard: React.FC<InventoryDashboardProps> = ({
  currentUser,
  activeStore,
  inventory,
  categories,
  wasteEntries,
  truckOrders,
  activeCountSession,
  syncState,
  onNavigate,
  onOpenItemDetail,
  onOpenGuide,
}) => {
  // Calculations
  const lowStockItems = inventory.filter(
    (item) => item.currentQuantity <= item.reorderThreshold
  );

  const totalValuation = inventory.reduce(
    (acc, item) => acc + item.currentQuantity * item.costPerUnit,
    0
  );

  // Waste logged today
  const todayStr = new Date().toISOString().split('T')[0];
  const todayWaste = wasteEntries.filter((w) => w.timestamp.startsWith(todayStr));
  const todayWasteCost = todayWaste.reduce((acc, w) => acc + w.totalCost, 0);

  // Next truck order
  const pendingTruckOrder = truckOrders.find(
    (o) => o.status === 'suggested' || o.status === 'ordered'
  );

  const formattedDate = new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  }).format(new Date());

  const handleAction = (tab: NavTab) => {
    onNavigate(tab);
    SoundPlayer.playCountBeep();
  };

  return (
    <div className="space-y-8 pb-20 select-none">
      {/* 1. Header Greeting & Store Status */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white/5 border border-white/10 rounded-3xl p-6 backdrop-blur-sm">
        <div>
          <div className="flex items-center gap-2 text-xs font-medium text-slate-400 mb-1">
            <span>{formattedDate}</span>
            <span>•</span>
            <span className="text-indigo-300 font-semibold">{activeStore.name} (#{activeStore.storeNumber})</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white font-heading tracking-tight">
            Shift Dashboard
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Welcome back, <strong className="text-slate-200">{currentUser.name}</strong> ({currentUser.role})
          </p>
        </div>

        {/* Sync & Store Info Pill */}
        <div className="flex items-center gap-3">
          <div
            className={`px-3.5 py-1.5 rounded-full border text-xs font-medium flex items-center gap-2 ${
              syncState.isOnline
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
            }`}
          >
            {syncState.isOnline ? (
              <>
                <div className="w-2 h-2 bg-emerald-500 rounded-full shadow-[0_0_8px_#10b981]"></div>
                <span>Online / Synced</span>
              </>
            ) : (
              <>
                <WifiOff className="w-3.5 h-3.5 text-amber-400" />
                <span>Offline ({syncState.queue.length})</span>
              </>
            )}
          </div>

          <button
            onClick={onOpenGuide}
            className="px-4 py-2 rounded-2xl bg-indigo-500 hover:bg-indigo-400 text-white text-xs font-bold shadow-lg shadow-indigo-500/20 flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Luna Assistant</span>
          </button>
        </div>
      </div>

      {/* 2. Luna Fox Assistant Tip Card */}
      <FoxTipCard
        mood={lowStockItems.length > 2 ? 'worried' : 'happy'}
        greeting={`Hello, ${currentUser.name.split(' ')[0]}! Ready for inventory?`}
        tip={
          lowStockItems.length > 0
            ? `Heads up! We have ${lowStockItems.length} items below reorder threshold (including ${lowStockItems[0].name}). Let's verify counts and finalize the truck order!`
            : `All Hardee’s inventory levels look healthy right now! Tuesday truck arrives at 6:00 AM.`
        }
        actionText={lowStockItems.length > 0 ? 'Review Low Stock' : 'Start Rapid Count'}
        onAction={() => handleAction(lowStockItems.length > 0 ? 'inventory' : 'count')}
        onOpenGuide={onOpenGuide}
      />

      {/* 3. In-Progress Count Session Resume Banner (if any) */}
      {activeCountSession && (
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="p-6 rounded-3xl bg-indigo-600/20 border border-indigo-400/30 text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xl backdrop-blur-sm"
        >
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-2xl bg-indigo-500/30 border border-indigo-400/40 text-indigo-300">
              <Calculator className="w-6 h-6" />
            </div>
            <div>
              <div className="text-xs font-bold uppercase tracking-widest text-indigo-300">
                Count In Progress
              </div>
              <div className="text-base font-semibold mt-0.5">
                Started by {activeCountSession.countedBy.userName} ({activeCountSession.totalItemsCounted} items saved)
              </div>
            </div>
          </div>
          <button
            onClick={() => handleAction('count')}
            className="px-5 py-3 rounded-2xl bg-indigo-500 hover:bg-indigo-400 text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-indigo-500/20 transition-all self-end sm:self-auto cursor-pointer"
          >
            <span>Resume Count</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </motion.div>
      )}

      {/* 4. Core Metric Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {/* Card 1: Low Stock Alert */}
        <div
          onClick={() => handleAction('inventory')}
          className="bg-white/5 border border-white/10 p-6 rounded-3xl backdrop-blur-sm cursor-pointer transition-all hover:bg-white/[0.08]"
        >
          <p className="text-slate-400 text-sm font-medium mb-1 flex items-center justify-between">
            <span>Low Stock Alert</span>
            <AlertTriangle className={`w-4 h-4 ${lowStockItems.length > 0 ? 'text-rose-400 animate-pulse' : 'text-slate-500'}`} />
          </p>
          <h3 className="text-3xl font-bold text-rose-400">
            {lowStockItems.length} <span className="text-sm font-normal text-slate-500">items</span>
          </h3>
          <div className="mt-3 h-1 w-full bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-rose-500 rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, (lowStockItems.length / Math.max(1, inventory.length)) * 300)}%` }}
            />
          </div>
        </div>

        {/* Card 2: Shift Waste Today */}
        <div
          onClick={() => handleAction('waste')}
          className="bg-white/5 border border-white/10 p-6 rounded-3xl backdrop-blur-sm cursor-pointer transition-all hover:bg-white/[0.08]"
        >
          <p className="text-slate-400 text-sm font-medium mb-1 flex items-center justify-between">
            <span>Daily Waste</span>
            <Trash2 className="w-4 h-4 text-amber-400" />
          </p>
          <h3 className="text-3xl font-bold text-amber-400">
            ${todayWasteCost.toFixed(2)}
          </h3>
          <p className="text-[10px] text-slate-500 mt-2 uppercase tracking-wider">
            {todayWaste.length} logs recorded today
          </p>
        </div>

        {/* Card 3: Next Truck Delivery */}
        <div
          onClick={() => handleAction('orders')}
          className="bg-white/5 border border-white/10 p-6 rounded-3xl backdrop-blur-sm cursor-pointer transition-all hover:bg-white/[0.08]"
        >
          <p className="text-slate-400 text-sm font-medium mb-1 flex items-center justify-between">
            <span>Next Delivery</span>
            <Truck className="w-4 h-4 text-indigo-400" />
          </p>
          <h3 className="text-3xl font-bold text-indigo-300 truncate">
            {activeStore.truckDays[0] || 'Tuesday'}
          </h3>
          <p className="text-[10px] text-slate-500 mt-2 uppercase tracking-wider">
            {pendingTruckOrder ? `PO #${pendingTruckOrder.orderNumber}` : 'Ready to generate'}
          </p>
        </div>

        {/* Card 4: Inventory SKU Valuation */}
        <div
          onClick={() => handleAction('inventory')}
          className="bg-white/5 border border-white/10 p-6 rounded-3xl backdrop-blur-sm cursor-pointer transition-all hover:bg-white/[0.08]"
        >
          <p className="text-slate-400 text-sm font-medium mb-1 flex items-center justify-between">
            <span>Inventory SKUs</span>
            <Package className="w-4 h-4 text-emerald-400" />
          </p>
          <h3 className="text-3xl font-bold text-emerald-400">
            {inventory.length} <span className="text-sm font-normal text-slate-500">items</span>
          </h3>
          <p className="text-[10px] text-slate-500 mt-2 uppercase tracking-wider">
            Valuation: ${totalValuation.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
          </p>
        </div>
      </div>

      {/* 5. Quick Actions Section */}
      <div>
        <h2 className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-4 px-1">
          Quick Actions
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <button
            onClick={() => handleAction('count')}
            className="flex items-center justify-between px-5 py-4 bg-white/[0.03] hover:bg-white/[0.06] rounded-2xl border border-white/5 transition-all text-left group cursor-pointer"
          >
            <div>
              <div className="text-sm font-semibold text-slate-200 group-hover:text-indigo-300 transition-colors">
                Rapid Count
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5">
                Shelf-by-shelf
              </div>
            </div>
            <Calculator className="w-5 h-5 text-slate-600 group-hover:text-indigo-400 transition-colors shrink-0 ml-2" />
          </button>

          <button
            onClick={() => handleAction('scan')}
            className="flex items-center justify-between px-5 py-4 bg-white/[0.03] hover:bg-white/[0.06] rounded-2xl border border-white/5 transition-all text-left group cursor-pointer"
          >
            <div>
              <div className="text-sm font-semibold text-slate-200 group-hover:text-emerald-300 transition-colors">
                Scan Barcode
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5">
                Lookup & count
              </div>
            </div>
            <QrCode className="w-5 h-5 text-slate-600 group-hover:text-emerald-400 transition-colors shrink-0 ml-2" />
          </button>

          <button
            onClick={() => handleAction('truck_day')}
            className="flex items-center justify-between px-5 py-4 bg-white/[0.03] hover:bg-white/[0.06] rounded-2xl border border-white/5 transition-all text-left group cursor-pointer"
          >
            <div>
              <div className="text-sm font-semibold text-slate-200 group-hover:text-amber-300 transition-colors">
                Receive Delivery
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5">
                Check off PO
              </div>
            </div>
            <Truck className="w-5 h-5 text-slate-600 group-hover:text-amber-400 transition-colors shrink-0 ml-2" />
          </button>

          <button
            onClick={() => handleAction('waste')}
            className="flex items-center justify-between px-5 py-4 bg-white/[0.03] hover:bg-white/[0.06] rounded-2xl border border-white/5 transition-all text-left group cursor-pointer"
          >
            <div>
              <div className="text-sm font-semibold text-slate-200 group-hover:text-rose-300 transition-colors">
                Log Waste
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5">
                Record loss
              </div>
            </div>
            <Trash2 className="w-5 h-5 text-slate-600 group-hover:text-rose-400 transition-colors shrink-0 ml-2" />
          </button>
        </div>
      </div>

      {/* 6. Critical Low Stock Spotlight / Inventory Snapshot */}
      {lowStockItems.length > 0 && (
        <div className="bg-white/5 border border-white/10 rounded-3xl p-6 sm:p-8 backdrop-blur-sm flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-lg font-semibold text-white">Inventory Snapshot (Low Stock)</h2>
              <p className="text-xs text-slate-500">Critical items below minimum par levels</p>
            </div>
            <button
              onClick={() => handleAction('inventory')}
              className="text-sm text-indigo-400 font-medium hover:underline cursor-pointer"
            >
              View Full List
            </button>
          </div>

          <div className="space-y-3">
            {lowStockItems.slice(0, 6).map((item) => {
              const category = categories.find((c) => c.id === item.categoryId);
              return (
                <div
                  key={item.id}
                  onClick={() => onOpenItemDetail(item)}
                  className="flex items-center justify-between p-4 bg-white/[0.03] border border-white/5 rounded-2xl hover:bg-white/[0.06] transition-all cursor-pointer group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold shrink-0"
                      style={{
                        backgroundColor: `${category?.color || '#6366f1'}25`,
                        color: category?.color || '#a5b4fc',
                        border: `1px solid ${category?.color || '#6366f1'}40`,
                      }}
                    >
                      {item.name.charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-sm text-slate-200 group-hover:text-indigo-300 transition-colors truncate">
                        {item.name}
                      </p>
                      <p className="text-xs text-slate-500">
                        Category: {category?.name || 'General'} • {item.storageLocation}
                      </p>
                    </div>
                  </div>

                  <div className="text-right shrink-0 ml-3">
                    <p className="text-sm font-bold text-rose-400">
                      {item.currentQuantity} {item.unitType} Remaining
                    </p>
                    <p className="text-xs text-slate-500 italic">
                      Par: {item.parLevel} {item.unitType}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
