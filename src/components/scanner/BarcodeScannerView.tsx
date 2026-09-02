import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'motion/react';
import {
  QrCode,
  Camera,
  CameraOff,
  Search,
  CheckCircle2,
  Plus,
  Trash2,
  Package,
  Sparkles,
  AlertCircle,
  Keyboard,
  Barcode,
  Eye,
  FileText,
  Truck,
} from 'lucide-react';
import { InventoryItem, Store, TruckOrder, User, UserRole, Category } from '../../types';
import { LunaFox } from '../fox/LunaFox';
import { SoundPlayer } from '../../utils/audio';
import { InvoiceScannerModal } from '../orders/InvoiceScannerModal';
import { ProductLabelScannerModal } from '../inventory/ProductLabelScannerModal';

type ScanMode = 'lookup' | 'count_add' | 'waste';

interface BarcodeScannerViewProps {
  inventory: InventoryItem[];
  userRole: UserRole;
  activeStore?: Store;
  currentUser?: User;
  categories?: Category[];
  onAddItem?: (item: InventoryItem) => void;
  onOpenItemDetail: (item: InventoryItem) => void;
  onQuickCountAdd: (itemId: string) => void;
  onOpenWasteForItem: (item: InventoryItem) => void;
  onApplyScannedOrder?: (order: TruckOrder) => void;
}

