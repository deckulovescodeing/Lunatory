import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Plus, Sparkles, Barcode, Camera } from 'lucide-react';
import { Category, InventoryItem, StorageLocation, UnitType } from '../../types';
import { SoundPlayer } from '../../utils/audio';

interface AddItemModalProps {
  storeId: string;
  categories: Category[];
  isOpen: boolean;
  onClose: () => void;
  onAddItem: (item: InventoryItem) => void;
  onOpenScanner?: () => void;
}

export const AddItemModal: React.FC<AddItemModalProps> = ({
  storeId,
  categories,
  isOpen,
  onClose,
  onAddItem,
  onOpenScanner,
}) => {
  const [name, setName] = useState('');
  const [categoryId, setCategoryId] = useState(categories[0]?.id || 'cat-meats');
  const [storageLocation, setStorageLocation] = useState<StorageLocation>('Walk-in Freezer');
  const [unitType, setUnitType] = useState<UnitType>('case');
  const [packSize, setPackSize] = useState('4 x 10 lb bags');
  const [vendor, setVendor] = useState('US Foods CKE Supply');
  const [costPerUnit, setCostPerUnit] = useState(45.0);
  const [parLevel, setParLevel] = useState(10);
  const [reorderThreshold, setReorderThreshold] = useState(4);
  const [currentQuantity, setCurrentQuantity] = useState(10);
  const [usageRatePerDay, setUsageRatePerDay] = useState(2.0);
  const [barcode, setBarcode] = useState('');
  const [notes, setNotes] = useState('');

  // Auto generate barcode/SKU
  const handleGenerateBarcode = () => {
    const randomCode = '0712345' + Math.floor(10000 + Math.random() * 90000);
    setBarcode(randomCode);
    SoundPlayer.playScanSuccess();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const newItem: InventoryItem = {
      id: 'item-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
      storeId,
      sku: 'HD-' + name.substring(0, 3).toUpperCase() + '-' + Math.floor(100 + Math.random() * 900),
      barcode: barcode || '0712345' + Math.floor(10000 + Math.random() * 90000),
      name: name.trim(),
      categoryId,
      unitType,
      packSize,
      unitsPerPack: 1,
      vendor,
      costPerUnit,
      parLevel,
      minTarget: Math.max(1, Math.round(parLevel * 0.3)),
      maxTarget: Math.round(parLevel * 1.5),
      reorderThreshold,
      currentQuantity,
      previousQuantity: currentQuantity,
      storageLocation,
      usageRatePerDay,
      wasteLast7Days: 0,
      notes,
      lastCountedAt: new Date().toISOString(),
      lastCountedBy: 'Initial Setup',
    };

    onAddItem(newItem);
    SoundPlayer.playSuccessFanfare();
    onClose();
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
            {/* Header */}
            <div className="px-6 py-4 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-xl bg-amber-400/20 text-amber-300">
                  <Plus className="w-5 h-5" />
                </span>
                <div>
                  <h2 className="text-lg font-bold text-white font-heading">
                    Add New Inventory Item
                  </h2>
                  <p className="text-xs text-slate-400">Hardee’s Harrogate Store Catalog</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 text-slate-400 hover:text-white rounded-xl bg-white/5 hover:bg-white/10"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 flex-1">
              {onOpenScanner && (
                <div className="p-3.5 bg-gradient-to-r from-amber-500/15 via-indigo-500/15 to-purple-500/15 border border-amber-400/30 rounded-2xl flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <span className="p-2 rounded-xl bg-amber-400/20 text-amber-300">
                      <Camera className="w-4 h-4" />
                    </span>
                    <div>
                      <div className="text-xs font-bold text-amber-300 flex items-center gap-1">
                        <Sparkles className="w-3 h-3" /> Auto-fill with Camera
                      </div>
                      <div className="text-[10px] text-slate-300">
                        Scan product box label & barcode to auto-populate
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenScanner();
                    }}
                    className="px-3 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs shrink-0 shadow-sm"
                  >
                    Scan Now
                  </button>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                    Item Name *
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Sliced Dill Pickles"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 mb-1">Category</label>
                  <select
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
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
                    value={storageLocation}
                    onChange={(e) => setStorageLocation(e.target.value as StorageLocation)}
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
                    value={unitType}
                    onChange={(e) => setUnitType(e.target.value as UnitType)}
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
                    value={packSize}
                    onChange={(e) => setPackSize(e.target.value)}
                    placeholder="e.g. 6 x 5 lb bags (30 lb case)"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 mb-1">Cost Per Unit ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={costPerUnit}
                    onChange={(e) => setCostPerUnit(parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 mb-1">Starting Quantity</label>
                  <input
                    type="number"
                    value={currentQuantity}
                    onChange={(e) => setCurrentQuantity(parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 mb-1">Par Level</label>
                  <input
                    type="number"
                    value={parLevel}
                    onChange={(e) => setParLevel(parseInt(e.target.value) || 0)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 mb-1">Reorder Threshold</label>
                  <input
                    type="number"
                    value={reorderThreshold}
                    onChange={(e) => setReorderThreshold(parseInt(e.target.value) || 0)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>

                <div className="col-span-2">
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[11px] font-semibold text-slate-400">Barcode</label>
                    <button
                      type="button"
                      onClick={handleGenerateBarcode}
                      className="text-[10px] text-amber-400 hover:underline flex items-center gap-1"
                    >
                      <Sparkles className="w-3 h-3" /> Auto-generate
                    </button>
                  </div>
                  <div className="relative">
                    <Barcode className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      value={barcode}
                      onChange={(e) => setBarcode(e.target.value)}
                      placeholder="071234500..."
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-white font-mono"
                    />
                  </div>
                </div>

                <div className="col-span-2">
                  <label className="block text-[11px] font-semibold text-slate-400 mb-1">Supplier / Vendor</label>
                  <input
                    type="text"
                    value={vendor}
                    onChange={(e) => setVendor(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-semibold text-slate-300 bg-white/5 hover:bg-white/10 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-xl shadow-md flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4" /> Add Item to Catalog
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
