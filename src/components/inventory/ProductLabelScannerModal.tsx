import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  Camera,
  Upload,
  Sparkles,
  Barcode,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Plus,
  Layers,
  ArrowRight,
  Package,
  DollarSign,
  MapPin,
  Tag,
  Boxes,
  Eye,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import { Category, InventoryItem, StorageLocation, Store, UnitType } from '../../types';
import { SoundPlayer } from '../../utils/audio';

interface ProductLabelScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddItem: (item: InventoryItem) => void;
  categories: Category[];
  activeStore: Store;
  initialBarcode?: string;
}

interface CapturedPhoto {
  id: string;
  dataUrl: string;
  label: string;
}

interface ExtractedProductData {
  name: string;
  barcode: string;
  sku: string;
  vendor: string;
  categoryId: string;
  categoryName: string;
  storageLocation: StorageLocation;
  unitType: UnitType;
  packSize: string;
  unitsPerPack: number;
  costPerUnit: number;
  parLevel: number;
  reorderThreshold: number;
  usageRatePerDay: number;
  allergens: string[];
  notes: string;
  confidence: number;
  simulated?: boolean;
}

// Built-in high-quality demo samples for testing without physical boxes
const DEMO_PRODUCT_SAMPLES = [
  {
    id: 'demo-biscuit',
    title: 'Hardee’s Biscuit Mix (50 lb)',
    desc: 'Baking flour bag with batch code & UPC',
    categoryHint: 'cat-bakery',
    imageSvg: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400" viewBox="0 0 600 400"><rect width="600" height="400" fill="%23fef3c7"/><rect x="40" y="40" width="520" height="320" rx="16" fill="%23fffbeb" stroke="%23d97706" stroke-width="6"/><text x="300" y="100" font-family="sans-serif" font-size="28" font-weight="900" text-anchor="middle" fill="%2392400e">HARDEE'S PROPRIETARY BLEND</text><text x="300" y="150" font-family="sans-serif" font-size="34" font-weight="bold" text-anchor="middle" fill="%23b45309">MADE FROM SCRATCH BISCUIT MIX</text><text x="300" y="190" font-family="sans-serif" font-size="20" text-anchor="middle" fill="%2378350f">NET WT 50 LB (22.68 kg) • US FOODS CKE #00142</text><rect x="180" y="220" width="240" height="70" fill="%23ffffff" stroke="%23000" stroke-width="2"/><text x="300" y="270" font-family="monospace" font-size="32" font-weight="bold" text-anchor="middle" fill="%23000">||| |||| || ||||| |||</text><text x="300" y="315" font-family="monospace" font-size="16" font-weight="bold" text-anchor="middle" fill="%231f2937">071234500142</text></svg>`,
  },
  {
    id: 'demo-angus',
    title: '1/3 lb Angus Beef Patties',
    desc: 'Frozen box case label with temperature warning',
    categoryHint: 'cat-meats',
    imageSvg: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400" viewBox="0 0 600 400"><rect width="600" height="400" fill="%231e293b"/><rect x="40" y="40" width="520" height="320" rx="16" fill="%230f172a" stroke="%23ef4444" stroke-width="6"/><text x="300" y="100" font-family="sans-serif" font-size="26" font-weight="900" text-anchor="middle" fill="%23f87171">CKE RESTAURANTS SUPPLY</text><text x="300" y="145" font-family="sans-serif" font-size="30" font-weight="bold" text-anchor="middle" fill="%23ffffff">100% BLACK ANGUS BEEF PATTIES 1/3 LB</text><text x="300" y="185" font-family="sans-serif" font-size="18" text-anchor="middle" fill="%23cbd5e1">KEEP FROZEN 0°F • 40 CT (13.33 LB CASE) • SKU HD-ANG-0128</text><rect x="180" y="220" width="240" height="70" fill="%23ffffff" stroke="%23000" stroke-width="2"/><text x="300" y="270" font-family="monospace" font-size="32" font-weight="bold" text-anchor="middle" fill="%23000">|||| || |||| ||| ||||</text><text x="300" y="315" font-family="monospace" font-size="16" font-weight="bold" text-anchor="middle" fill="%231f2937">071234500128</text></svg>`,
  },
  {
    id: 'demo-fries',
    title: 'Natural-Cut French Fries Case',
    desc: '6 x 5 lb fry cases for walk-in freezer',
    categoryHint: 'cat-sides',
    imageSvg: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400" viewBox="0 0 600 400"><rect width="600" height="400" fill="%23fef08a"/><rect x="40" y="40" width="520" height="320" rx="16" fill="%23fef9c3" stroke="%23eab308" stroke-width="6"/><text x="300" y="100" font-family="sans-serif" font-size="26" font-weight="900" text-anchor="middle" fill="%23854d0e">SIMPLOT / HARDEE'S SPEC</text><text x="300" y="145" font-family="sans-serif" font-size="32" font-weight="bold" text-anchor="middle" fill="%23ca8a04">NATURAL-CUT SKIN-ON FRENCH FRIES</text><text x="300" y="185" font-family="sans-serif" font-size="18" text-anchor="middle" fill="%23713f12">6 x 5 LB BAGS (30 LB CASE) • KEEP FROZEN • SKU SIM-00166</text><rect x="180" y="220" width="240" height="70" fill="%23ffffff" stroke="%23000" stroke-width="2"/><text x="300" y="270" font-family="monospace" font-size="32" font-weight="bold" text-anchor="middle" fill="%23000">||| ||||| || ||| ||||</text><text x="300" y="315" font-family="monospace" font-size="16" font-weight="bold" text-anchor="middle" fill="%231f2937">071234500166</text></svg>`,
  },
  {
    id: 'demo-sauce',
    title: 'Frank’s RedHot Buffalo Sauce (4 Gal)',
    desc: 'Heavy condiment case with tamper sticker',
    categoryHint: 'cat-condiments',
    imageSvg: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400" viewBox="0 0 600 400"><rect width="600" height="400" fill="%23fee2e2"/><rect x="40" y="40" width="520" height="320" rx="16" fill="%23fff1f2" stroke="%23f43f5e" stroke-width="6"/><text x="300" y="100" font-family="sans-serif" font-size="28" font-weight="900" text-anchor="middle" fill="%239f1239">FRANK'S REDHOT</text><text x="300" y="145" font-family="sans-serif" font-size="30" font-weight="bold" text-anchor="middle" fill="%23be123c">CAYENNE PEPPER BUFFALO SAUCE</text><text x="300" y="185" font-family="sans-serif" font-size="18" text-anchor="middle" fill="%23881337">4 x 1 GALLON JUGS • STORE AMBIENT • SKU FRK-00192</text><rect x="180" y="220" width="240" height="70" fill="%23ffffff" stroke="%23000" stroke-width="2"/><text x="300" y="270" font-family="monospace" font-size="32" font-weight="bold" text-anchor="middle" fill="%23000">|||| ||| ||||| || |||</text><text x="300" y="315" font-family="monospace" font-size="16" font-weight="bold" text-anchor="middle" fill="%231f2937">071234500192</text></svg>`,
  },
];