export const BarcodeScannerView: React.FC<BarcodeScannerViewProps> = ({
  inventory,
  userRole,
  activeStore,
  currentUser,
  categories = [],
  onAddItem,
  onOpenItemDetail,
  onQuickCountAdd,
  onOpenWasteForItem,
  onApplyScannedOrder,
}) => {
  const [scanMode, setScanMode] = useState<ScanMode>('lookup');
  const [manualCode, setManualCode] = useState('');
  const [scannedItem, setScannedItem] = useState<InventoryItem | null>(null);
  const [searchedUnmatchedCode, setSearchedUnmatchedCode] = useState<string | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [isInvoiceScannerOpen, setIsInvoiceScannerOpen] = useState(false);
  const [isProductLabelScannerOpen, setIsProductLabelScannerOpen] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Quick Preset test barcodes from Hardee's inventory
  const testBarcodes = [
    { name: '1/3 lb Angus Beef', code: '071234500128' },
    { name: 'Made from Scratch Biscuit Mix', code: '071234500142' },
    { name: 'Hardee’s Natural-Cut French Fries', code: '071234500166' },
    { name: 'Crispy Bacon Strips', code: '071234500159' },
    { name: 'Hardee’s Red Drink Cups 30oz', code: '071234500203' },
  ];

  // Camera start / stop
  const startCamera = async () => {
    try {
      setCameraError(null);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setIsCameraActive(true);
      SoundPlayer.playCountBeep();
    } catch (err: any) {
      console.warn('Camera access error:', err);
      setCameraError('Camera access not available in this browser window. You can use manual entry or demo barcode buttons below.');
      setIsCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
  };

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  const handleLookup = (code: string) => {
    const clean = code.trim().toLowerCase();
    if (!clean) return;

    const match = inventory.find(
      (i) =>
        i.barcode.toLowerCase() === clean ||
        i.sku.toLowerCase() === clean ||
        i.name.toLowerCase().includes(clean)
    );

    if (match) {
      setScannedItem(match);
      setSearchedUnmatchedCode(null);
      SoundPlayer.playScanSuccess();

      // If in count_add mode, trigger +1 instantly
      if (scanMode === 'count_add') {
        onQuickCountAdd(match.id);
      } else if (scanMode === 'waste') {
        onOpenWasteForItem(match);
      }
    } else {
      SoundPlayer.playAlertChime();
      setScannedItem(null);
      setSearchedUnmatchedCode(code.trim());
    }
  };

  const handlePresetClick = (code: string) => {
    setManualCode(code);
    handleLookup(code);
  };

  return (
    <div className="space-y-4 pb-24 select-none">
      {/* 1. Top Bar & Mode Selector */}
      <div className="bg-slate-900/80 border border-white/10 rounded-2xl p-4 backdrop-blur-md space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-lg sm:text-xl font-extrabold text-white font-heading">
                Barcode & SKU Scanner
              </h1>
              <p className="text-xs text-slate-400">
                Scan shelf labels, case boxes, or enter SKU
              </p>
            </div>
          </div>

          {/* Mode Switcher */}
          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 self-start sm:self-auto">
            <button
              onClick={() => setScanMode('lookup')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                scanMode === 'lookup'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Eye className="w-3.5 h-3.5" /> Lookup
            </button>
            <button
              onClick={() => setScanMode('count_add')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                scanMode === 'count_add'
                  ? 'bg-amber-400 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Plus className="w-3.5 h-3.5" /> Count (+1)
            </button>
            <button
              onClick={() => setScanMode('waste')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                scanMode === 'waste'
                  ? 'bg-rose-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Trash2 className="w-3.5 h-3.5" /> Log Waste
            </button>
          </div>
        </div>
      </div>

      {/* Quick AI Vision Scanning Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Product Box Label & Barcode Scanner */}
        <div className="bg-gradient-to-r from-amber-950/60 via-slate-900/80 to-slate-900/90 border border-amber-400/40 rounded-2xl p-4 backdrop-blur-md flex flex-col justify-between gap-3 shadow-lg">
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-xl bg-amber-400/20 text-amber-300 border border-amber-400/30 shrink-0">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-white">
                  Add Product via Camera
                </h2>
                <span className="px-1.5 py-0.5 rounded text-[9px] font-extrabold uppercase bg-amber-400/20 text-amber-300 border border-amber-400/30">
                  Label & Barcode AI
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Point camera at box packaging to auto-read product title, barcode, vendor, and storage temp.
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              setIsProductLabelScannerOpen(true);
              SoundPlayer.playCountBeep();
            }}
            className="w-full py-2 bg-gradient-to-r from-amber-400 to-amber-300 hover:from-amber-300 hover:to-amber-200 text-slate-950 text-xs font-extrabold rounded-xl shadow-md flex items-center justify-center gap-2 transition-transform active:scale-95"
          >
            <Camera className="w-4 h-4" />
            <span>Scan Product Label & Box</span>
          </button>
        </div>

        {/* Multi-Page Truck Order Document Scan */}
        <div className="bg-gradient-to-r from-indigo-950/60 via-slate-900/80 to-slate-900/90 border border-indigo-500/30 rounded-2xl p-4 backdrop-blur-md flex flex-col justify-between gap-3 shadow-lg">
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-500/20 text-indigo-300 border border-indigo-400/30 shrink-0">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-white">
                  Multi-Page Truck Order OCR
                </h2>
                <span className="px-1.5 py-0.5 rounded text-[9px] font-extrabold uppercase bg-indigo-500/20 text-indigo-300 border border-indigo-400/30">
                  Multi-Page
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Snap paper invoice sheets to digitize PO line items and truck delivery receipts.
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsInvoiceScannerOpen(true)}
            className="w-full py-2 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white text-xs font-bold rounded-xl shadow-md flex items-center justify-center gap-2 transition-transform active:scale-95"
          >
            <FileText className="w-4 h-4" />
            <span>Scan Invoice Paperwork</span>
          </button>
        </div>
      </div>

      {/* 2. Camera Viewfinder / Scanner Stage */}
      <div className="relative rounded-3xl bg-slate-950/90 border border-emerald-500/30 overflow-hidden shadow-2xl p-6 text-center">
        {/* Laser Sweep Animation */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="w-full h-1 bg-gradient-to-r from-transparent via-emerald-400 to-transparent shadow-[0_0_15px_rgba(52,211,153,0.8)] animate-pulse" />
        </div>

        {/* Video Element if Camera active */}
        {isCameraActive ? (
          <div className="relative w-full max-w-sm mx-auto aspect-video rounded-2xl overflow-hidden bg-black border border-slate-700">
            <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
            <div className="absolute inset-8 border-2 border-dashed border-emerald-400 rounded-xl pointer-events-none" />
          </div>
        ) : (
          /* Viewfinder Graphic */
          <div className="py-8 flex flex-col items-center justify-center space-y-3">
            <div className="relative p-6 rounded-3xl bg-white/5 border border-white/10 max-w-xs w-full">
              <div className="flex justify-center mb-3">
                <LunaFox mood="scanning" size="lg" />
              </div>
              <div className="text-xs font-semibold text-slate-300">
                Aim scanner at UPC-A / EAN / Code-128 barcode
              </div>
              <div className="mt-4 flex justify-center gap-1 text-slate-500">
                <Barcode className="w-20 h-10 opacity-70" />
              </div>
            </div>
          </div>
        )}

        {/* Camera Toggle Button */}
        <div className="mt-4 flex justify-center gap-2">
          {!isCameraActive ? (
            <button
              onClick={startCamera}
              className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold flex items-center gap-2 shadow-lg transition-transform active:scale-95"
            >
              <Camera className="w-4 h-4" />
              <span>Start Camera Scanner</span>
            </button>
          ) : (
            <button
              onClick={stopCamera}
              className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold flex items-center gap-2 shadow-lg"
            >
              <CameraOff className="w-4 h-4" />
              <span>Stop Camera</span>
            </button>
          )}
        </div>

        {cameraError && (
          <p className="text-[11px] text-amber-300 mt-2 max-w-md mx-auto">
            {cameraError}
          </p>
        )}
      </div>

      {/* 3. Manual Entry Input Form */}
      <div className="bg-slate-900/80 border border-white/10 rounded-2xl p-4 backdrop-blur-md space-y-3">
        <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
          <Keyboard className="w-3.5 h-3.5 text-amber-400" />
          Manual Barcode or SKU Lookup
        </label>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleLookup(manualCode);
          }}
          className="flex gap-2"
        >
          <input
            type="text"
            value={manualCode}
            onChange={(e) => setManualCode(e.target.value)}
            placeholder="Type barcode (e.g. 071234500128) or SKU (e.g. HD-BEEF-101)..."
            className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 font-mono"
          />
          <button
            type="submit"
            className="px-5 py-2.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs rounded-xl shadow-md flex items-center gap-1.5"
          >
            <Search className="w-4 h-4" />
            <span>Search</span>
          </button>
        </form>
      </div>

      {/* 4. Scanned Item Result Spotlight */}
      {scannedItem && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-5 rounded-3xl bg-slate-900 border border-emerald-500/50 shadow-2xl text-white space-y-4"
        >
          <div className="flex items-start justify-between">
            <div>
              <span className="px-2.5 py-0.5 text-[10px] font-bold rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 uppercase">
                Item Identified
              </span>
              <h2 className="text-xl font-bold text-white font-heading mt-1">
                {scannedItem.name}
              </h2>
              <div className="text-xs text-slate-400 mt-0.5">
                SKU: {scannedItem.sku} • Location: {scannedItem.storageLocation}
              </div>
            </div>

            <div className="text-right">
              <div className="text-2xl font-extrabold text-amber-300 font-heading">
                {scannedItem.currentQuantity} {scannedItem.unitType}s
              </div>
              <div className="text-[10px] text-slate-400">
                Par: {scannedItem.parLevel} • ${(scannedItem.costPerUnit || 0).toFixed(2)}/ea
              </div>
            </div>
          </div>

          {/* Action Row */}
          <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-800">
            <button
              onClick={() => onOpenItemDetail(scannedItem)}
              className="py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-white flex items-center justify-center gap-1.5"
            >
              <Package className="w-3.5 h-3.5 text-indigo-400" />
              <span>Full Details</span>
            </button>
            <button
              onClick={() => {
                onQuickCountAdd(scannedItem.id);
                SoundPlayer.playCountBeep();
              }}
              className="py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-bold flex items-center justify-center gap-1.5 shadow-md"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add +1 Count</span>
            </button>
            <button
              onClick={() => onOpenWasteForItem(scannedItem)}
              className="py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-md"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Log Waste</span>
            </button>
          </div>
        </motion.div>
      )}

      {/* Unrecognized Barcode / SKU Card */}
      {!scannedItem && searchedUnmatchedCode && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-5 rounded-3xl bg-slate-900 border border-amber-500/40 shadow-2xl text-white space-y-3.5"
        >
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-2xl bg-amber-500/20 text-amber-300 border border-amber-500/30 shrink-0">
              <AlertCircle className="w-5 h-5" />
            </div>
            <div>
              <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/30 uppercase">
                New Barcode Detected
              </span>
              <h3 className="text-base font-bold text-white mt-1">
                "{searchedUnmatchedCode}" is not yet in Hardee’s Catalog
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Would you like to scan the product packaging/label with your camera to automatically identify and add this item?
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-800">
            <button
              onClick={() => {
                setIsProductLabelScannerOpen(true);
                SoundPlayer.playCountBeep();
              }}
              className="px-4 py-2 bg-gradient-to-r from-amber-400 to-amber-300 hover:from-amber-300 hover:to-amber-200 text-slate-950 text-xs font-extrabold rounded-xl shadow-md flex items-center gap-2"
            >
              <Camera className="w-4 h-4" />
              <span>Scan Product Label & Box to Add Item</span>
            </button>
            <button
              onClick={() => setSearchedUnmatchedCode(null)}
              className="px-3 py-2 bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white text-xs font-semibold rounded-xl"
            >
              Dismiss
            </button>
          </div>
        </motion.div>
      )}

      {/* 5. Hardee's Harrogate Quick Test Barcode Bar */}
      <div className="bg-slate-900/60 border border-white/10 rounded-2xl p-4 backdrop-blur-md space-y-2.5">
        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
          <Sparkles className="w-3 h-3 text-amber-400" />
          Test Barcodes (Harrogate Kitchen Package Labels):
        </span>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
          {testBarcodes.map((b) => (
            <button
              key={b.code}
              onClick={() => handlePresetClick(b.code)}
              className="p-2.5 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-left text-xs transition-colors flex items-center justify-between group"
            >
              <div className="min-w-0 pr-2">
                <div className="font-semibold text-slate-200 group-hover:text-amber-300 truncate">
                  {b.name}
                </div>
                <div className="font-mono text-[10px] text-slate-500">{b.code}</div>
              </div>
              <Barcode className="w-5 h-5 text-slate-600 group-hover:text-emerald-400 shrink-0" />
            </button>
          ))}
        </div>
      </div>

      {activeStore && currentUser && (
        <InvoiceScannerModal
          isOpen={isInvoiceScannerOpen}
          onClose={() => setIsInvoiceScannerOpen(false)}
          activeStore={activeStore}
          currentUser={currentUser}
          inventory={inventory}
          onApplyToReceiving={(order) => {
            onApplyScannedOrder?.(order);
          }}
          onApplyToOrderBuilder={(order) => {
            onApplyScannedOrder?.(order);
          }}
          onDirectReceiveStock={(order) => {
            onApplyScannedOrder?.(order);
          }}
        />
      )}

      {/* AI Product Label & Barcode Scanner Modal */}
      {activeStore && (
        <ProductLabelScannerModal
          isOpen={isProductLabelScannerOpen}
          onClose={() => setIsProductLabelScannerOpen(false)}
          onAddItem={(newItem) => {
            onAddItem?.(newItem);
            setScannedItem(newItem);
            setSearchedUnmatchedCode(null);
          }}
          categories={categories}
          activeStore={activeStore}
          initialBarcode={searchedUnmatchedCode || ''}
        />
      )}
    </div>
  );
};
