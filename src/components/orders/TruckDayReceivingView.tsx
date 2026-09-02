import React, { useState } from 'react';
import { motion } from 'motion/react';
import {
  Truck,
  CheckCircle2,
  AlertTriangle,
  Plus,
  Minus,
  Check,
  RotateCcw,
  Sparkles,
  PackageCheck,
  DollarSign,
  Camera,
  FileText,
} from 'lucide-react';
import { InventoryItem, Store, TruckOrder, User } from '../../types';
import { LunaFox } from '../fox/LunaFox';
import { SoundPlayer } from '../../utils/audio';
import { InvoiceScannerModal } from './InvoiceScannerModal';

interface TruckDayReceivingViewProps {
  activeStore: Store;
  currentUser: User;
  truckOrders: TruckOrder[];
  inventory: InventoryItem[];
  onFinalizeReceiving: (orderId: string, receivedMap: Record<string, number>, damageNotes: string) => void;
  onBackToOrders: () => void;
  onImportScannedOrder?: (order: TruckOrder) => void;
}

export const TruckDayReceivingView: React.FC<TruckDayReceivingViewProps> = ({
  activeStore,
  currentUser,
  truckOrders,
  inventory,
  onFinalizeReceiving,
  onBackToOrders,
  onImportScannedOrder,
}) => {
  const [isScannerOpen, setIsScannerOpen] = useState<boolean>(false);
  const [activeScannedOrder, setActiveScannedOrder] = useState<TruckOrder | null>(null);

  // Find primary pending order to receive or use currently scanned order
  const targetOrder =
    activeScannedOrder ||
    truckOrders.find((o) => o.status === 'ordered' || o.status === 'suggested') ||
    truckOrders[0];

  const [receivedMap, setReceivedMap] = useState<Record<string, number>>(() => {
    if (!targetOrder) return {};
    const map: Record<string, number> = {};
    targetOrder.items.forEach((item) => {
      map[item.itemId] = item.orderedQuantity; // default to full expected
    });
    return map;
  });

  const [damagedMap, setDamagedMap] = useState<Record<string, number>>({});
  const [damageNotes, setDamageNotes] = useState<string>('');
  const [isDone, setIsDone] = useState<boolean>(false);

  const handleApplyScannedOrder = (order: TruckOrder) => {
    setActiveScannedOrder(order);
    const map: Record<string, number> = {};
    order.items.forEach((item) => {
      map[item.itemId] = item.receivedQuantity || item.orderedQuantity;
    });
    setReceivedMap(map);
    onImportScannedOrder?.(order);
  };

  if (!targetOrder) {
    return (
      <div className="p-8 text-center bg-slate-900/80 rounded-3xl border border-white/10 text-slate-400 space-y-4 max-w-lg mx-auto">
        <div className="w-16 h-16 rounded-3xl bg-amber-500/20 border border-amber-500/30 text-amber-400 mx-auto flex items-center justify-center">
          <Truck className="w-8 h-8 opacity-80" />
        </div>
        <div>
          <h3 className="text-base font-bold text-white">No Pending Orders to Receive</h3>
          <p className="text-xs text-slate-400 mt-1">
            Scan your physical delivery invoice sheets or create a purchase order first.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <button
            onClick={() => setIsScannerOpen(true)}
            className="w-full sm:w-auto px-5 py-2.5 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white text-xs font-bold rounded-xl shadow-lg flex items-center justify-center gap-2"
          >
            <Camera className="w-4 h-4" />
            <span>Scan Delivery Invoice</span>
          </button>
          <button
            onClick={onBackToOrders}
            className="w-full sm:w-auto px-4 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 text-xs font-bold rounded-xl"
          >
            Go to Order Builder
          </button>
        </div>

        <InvoiceScannerModal
          isOpen={isScannerOpen}
          onClose={() => setIsScannerOpen(false)}
          activeStore={activeStore}
          currentUser={currentUser}
          inventory={inventory}
          onApplyToReceiving={handleApplyScannedOrder}
          onDirectReceiveStock={(order) => {
            handleApplyScannedOrder(order);
            const map: Record<string, number> = {};
            order.items.forEach((i) => {
              map[i.itemId] = i.receivedQuantity || i.orderedQuantity;
            });
            onFinalizeReceiving(order.id, map, 'Directly received via multi-page invoice scan.');
          }}
        />
      </div>
    );
  }

  const handleAdjustReceived = (itemId: string, delta: number) => {
    setReceivedMap((prev) => {
      const current = prev[itemId] || 0;
      const next = Math.max(0, current + delta);
      return { ...prev, [itemId]: next };
    });
    if (delta > 0) {
      SoundPlayer.playCountBeep();
    } else {
      SoundPlayer.playDecrementSound();
    }
  };

  const handleAdjustDamaged = (itemId: string, delta: number) => {
    setDamagedMap((prev) => {
      const current = prev[itemId] || 0;
      const next = Math.max(0, current + delta);
      return { ...prev, [itemId]: next };
    });
    if (delta > 0) {
      SoundPlayer.playAlertChime();
    }
  };

  const handleQuickReceiveAll = () => {
    const map: Record<string, number> = {};
    targetOrder.items.forEach((item) => {
      map[item.itemId] = item.orderedQuantity;
    });
    setReceivedMap(map);
    SoundPlayer.playSuccessFanfare();
  };

  const handleFinalize = () => {
    onFinalizeReceiving(targetOrder.id, receivedMap, damageNotes);
    SoundPlayer.playSuccessFanfare();
    setIsDone(true);
  };

  const totalExpected = targetOrder.items.reduce((acc, i) => acc + (i.orderedQuantity || i.orderedQty || 0), 0);
  const totalReceived = Object.values(receivedMap).reduce<number>((acc, v) => acc + (Number(v) || 0), 0);

  return (
    <div className="space-y-4 pb-24 select-none">
      {/* 1. Header with Manifest Details */}
      <div className="bg-slate-900/80 border border-white/10 rounded-2xl p-4 backdrop-blur-md flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
            <PackageCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg sm:text-xl font-extrabold text-white font-heading">
                Truck Receiving Checklist
              </h1>
              <span className="font-mono text-xs text-amber-300 font-bold bg-amber-500/20 px-2 py-0.5 rounded">
                PO #{targetOrder.orderNumber}
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Vendor: <strong>{targetOrder.vendor}</strong> • Delivery for {activeStore.name}
            </p>
          </div>
        </div>

        <div className="flex items-center flex-wrap gap-2">
          <button
            onClick={() => setIsScannerOpen(true)}
            className="px-3.5 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white text-xs font-bold rounded-xl shadow-md flex items-center gap-1.5 transition-transform active:scale-95"
          >
            <Camera className="w-3.5 h-3.5" />
            <span>Scan Multi-Page Invoice</span>
          </button>
          <button
            onClick={handleQuickReceiveAll}
            className="px-3.5 py-2 bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-slate-200 rounded-xl"
          >
            Mark All 100% Received
          </button>
          <button
            onClick={handleFinalize}
            className="px-5 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 text-xs font-extrabold rounded-xl shadow-lg flex items-center gap-1.5 transition-transform active:scale-95"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Finalize & Update Stock</span>
          </button>
        </div>
      </div>

      {/* 2. Receiving Progress Tally Card */}
      <div className="bg-slate-900/80 border border-white/10 rounded-2xl p-4 backdrop-blur-md flex items-center justify-between">
        <div>
          <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Delivery Verification
          </div>
          <div className="text-sm font-semibold text-white mt-0.5">
            Received <strong className="text-emerald-400">{totalReceived}</strong> of <strong className="text-slate-300">{totalExpected}</strong> expected cases
          </div>
        </div>
        <LunaFox mood={totalReceived >= totalExpected ? 'celebrating' : 'happy'} size="md" />
      </div>

      {/* 3. Items Manifest Checklist */}
      <div className="bg-slate-900/90 border border-slate-700/80 rounded-3xl p-5 backdrop-blur-md space-y-3">
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">
          Delivery Manifest Line Items
        </h2>

        <div className="space-y-2.5">
          {targetOrder.items.map((item) => {
            const received = receivedMap[item.itemId] ?? item.orderedQuantity;
            const damaged = damagedMap[item.itemId] || 0;
            const isShort = received < item.orderedQuantity;

            return (
              <div
                key={item.itemId}
                className={`p-3.5 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs transition-colors ${
                  isShort
                    ? 'bg-rose-950/30 border-rose-900/50'
                    : 'bg-slate-950/70 border-slate-800'
                }`}
              >
                <div className="min-w-0">
                  <div className="font-bold text-white text-sm">{item.itemName}</div>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    Expected: <strong className="text-slate-200">{item.orderedQuantity} {item.unitType}s</strong> ({item.packSize})
                  </div>
                </div>

                <div className="flex items-center gap-4 shrink-0">
                  {/* Received Counter */}
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-semibold text-slate-400">Delivered:</span>
                    <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-700">
                      <button
                        onClick={() => handleAdjustReceived(item.itemId, -1)}
                        className="p-1 text-slate-300 hover:text-white"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="w-6 text-center font-extrabold text-white text-xs">
                        {received}
                      </span>
                      <button
                        onClick={() => handleAdjustReceived(item.itemId, +1)}
                        className="p-1 text-emerald-400 hover:text-emerald-300"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Damaged Counter */}
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-semibold text-rose-400">Damaged:</span>
                    <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-700">
                      <button
                        onClick={() => handleAdjustDamaged(item.itemId, -1)}
                        className="p-1 text-slate-300 hover:text-white"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="w-6 text-center font-extrabold text-rose-300 text-xs">
                        {damaged}
                      </span>
                      <button
                        onClick={() => handleAdjustDamaged(item.itemId, +1)}
                        className="p-1 text-rose-400 hover:text-rose-300"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Damage & Shortage Notes */}
        <div className="pt-3 border-t border-slate-800 space-y-2">
          <label className="block text-[11px] font-semibold text-slate-400">
            Delivery Shortage / Credit Request Notes
          </label>
          <input
            type="text"
            value={damageNotes}
            onChange={(e) => setDamageNotes(e.target.value)}
            placeholder="e.g. 1 box biscuit mix punctured by pallet jack, requested US Foods credit memo"
            className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white"
          />
        </div>
      </div>

      <InvoiceScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        activeStore={activeStore}
        currentUser={currentUser}
        inventory={inventory}
        onApplyToReceiving={handleApplyScannedOrder}
        onDirectReceiveStock={(order) => {
          handleApplyScannedOrder(order);
          const map: Record<string, number> = {};
          order.items.forEach((i) => {
            map[i.itemId] = i.receivedQuantity || i.orderedQuantity;
          });
          onFinalizeReceiving(order.id, map, 'Directly received via multi-page invoice scan.');
        }}
      />
    </div>
  );
};
