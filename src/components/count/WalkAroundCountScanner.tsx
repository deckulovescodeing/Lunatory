import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  QrCode,
  Camera,
  CameraOff,
  Search,
  CheckCircle2,
  Plus,
  Minus,
  Check,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  Package,
  X,
  Volume2,
  Printer,
  ChevronRight,
  ChevronDown,
  Layers,
  Flame,
  ArrowRight,
  SlidersHorizontal,
} from 'lucide-react';
import { InventoryItem, User, StorageLocation, CountEntry } from '../../types';
import { SoundPlayer } from '../../utils/audio';
import { LunaFox } from '../fox/LunaFox';
import QRCode from 'qrcode';

interface WalkAroundCountScannerProps {
  inventory: InventoryItem[];
  currentUser: User;
  onUpdateItemQuantity: (itemId: string, newQuantity: number) => void;
  onRecordCountEntry?: (entry: CountEntry) => void;
  onOpenItemDetail?: (item: InventoryItem) => void;
}

export const WalkAroundCountScanner: React.FC<WalkAroundCountScannerProps> = ({
  inventory,
  currentUser,
  onUpdateItemQuantity,
  onRecordCountEntry,
  onOpenItemDetail,
}) => {
  // Scanner state
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [manualInput, setManualInput] = useState('');
  const [selectedLocation, setSelectedLocation] = useState<string>('all');
  
  // Quick Adjust Modal State
  const [activeItem, setActiveItem] = useState<InventoryItem | null>(null);
  const [adjustedQty, setAdjustedQty] = useState<number>(0);
  const [lastSavedMessage, setLastSavedMessage] = useState<string | null>(null);
  const [countedHistory, setCountedHistory] = useState<Array<{
    item: InventoryItem;
    oldCount: number;
    newCount: number;
    time: string;
  }>>([]);

  // Shelf QR Code Tags Sheet Modal
  const [isQrSheetOpen, setIsQrSheetOpen] = useState(false);
  const [qrCodeUrls, setQrCodeUrls] = useState<Record<string, string>>({});

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const qtyInputRef = useRef<HTMLInputElement | null>(null);

  // Storage Locations
  const locations: string[] = [
    'All Locations',
    'Walk-in Freezer',
    'Walk-in Cooler',
    'Dry Storage Room',
    'Front Counter / Dispenser',
    'Kitchen Prep Line',
    'Chemical / Supply Rack',
  ];

  // Filtered inventory based on selected storage zone
  const filteredInventory = inventory.filter((item) => {
    if (selectedLocation !== 'all' && item.storageLocation !== selectedLocation) {
      return false;
    }
    return true;
  });

  // Pre-generate QR codes for shelf tags sheet
  useEffect(() => {
    if (isQrSheetOpen) {
      const generateAll = async () => {
        const urls: Record<string, string> = {};
        for (const item of inventory.slice(0, 24)) {
          try {
            const url = await QRCode.toDataURL(item.barcode || item.sku, {
              width: 140,
              margin: 1,
              color: { dark: '#0F172A', light: '#FFFFFF' },
            });
            urls[item.id] = url;
          } catch (e) {
            console.error(e);
          }
        }
        setQrCodeUrls(urls);
      };
      generateAll();
    }
  }, [isQrSheetOpen, inventory]);

  // Focus quantity input when pop-up opens
  useEffect(() => {
    if (activeItem && qtyInputRef.current) {
      qtyInputRef.current.focus();
      qtyInputRef.current.select();
    }
  }, [activeItem]);

  // Start Camera
  const startCamera = async () => {
    try {
      setCameraError(null);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setIsCameraActive(true);
      SoundPlayer.playCountBeep();
    } catch (err: any) {
      console.warn('Camera error:', err);
      setCameraError('Camera access not supported or permission denied in this browser. You can tap any shelf tag below or enter SKU directly.');
      setIsCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
  };

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  // Handle scanned or selected code
  const handleProcessCode = (code: string) => {
    const clean = code.trim().toLowerCase();
    if (!clean) return;

    const match = inventory.find(
      (i) =>
        i.barcode.toLowerCase() === clean ||
        i.sku.toLowerCase() === clean ||
        i.name.toLowerCase().includes(clean) ||
        i.id.toLowerCase() === clean
    );

    if (match) {
      setActiveItem(match);
      setAdjustedQty(match.currentQuantity);
      SoundPlayer.playScanSuccess();
      setManualInput('');
    } else {
      SoundPlayer.playAlertChime();
      alert(`No inventory item matches code "${code}". Please check SKU or shelf label.`);
    }
  };

  // Save the adjusted amount
  const handleSaveCount = () => {
    if (!activeItem) return;

    const finalQty = Math.max(0, Number(adjustedQty) || 0);
    const oldCount = activeItem.currentQuantity;
    const variance = finalQty - oldCount;
    const dollarVariance = variance * activeItem.costPerUnit;

    // 1. Update master inventory
    onUpdateItemQuantity(activeItem.id, finalQty);

    // 2. Record count entry
    if (onRecordCountEntry) {
      const entry: CountEntry = {
        itemId: activeItem.id,
        itemName: activeItem.name,
        expectedQuantity: oldCount,
        countedQuantity: finalQty,
        variance,
        dollarVariance,
        unitType: activeItem.unitType,
      };
      onRecordCountEntry(entry);
    }

    // 3. Audio & Haptic feedback
    SoundPlayer.playSuccessFanfare();

    // 4. Update local session history
    const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setCountedHistory((prev) => [
      {
        item: activeItem,
        oldCount,
        newCount: finalQty,
        time: nowTime,
      },
      ...prev.slice(0, 9),
    ]);

    // 5. Show quick toast & close popup
    setLastSavedMessage(`✓ Updated ${activeItem.name} to ${finalQty} ${activeItem.unitType}s`);
    setTimeout(() => setLastSavedMessage(null), 3500);
    setActiveItem(null);
  };

  return (
    <div className="space-y-4 select-none">
      {/* 1. Header Banner */}
      <div className="bg-gradient-to-r from-slate-900/90 via-indigo-950/80 to-slate-900/90 border border-indigo-500/30 rounded-3xl p-4 sm:p-5 backdrop-blur-xl shadow-2xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 border border-indigo-400/40 flex items-center justify-center text-indigo-300 shadow-md">
              <QrCode className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-black font-heading text-white tracking-tight">
                  Walk-Around Shelf & Box Scanner
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-400/20 text-amber-300 border border-amber-400/30">
                  Instant Pop-up Mode
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Scan any shelf QR tag or box UPC barcode to adjust on-hand inventory in one tap.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsQrSheetOpen(true)}
              className="px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition-colors"
              title="View Printable Shelf QR Codes"
            >
              <Printer className="w-3.5 h-3.5 text-indigo-400" />
              <span>Shelf QR Tags</span>
            </button>

            <button
              onClick={isCameraActive ? stopCamera : startCamera}
              className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-lg transition-all active:scale-95 ${
                isCameraActive
                  ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-600/30'
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/30'
              }`}
            >
              {isCameraActive ? (
                <>
                  <CameraOff className="w-4 h-4" />
                  <span>Turn Camera Off</span>
                </>
              ) : (
                <>
                  <Camera className="w-4 h-4" />
                  <span>Launch Camera</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Location Filter & Manual SKU Bar */}
        <div className="mt-4 pt-3 border-t border-white/10 flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
          {/* Storage Zone Dropdown */}
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Aisle / Zone:
            </span>
            <select
              value={selectedLocation}
              onChange={(e) => {
                setSelectedLocation(e.target.value);
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

          {/* Manual Code / SKU Search */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={manualInput}
              onChange={(e) => setManualInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && manualInput.trim()) {
                  handleProcessCode(manualInput);
                }
              }}
              placeholder="Scan barcode, type SKU (e.g. 071234500128) or product name..."
              className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-9 pr-24 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-400"
            />
            {manualInput.trim() && (
              <button
                type="button"
                onClick={() => handleProcessCode(manualInput)}
                className="absolute right-1.5 top-1 px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold transition-colors"
              >
                Scan
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Success Feedback Toast Banner */}
      {lastSavedMessage && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="p-3 bg-emerald-500/20 border border-emerald-500/40 rounded-2xl flex items-center justify-between text-emerald-300 text-xs font-bold shadow-lg"
        >
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{lastSavedMessage}</span>
          </div>
          <span className="text-[10px] text-emerald-400/80 font-normal">Ready for next shelf QR</span>
        </motion.div>
      )}

      {/* 2. Live Camera Viewfinder (if turned on) */}
      {isCameraActive && (
        <div className="relative bg-slate-950 border border-indigo-500/40 rounded-3xl overflow-hidden shadow-2xl">
          <div className="aspect-video sm:aspect-[21/9] w-full relative flex items-center justify-center bg-black">
            <video
              ref={videoRef}
              playsInline
              autoPlay
              muted
              className="w-full h-full object-cover"
            />

            {/* Target Scanning Crosshair Box */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-64 h-40 sm:w-80 sm:h-48 border-2 border-dashed border-amber-400 rounded-2xl relative flex items-center justify-center shadow-[0_0_20px_rgba(251,191,36,0.3)]">
                <div className="absolute top-2 text-[10px] uppercase tracking-widest font-black text-amber-300 bg-black/60 px-2.5 py-0.5 rounded-full backdrop-blur-md">
                  Align Shelf QR or Box Barcode
                </div>
                <div className="w-full h-0.5 bg-gradient-to-r from-transparent via-amber-400 to-transparent animate-pulse" />
              </div>
            </div>

            {/* Camera Control overlay buttons */}
            <div className="absolute top-3 right-3 flex items-center gap-2 z-10">
              <button
                onClick={stopCamera}
                className="p-2 rounded-xl bg-black/70 hover:bg-black/90 text-white border border-white/20 backdrop-blur-md"
                title="Close Camera"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {cameraError && (
        <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0 text-amber-400" />
          <span>{cameraError}</span>
        </div>
      )}

      {/* 3. Walk-Around Interactive Shelf Tags & Box Simulator */}
      <div className="bg-slate-900/80 border border-white/10 rounded-3xl p-4 sm:p-5 backdrop-blur-md space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
              Tap Shelf Tag to Adjust On-Hand ({filteredInventory.length} Products in {selectedLocation === 'all' ? 'Store' : selectedLocation})
            </span>
          </div>
          <span className="text-[11px] text-slate-400 font-medium">
            Simulates walking past shelf & scanning
          </span>
        </div>

        {/* Shelf Tag Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 max-h-[420px] overflow-y-auto pr-1">
          {filteredInventory.map((item) => {
            const isLow = item.currentQuantity <= item.reorderPoint;
            return (
              <motion.button
                key={item.id}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  setActiveItem(item);
                  setAdjustedQty(item.currentQuantity);
                  SoundPlayer.playScanSuccess();
                }}
                className={`p-3 rounded-2xl border text-left flex items-start justify-between gap-2.5 transition-all group ${
                  isLow
                    ? 'bg-rose-950/20 border-rose-500/30 hover:border-rose-400 hover:bg-rose-950/40'
                    : 'bg-slate-950/70 border-slate-800 hover:border-indigo-500/50 hover:bg-slate-900'
                }`}
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className="px-1.5 py-0.2 rounded bg-indigo-500/20 text-indigo-300 text-[9px] font-bold font-mono uppercase">
                      {item.storageLocation.replace('Walk-in ', '')}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      SKU: {item.sku}
                    </span>
                  </div>

                  <div className="text-xs font-bold text-white group-hover:text-amber-300 transition-colors truncate">
                    {item.name}
                  </div>

                  <div className="text-[10px] text-slate-400 mt-0.5">
                    Par: <strong className="text-slate-200">{item.parLevel}</strong> • Pack: {item.packSize}
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <div className="text-xs font-black text-white group-hover:text-amber-300 font-heading">
                    {item.currentQuantity} <span className="text-[10px] font-normal text-slate-400">{item.unitType}s</span>
                  </div>
                  <div className="mt-1 flex items-center justify-end gap-1 text-[10px] font-bold text-amber-400">
                    <span>Adjust</span>
                    <ChevronRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </div>
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* 4. Recent Walk-Around Count Session Log */}
      {countedHistory.length > 0 && (
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-3.5 space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-slate-400 uppercase tracking-wider">
            <span>Walk-Around Activity Log (This Session)</span>
            <span className="text-indigo-400">{countedHistory.length} items audited</span>
          </div>

          <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
            {countedHistory.map((hist, idx) => {
              const diff = hist.newCount - hist.oldCount;
              return (
                <div
                  key={idx}
                  className="p-2 rounded-xl bg-slate-950/80 border border-slate-800 flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-slate-500 font-mono">{hist.time}</span>
                    <span className="font-semibold text-white">{hist.item.name}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-slate-400">
                      {hist.oldCount} ➔ <strong className="text-white">{hist.newCount} {hist.item.unitType}s</strong>
                    </span>
                    <span
                      className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${
                        diff > 0
                          ? 'bg-emerald-500/20 text-emerald-300'
                          : diff < 0
                          ? 'bg-rose-500/20 text-rose-300'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {diff > 0 ? `+${diff}` : diff === 0 ? 'Exact' : diff}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. QUICK ADJUST ON-HAND POPUP (Requested Feature)                           */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {activeItem && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md select-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 20 }}
              className="relative w-full max-w-md bg-[#0F1420] border border-amber-400/50 rounded-3xl shadow-2xl text-white overflow-hidden"
            >
              {/* Top Pop-up Header */}
              <div className="px-5 py-3.5 bg-gradient-to-r from-indigo-950 via-slate-900 to-indigo-950 border-b border-white/10 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-amber-400 text-slate-950 font-bold">
                    <Package className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-[10px] font-bold uppercase tracking-widest text-amber-300">
                      Adjust On-Hand Count
                    </div>
                    <div className="text-xs text-slate-400">
                      {activeItem.storageLocation}
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => setActiveItem(null)}
                  className="p-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Pop-up Body */}
              <div className="p-5 space-y-4">
                {/* Item Details Card */}
                <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800">
                  <h3 className="text-base font-extrabold text-white leading-tight">
                    {activeItem.name}
                  </h3>
                  <div className="flex items-center justify-between text-xs text-slate-400 mt-1">
                    <span>SKU: <strong className="text-slate-300 font-mono">{activeItem.sku}</strong></span>
                    <span>Par Level: <strong className="text-amber-300">{activeItem.parLevel} {activeItem.unitType}s</strong></span>
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    Pack Size: {activeItem.packSize} • Current in System: {activeItem.currentQuantity}
                  </div>
                </div>

                {/* Big Number Input & Tactile Stepper */}
                <div className="p-4 rounded-2xl bg-slate-950 border border-indigo-500/40 text-center space-y-3 shadow-inner">
                  <div className="text-[11px] uppercase font-bold text-slate-400 tracking-wider">
                    Actual Physical Count on Shelf ({activeItem.unitType}s)
                  </div>

                  <div className="flex items-center justify-center gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        setAdjustedQty((prev) => Math.max(0, prev - 1));
                        SoundPlayer.playDecrementSound();
                      }}
                      className="w-12 h-12 rounded-2xl bg-slate-800 hover:bg-slate-700 active:bg-rose-600 border border-slate-700 text-rose-300 font-bold text-2xl flex items-center justify-center transition-transform active:scale-95 shadow-md"
                    >
                      <Minus className="w-5 h-5" />
                    </button>

                    <div className="relative">
                      <input
                        ref={qtyInputRef}
                        type="number"
                        min="0"
                        value={adjustedQty}
                        onChange={(e) => setAdjustedQty(Number(e.target.value) || 0)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            handleSaveCount();
                          }
                        }}
                        className="w-28 text-center text-4xl sm:text-5xl font-black text-amber-300 font-heading bg-transparent border-b-2 border-amber-400/80 focus:outline-none focus:border-amber-300 py-1"
                      />
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setAdjustedQty((prev) => prev + 1);
                        SoundPlayer.playCountBeep();
                      }}
                      className="w-12 h-12 rounded-2xl bg-slate-800 hover:bg-slate-700 active:bg-emerald-600 border border-slate-700 text-emerald-300 font-bold text-2xl flex items-center justify-center transition-transform active:scale-95 shadow-md"
                    >
                      <Plus className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Variance Pill */}
                  <div className="pt-1">
                    {adjustedQty !== activeItem.currentQuantity ? (
                      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        Variance: {adjustedQty - activeItem.currentQuantity > 0 ? '+' : ''}
                        {adjustedQty - activeItem.currentQuantity} {activeItem.unitType}s ($
                        {(((adjustedQty - (activeItem.currentQuantity || 0)) * (activeItem.costPerUnit || 0))).toFixed(2)})
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                        <Check className="w-3.5 h-3.5" /> Matches System On-Hand
                      </span>
                    )}
                  </div>
                </div>

                {/* Quick Presets Stepper Bar */}
                <div className="grid grid-cols-4 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setAdjustedQty((prev) => prev + 5);
                      SoundPlayer.playCountBeep();
                    }}
                    className="py-2.5 rounded-xl bg-indigo-900/50 hover:bg-indigo-800/70 border border-indigo-700/50 text-xs font-bold text-indigo-200 transition-colors"
                  >
                    +5
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setAdjustedQty((prev) => prev + 10);
                      SoundPlayer.playCountBeep();
                    }}
                    className="py-2.5 rounded-xl bg-indigo-900/50 hover:bg-indigo-800/70 border border-indigo-700/50 text-xs font-bold text-indigo-200 transition-colors"
                  >
                    +10
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setAdjustedQty(activeItem.parLevel);
                      SoundPlayer.playCountBeep();
                    }}
                    className="py-2.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-xs font-bold text-amber-300 transition-colors"
                  >
                    Set to Par ({activeItem.parLevel})
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setAdjustedQty(0);
                      SoundPlayer.playDecrementSound();
                    }}
                    className="py-2.5 rounded-xl bg-rose-950/60 hover:bg-rose-900/80 border border-rose-800/60 text-xs font-bold text-rose-200 transition-colors"
                  >
                    Zero (0)
                  </button>
                </div>

                {/* Save & Done Action Bar */}
                <div className="pt-2 flex items-center gap-2.5">
                  <button
                    type="button"
                    onClick={() => setActiveItem(null)}
                    className="flex-1 py-3 bg-white/5 hover:bg-white/10 text-slate-300 rounded-2xl text-xs font-bold transition-colors"
                  >
                    Cancel
                  </button>

                  <button
                    type="button"
                    onClick={handleSaveCount}
                    className="flex-[2] py-3.5 bg-gradient-to-r from-amber-400 via-orange-400 to-amber-400 hover:from-amber-300 hover:to-orange-300 text-slate-950 rounded-2xl text-sm font-black flex items-center justify-center gap-2 shadow-xl shadow-amber-500/20 transition-transform active:scale-95"
                  >
                    <CheckCircle2 className="w-5 h-5 text-slate-950" />
                    <span>Done & Save Count</span>
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ========================================================================= */}
      {/* 6. PRINTABLE SHELF QR CODES MODAL                                         */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {isQrSheetOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md select-none overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-4xl bg-slate-900 border border-slate-700 rounded-3xl shadow-2xl text-white overflow-hidden max-h-[90vh] flex flex-col"
            >
              {/* Header */}
              <div className="px-6 py-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between sticky top-0 z-10">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-indigo-600 text-white">
                    <Printer className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-white">
                      Printable Shelf QR Tags (Hardee’s Harrogate)
                    </h2>
                    <p className="text-xs text-slate-400">
                      Scan these labels with your phone/tablet camera while walking the store.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => window.print()}
                    className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-1.5"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Print Sheet</span>
                  </button>
                  <button
                    onClick={() => setIsQrSheetOpen(false)}
                    className="p-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Grid of Shelf Tags with QR Codes */}
              <div className="p-6 overflow-y-auto flex-1 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 bg-slate-950/50">
                {inventory.map((item) => (
                  <div
                    key={item.id}
                    className="p-4 rounded-2xl bg-white text-slate-950 border border-slate-300 shadow-md flex flex-col items-center text-center space-y-2"
                  >
                    <div className="text-[10px] uppercase font-extrabold tracking-widest text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                      {item.storageLocation}
                    </div>

                    <div className="font-extrabold text-sm text-slate-900 leading-tight">
                      {item.name}
                    </div>

                    {qrCodeUrls[item.id] ? (
                      <img
                        src={qrCodeUrls[item.id]}
                        alt={item.name}
                        className="w-28 h-28 border border-slate-200 rounded-lg p-1 bg-white"
                      />
                    ) : (
                      <div className="w-28 h-28 border border-dashed border-slate-300 rounded-lg flex items-center justify-center text-xs text-slate-400 font-mono">
                        {item.sku}
                      </div>
                    )}

                    <div className="text-[11px] font-mono font-bold text-slate-600">
                      UPC: {item.barcode || item.sku}
                    </div>
                    <div className="text-[10px] text-slate-500 font-medium">
                      Par: {item.parLevel} {item.unitType}s • Pack: {item.packSize}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
