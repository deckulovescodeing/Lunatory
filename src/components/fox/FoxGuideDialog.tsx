import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, X, ChevronRight, Volume2, HelpCircle, Lightbulb, BookOpen, ShieldCheck } from 'lucide-react';
import { LunaFox, FoxMood } from './LunaFox';
import { SoundPlayer } from '../../utils/audio';

interface FoxGuideDialogProps {
  currentView: string;
  isOpen: boolean;
  onClose: () => void;
  userRole: string;
  storeName: string;
}

export const FoxGuideDialog: React.FC<FoxGuideDialogProps> = ({
  currentView,
  isOpen,
  onClose,
  userRole,
  storeName,
}) => {
  const [selectedTopic, setSelectedTopic] = useState<'screen' | 'tips' | 'about' | 'practice'>('screen');
  const [mood, setMood] = useState<FoxMood>('greeting');

  const getScreenGuide = () => {
    switch (currentView) {
      case 'dashboard':
        return {
          title: 'Inventory Command Center',
          mood: 'happy' as FoxMood,
          description: `Welcome to ${storeName}! Here is a quick snapshot of stock health, pending truck shipments, low-inventory alerts, and fast action shortcuts.`,
          steps: [
            'Check the "Low Stock" badge for items below par level.',
            'Tap "Quick Count" to record physical shelf counts in seconds.',
            'Review the suggested truck order before the 2:00 PM cutoff.',
          ],
        };
      case 'inventory':
        return {
          title: 'Item Catalog & Stock Details',
          mood: 'tech' as FoxMood,
          description: 'Search, filter by storage location (Freezer, Cooler, Dry Storage), update par levels, check pack sizes, or generate printable barcode labels.',
          steps: [
            'Tap any item card to adjust quantities or view SKU barcodes.',
            'Use category filters to hone in on Meats, Dairy, or Bakery.',
            'Managers can edit unit costs and par levels directly.',
          ],
        };
      case 'count':
        return {
          title: 'Rapid Count Mode',
          mood: 'counting' as FoxMood,
          description: 'Optimized for high-speed restaurant shifts! Big touch targets let you count shelf by shelf without paper clipboard hassles.',
          steps: [
            'Use +1, +5, +10 or Full Case buttons for instant counting.',
            'Skip items if inaccessible and come back before submitting.',
            'Inspect the variance review before finalizing your count.',
          ],
        };
      case 'scan':
        return {
          title: 'Barcode & QR Scanner',
          mood: 'scanning' as FoxMood,
          description: 'Scan item barcodes using your camera or enter SKUs manually. Look up items, log fast counts, or record waste instantly.',
          steps: [
            'Aim camera at the package barcode or select from test barcodes.',
            'Switch mode between "Lookup", "Count (+1)", or "Log Waste".',
            'Laser sound confirms valid match in Hardee’s inventory.',
          ],
        };
      case 'orders':
        return {
          title: 'Smart Truck Order Generator & Invoice OCR',
          mood: 'teaching' as FoxMood,
          description: 'Lunatory calculates replenishments based on par levels and usage rates, or lets you photograph multi-page vendor orders to auto-populate the manifest.',
          steps: [
            'Tap "Scan Multi-Page Invoice" to photograph 1 or more paper sheets before submitting.',
            'Review highlighted suggestions (red = high stockout risk).',
            'Approve and transmit order or save as pending delivery.',
          ],
        };
      case 'truck_day':
        return {
          title: 'Truck Day Receiving & Invoice Scanner',
          mood: 'celebrating' as FoxMood,
          description: 'When the delivery truck arrives, verify boxes against your PO or snap photos of all delivery invoice pages to digitize the manifest immediately.',
          steps: [
            'Scan multiple delivery invoice pages sequentially with your camera.',
            'Check off delivered items and log damaged cases for vendor credit memos.',
            'Tap "Finalize & Update Stock" to adjust store inventory automatically!',
          ],
        };
      case 'waste':
        return {
          title: 'Shift Waste Tracker',
          mood: 'worried' as FoxMood,
          description: 'Keep track of food loss from expired hold times, grill drops, or burnt prep. Tracking waste directly improves order accuracy.',
          steps: [
            'Select the item and specify the wasted quantity.',
            'Choose the exact reason (e.g. Hold time expired, prep loss).',
            'Dollar costs are calculated automatically for manager audits.',
          ],
        };
      case 'reports':
        return {
          title: 'Analytics & Insights',
          mood: 'happy' as FoxMood,
          description: 'Visual breakdown of inventory valuation, waste trends, par level compliance, and historical shift logs.',
          steps: [
            'Export inventory snapshots to CSV spreadsheets.',
            'Analyze top waste items to cut food costs.',
            'Review count variance trends over time.',
          ],
        };
      case 'admin':
        return {
          title: 'Developer & Admin Tools',
          mood: 'tech' as FoxMood,
          description: 'Full store management, user permissions, offline sync simulator, audit logs, and JSON database backup/restore.',
          steps: [
            'Manage user PINs, roles (Crew, Manager, Admin).',
            'Test offline queue resilience and sync conflict handling.',
            'Download full database backups or reset to factory defaults.',
          ],
        };
      default:
        return {
          title: 'Lunatory Assistant',
          mood: 'greeting' as FoxMood,
          description: 'I’m Luna, your cozy star-fox inventory assistant! I’m here to help make shift counts effortless and accurate.',
          steps: [
            'Tap any action to get started.',
            'Toggle sounds and time-of-day sky themes in Settings.',
          ],
        };
    }
  };

  const guide = getScreenGuide();

  const handleMoodTest = (newMood: FoxMood) => {
    setMood(newMood);
    if (newMood === 'happy' || newMood === 'celebrating') {
      SoundPlayer.playSuccessFanfare();
    } else if (newMood === 'scanning') {
      SoundPlayer.playScanSuccess();
    } else if (newMood === 'counting') {
      SoundPlayer.playCountBeep();
    } else if (newMood === 'worried') {
      SoundPlayer.playAlertChime();
    } else {
      SoundPlayer.playFoxChirp();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative w-full max-w-xl bg-slate-900/95 border border-indigo-500/30 rounded-2xl shadow-2xl text-white overflow-hidden"
          >
            {/* Celestial Top Banner */}
            <div className="relative px-6 pt-6 pb-4 bg-gradient-to-r from-indigo-950 via-purple-950 to-slate-950 border-b border-indigo-800/40">
              <button
                onClick={onClose}
                className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-full bg-white/5 hover:bg-white/10 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-4">
                <LunaFox mood={mood} size="lg" className="shrink-0" />
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wider text-amber-300 bg-amber-500/20 border border-amber-400/30 rounded-full">
                      Guide & Assistant
                    </span>
                    <span className="text-xs text-indigo-300 flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-amber-300" /> Luna the Star Fox
                    </span>
                  </div>
                  <h2 className="text-xl font-bold text-white mt-1 font-heading">
                    {guide.title}
                  </h2>
                  <p className="text-xs text-indigo-200/80 mt-0.5">
                    Signed in as <strong className="text-white capitalize">{userRole}</strong> at {storeName}
                  </p>
                </div>
              </div>

              {/* Navigation Tabs inside Modal */}
              <div className="flex items-center gap-2 mt-4 pt-3 border-t border-indigo-900/40">
                <button
                  onClick={() => setSelectedTopic('screen')}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors flex items-center gap-1.5 ${
                    selectedTopic === 'screen'
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-indigo-200 hover:bg-indigo-900/40'
                  }`}
                >
                  <BookOpen className="w-3.5 h-3.5" /> Screen Guide
                </button>
                <button
                  onClick={() => setSelectedTopic('tips')}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors flex items-center gap-1.5 ${
                    selectedTopic === 'tips'
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-indigo-200 hover:bg-indigo-900/40'
                  }`}
                >
                  <Lightbulb className="w-3.5 h-3.5 text-amber-300" /> Pro Tips
                </button>
                <button
                  onClick={() => setSelectedTopic('practice')}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors flex items-center gap-1.5 ${
                    selectedTopic === 'practice'
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-indigo-200 hover:bg-indigo-900/40'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5 text-pink-300" /> Fox Emotions & Sounds
                </button>
              </div>
            </div>

            {/* Content Body */}
            <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
              {selectedTopic === 'screen' && (
                <div className="space-y-4">
                  <div className="p-3.5 bg-indigo-950/50 border border-indigo-800/40 rounded-xl">
                    <p className="text-sm text-indigo-100 leading-relaxed">
                      {guide.description}
                    </p>
                  </div>

                  <div>
                    <h4 className="text-xs font-semibold text-indigo-300 uppercase tracking-wider mb-2">
                      Key Steps for this screen:
                    </h4>
                    <div className="space-y-2">
                      {guide.steps.map((step, idx) => (
                        <div
                          key={idx}
                          className="flex items-start gap-3 p-2.5 rounded-lg bg-slate-800/60 border border-slate-700/50 text-sm text-slate-200"
                        >
                          <span className="flex items-center justify-center w-5 h-5 text-xs font-bold text-amber-300 bg-amber-500/20 rounded-full shrink-0 mt-0.5">
                            {idx + 1}
                          </span>
                          <span>{step}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {selectedTopic === 'tips' && (
                <div className="space-y-3">
                  <div className="p-3 bg-slate-800/60 border border-slate-700/60 rounded-xl space-y-2">
                    <div className="flex items-center gap-2 text-amber-300 font-semibold text-sm">
                      <ShieldCheck className="w-4 h-4" /> Hardee’s Harrogate Best Practices
                    </div>
                    <ul className="text-xs text-slate-300 space-y-1.5 list-disc list-inside">
                      <li><strong>FIFO Rotation:</strong> New biscuit flour and patties go behind existing stock on dunnage racks.</li>
                      <li><strong>Truck Day:</strong> Delivery arrives Tuesday & Friday mornings at 6:00 AM.</li>
                      <li><strong>Offline Mode:</strong> If kitchen Wi-Fi drops, Lunatory keeps saving your counts locally.</li>
                      <li><strong>Waste Logging:</strong> Always log expired biscuits and dropped patties so the truck algorithm stays accurate.</li>
                    </ul>
                  </div>

                  <div className="p-3 bg-indigo-950/40 border border-indigo-800/40 rounded-xl text-xs text-indigo-200">
                    💡 <strong>Tip:</strong> Double-tap any item card in the inventory list to quickly add +1 case without opening full details!
                  </div>
                </div>
              )}

              {selectedTopic === 'practice' && (
                <div className="space-y-3">
                  <p className="text-xs text-slate-300">
                    Interact with Luna! Tap an emotion below to see her animations and trigger custom synthesized theme sounds:
                  </p>
                  <div className="grid grid-cols-3 gap-2">
                    {(['greeting', 'happy', 'counting', 'scanning', 'celebrating', 'worried', 'sleepy', 'tech'] as FoxMood[]).map(
                      (m) => (
                        <button
                          key={m}
                          onClick={() => handleMoodTest(m)}
                          className={`px-3 py-2 text-xs font-medium capitalize rounded-lg border transition-all flex items-center justify-center gap-1.5 ${
                            mood === m
                              ? 'bg-amber-500 text-slate-950 border-amber-300 font-bold shadow-md'
                              : 'bg-slate-800/70 border-slate-700 text-slate-300 hover:bg-slate-700'
                          }`}
                        >
                          <Volume2 className="w-3.5 h-3.5 opacity-70" />
                          {m}
                        </button>
                      )
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-3 bg-slate-950/80 border-t border-indigo-900/30 flex items-center justify-between">
              <span className="text-xs text-slate-400">
                You can reopen Luna anytime by tapping the fox in the header!
              </span>
              <button
                onClick={onClose}
                className="px-4 py-1.5 text-xs font-semibold text-slate-900 bg-amber-400 hover:bg-amber-300 rounded-lg transition-colors"
              >
                Got it, thanks!
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
