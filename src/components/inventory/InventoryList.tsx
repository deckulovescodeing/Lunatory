import React, { useState, useMemo } from 'react';
import { motion } from 'motion/react';
import {
  Search,
  Filter,
  Plus,
  AlertTriangle,
  Barcode,
  Download,
  Printer,
  CheckCircle2,
  Building2,
  ChevronRight,
  Sparkles,
  Camera,
} from 'lucide-react';
import { Category, InventoryItem, StorageLocation, Store, UserRole } from '../../types';
import { ItemDetailModal } from './ItemDetailModal';
import { AddItemModal } from './AddItemModal';
import { ProductLabelScannerModal } from './ProductLabelScannerModal';
import { SoundPlayer } from '../../utils/audio';

interface InventoryListProps {
  storeId: string;
  activeStore?: Store;
  inventory: InventoryItem[];
  categories: Category[];
  userRole: UserRole;
  onUpdateQuantity: (itemId: string, newQty: number, reason: string) => void;
  onSaveItem: (item: InventoryItem) => void;
  onAddItem: (item: InventoryItem) => void;
  onDeleteItem: (itemId: string) => void;
  onExportCSV: () => void;
}

export const InventoryList: React.FC<InventoryListProps> = ({
  storeId,
  activeStore,
  inventory,
  categories,
  userRole,
  onUpdateQuantity,
  onSaveItem,
  onAddItem,
  onDeleteItem,
  onExportCSV,
}) => {
  const isManagerOrAdmin = userRole === 'manager' || userRole === 'admin';

  const currentStoreObj: Store = activeStore || {
    id: storeId,
    storeNumber: '0482',
    name: "Hardee's of Harrogate",
    address: '6340 Cumberland Gap Pkwy',
    city: 'Harrogate',
    state: 'TN',
    truckDays: ['Monday', 'Thursday'],
    leadTimeDays: 2,
  };

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedLocation, setSelectedLocation] = useState<string>('all');
  const [stockStatusFilter, setStockStatusFilter] = useState<'all' | 'low' | 'ok' | 'high'>('all');

  const [selectedItemForDetail, setSelectedItemForDetail] = useState<InventoryItem | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showProductScannerModal, setShowProductScannerModal] = useState(false);

  // Filter logic
  const filteredItems = useMemo(() => {
    return inventory.filter((item) => {
      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchName = item.name.toLowerCase().includes(q);
        const matchSku = item.sku.toLowerCase().includes(q);
        const matchBarcode = item.barcode.includes(q);
        const matchVendor = item.vendor.toLowerCase().includes(q);
        const matchLoc = item.storageLocation.toLowerCase().includes(q);
        if (!matchName && !matchSku && !matchBarcode && !matchVendor && !matchLoc) {
          return false;
        }
      }

      // Category
      if (selectedCategory !== 'all' && item.categoryId !== selectedCategory) {
        return false;
      }

      // Storage Location
      if (selectedLocation !== 'all' && item.storageLocation !== selectedLocation) {
        return false;
      }

      // Stock status
      if (stockStatusFilter === 'low' && item.currentQuantity > item.reorderThreshold) {
        return false;
      }
      if (stockStatusFilter === 'ok' && (item.currentQuantity <= item.reorderThreshold || item.currentQuantity > item.maxTarget)) {
        return false;
      }
      if (stockStatusFilter === 'high' && item.currentQuantity <= item.maxTarget) {
        return false;
      }

      return true;
    });
  }, [inventory, searchQuery, selectedCategory, selectedLocation, stockStatusFilter]);

  const storageLocations: StorageLocation[] = [
    'Walk-in Freezer',
    'Walk-in Cooler',
    'Dry Storage Room',
    'Front Counter / Dispenser',
    'Kitchen Prep Line',
    'Chemical / Supply Rack',
  ];

  const handleQuickAdd = (e: React.MouseEvent, item: InventoryItem) => {
    e.stopPropagation();
    onUpdateQuantity(item.id, item.currentQuantity + 1, 'Quick +1 Tap');
    SoundPlayer.playCountBeep();
  };

  const handleQuickSub = (e: React.MouseEvent, item: InventoryItem) => {
    e.stopPropagation();
    if (item.currentQuantity > 0) {
      onUpdateQuantity(item.id, item.currentQuantity - 1, 'Quick -1 Tap');
      SoundPlayer.playDecrementSound();
    }
  };

  return (
    <div className="space-y-4 pb-20 select-none">
      {/* 1. Search & Filter Bar */}
      <div className="bg-slate-900/80 border border-white/10 rounded-2xl p-4 backdrop-blur-md space-y-3">
        <div className="flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-center justify-between">
          {/* Search Bar */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search items, SKU, barcode, location..."
              className="w-full bg-slate-950/80 border border-slate-700/80 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={onExportCSV}
              className="px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-slate-200 flex items-center gap-1.5 transition-colors"
              title="Export Inventory CSV"
            >
              <Download className="w-3.5 h-3.5 text-indigo-400" />
              <span className="hidden xs:inline">Export CSV</span>
            </button>

            {isManagerOrAdmin && (
              <>
                <button
                  onClick={() => {
                    setShowProductScannerModal(true);
                    SoundPlayer.playCountBeep();
                  }}
                  className="px-3 py-2 rounded-xl bg-gradient-to-r from-amber-500/20 to-indigo-500/20 hover:from-amber-500/30 hover:to-indigo-500/30 border border-amber-400/40 text-amber-300 text-xs font-bold flex items-center gap-1.5 shadow-md transition-transform active:scale-95"
                  title="Scan Product Label or Barcode with Camera"
                >
                  <Camera className="w-3.5 h-3.5 text-amber-400" />
                  <span className="hidden xs:inline">Scan Label & Barcode</span>
                  <span className="xs:hidden">Scan</span>
                </button>

                <button
                  onClick={() => {
                    setShowAddModal(true);
                    SoundPlayer.playCountBeep();
                  }}
                  className="px-3.5 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-bold flex items-center gap-1.5 shadow-md transition-transform active:scale-95"
                >
                  <Plus className="w-4 h-4" />
                  <span>Manual Add</span>
                </button>
              </>
            )}
          </div>
        </div>

        {/* Category Pills Slider */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          <button
            onClick={() => {
              setSelectedCategory('all');
              SoundPlayer.playCountBeep();
            }}
            className={`px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
              selectedCategory === 'all'
                ? 'bg-amber-400 text-slate-950'
                : 'bg-white/5 text-slate-300 hover:bg-white/10'
            }`}
          >
            All Categories ({inventory.length})
          </button>
          {categories.map((c) => {
            const count = inventory.filter((i) => i.categoryId === c.id).length;
            const isSelected = selectedCategory === c.id;
            return (
              <button
                key={c.id}
                onClick={() => {
                  setSelectedCategory(c.id);
                  SoundPlayer.playCountBeep();
                }}
                className={`px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'bg-white/5 text-slate-300 hover:bg-white/10'
                }`}
              >
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: c.color }} />
                <span>{c.name}</span>
                <span className="text-[10px] opacity-70">({count})</span>
              </button>
            );
          })}
        </div>

        {/* Secondary Filter Badges */}
        <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
          {/* Stock Level Filter */}
          <div className="flex items-center gap-1 bg-slate-950/60 p-1 rounded-lg border border-slate-800">
            <span className="text-[10px] text-slate-400 px-1 font-semibold uppercase">Stock:</span>
            {(['all', 'low', 'ok', 'high'] as const).map((status) => (
              <button
                key={status}
                onClick={() => setStockStatusFilter(status)}
                className={`px-2 py-0.5 rounded text-[11px] font-medium capitalize transition-colors ${
                  stockStatusFilter === status
                    ? 'bg-indigo-600 text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {status === 'low' ? 'Low Stock' : status === 'ok' ? 'On Par' : status === 'high' ? 'Overstock' : 'All'}
              </button>
            ))}
          </div>

          {/* Storage Location Dropdown */}
          <div className="flex items-center gap-1 bg-slate-950/60 p-1 rounded-lg border border-slate-800">
            <span className="text-[10px] text-slate-400 px-1 font-semibold uppercase">Location:</span>
            <select
              value={selectedLocation}
              onChange={(e) => setSelectedLocation(e.target.value)}
              className="bg-transparent text-[11px] text-white focus:outline-none pr-2 font-medium"
            >
              <option value="all" className="bg-slate-900 text-white">All Locations</option>
              {storageLocations.map((loc) => (
                <option key={loc} value={loc} className="bg-slate-900 text-white">
                  {loc}
                </option>
              ))}
            </select>
          </div>

          <span className="text-slate-400 text-xs ml-auto">
            Showing <strong className="text-white">{filteredItems.length}</strong> items
          </span>
        </div>
      </div>

      {/* 2. Items Grid */}
      {filteredItems.length === 0 ? (
        <div className="p-12 text-center bg-slate-900/60 border border-white/5 rounded-2xl text-slate-400 space-y-2">
          <AlertTriangle className="w-8 h-8 text-amber-400 mx-auto opacity-70" />
          <p className="font-semibold text-white">No items found matching your filters</p>
          <p className="text-xs">Try clearing your search query or selecting "All Categories"</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {filteredItems.map((item) => {
            const category = categories.find((c) => c.id === item.categoryId);
            const isLow = item.currentQuantity <= item.reorderThreshold;
            const isCritical = item.currentQuantity <= item.minTarget;
            const parRatio = item.parLevel ? item.currentQuantity / item.parLevel : 1;

            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                onClick={() => {
                  setSelectedItemForDetail(item);
                  SoundPlayer.playCountBeep();
                }}
                className={`p-4 rounded-2xl border backdrop-blur-md cursor-pointer transition-all hover:scale-[1.01] flex flex-col justify-between gap-3 group relative overflow-hidden ${
                  isLow
                    ? 'bg-rose-950/40 border-rose-800/50 hover:border-rose-600'
                    : 'bg-slate-900/80 border-white/10 hover:border-white/20'
                }`}
              >
                {/* Category Color Accent Top Bar */}
                <div
                  className="absolute top-0 left-0 right-0 h-1"
                  style={{ backgroundColor: category?.color || '#6366f1' }}
                />

                {/* Top: Name, SKU, Category */}
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 mb-1">
                        <span
                          className="px-2 py-0.5 text-[9px] font-bold rounded uppercase tracking-wider text-white"
                          style={{ backgroundColor: category?.color || '#6366f1' }}
                        >
                          {category?.name}
                        </span>
                        <span className="text-[10px] font-mono text-slate-400">
                          {item.sku}
                        </span>
                      </div>
                      <h3 className="text-sm font-bold text-white group-hover:text-amber-300 transition-colors line-clamp-1 font-heading">
                        {item.name}
                      </h3>
                      <div className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-1.5">
                        <Building2 className="w-3 h-3 text-slate-500" />
                        <span>{item.storageLocation}</span>
                      </div>
                    </div>

                    {/* Stock Alert Pill */}
                    {isLow && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30 flex items-center gap-1 shrink-0">
                        <AlertTriangle className="w-3 h-3" /> Low
                      </span>
                    )}
                  </div>
                </div>

                {/* Middle: On-Hand Qty & Par Progress */}
                <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-2">
                  <div className="flex items-baseline justify-between">
                    <div>
                      <span className="text-2xl font-extrabold text-white font-heading">
                        {item.currentQuantity}
                      </span>
                      <span className="text-xs font-semibold text-slate-400 ml-1">
                        {item.unitType}s
                      </span>
                    </div>
                    <div className="text-right text-[10px] text-slate-400">
                      <div>Par: <strong className="text-white">{item.parLevel}</strong></div>
                      <div>${(item.costPerUnit || 0).toFixed(2)} / {item.unitType}</div>
                    </div>
                  </div>

                  {/* Par Level Bar */}
                  <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        isLow ? 'bg-rose-500' : parRatio >= 1 ? 'bg-emerald-500' : 'bg-amber-500'
                      }`}
                      style={{ width: `${Math.min(100, Math.round(parRatio * 100))}%` }}
                    />
                  </div>
                </div>

                {/* Bottom: Quick Adjustment Buttons & Pack Size */}
                <div className="flex items-center justify-between gap-2 pt-1 border-t border-white/5">
                  <span className="text-[10px] text-slate-400 truncate max-w-[130px]" title={item.packSize}>
                    {item.packSize}
                  </span>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={(e) => handleQuickSub(e, item)}
                      className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 active:bg-rose-600 text-xs font-bold text-slate-300 hover:text-white transition-colors"
                      title="Quick -1"
                    >
                      -1
                    </button>
                    <button
                      onClick={(e) => handleQuickAdd(e, item)}
                      className="px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 active:bg-amber-400 active:text-slate-950 text-xs font-bold text-white transition-colors"
                      title="Quick +1"
                    >
                      +1
                    </button>
                    <button
                      className="p-1 text-slate-400 hover:text-amber-300 transition-colors"
                      title="View full item details"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* 3. Detail & Edit Modal */}
      <ItemDetailModal
        item={selectedItemForDetail}
        categories={categories}
        userRole={userRole}
        isOpen={Boolean(selectedItemForDetail)}
        onClose={() => setSelectedItemForDetail(null)}
        onUpdateQuantity={onUpdateQuantity}
        onSaveItem={(updated) => {
          onSaveItem(updated);
          setSelectedItemForDetail(updated);
        }}
        onDeleteItem={(id) => {
          onDeleteItem(id);
          setSelectedItemForDetail(null);
        }}
      />

      {/* 4. Add Item Modal */}
      <AddItemModal
        storeId={storeId}
        categories={categories}
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onAddItem={onAddItem}
        onOpenScanner={() => setShowProductScannerModal(true)}
      />

      {/* 5. AI Product Label & Barcode Scanner Modal */}
      <ProductLabelScannerModal
        isOpen={showProductScannerModal}
        onClose={() => setShowProductScannerModal(false)}
        onAddItem={onAddItem}
        categories={categories}
        activeStore={currentStoreObj}
      />
    </div>
  );
};
