import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X } from 'lucide-react';
import { AppSettings, Store, SyncState, User } from '../../types';
import { SettingsView } from './SettingsView';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User | null;
  activeStore: Store;
  allStores?: Store[];
  settings: AppSettings;
  syncState: SyncState;
  onSelectStore?: (storeId: string) => void;
  onSaveStore?: (store: Store) => void;
  onDeleteStore?: (storeId: string) => void;
  onUpdateSettings: (newSettings: Partial<AppSettings>) => void;
  onLogout: () => void;
  onOpenGuide?: () => void;
  onToggleOfflineSim?: () => void;
  isDevUnlocked?: boolean;
  onOpenDevTweaks?: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  activeStore,
  allStores = [],
  settings,
  syncState,
  onSelectStore,
  onSaveStore,
  onDeleteStore,
  onUpdateSettings,
  onLogout,
  onOpenGuide,
  onToggleOfflineSim,
  isDevUnlocked,
  onOpenDevTweaks,
}) => {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/75 backdrop-blur-md select-none overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 15 }}
          className="relative w-full max-w-5xl bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl text-white overflow-hidden max-h-[92vh] flex flex-col"
        >
          {/* Modal Header */}
          <div className="px-6 py-3.5 bg-slate-950/90 border-b border-slate-800 flex items-center justify-between sticky top-0 z-20">
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-white">Store Settings & Offline Mesh Hub</span>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white rounded-xl bg-white/5 hover:bg-white/10 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Modal Body */}
          <div className="p-4 sm:p-6 overflow-y-auto flex-1">
            <SettingsView
              currentUser={currentUser}
              activeStore={activeStore}
              allStores={allStores}
              settings={settings}
              syncState={syncState}
              onSelectStore={onSelectStore}
              onSaveStore={onSaveStore}
              onDeleteStore={onDeleteStore}
              onUpdateSettings={onUpdateSettings}
              onLogout={() => {
                onLogout();
                onClose();
              }}
              onOpenGuide={onOpenGuide}
              onToggleOfflineSim={onToggleOfflineSim}
              isDevUnlocked={isDevUnlocked}
              onOpenDevTweaks={onOpenDevTweaks}
            />
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