export const ProductLabelScannerModal: React.FC<ProductLabelScannerModalProps> = ({
  isOpen,
  onClose,
  onAddItem,
  categories,
  activeStore,
  initialBarcode,
}) => {
  const [step, setStep] = useState<'capture' | 'analyzing' | 'review'>('capture');
  const [photos, setPhotos] = useState<CapturedPhoto[]>([]);
  const [isCameraActive, setIsCameraActive] = useState<boolean>(true);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);

  // Form review fields
  const [extractedData, setExtractedData] = useState<ExtractedProductData | null>(null);
  const [formName, setFormName] = useState('');
  const [formBarcode, setFormBarcode] = useState(initialBarcode || '');
  const [formSku, setFormSku] = useState('');
  const [formVendor, setFormVendor] = useState('US Foods CKE Supply');
  const [formCategoryId, setFormCategoryId] = useState(categories[0]?.id || 'cat-meats');
  const [formLocation, setFormLocation] = useState<StorageLocation>('Walk-in Freezer');
  const [formUnitType, setFormUnitType] = useState<UnitType>('case');
  const [formPackSize, setFormPackSize] = useState('1 Case');
  const [formUnitsPerPack, setFormUnitsPerPack] = useState(1);
  const [formCostPerUnit, setFormCostPerUnit] = useState(45.0);
  const [formQuantity, setFormQuantity] = useState(5);
  const [formParLevel, setFormParLevel] = useState(10);
  const [formReorderThreshold, setFormReorderThreshold] = useState(4);
  const [formUsageRate, setFormUsageRate] = useState(2.0);
  const [formNotes, setFormNotes] = useState('');
  const [formAllergens, setFormAllergens] = useState<string[]>([]);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Initialize camera stream
  useEffect(() => {
    let activeStream: MediaStream | null = null;

    async function initCamera() {
      if (isOpen && step === 'capture' && isCameraActive) {
        try {
          setCameraError(null);
          activeStream = await navigator.mediaDevices.getUserMedia({
            video: {
              facingMode: { ideal: facingMode },
              width: { ideal: 1920 },
              height: { ideal: 1080 },
            },
            audio: false,
          });
          streamRef.current = activeStream;

          if (videoRef.current) {
            videoRef.current.srcObject = activeStream;
            videoRef.current.play();
          }
        } catch (err: any) {
          console.warn('Camera stream could not start:', err);
          setCameraError('Camera access unavailable. You can upload photos or select sample product labels below.');
          setIsCameraActive(false);
        }
      }
    }

    initCamera();

    return () => {
      if (activeStream) {
        activeStream.getTracks().forEach((track) => track.stop());
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
    };
  }, [isOpen, step, isCameraActive, facingMode]);

  // Reset when opened
  useEffect(() => {
    if (isOpen) {
      setStep('capture');
      setPhotos([]);
      setAnalysisError(null);
      setIsCameraActive(true);
      if (initialBarcode) {
        setFormBarcode(initialBarcode);
      }
    }
  }, [isOpen, initialBarcode]);

  if (!isOpen) return null;

  // Snap photo from camera
  const handleSnapPhoto = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.88);

    const newPhoto: CapturedPhoto = {
      id: 'photo-' + Date.now(),
      dataUrl,
      label: photos.length === 0 ? 'Product Label & Barcode' : `Angle ${photos.length + 1}`,
    };

    setPhotos((prev) => [...prev, newPhoto]);
    SoundPlayer.playCountBeep();
  };

  // Upload photo from file input
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file: File) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          const newPhoto: CapturedPhoto = {
            id: 'photo-' + Date.now() + '-' + Math.random().toString(36).substring(2, 5),
            dataUrl: event.target.result as string,
            label: file.name || `Photo ${photos.length + 1}`,
          };
          setPhotos((prev) => [...prev, newPhoto]);
          SoundPlayer.playCountBeep();
        }
      };
      reader.readAsDataURL(file);
    });

    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Load a demo sample
  const handleSelectDemo = (demo: typeof DEMO_PRODUCT_SAMPLES[0]) => {
    const newPhoto: CapturedPhoto = {
      id: 'demo-' + demo.id,
      dataUrl: demo.imageSvg,
      label: demo.title,
    };
    setPhotos([newPhoto]);
    SoundPlayer.playCountBeep();
  };

  const handleRemovePhoto = (id: string) => {
    setPhotos((prev) => prev.filter((p) => p.id !== id));
  };

  // Run AI Vision Extraction
  const handleRunAiAnalysis = async () => {
    if (photos.length === 0) return;

    setStep('analyzing');
    setIsAnalyzing(true);
    setAnalysisError(null);
    SoundPlayer.playScanSuccess();

    try {
      const imagesPayload = photos.map((p) => ({
        data: p.dataUrl,
        mimeType: 'image/jpeg',
      }));

      const response = await fetch('/api/inventory/scan-product-label', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          images: imagesPayload,
          existingCategories: categories.map((c) => ({ id: c.id, name: c.name })),
          existingBarcode: initialBarcode || formBarcode || '',
          storeInfo: {
            storeNumber: activeStore.storeNumber,
            name: activeStore.name,
          },
        }),
      });

      if (!response.ok) {
        const errJson = await response.json().catch(() => ({}));
        throw new Error(errJson.error || `Scan failed with HTTP status ${response.status}`);
      }

      const result: ExtractedProductData = await response.json();
      setExtractedData(result);

      // Populate review form
      setFormName(result.name || 'New Scanned Product');
      setFormBarcode(result.barcode || initialBarcode || '0712345' + Math.floor(10000 + Math.random() * 90000));
      setFormSku(result.sku || 'HD-SKU-' + Math.floor(100 + Math.random() * 900));
      setFormVendor(result.vendor || 'US Foods CKE Supply');

      // Match category
      const matchedCat = categories.find((c) => c.id === result.categoryId) || categories[0];
      setFormCategoryId(matchedCat ? matchedCat.id : categories[0]?.id || 'cat-meats');

      // Match location
      setFormLocation(result.storageLocation || 'Walk-in Freezer');
      setFormUnitType(result.unitType || 'case');
      setFormPackSize(result.packSize || '1 Case');
      setFormUnitsPerPack(result.unitsPerPack || 1);
      setFormCostPerUnit(result.costPerUnit ? Number(result.costPerUnit) : 45.0);
      setFormParLevel(result.parLevel ? Number(result.parLevel) : 10);
      setFormReorderThreshold(result.reorderThreshold ? Number(result.reorderThreshold) : 4);
      setFormUsageRate(result.usageRatePerDay ? Number(result.usageRatePerDay) : 2.0);
      setFormQuantity(result.parLevel ? Math.max(2, Math.round(Number(result.parLevel) * 0.8)) : 6);
      setFormAllergens(result.allergens || []);
      setFormNotes(result.notes || '');

      setStep('review');
      SoundPlayer.playSuccessFanfare();
    } catch (err: any) {
      console.error('AI Product scan error:', err);
      setAnalysisError(err.message || 'Failed to analyze product photos. You can retry or fill details manually.');
      setStep('capture');
      SoundPlayer.playAlertChime();
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Submit to inventory catalog
  const handleSaveProduct = (andScanNext: boolean = false) => {
    if (!formName.trim()) return;

    const newItem: InventoryItem = {
      id: 'item-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
      storeId: activeStore.id,
      sku: formSku.trim() || 'HD-' + formName.substring(0, 3).toUpperCase() + '-' + Math.floor(100 + Math.random() * 900),
      barcode: formBarcode.trim() || '0712345' + Math.floor(10000 + Math.random() * 90000),
      name: formName.trim(),
      categoryId: formCategoryId,
      unitType: formUnitType,
      packSize: formPackSize.trim() || '1 Case',
      unitsPerPack: Number(formUnitsPerPack) || 1,
      vendor: formVendor.trim() || 'US Foods CKE Supply',
      costPerUnit: Number(formCostPerUnit) || 0,
      parLevel: Number(formParLevel) || 0,
      minTarget: Math.max(1, Math.round((Number(formParLevel) || 10) * 0.3)),
      maxTarget: Math.round((Number(formParLevel) || 10) * 1.5),
      reorderThreshold: Number(formReorderThreshold) || 0,
      currentQuantity: Number(formQuantity) || 0,
      previousQuantity: Number(formQuantity) || 0,
      storageLocation: formLocation,
      usageRatePerDay: Number(formUsageRate) || 2.0,
      wasteLast7Days: 0,
      notes: formNotes + (formAllergens.length > 0 ? ` Allergens: ${formAllergens.join(', ')}` : ''),
      lastCountedAt: new Date().toISOString(),
      lastCountedBy: 'AI Camera Label Scan',
    };

    onAddItem(newItem);
    SoundPlayer.playSuccessFanfare();

    if (andScanNext) {
      setStep('capture');
      setPhotos([]);
      setExtractedData(null);
      setFormName('');
      setFormBarcode('');
      setFormSku('');
    } else {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-md select-none">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className="relative w-full max-w-4xl bg-slate-900 border border-slate-700 rounded-3xl shadow-2xl text-white overflow-hidden max-h-[92vh] flex flex-col"
      >
        {/* Header */}
        <div className="px-5 sm:px-6 py-3.5 bg-slate-950/85 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="p-2.5 rounded-2xl bg-gradient-to-tr from-amber-500 to-indigo-500 text-slate-950 shadow-md">
              <Camera className="w-5 h-5 text-slate-950" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-white font-heading">
                  AI Product Label & Barcode Scanner
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-amber-400/20 text-amber-300 border border-amber-400/30 flex items-center gap-1">
                  <Sparkles className="w-3 h-3" /> Vision AI
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Point camera at box packaging, product label, and barcode to auto-populate inventory
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl bg-white/5 hover:bg-white/10 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Step 1: Capture Photos */}
        {step === 'capture' && (
          <div className="p-5 sm:p-6 overflow-y-auto space-y-5 flex-1">
            {analysisError && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-2xl flex items-center gap-2.5 text-xs text-rose-300">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                <span>{analysisError}</span>
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
              {/* Camera Stream / Viewfinder */}
              <div className="lg:col-span-7 flex flex-col space-y-3">
                <div className="relative aspect-video bg-slate-950 rounded-2xl border-2 border-slate-800 overflow-hidden flex items-center justify-center shadow-inner">
                  {isCameraActive ? (
                    <>
                      <video
                        ref={videoRef}
                        playsInline
                        muted
                        autoPlay
                        className="w-full h-full object-cover"
                      />
                      {/* Scanning Target Overlay */}
                      <div className="absolute inset-6 border-2 border-dashed border-amber-400/60 rounded-xl pointer-events-none flex flex-col justify-between p-3">
                        <div className="flex justify-between items-center text-[10px] font-bold text-amber-300 bg-slate-950/70 px-2 py-0.5 rounded-md backdrop-blur-sm self-start">
                          <Barcode className="w-3 h-3 inline mr-1" /> Align Label & Barcode
                        </div>
                        <div className="w-full h-0.5 bg-amber-400/80 shadow-[0_0_8px_#f59e0b] animate-pulse" />
                        <div className="text-[10px] text-slate-300 bg-slate-950/70 px-2 py-0.5 rounded-md backdrop-blur-sm self-end">
                          Hold Steady
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="text-center p-6 space-y-3">
                      <Camera className="w-10 h-10 text-slate-600 mx-auto" />
                      <p className="text-xs text-slate-400 max-w-xs">
                        {cameraError || 'Camera is currently paused or inactive.'}
                      </p>
                      <button
                        onClick={() => setIsCameraActive(true)}
                        className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold"
                      >
                        Start Camera
                      </button>
                    </div>
                  )}
                </div>

                {/* Camera Action Buttons */}
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    {isCameraActive && (
                      <button
                        onClick={() => setFacingMode((prev) => (prev === 'environment' ? 'user' : 'environment'))}
                        className="px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-slate-300 flex items-center gap-1.5"
                        title="Switch Front/Back Camera"
                      >
                        <RefreshCw className="w-3.5 h-3.5" /> Flip Camera
                      </button>
                    )}
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-slate-300 flex items-center gap-1.5"
                    >
                      <Upload className="w-3.5 h-3.5 text-indigo-400" /> Upload Image
                    </button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      multiple
                      className="hidden"
                      onChange={handleFileUpload}
                    />
                  </div>

                  {isCameraActive && (
                    <button
                      onClick={handleSnapPhoto}
                      className="px-5 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 active:scale-95 text-slate-950 font-extrabold text-xs flex items-center gap-2 shadow-lg transition-transform"
                    >
                      <Camera className="w-4 h-4" /> Snap Photo ({photos.length})
                    </button>
                  )}
                </div>
              </div>

              {/* Photos Gallery & Demo Presets */}
              <div className="lg:col-span-5 flex flex-col space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-300">
                    Captured Photos ({photos.length})
                  </span>
                  {photos.length > 0 && (
                    <button
                      onClick={() => setPhotos([])}
                      className="text-[11px] text-rose-400 hover:underline"
                    >
                      Clear All
                    </button>
                  )}
                </div>

                {photos.length === 0 ? (
                  <div className="border border-dashed border-slate-700/80 rounded-2xl p-4 text-center space-y-2.5 bg-slate-950/40">
                    <Package className="w-7 h-7 text-slate-600 mx-auto" />
                    <p className="text-xs text-slate-400">
                      Snap or upload a photo of the product package, box sticker, or barcode label.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto p-1">
                    {photos.map((photo, idx) => (
                      <div
                        key={photo.id}
                        className="relative group rounded-xl overflow-hidden border border-slate-700 bg-slate-950 aspect-video"
                      >
                        <img
                          src={photo.dataUrl}
                          alt={photo.label}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-between p-1.5 transition-opacity">
                          <span className="text-[10px] font-bold text-white bg-black/60 px-1.5 py-0.5 rounded">
                            #{idx + 1}
                          </span>
                          <button
                            onClick={() => handleRemovePhoto(photo.id)}
                            className="p-1 rounded-md bg-rose-600 text-white hover:bg-rose-500"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Quick Demo Label Presets for Instant Testing */}
                <div className="pt-2 border-t border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-amber-400 flex items-center gap-1">
                      <Zap className="w-3.5 h-3.5" /> Or Test with Hardee's Sample Boxes:
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {DEMO_PRODUCT_SAMPLES.map((demo) => (
                      <button
                        key={demo.id}
                        onClick={() => handleSelectDemo(demo)}
                        className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-slate-800 hover:border-amber-400/50 text-left transition-all group"
                      >
                        <div className="text-[11px] font-bold text-white group-hover:text-amber-300 truncate">
                          {demo.title}
                        </div>
                        <div className="text-[9px] text-slate-400 truncate mt-0.5">{demo.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 2: AI Analyzing Loading Screen */}
        {step === 'analyzing' && (
          <div className="p-12 flex flex-col items-center justify-center space-y-6 flex-1 text-center">
            <div className="relative">
              <div className="w-24 h-24 rounded-3xl bg-amber-400/10 border-2 border-amber-400 flex items-center justify-center animate-pulse">
                <Sparkles className="w-12 h-12 text-amber-400 animate-spin" style={{ animationDuration: '6s' }} />
              </div>
              <div className="absolute -bottom-2 -right-2 p-2 rounded-xl bg-indigo-600 text-white shadow-lg">
                <Barcode className="w-5 h-5" />
              </div>
            </div>
            <div className="space-y-2 max-w-sm">
              <h3 className="text-lg font-extrabold text-white font-heading">
                AI Vision Reading Product Label...
              </h3>
              <p className="text-xs text-slate-400">
                Extracting brand, official product name, barcode digits, distributor SKU, storage temperature, unit packaging, and wholesale pricing.
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs font-semibold text-amber-300 bg-amber-400/10 px-4 py-2 rounded-xl border border-amber-400/20">
              <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Analyzing {photos.length} captured photo(s)
            </div>
          </div>
        )}

        {/* Step 3: Review & Edit Before Saving */}
        {step === 'review' && (
          <div className="p-5 sm:p-6 overflow-y-auto space-y-5 flex-1">
            {/* Top Success Banner */}
            <div className="p-4 bg-emerald-500/15 border border-emerald-500/30 rounded-2xl flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs sm:text-sm font-bold text-emerald-300">
                    Product Successfully Identified & Extracted!
                  </h4>
                  <p className="text-[11px] text-slate-300">
                    Review and fine-tune fields below before adding to Hardee’s Store #{activeStore.storeNumber} catalog.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setStep('capture')}
                className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-semibold text-slate-300 shrink-0"
              >
                Re-scan Photo
              </button>
            </div>

            {/* Extracted Form Fields */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Product Name */}
              <div className="sm:col-span-2 lg:col-span-3">
                <label className="block text-[11px] font-semibold text-slate-400 mb-1 flex items-center gap-1">
                  <Package className="w-3.5 h-3.5 text-amber-400" /> Item Name *
                </label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm font-bold text-white focus:border-amber-400"
                  required
                />
              </div>

              {/* Barcode / UPC */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1 flex items-center gap-1">
                  <Barcode className="w-3.5 h-3.5 text-indigo-400" /> Barcode / UPC
                </label>
                <input
                  type="text"
                  value={formBarcode}
                  onChange={(e) => setFormBarcode(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-amber-300"
                />
              </div>

              {/* SKU */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1 flex items-center gap-1">
                  <Tag className="w-3.5 h-3.5 text-cyan-400" /> SKU / Item Code
                </label>
                <input
                  type="text"
                  value={formSku}
                  onChange={(e) => setFormSku(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-white"
                />
              </div>

              {/* Category */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1 flex items-center gap-1">
                  <Boxes className="w-3.5 h-3.5 text-purple-400" /> Category
                </label>
                <select
                  value={formCategoryId}
                  onChange={(e) => setFormCategoryId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Storage Location */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-rose-400" /> Storage Location
                </label>
                <select
                  value={formLocation}
                  onChange={(e) => setFormLocation(e.target.value as StorageLocation)}
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

              {/* Unit Type */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">Unit Type</label>
                <select
                  value={formUnitType}
                  onChange={(e) => setFormUnitType(e.target.value as UnitType)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                >
                  {['case', 'bag', 'box', 'lb', 'each', 'carton', 'gallon', 'pack', 'roll'].map((u) => (
                    <option key={u} value={u}>
                      {u}
                    </option>
                  ))}
                </select>
              </div>

              {/* Pack Size */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">Pack Size Description</label>
                <input
                  type="text"
                  value={formPackSize}
                  onChange={(e) => setFormPackSize(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>

              {/* Cost Per Unit */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1 flex items-center gap-1">
                  <DollarSign className="w-3.5 h-3.5 text-emerald-400" /> Cost Per Unit ($)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formCostPerUnit}
                  onChange={(e) => setFormCostPerUnit(parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-bold"
                />
              </div>

              {/* Starting On-Hand Quantity */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">Initial On-Hand Count</label>
                <input
                  type="number"
                  value={formQuantity}
                  onChange={(e) => setFormQuantity(parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-bold"
                />
              </div>

              {/* Par Level */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">Par Level</label>
                <input
                  type="number"
                  value={formParLevel}
                  onChange={(e) => setFormParLevel(parseInt(e.target.value) || 0)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-bold"
                />
              </div>

              {/* Reorder Threshold */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">Reorder Threshold</label>
                <input
                  type="number"
                  value={formReorderThreshold}
                  onChange={(e) => setFormReorderThreshold(parseInt(e.target.value) || 0)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>

              {/* Supplier / Vendor */}
              <div className="sm:col-span-2">
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">Distributor / Supplier</label>
                <input
                  type="text"
                  value={formVendor}
                  onChange={(e) => setFormVendor(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>

              {/* Notes / Allergens */}
              <div className="sm:col-span-2 lg:col-span-3">
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                  Product Notes & Label Details
                </label>
                <textarea
                  rows={2}
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white resize-none"
                />
              </div>
            </div>
          </div>
        )}

        {/* Footer Actions */}
        <div className="px-5 sm:px-6 py-3.5 bg-slate-950/80 border-t border-slate-800 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-300 bg-white/5 hover:bg-white/10 rounded-xl transition-colors"
          >
            Cancel
          </button>

          {step === 'capture' && (
            <button
              disabled={photos.length === 0 || isAnalyzing}
              onClick={handleRunAiAnalysis}
              className={`px-5 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 shadow-lg transition-all ${
                photos.length > 0
                  ? 'bg-gradient-to-r from-amber-400 to-amber-300 text-slate-950 hover:opacity-95 active:scale-95'
                  : 'bg-slate-800 text-slate-500 cursor-not-allowed'
              }`}
            >
              <Sparkles className="w-4 h-4" />
              <span>Extract Product Info ({photos.length})</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}

          {step === 'review' && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleSaveProduct(true)}
                className="px-4 py-2 text-xs font-bold text-amber-300 bg-amber-400/10 hover:bg-amber-400/20 border border-amber-400/30 rounded-xl transition-colors hidden sm:flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" /> Save & Scan Next
              </button>
              <button
                type="button"
                onClick={() => handleSaveProduct(false)}
                className="px-5 py-2.5 text-xs font-extrabold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-xl shadow-lg flex items-center gap-2 transition-transform active:scale-95"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Add Product to Catalog</span>
              </button>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};
