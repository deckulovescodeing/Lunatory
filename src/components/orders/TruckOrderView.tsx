import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Truck,
  Plus,
  Minus,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Download,
  Printer,
  Calendar,
  Clock,
  Send,
  Building2,
  Camera,
  FileText,
  Edit2,
  Check,
} from 'lucide-react';
import { InventoryItem, Store, TruckOrder, TruckOrderItem, User } from '../../types';
import { SoundPlayer } from '../../utils/audio';
import { InvoiceScannerModal } from './InvoiceScannerModal';

interface TruckOrderViewProps {
  activeStore: Store;
  currentUser: User;
  inventory: InventoryItem[];
  truckOrders: TruckOrder[];
  onCreateOrder: (order: TruckOrder) => void;
  onUpdateOrderStatus: (orderId: string, status: TruckOrder['status']) => void;
  onNavigateToTruckDay: () => void;
}

export const TruckOrderView: React.FC<TruckOrderViewProps> = ({
  activeStore,
  currentUser,
  inventory,
  truckOrders,
  onCreateOrder,
  onUpdateOrderStatus,
  onNavigateToTruckDay,
}) => {
  const [isScannerOpen, setIsScannerOpen] = useState<boolean>(false);

  // Delivery Date & Order Cutoff states (Editable)
  const defaultDeliveryDate = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + (activeStore.leadTimeDays || 2));
    return d.toISOString().split('T')[0];
  }, [activeStore.leadTimeDays]);

  const [customDeliveryDate, setCustomDeliveryDate] = useState<string>(defaultDeliveryDate);
  const [customCutoffTime, setCustomCutoffTime] = useState<string>(
    `${activeStore.cutoffDay || 'Sunday'} at ${activeStore.cutoffTimeStr || '14:00 (2:00 PM EST)'}`
  );
  const [isEditingSchedule, setIsEditingSchedule] = useState<boolean>(false);

  // Generate smart suggestions based on par levels and lead time
  const [leadTimeDays, setLeadTimeDays] = useState<number>(3);
  const [orderItemsMap, setOrderItemsMap] = useState<Record<string, number>>(() => {
    const map: Record<string, number> = {};
    inventory.forEach((item) => {
      // Smart algorithm: (Par - Current) + (LeadTime * DailyUsage)
      const deficit = Math.max(0, item.parLevel - item.currentQuantity);
      const usageDuringLead = Math.ceil(item.usageRatePerDay * 3);
      const suggested = deficit + (item.currentQuantity <= item.reorderThreshold ? usageDuringLead : 0);
      if (suggested > 0) {
        map[item.id] = suggested;
      }
    });
    return map;
  });

  const [orderNotes, setOrderNotes] = useState<string>(
    `${activeStore.name} weekly replenishment order for ${activeStore.truckDays?.join(' & ') || 'Tuesday'} truck.`
  );

  const handleApplyScannedToBuilder = (scannedOrder: TruckOrder) => {
    const newMap = { ...orderItemsMap };
    scannedOrder.items.forEach((item) => {
      newMap[item.itemId] = item.orderedQuantity;
    });
    setOrderItemsMap(newMap);
    if (scannedOrder.notes) setOrderNotes(scannedOrder.notes);
    if (scannedOrder.deliveryDate) setCustomDeliveryDate(scannedOrder.deliveryDate);
    if (scannedOrder.cutoffTime) setCustomCutoffTime(scannedOrder.cutoffTime);
    SoundPlayer.playSuccessFanfare();
  };

  // Calculate order items
  const suggestedOrderList = useMemo(() => {
    return inventory
      .map((item) => {
        const orderQty = orderItemsMap[item.id] || 0;
        const totalCost = orderQty * item.costPerUnit;
        return {
          itemId: item.id,
          itemName: item.name,
          sku: item.sku,
          unitType: item.unitType,
          packSize: item.packSize,
          currentQuantity: item.currentQuantity,
          parLevel: item.parLevel,
          suggestedQuantity: orderQty,
          orderedQuantity: orderQty,
          unitCost: item.costPerUnit,
          totalCost,
          receivedQuantity: 0,
        } as TruckOrderItem;
      })
      .filter((line) => line.suggestedQuantity > 0 || orderItemsMap[line.itemId] > 0);
  }, [inventory, orderItemsMap]);

  const totalOrderCost = suggestedOrderList.reduce((acc, line) => acc + line.totalCost, 0);
  const totalCases = suggestedOrderList.reduce((acc, line) => acc + line.orderedQuantity, 0);

  const handleAdjustItem = (itemId: string, delta: number) => {
    setOrderItemsMap((prev) => {
      const current = prev[itemId] || 0;
      const next = Math.max(0, current + delta);
      return {
        ...prev,
        [itemId]: next,
      };
    });
    if (delta > 0) {
      SoundPlayer.playCountBeep();
    } else {
      SoundPlayer.playDecrementSound();
    }
  };

  const handleCreateOrder = (status: 'suggested' | 'ordered') => {
    const activeItems = suggestedOrderList.filter((i) => i.orderedQuantity > 0);
    if (activeItems.length === 0) return;

    const newOrder: TruckOrder = {
      id: 'order-' + Date.now(),
      storeId: activeStore.id,
      orderNumber: 'USF-HAR-' + Math.floor(1000 + Math.random() * 9000),
      vendor: 'US Foods CKE Supply',
      deliveryDate: customDeliveryDate,
      cutoffTime: customCutoffTime,
      status,
      items: activeItems,
      totalCost: totalOrderCost,
      createdAt: new Date().toISOString(),
      createdBy: {
        userId: currentUser.id,
        userName: currentUser.name,
        role: currentUser.role,
      },
      notes: orderNotes,
    };

    onCreateOrder(newOrder);
    SoundPlayer.playSuccessFanfare();
  };

  const pendingOrders = truckOrders.filter((o) => o.status === 'suggested' || o.status === 'ordered');

  return (
    <div className="space-y-5 pb-24 select-none">
      {/* 1. Header with Next Truck & Cutoff Notice */}
      <div className="bg-slate-900/80 border border-white/10 rounded-2xl p-4 backdrop-blur-md flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/30">
            <Truck className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg sm:text-xl font-extrabold text-white font-heading">
                Smart Truck Order Builder
              </h1>
              <span className="px-2 py-0.5 text-[10px] font-bold bg-amber-500/20 text-amber-300 rounded-full border border-amber-400/30">
                US Foods CKE
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Auto-calculates replenishment from par levels & weekly consumption rates
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsScannerOpen(true)}
            className="px-3.5 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white text-xs font-bold rounded-xl shadow-md flex items-center gap-1.5 transition-transform active:scale-95"
          >
            <Camera className="w-4 h-4" />
            <span>Scan Multi-Page Invoice</span>
          </button>
          <button
            onClick={onNavigateToTruckDay}
            className="px-3.5 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold rounded-xl shadow-md flex items-center gap-1.5 transition-transform active:scale-95"
          >
            <Truck className="w-4 h-4" />
            <span>Switch to Receiving Mode</span>
          </button>
        </div>
      </div>

      {/* 2. Active / Pending Orders List */}
      {pendingOrders.length > 0 && (
        <div className="bg-slate-900/80 border border-indigo-500/30 rounded-2xl p-4 backdrop-blur-md space-y-3">
          <h2 className="text-xs font-bold uppercase tracking-wider text-indigo-300 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" /> Active Purchase Orders in Transit
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {pendingOrders.map((order) => (
              <div
                key={order.id}
                className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 flex flex-col justify-between gap-3 text-xs"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white text-sm font-mono">PO #{order.orderNumber}</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-amber-500/20 text-amber-300 border border-amber-500/30">
                      {order.status}
                    </span>
                  </div>
                  <div className="text-slate-400 text-[11px] mt-1">
                    Delivery: <strong className="text-white">{order.deliveryDate || order.scheduledDeliveryDate || 'Pending'}</strong> ({order.items.length} items, ${((order.totalCost ?? order.totalEstimatedCost) || 0).toFixed(2)})
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-800/80">
                  <span className="text-[10px] text-slate-400">Created by {order.createdBy.userName}</span>
                  <button
                    onClick={onNavigateToTruckDay}
                    className="px-3 py-1 bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-bold rounded-lg shadow-sm"
                  >
                    Receive Truck
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 3. Smart Order Generator Builder */}
      <div className="bg-slate-900/90 border border-slate-700/80 rounded-3xl p-5 backdrop-blur-md space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div>
            <h2 className="text-base font-bold text-white font-heading">
              New Replenishment Proposal
            </h2>
            <p className="text-xs text-slate-400">
              Review and adjust suggested case quantities before transmitting to vendor
            </p>
          </div>

          <div className="flex items-center gap-4 text-right">
            <div>
              <div className="text-[10px] uppercase font-bold text-slate-400">Total Cases</div>
              <div className="text-xl font-extrabold text-white font-heading">{totalCases}</div>
            </div>
            <div className="h-8 w-px bg-slate-800" />
            <div>
              <div className="text-[10px] uppercase font-bold text-slate-400">Total PO Estimate</div>
              <div className="text-xl font-extrabold text-amber-300 font-heading">
                ${totalOrderCost.toFixed(2)}
              </div>
            </div>
          </div>
        </div>

        {/* Delivery Schedule & Cutoff Time Editor Bar */}
        <div className="p-4 rounded-2xl bg-slate-950/80 border border-amber-500/30 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-amber-400" />
              <span className="text-xs font-bold text-white uppercase tracking-wider">
                Truck Delivery Schedule & Cutoff Deadline
              </span>
            </div>

            <button
              onClick={() => {
                setIsEditingSchedule(!isEditingSchedule);
                SoundPlayer.playCountBeep();
              }}
              className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-amber-300 text-xs font-bold flex items-center gap-1.5 self-start sm:self-auto border border-amber-400/20"
            >
              <Edit2 className="w-3.5 h-3.5" />
              <span>{isEditingSchedule ? 'Close Schedule Editor' : 'Modify Dates & Times'}</span>
            </button>
          </div>

          {!isEditingSchedule ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div className="flex items-center gap-2 text-xs">
                <Truck className="w-4 h-4 text-amber-400 shrink-0" />
                <div>
                  <span className="text-slate-400">Scheduled Delivery Date: </span>
                  <strong className="text-white font-mono">{customDeliveryDate}</strong>
                  <span className="text-[10px] text-amber-300/80 ml-1.5 font-semibold">
                    ({activeStore.truckDays?.join(' & ') || 'Standard Schedule'})
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 text-xs">
                <Clock className="w-4 h-4 text-indigo-400 shrink-0" />
                <div>
                  <span className="text-slate-400">Order Cutoff Deadline: </span>
                  <strong className="text-indigo-200">{customCutoffTime}</strong>
                </div>
              </div>
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-800"
            >
              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-amber-400" />
                  Scheduled Truck Arrival Date:
                </label>
                <input
                  type="date"
                  value={customDeliveryDate}
                  onChange={(e) => setCustomDeliveryDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white font-mono focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-indigo-400" />
                  Order Cutoff Deadline (Time & Day):
                </label>
                <input
                  type="text"
                  value={customCutoffTime}
                  onChange={(e) => setCustomCutoffTime(e.target.value)}
                  placeholder="e.g. Sunday at 2:00 PM EST or 14:00"
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-amber-400"
                />
              </div>
            </motion.div>
          )}
        </div>

        {/* Suggested Line Items Table */}
        <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
          {suggestedOrderList.map((item) => {
            const isHighNeed = item.currentQuantity <= (item.parLevel * 0.4);
            return (
              <div
                key={item.itemId}
                className={`p-3 rounded-xl border flex items-center justify-between gap-3 text-xs ${
                  isHighNeed
                    ? 'bg-rose-950/40 border-rose-800/50'
                    : 'bg-slate-950/70 border-slate-800'
                }`}
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white truncate">{item.itemName}</span>
                    {isHighNeed && (
                      <span className="px-1.5 py-0.2 text-[9px] font-bold rounded bg-rose-500/20 text-rose-300 border border-rose-500/30 uppercase">
                        Low Stock
                      </span>
                    )}
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">
                    On Hand: <strong className="text-slate-200">{item.currentQuantity ?? 0}</strong> • Par: {item.parLevel ?? 0} • ${(item.unitCost || 0).toFixed(2)}/case
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <div className="text-right">
                    <div className="font-bold text-amber-300">${((item.totalCost ?? (item.unitCost * (item.orderedQuantity ?? 0))) || 0).toFixed(2)}</div>
                  </div>

                  {/* Quantity Stepper */}
                  <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-700">
                    <button
                      onClick={() => handleAdjustItem(item.itemId, -1)}
                      className="p-1 text-slate-300 hover:text-white rounded hover:bg-slate-800"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="w-7 text-center font-extrabold text-white text-xs">
                      {item.orderedQuantity}
                    </span>
                    <button
                      onClick={() => handleAdjustItem(item.itemId, +1)}
                      className="p-1 text-amber-400 hover:text-amber-300 rounded hover:bg-slate-800"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Order Notes & Actions */}
        <div className="pt-3 border-t border-slate-800 space-y-3">
          <input
            type="text"
            value={orderNotes}
            onChange={(e) => setOrderNotes(e.target.value)}
            placeholder="Order notes for delivery driver or store manager..."
            className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white"
          />

          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <span className="text-[11px] text-slate-400">
              Cutoff: <strong className="text-indigo-300">{customCutoffTime}</strong> for{' '}
              <strong className="text-amber-300">{customDeliveryDate}</strong> arrival
            </span>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                onClick={() => handleCreateOrder('suggested')}
                className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-semibold"
              >
                Save as Draft PO
              </button>
              <button
                onClick={() => handleCreateOrder('ordered')}
                className="flex-1 sm:flex-initial px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-400 to-orange-400 hover:from-amber-300 hover:to-orange-300 text-slate-950 text-xs font-extrabold shadow-lg flex items-center justify-center gap-1.5 transition-transform active:scale-95"
              >
                <Send className="w-4 h-4" />
                <span>Approve & Transmit Order</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <InvoiceScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        activeStore={activeStore}
        currentUser={currentUser}
        inventory={inventory}
        onApplyToOrderBuilder={handleApplyScannedToBuilder}
        onApplyToReceiving={(order) => {
          onCreateOrder(order);
          onNavigateToTruckDay();
        }}
        onDirectReceiveStock={(order) => {
          onCreateOrder({ ...order, status: 'received' });
        }}
      />
    </div>
  );
};
