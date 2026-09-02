import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Camera,
  Upload,
  FileText,
  Plus,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  X,
  Sparkles,
  Layers,
  Eye,
  ArrowRight,
  Package,
  DollarSign,
  Calendar,
  Building2,
  Hash,
  ChevronRight,
  Check,
  Zap,
} from 'lucide-react';
import { InventoryItem, Store, TruckOrder, TruckOrderItem, User } from '../../types';
import { LunaFox } from '../fox/LunaFox';
import { SoundPlayer } from '../../utils/audio';
import {
  InvoicePageImage,
  processMultiPageInvoice,
  ScannedInvoiceItem,
  ScannedInvoiceResult,
} from '../../services/invoiceScanner';

interface InvoiceScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeStore: Store;
  currentUser: User;
  inventory: InventoryItem[];
  onApplyToReceiving?: (order: TruckOrder) => void;
  onApplyToOrderBuilder?: (order: TruckOrder) => void;
  onDirectReceiveStock?: (order: TruckOrder) => void;
}

export const InvoiceScannerModal: React.FC<InvoiceScannerModalProps> = ({
  isOpen,
  onClose,
  activeStore,
  currentUser,
  inventory,
  onApplyToReceiving,
  onApplyToOrderBuilder,
  onDirectReceiveStock,
}) => {
  // Mode: 'capture' | 'analyzing' | 'review'
  const [step, setStep] = useState<'capture' | 'analyzing' | 'review'>('capture');
  const [pages, setPages] = useState<InvoicePageImage[]>([]);
  const [selectedPreviewPage, setSelectedPreviewPage] = useState<string | null>(null);

  // Camera state
  const [isCameraActive, setIsCameraActive] = useState<boolean>(true);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Extracted Result State
  const [extractedData, setExtractedData] = useState<ScannedInvoiceResult | null>(null);
  const [editedItems, setEditedItems] = useState<ScannedInvoiceItem[]>([]);
  const [orderNumber, setOrderNumber] = useState<string>('');
  const [vendor, setVendor] = useState<string>('US Foods CKE');
  const [deliveryDate, setDeliveryDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Start / stop camera stream
  useEffect(() => {
    let stream: MediaStream | null = null;

    async function initCamera() {
      if (isOpen && step === 'capture' && isCameraActive) {
        try {
          setCameraError(null);
          stream = await navigator.mediaDevices.getUserMedia({
            video: {
              facingMode: { ideal: facingMode },
              width: { ideal: 1920 },
              height: { ideal: 1080 },
            },
            audio: false,
          });

          if (videoRef.current) {
            videoRef.current.srcObject = stream;
            videoRef.current.play();
          }
        } catch (err: any) {
          console.warn('Camera access error:', err);
          setCameraError('Camera access unavailable or denied. You can upload photos of the pages.');
          setIsCameraActive(false);
        }
      }
    }

    initCamera();

    return () => {
      if (stream) {
        stream.getTracks().forEach((t) => t.stop());
      }
    };
  }, [isOpen, step, isCameraActive, facingMode]);

  if (!isOpen) return null;

  // Capture current camera frame as a page
  const handleSnapPage = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.88);

    const newPage: InvoicePageImage = {
      id: 'page-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
      dataUrl,
      name: `Page ${pages.length + 1}`,
      timestamp: Date.now(),
    };

    setPages((prev) => [...prev, newPage]);
    SoundPlayer.playCountBeep();
  };

  // Handle file uploads (multiple files supported)
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file: File, index: number) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          const newPage: InvoicePageImage = {
            id: 'page-' + Date.now() + '-' + index,
            dataUrl: event.target.result as string,
            name: file.name || `Page ${pages.length + index + 1}`,
            timestamp: Date.now(),
          };
          setPages((prev) => [...prev, newPage]);
        }
      };
      reader.readAsDataURL(file);
    });

    SoundPlayer.playCountBeep();
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleRemovePage = (id: string) => {
    setPages((prev) => prev.filter((p) => p.id !== id));
    SoundPlayer.playDecrementSound();
  };

  const handleAnalyzePages = async () => {
    if (pages.length === 0) {
      setErrorMsg('Please scan or upload at least one truck order page.');
      return;
    }

    setErrorMsg(null);
    setStep('analyzing');
    setIsAnalyzing(true);
    SoundPlayer.playSuccessFanfare();

    try {
      const result = await processMultiPageInvoice(pages, inventory, activeStore);
      setExtractedData(result);
      setEditedItems(result.items || []);
      setOrderNumber(result.orderNumber || `PO-${Math.floor(10000 + Math.random() * 90000)}`);
      setVendor(result.vendor || 'US Foods CKE');
      setDeliveryDate(result.deliveryDate || new Date().toISOString().split('T')[0]);
      setStep('review');
      SoundPlayer.playSuccessFanfare();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to extract invoice data. Please try again.');
      setStep('capture');
      SoundPlayer.playAlertChime();
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleUpdateItemQuantity = (index: number, delta: number) => {
    setEditedItems((prev) => {
      const next = [...prev];
      const current = next[index].quantityShipped || 0;
      next[index].quantityShipped = Math.max(0, current + delta);
      next[index].totalCost = (next[index].unitCost || 0) * next[index].quantityShipped;
      return next;
    });
  };

  const handleUpdateItemMatch = (index: number, itemId: string) => {
    const matched = inventory.find((i) => i.id === itemId);
    if (!matched) return;

    setEditedItems((prev) => {
      const next = [...prev];
      next[index] = {
        ...next[index],
        matchedItemId: matched.id,
        itemName: matched.name,
        sku: matched.sku,
        packSize: matched.packSize,
        unitCost: matched.costPerUnit,
        storageLocation: matched.storageLocation,
        totalCost: (matched.costPerUnit || 0) * (next[index].quantityShipped || 1),
      };
      return next;
    });
  };

  const handleDeleteItem = (index: number) => {
    setEditedItems((prev) => prev.filter((_, i) => i !== index));
    SoundPlayer.playDecrementSound();
  };

  // Convert to TruckOrder object
  const buildTruckOrder = (status: TruckOrder['status'] = 'ordered'): TruckOrder => {
    const formattedItems: TruckOrderItem[] = editedItems.map((item) => {
      const matched = inventory.find((i) => i.id === item.matchedItemId);
      return {
        itemId: item.matchedItemId || 'temp-' + item.sku,
        itemName: item.itemName,
        sku: item.sku,
        packSize: item.packSize,
        unitCost: item.unitCost,
        totalCost: item.totalCost,
        parLevel: matched?.parLevel || 10,
        currentQuantity: matched?.currentQuantity || 0,
        orderedQuantity: item.quantityOrdered || item.quantityShipped,
        receivedQuantity: item.quantityShipped,
        suggestedQuantity: item.quantityOrdered || item.quantityShipped,
      };
    });

    const totalCost = formattedItems.reduce((sum, item) => sum + (item.totalCost || 0), 0);

    return {
      id: 'scanned-order-' + Date.now(),
      storeId: activeStore.id,
      orderNumber,
      vendor,
      deliveryDate,
      status,
      items: formattedItems,
      totalCost,
      createdAt: new Date().toISOString(),
      createdBy: {
        userId: currentUser.id,
        userName: currentUser.name,
        role: currentUser.role,
      },
      notes: `Extracted from ${pages.length} scanned physical invoice page(s).`,
    };
  };

  const handleApplyToReceiving = () => {
    const order = buildTruckOrder('ordered');
    onApplyToReceiving?.(order);
    SoundPlayer.playSuccessFanfare();
    onClose();
  };

  const handleApplyToOrderBuilder = () => {
    const order = buildTruckOrder('suggested');
    onApplyToOrderBuilder?.(order);
    SoundPlayer.playSuccessFanfare();
    onClose();
  };

  const handleDirectReceiveStock = () => {
    const order = buildTruckOrder('received');
    onDirectReceiveStock?.(order);
    SoundPlayer.playSuccessFanfare();
    onClose();
  };

  const totalCalculatedCost = editedItems.reduce((sum, item) => sum + (item.totalCost || 0), 0);
  const totalCalculatedCases = editedItems.reduce((sum, item) => sum + (item.quantityShipped || 0), 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-xl overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className="relative w-full max-w-4xl bg-[#0B0E14] border border-white/15 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
      >
        {/* Top Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-white/[0.03]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-300">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-white font-heading">
                  Multi-Page Truck Order Scanner
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-400/30">
                  AI OCR
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Snap or upload invoice pages to extract PO, vendor, and line items
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
          {errorMsg && (
            <div className="p-3.5 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-rose-300 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* STEP 1: CAPTURE & MULTI-PAGE QUEUE */}
          {step === 'capture' && (
            <div className="space-y-6">
              {/* Viewfinder or Upload Area */}
              {isCameraActive ? (
                <div className="relative rounded-3xl overflow-hidden bg-black aspect-[4/3] sm:aspect-[16/9] max-h-[380px] border border-white/15 flex items-center justify-center group shadow-inner">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover"
                  />

                  {/* Document Alignment Frame */}
                  <div className="absolute inset-6 border-2 border-dashed border-indigo-400/60 rounded-2xl pointer-events-none flex flex-col justify-between p-4">
                    <div className="flex justify-between items-center text-[11px] font-bold text-indigo-300 bg-black/60 px-3 py-1 rounded-full backdrop-blur-md self-center">
                      <Sparkles className="w-3.5 h-3.5 mr-1.5 text-amber-300" />
                      Align Truck Invoice Page Inside Frame
                    </div>
                    <div className="text-center text-[10px] text-slate-300 bg-black/50 py-1 px-3 rounded-full self-center backdrop-blur-sm">
                      Supports US Foods, Sysco, McLane, CKE delivery sheets
                    </div>
                  </div>

                  {/* Camera Control Overlays */}
                  <div className="absolute bottom-4 inset-x-0 flex items-center justify-center gap-4 z-20">
                    <button
                      onClick={() =>
                        setFacingMode((prev) => (prev === 'environment' ? 'user' : 'environment'))
                      }
                      className="p-3 bg-black/60 hover:bg-black/80 text-white rounded-2xl border border-white/20 backdrop-blur-md transition-transform active:scale-95"
                      title="Switch Camera"
                    >
                      <RefreshCw className="w-4 h-4" />
                    </button>

                    <button
                      onClick={handleSnapPage}
                      className="px-6 py-3.5 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white rounded-2xl font-bold text-sm shadow-xl shadow-indigo-500/30 flex items-center gap-2 transition-transform active:scale-90"
                    >
                      <Camera className="w-5 h-5" />
                      <span>Snap Page {pages.length + 1}</span>
                    </button>

                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="p-3 bg-black/60 hover:bg-black/80 text-white rounded-2xl border border-white/20 backdrop-blur-md transition-transform active:scale-95"
                      title="Upload file / photo"
                    >
                      <Upload className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ) : (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="p-8 sm:p-12 border-2 border-dashed border-white/15 hover:border-indigo-400/50 rounded-3xl text-center bg-white/[0.02] hover:bg-white/[0.04] transition-all cursor-pointer space-y-4"
                >
                  <div className="w-16 h-16 rounded-3xl bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 mx-auto flex items-center justify-center">
                    <Upload className="w-8 h-8" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white">Upload Truck Invoice Pages</h3>
                    <p className="text-xs text-slate-400 mt-1">
                      Drag and drop photos or click to select multiple page images (PNG, JPG)
                    </p>
                  </div>
                  <button className="px-5 py-2.5 bg-white/10 hover:bg-white/15 border border-white/10 text-white text-xs font-semibold rounded-2xl">
                    Browse Document Photos
                  </button>
                </div>
              )}

              {/* Hidden File Input */}
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />

              {/* Mode Toggle Bar */}
              <div className="flex items-center justify-between text-xs text-slate-400 px-1">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setIsCameraActive(true)}
                    className={`px-3 py-1.5 rounded-xl font-medium transition-colors ${
                      isCameraActive
                        ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-400/30'
                        : 'hover:text-white'
                    }`}
                  >
                    Live Camera Mode
                  </button>
                  <button
                    onClick={() => setIsCameraActive(false)}
                    className={`px-3 py-1.5 rounded-xl font-medium transition-colors ${
                      !isCameraActive
                        ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-400/30'
                        : 'hover:text-white'
                    }`}
                  >
                    File Upload Mode
                  </button>
                </div>

                <span className="text-[11px] text-slate-500">
                  {pages.length} page(s) ready to process
                </span>
              </div>

              {/* Scanned Pages Thumbnail Strip */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Layers className="w-4 h-4 text-indigo-400" />
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                      Scanned Pages Queue ({pages.length})
                    </h3>
                  </div>

                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="text-xs text-indigo-400 hover:text-indigo-300 font-medium flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add More Pages</span>
                  </button>
                </div>

                {pages.length === 0 ? (
                  <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/5 text-center text-xs text-slate-500">
                    No pages captured yet. Tap <strong>"Snap Page 1"</strong> or upload photos of your delivery paperwork.
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {pages.map((page, index) => (
                      <div
                        key={page.id}
                        className="relative rounded-2xl overflow-hidden border border-white/15 bg-slate-900 group aspect-[3/4] shadow-md"
                      >
                        <img
                          src={page.dataUrl}
                          alt={`Page ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent p-2.5 flex flex-col justify-between">
                          <span className="self-start px-2 py-0.5 rounded-lg bg-black/60 backdrop-blur-md text-[10px] font-bold text-white border border-white/20">
                            Page {index + 1}
                          </span>

                          <div className="flex items-center justify-between">
                            <button
                              onClick={() => setSelectedPreviewPage(page.dataUrl)}
                              className="p-1.5 bg-white/20 hover:bg-white/30 text-white rounded-lg backdrop-blur-sm transition-colors"
                              title="Preview"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>

                            <button
                              onClick={() => handleRemovePage(page.id)}
                              className="p-1.5 bg-rose-500/80 hover:bg-rose-500 text-white rounded-lg backdrop-blur-sm transition-colors"
                              title="Delete Page"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}

                    {/* "+ Add Page" Placeholder Card */}
                    <button
                      onClick={() => {
                        if (isCameraActive) {
                          handleSnapPage();
                        } else {
                          fileInputRef.current?.click();
                        }
                      }}
                      className="rounded-2xl border-2 border-dashed border-white/15 hover:border-indigo-400/40 bg-white/[0.01] hover:bg-white/[0.03] flex flex-col items-center justify-center p-4 text-slate-400 hover:text-indigo-300 transition-all aspect-[3/4] group"
                    >
                      <div className="w-10 h-10 rounded-xl bg-white/5 group-hover:bg-indigo-500/20 flex items-center justify-center mb-2 transition-colors">
                        <Plus className="w-5 h-5" />
                      </div>
                      <span className="text-xs font-bold">Add Page {pages.length + 1}</span>
                      <span className="text-[10px] text-slate-500 mt-0.5">Snap or upload</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Bottom Action Submit Button */}
              <div className="pt-2">
                <button
                  disabled={pages.length === 0 || isAnalyzing}
                  onClick={handleAnalyzePages}
                  className={`w-full py-4 rounded-2xl font-bold text-sm shadow-xl flex items-center justify-center gap-2 transition-all ${
                    pages.length > 0
                      ? 'bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white shadow-indigo-500/25 active:scale-98 cursor-pointer'
                      : 'bg-white/5 text-slate-500 cursor-not-allowed border border-white/5'
                  }`}
                >
                  <Sparkles className="w-4 h-4 text-amber-300" />
                  <span>
                    Analyze & Pull Order Info ({pages.length} {pages.length === 1 ? 'Page' : 'Pages'})
                  </span>
                  <ArrowRight className="w-4 h-4 ml-1" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: ANALYZING ANIMATION */}
          {step === 'analyzing' && (
            <div className="py-12 px-4 text-center space-y-6">
              <div className="mx-auto flex justify-center">
                <LunaFox mood="scanning" size="xl" />
              </div>

              <div className="space-y-2">
                <h3 className="text-xl font-bold text-white font-heading">
                  Extracting Truck Order from {pages.length} Page(s)...
                </h3>
                <p className="text-xs text-slate-400 max-w-md mx-auto">
                  Luna AI is reading line item SKUs, case quantities, unit pricing, and matching items against your Harrogate store inventory catalog.
                </p>
              </div>

              <div className="w-48 h-1.5 bg-slate-800 rounded-full overflow-hidden mx-auto">
                <motion.div
                  className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-amber-400"
                  animate={{ x: [-100, 200] }}
                  transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
                />
              </div>
            </div>
          )}

          {/* STEP 3: REVIEW EXTRACTED ORDER */}
          {step === 'review' && (
            <div className="space-y-6">
              {/* Order Metadata Card */}
              <div className="bg-white/5 border border-white/10 rounded-3xl p-5 sm:p-6 backdrop-blur-sm space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/10">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                    <div>
                      <h3 className="text-sm font-bold text-white">
                        Extraction Complete ({editedItems.length} Line Items Extracted)
                      </h3>
                      <p className="text-xs text-slate-400">
                        Processed from {pages.length} page(s) • Review and customize before applying
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => setStep('capture')}
                    className="text-xs text-indigo-400 hover:text-white flex items-center gap-1 self-start sm:self-auto"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Re-scan Pages</span>
                  </button>
                </div>

                {/* Header Inputs */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="text-[11px] font-semibold uppercase text-slate-400 mb-1 flex items-center gap-1">
                      <Hash className="w-3 h-3 text-indigo-400" /> PO / Invoice #
                    </label>
                    <input
                      type="text"
                      value={orderNumber}
                      onChange={(e) => setOrderNumber(e.target.value)}
                      className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs font-mono font-bold text-amber-300 focus:outline-none focus:border-indigo-400"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold uppercase text-slate-400 mb-1 flex items-center gap-1">
                      <Building2 className="w-3 h-3 text-indigo-400" /> Vendor / Distributor
                    </label>
                    <input
                      type="text"
                      value={vendor}
                      onChange={(e) => setVendor(e.target.value)}
                      className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs font-semibold text-white focus:outline-none focus:border-indigo-400"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold uppercase text-slate-400 mb-1 flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-indigo-400" /> Delivery Date
                    </label>
                    <input
                      type="date"
                      value={deliveryDate}
                      onChange={(e) => setDeliveryDate(e.target.value)}
                      className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs font-semibold text-white focus:outline-none focus:border-indigo-400"
                    />
                  </div>
                </div>
              </div>

              {/* Extracted Line Items Table */}
              <div className="space-y-3">
                <div className="flex items-center justify-between px-1">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Extracted Line Items ({editedItems.length})
                  </h4>
                  <div className="text-xs text-slate-400">
                    Total Cases: <strong className="text-emerald-400">{totalCalculatedCases}</strong> • Total Cost: <strong className="text-amber-300">${totalCalculatedCost.toFixed(2)}</strong>
                  </div>
                </div>

                <div className="space-y-2.5 max-h-[320px] overflow-y-auto pr-1">
                  {editedItems.map((item, index) => {
                    const matchedCatalogItem = inventory.find((i) => i.id === item.matchedItemId);
                    return (
                      <div
                        key={index}
                        className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/5 hover:border-white/10 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="px-1.5 py-0.5 rounded bg-white/10 text-[10px] font-mono text-slate-300">
                              {item.sku || `ITEM #${index + 1}`}
                            </span>
                            <span className="text-xs font-bold text-white truncate">
                              {item.itemName}
                            </span>
                            {item.pageNumber && (
                              <span className="text-[10px] text-slate-500">
                                (Page {item.pageNumber})
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-3 text-[11px] text-slate-400 mt-1">
                            <span>Pack: {item.packSize || '1 CS'}</span>
                            <span>•</span>
                            <span>${(item.unitCost || 0).toFixed(2)} / case</span>
                            <span>•</span>
                            <span className="text-indigo-300">
                              {matchedCatalogItem ? `Matched: ${matchedCatalogItem.name}` : 'Unmatched SKU'}
                            </span>
                          </div>
                        </div>

                        {/* Match Dropdown & Quantity Editor */}
                        <div className="flex items-center gap-3 self-end sm:self-center">
                          {/* Item Selector */}
                          <select
                            value={item.matchedItemId || ''}
                            onChange={(e) => handleUpdateItemMatch(index, e.target.value)}
                            className="bg-black/60 border border-white/10 rounded-xl px-2 py-1 text-xs text-slate-300 max-w-[140px] truncate focus:outline-none"
                          >
                            <option value="">-- Match Catalog --</option>
                            {inventory.map((inv) => (
                              <option key={inv.id} value={inv.id}>
                                {inv.name}
                              </option>
                            ))}
                          </select>

                          {/* Quantity Controls */}
                          <div className="flex items-center bg-black/60 border border-white/10 rounded-xl p-0.5">
                            <button
                              onClick={() => handleUpdateItemQuantity(index, -1)}
                              className="p-1 hover:bg-white/10 rounded text-slate-300"
                            >
                              -
                            </button>
                            <span className="px-2 text-xs font-bold text-white min-w-[28px] text-center">
                              {item.quantityShipped}
                            </span>
                            <button
                              onClick={() => handleUpdateItemQuantity(index, 1)}
                              className="p-1 hover:bg-white/10 rounded text-slate-300"
                            >
                              +
                            </button>
                          </div>

                          <button
                            onClick={() => handleDeleteItem(index)}
                            className="p-1.5 text-slate-500 hover:text-rose-400 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Action Buttons for Scanned Data */}
              <div className="pt-3 border-t border-white/10 space-y-2.5">
                <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                  Choose How to Apply This Truck Order:
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {/* Action 1: Receiving Checklist */}
                  <button
                    onClick={handleApplyToReceiving}
                    className="p-4 rounded-2xl bg-gradient-to-br from-emerald-600/30 to-teal-600/30 hover:from-emerald-600/50 hover:to-teal-600/50 border border-emerald-500/30 text-left transition-all group cursor-pointer"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold text-emerald-300">
                        Check In Delivery
                      </span>
                      <Package className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition-transform" />
                    </div>
                    <p className="text-[11px] text-slate-300">
                      Populate Truck Day receiving checklist to verify case-by-case
                    </p>
                  </button>

                  {/* Action 2: Purchase Order Builder */}
                  <button
                    onClick={handleApplyToOrderBuilder}
                    className="p-4 rounded-2xl bg-gradient-to-br from-indigo-600/30 to-purple-600/30 hover:from-indigo-600/50 hover:to-purple-600/50 border border-indigo-500/30 text-left transition-all group cursor-pointer"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold text-indigo-300">
                        Save as Purchase Order
                      </span>
                      <FileText className="w-4 h-4 text-indigo-400 group-hover:scale-110 transition-transform" />
                    </div>
                    <p className="text-[11px] text-slate-300">
                      Save to order manager for future truck schedule tracking
                    </p>
                  </button>

                  {/* Action 3: Direct Receive & Update Stock */}
                  <button
                    onClick={handleDirectReceiveStock}
                    className="p-4 rounded-2xl bg-gradient-to-br from-amber-500/30 to-orange-500/30 hover:from-amber-500/50 hover:to-orange-500/50 border border-amber-400/30 text-left transition-all group cursor-pointer"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold text-amber-300">
                        Direct Stock Update
                      </span>
                      <Zap className="w-4 h-4 text-amber-400 group-hover:scale-110 transition-transform" />
                    </div>
                    <p className="text-[11px] text-slate-300">
                      Instantly add cases to inventory counts & finalize order
                    </p>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Full Image Preview Modal */}
        <AnimatePresence>
          {selectedPreviewPage && (
            <div
              onClick={() => setSelectedPreviewPage(null)}
              className="fixed inset-0 z-60 bg-black/90 flex items-center justify-center p-4 cursor-pointer"
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="max-w-2xl max-h-[85vh] rounded-2xl overflow-hidden border border-white/20 bg-slate-900"
              >
                <img
                  src={selectedPreviewPage}
                  alt="Full Page Preview"
                  className="w-full h-full object-contain"
                />
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};
