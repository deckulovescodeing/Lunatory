import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  Plus,
  Minus,
  Barcode,
  Printer,
  Edit2,
  Trash2,
  Check,
  AlertTriangle,
  History,
  TrendingDown,
  Building2,
  Sparkles,
} from 'lucide-react';
import { Category, InventoryItem, StorageLocation, UnitType, UserRole } from '../../types';
import { SoundPlayer } from '../../utils/audio';

interface ItemDetailModalProps {
  item: InventoryItem | null;
  categories: Category[];
  userRole: UserRole;
  isOpen: boolean;
  onClose: () => void;
  onUpdateQuantity: (itemId: string, newQty: number, reason: string) => void;
  onSaveItem: (item: InventoryItem) => void;
  onDeleteItem: (itemId: string) => void;
}

export const ItemDetailModal: React.FC<ItemDetailModalProps> = ({
  item,
  categories,
  userRole,
  isOpen,
  onClose,
  onUpdateQuantity,
  onSaveItem,
  onDeleteItem,
}) => {
  if (!item) return null;

  const isManagerOrAdmin = userRole === 'manager' || userRole === 'admin';
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<InventoryItem>({ ...item });
  const [adjustmentDelta, setAdjustmentDelta] = useState<number>(0);
  const [adjustmentReason, setAdjustmentReason] = useState<string>('Routine Spot Check');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<boolean>(false);

  const category = categories.find((c) => c.id === item.categoryId);

  // Par percentage
  const parPercent = Math.min(150, Math.round((item.currentQuantity / (item.parLevel || 1)) * 100));

  const handleApplyAdjustment = () => {
    if (adjustmentDelta !== 0) {
      const newTotal = Math.max(0, item.currentQuantity + adjustmentDelta);
      onUpdateQuantity(item.id, newTotal, adjustmentReason);
      setAdjustmentDelta(0);
      SoundPlayer.playSuccessFanfare();
    }
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveItem(editForm);
    setIsEditing(false);
    SoundPlayer.playSuccessFanfare();
  };

  const handleDelete = () => {
    onDeleteItem(item.id);
    onClose();
    SoundPlayer.playTrashDropSound();
  };

  const printLabel = () => {
    SoundPlayer.playScanSuccess();
    window.print();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/65 backdrop-blur-sm select-none">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            className="relative w-full max-w-lg bg-slate-900 border border-slate-700 rounded-3xl shadow-2xl text-white overflow-hidden max-h-[90vh] flex flex-col"
          >
            {/* Modal Header */}
            <div className="px-6 py-4 bg-slate-950/80 border-b border-slate-800 flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <span
                    className="px-2 py-0.5 text-[10px] font-bold rounded-md uppercase tracking-wider text-white"
                    style={{ backgroundColor: category?.color || '#6366f1' }}
                  >
                    {category?.name || 'General'}
                  </span>
                  <span className="text-xs font-mono text-slate-400">SKU: {item.sku}</span>
                </div>
                <h2 className="text-xl font-bold text-white font-heading mt-1">
                  {item.name}
                </h2>
                <div className="text-xs text-slate-400 mt-0.5 flex items-center gap-2">
                  <Building2 className="w-3.5 h-3.5 text-amber-400" />
                  <span>{item.storageLocation}</span>
                  <span>•</span>
                  <span>Vendor: {item.vendor}</span>
                </div>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                {isManagerOrAdmin && !isEditing && (
                  <button
                    onClick={() => {
                      setEditForm({ ...item });
                      setIsEditing(true);
                    }}
                    className="p-2 text-slate-400 hover:text-white rounded-xl bg-white/5 hover:bg-white/10 transition-colors"
                    title="Edit Item Details"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                )}
                <button
                  onClick={printLabel}
                  className="p-2 text-slate-400 hover:text-white rounded-xl bg-white/5 hover:bg-white/10 transition-colors"
                  title="Print Shelf Barcode Label"
                >
                  <Printer className="w-4 h-4" />
                </button>
                <button
                  onClick={onClose}
                  className="p-2 text-slate-400 hover:text-white rounded-xl bg-white/5 hover:bg-white/10 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-5 flex-1">
              {isEditing ? (
                /* Edit Item Form (Manager/Admin Only) */
                <form onSubmit={handleSaveEdit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="col-span-2">
                      <label className="block text-[11px] font-semibold text-slate-400 mb-1">Item Name</label>
                      <input
                        type="text"
                        value={editForm.name}
                        onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-400 mb-1">Category</label>
                      <select
                        value={editForm.categoryId}
                        onChange={(e) => setEditForm({ ...editForm, categoryId: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                      >
                        {categories.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-400 mb-1">Storage Location</label>
                      <select
                        value={editForm.storageLocation}
                        onChange={(e) => setEditForm({ ...editForm, storageLocation: e.target.value as StorageLocation })}
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                      >
                        {[
                          'Walk-in Freezer',
                          'Walk-in Cooler',
                          'Dry Storage Room',
                          'Front Counter / Dispenser',
                          'Kitchen Prep Line',
                          'Chemical / Supply Rack',
                        ].map((loc) => (
                          <option key={loc} value={loc}>
                            {loc}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-400 mb-1">Unit Type</label>
                      <select
                        value={editForm.unitType}
                        onChange={(e) => setEditForm({ ...editForm, unitType: e.target.value as UnitType })}
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                      >
                        {['case', 'bag', 'box', 'lb', 'each', 'carton', 'gallon', 'pack', 'roll'].map((u) => (
                          <option key={u} value={u}>
                            {u}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-400 mb-1">Pack Size Description</label>
                      <input
                        type="text"
                        value={editForm.packSize}
                        onChange={(e) => setEditForm({ ...editForm, packSize: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-400 mb-1">Cost Per Unit ($)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={editForm.costPerUnit}
                        onChange={(e) => setEditForm({ ...editForm, costPerUnit: parseFloat(e.target.value) || 0 })}
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-400 mb-1">Par Level</label>
                      <input
                        type="number"
                        value={editForm.parLevel}
                        onChange={(e) => setEditForm({ ...editForm, parLevel: parseInt(e.target.value) || 0 })}
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-400 mb-1">Reorder Threshold</label>
                      <input
                        type="number"
                        value={editForm.reorderThreshold}
                        onChange={(e) => setEditForm({ ...editForm, reorderThreshold: parseInt(e.target.value) || 0 })}
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-400 mb-1">Daily Usage (Units/Day)</label>
                      <input
                        type="number"
                        step="0.1"
                        value={editForm.usageRatePerDay}
                        onChange={(e) => setEditForm({ ...editForm, usageRatePerDay: parseFloat(e.target.value) || 0 })}
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                      />
                    </div>

                    <div className="col-span-2">
                      <label className="block text-[11px] font-semibold text-slate-400 mb-1">Barcode</label>
                      <input
                        type="text"
                        value={editForm.barcode}
                        onChange={(e) => setEditForm({ ...editForm, barcode: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono"
                      />
                    </div>

                    <div className="col-span-2">
                      <label className="block text-[11px] font-semibold text-slate-400 mb-1">Storage / Handling Notes</label>
                      <textarea
                        value={editForm.notes || ''}
                        onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                        rows={2}
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <button
                      type="button"
                      onClick={() => setShowDeleteConfirm(true)}
                      className="px-3 py-2 text-xs font-semibold text-rose-400 hover:text-rose-300 flex items-center gap-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Delete Item
                    </button>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setIsEditing(false)}
                        className="px-4 py-2 text-xs font-semibold text-slate-300 bg-white/5 hover:bg-white/10 rounded-xl"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-4 py-2 text-xs font-bold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-xl flex items-center gap-1"
                      >
                        <Check className="w-3.5 h-3.5" /> Save Changes
                      </button>
                    </div>
                  </div>
                </form>
              ) : (
                /* View Item Details & Quick Adjustment */
                <>
                  {/* Stock Level Card */}
                  <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                        Current On-Hand Quantity
                      </span>
                      <div className="text-xs font-semibold text-slate-300">
                        Valuation: <strong className="text-amber-300">${(((item.currentQuantity || 0) * (item.costPerUnit || 0))).toFixed(2)}</strong>
                      </div>
                    </div>

                    <div className="flex items-baseline gap-2">
                      <span className="text-4xl font-extrabold text-white font-heading">
                        {item.currentQuantity}
                      </span>
                      <span className="text-sm font-semibold text-slate-400">
                        {item.unitType}s ({item.packSize})
                      </span>
                    </div>

                    {/* Par Level Progress Bar */}
                    <div>
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="text-slate-400">Par Target: {item.parLevel} {item.unitType}s</span>
                        <span
                          className={`font-bold ${
                            item.currentQuantity <= item.reorderThreshold
                              ? 'text-rose-400'
                              : item.currentQuantity >= item.parLevel
                              ? 'text-emerald-400'
                              : 'text-amber-400'
                          }`}
                        >
                          {parPercent}% of Par
                        </span>
                      </div>
                      <div className="w-full h-2.5 rounded-full bg-slate-800 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${
                            item.currentQuantity <= item.reorderThreshold
                              ? 'bg-rose-500'
                              : item.currentQuantity >= item.parLevel
                              ? 'bg-emerald-500'
                              : 'bg-amber-500'
                          }`}
                          style={{ width: `${Math.min(100, parPercent)}%` }}
                        />
                      </div>
                    </div>

                    {item.currentQuantity <= item.reorderThreshold && (
                      <div className="flex items-center gap-2 p-2.5 rounded-xl bg-rose-950/60 border border-rose-900/60 text-rose-200 text-xs">
                        <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
                        <span>Low Stock Alert: Below reorder threshold ({item.reorderThreshold} {item.unitType}s).</span>
                      </div>
                    )}
                  </div>

                  {/* Quick Quantity Adjustment Pad */}
                  <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                        Quick Stock Adjustment
                      </span>
                      {adjustmentDelta !== 0 && (
                        <span className="text-xs font-bold text-amber-300">
                          New Total: {Math.max(0, item.currentQuantity + adjustmentDelta)} {item.unitType}s
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-4 gap-2">
                      <button
                        onClick={() => {
                          setAdjustmentDelta((d) => d - 1);
                          SoundPlayer.playDecrementSound();
                        }}
                        className="py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-rose-300 flex items-center justify-center gap-1 border border-slate-700"
                      >
                        <Minus className="w-3.5 h-3.5" /> 1
                      </button>
                      <button
                        onClick={() => {
                          setAdjustmentDelta((d) => d + 1);
                          SoundPlayer.playCountBeep();
                        }}
                        className="py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-emerald-300 flex items-center justify-center gap-1 border border-slate-700"
                      >
                        <Plus className="w-3.5 h-3.5" /> 1
                      </button>
                      <button
                        onClick={() => {
                          setAdjustmentDelta((d) => d + 5);
                          SoundPlayer.playCountBeep(1.2);
                        }}
                        className="py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-emerald-300 flex items-center justify-center gap-1 border border-slate-700"
                      >
                        <Plus className="w-3.5 h-3.5" /> 5
                      </button>
                      <button
                        onClick={() => {
                          setAdjustmentDelta((d) => d + 10);
                          SoundPlayer.playCountBeep(1.4);
                        }}
                        className="py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-emerald-300 flex items-center justify-center gap-1 border border-slate-700"
                      >
                        <Plus className="w-3.5 h-3.5" /> 10
                      </button>
                    </div>

                    {adjustmentDelta !== 0 && (
                      <div className="pt-2 space-y-2">
                        <select
                          value={adjustmentReason}
                          onChange={(e) => setAdjustmentReason(e.target.value)}
                          className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white"
                        >
                          <option value="Routine Spot Check">Routine Spot Check</option>
                          <option value="Prep Line Restock">Prep Line Restock</option>
                          <option value="Manual Delivery Add">Manual Delivery Add</option>
                          <option value="Correction / Miscount">Correction / Miscount</option>
                        </select>
                        <button
                          onClick={handleApplyAdjustment}
                          className="w-full py-2.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs rounded-xl shadow-md flex items-center justify-center gap-1.5 transition-transform active:scale-98"
                        >
                          <Check className="w-4 h-4" /> Save Adjusted Count
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Item Specs & Barcode Label Preview */}
                  <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-3">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                      Printable Shelf Label & Barcode
                    </span>
                    
                    <div className="p-3 bg-white text-slate-950 rounded-xl border border-slate-300 flex flex-col items-center justify-center text-center shadow-inner">
                      <div className="text-xs font-extrabold uppercase tracking-tight">{item.name}</div>
                      <div className="text-[10px] text-slate-600 font-medium">{item.packSize} • {item.storageLocation}</div>
                      
                      {/* Barcode Visual Representation */}
                      <div className="my-2 flex items-center justify-center gap-0.5 h-10 px-4">
                        {item.barcode.split('').map((char, i) => (
                          <div
                            key={i}
                            className="bg-black h-full"
                            style={{
                              width: (parseInt(char, 10) % 3 + 1) * 1.5 + 'px',
                              marginRight: (i % 2 === 0 ? '1px' : '2px'),
                            }}
                          />
                        ))}
                      </div>
                      <div className="font-mono text-xs font-bold tracking-widest text-slate-800">
                        {item.barcode}
                      </div>
                    </div>
                  </div>

                  {/* Metadata Audit Note */}
                  <div className="text-[11px] text-slate-400 flex items-center justify-between px-1">
                    <span>Last Counted: {item.lastCountedAt ? new Date(item.lastCountedAt).toLocaleDateString() : 'Never'}</span>
                    <span>By: {item.lastCountedBy || 'Staff'}</span>
                  </div>
                </>
              )}
            </div>

            {/* Delete Confirmation Overlay */}
            {showDeleteConfirm && (
              <div className="absolute inset-0 bg-slate-950/95 flex flex-col items-center justify-center p-6 text-center z-50">
                <AlertTriangle className="w-12 h-12 text-rose-400 mb-3 animate-pulse" />
                <h3 className="text-lg font-bold text-white mb-1">Delete {item.name}?</h3>
                <p className="text-xs text-slate-300 mb-6 max-w-sm">
                  This will remove the item from all inventory counts, truck ordering sheets, and reports.
                </p>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setShowDeleteConfirm(false)}
                    className="px-4 py-2 text-xs font-semibold text-slate-300 bg-white/10 rounded-xl"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDelete}
                    className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-500 rounded-xl shadow-md"
                  >
                    Yes, Delete Item
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
