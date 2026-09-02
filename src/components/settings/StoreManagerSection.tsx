import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Store as StoreIcon,
  Plus,
  Edit2,
  Trash2,
  Check,
  Calendar,
  Clock,
  MapPin,
  Phone,
  Truck,
  AlertTriangle,
  Sparkles,
  Building2,
  X,
  ArrowRight,
} from 'lucide-react';
import { Store, User } from '../../types';
import { SoundPlayer } from '../../utils/audio';

const DAYS_OF_WEEK = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
];

interface StoreManagerSectionProps {
  allStores: Store[];
  activeStore: Store;
  currentUser: User | null;
  onSelectStore: (storeId: string) => void;
  onSaveStore: (store: Store) => void;
  onDeleteStore: (storeId: string) => void;
}

export const StoreManagerSection: React.FC<StoreManagerSectionProps> = ({
  allStores,
  activeStore,
  currentUser,
  onSelectStore,
  onSaveStore,
  onDeleteStore,
}) => {
  const [editingStore, setEditingStore] = useState<Store | null>(null);
  const [isCreatingNew, setIsCreatingNew] = useState<boolean>(false);
  const [storeToDelete, setStoreToDelete] = useState<Store | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  // Form State for editing or creating
  const [formData, setFormData] = useState<Partial<Store>>({
    name: '',
    storeNumber: '',
    brand: "Hardee's / CKE Restaurants",
    address: '',
    city: '',
    state: 'TN',
    zip: '',
    phone: '',
    truckDays: ['Tuesday', 'Friday'],
    cutoffTimeStr: '14:00',
    cutoffDay: 'Sunday',
    leadTimeDays: 2,
    defaultParMultiplier: 1.15,
    notes: '',
  });

  const handleOpenEdit = (store: Store) => {
    setEditingStore(store);
    setIsCreatingNew(false);
    setFormData({
      ...store,
      truckDays: store.truckDays || ['Tuesday', 'Friday'],
      cutoffTimeStr: store.cutoffTimeStr || '14:00',
      cutoffDay: store.cutoffDay || 'Sunday',
    });
    SoundPlayer.playCountBeep();
  };

  const handleOpenCreate = () => {
    setIsCreatingNew(true);
    setEditingStore(null);
    setFormData({
      id: 'store-' + Date.now(),
      name: "Hardee's - New Branch",
      storeNumber: String(Math.floor(1000 + Math.random() * 9000)),
      brand: "Hardee's / CKE Restaurants",
      address: '',
      city: '',
      state: 'TN',
      zip: '',
      phone: '',
      truckDays: ['Monday', 'Thursday'],
      cutoffTimeStr: '14:00',
      cutoffDay: 'Saturday',
      leadTimeDays: 2,
      defaultParMultiplier: 1.15,
      notes: '',
    });
    SoundPlayer.playCountBeep();
  };

  const handleToggleTruckDay = (day: string) => {
    const current = formData.truckDays || [];
    let next: string[];
    if (current.includes(day)) {
      if (current.length === 1) {
        // Keep at least one truck day
        return;
      }
      next = current.filter((d) => d !== day);
    } else {
      next = [...current, day];
    }
    setFormData({ ...formData, truckDays: next });
    SoundPlayer.playCountBeep();
  };

  const handleSaveForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name?.trim() || !formData.storeNumber?.trim()) {
      return;
    }

    const storeToSave: Store = {
      id: formData.id || (editingStore ? editingStore.id : 'store-' + Date.now()),
      name: formData.name.trim(),
      storeNumber: formData.storeNumber.trim(),
      brand: formData.brand || "Hardee's / CKE Restaurants",
      address: formData.address?.trim() || '6301 Cumberland Gap Pkwy',
      city: formData.city?.trim() || 'Harrogate',
      state: formData.state?.trim() || 'TN',
      zip: formData.zip?.trim() || '37752',
      phone: formData.phone?.trim() || '',
      truckDays: formData.truckDays && formData.truckDays.length > 0 ? formData.truckDays : ['Tuesday', 'Friday'],
      cutoffTimeStr: formData.cutoffTimeStr || '14:00',
      cutoffDay: formData.cutoffDay || 'Sunday',
      leadTimeDays: Number(formData.leadTimeDays) || 2,
      defaultParMultiplier: Number(formData.defaultParMultiplier) || 1.15,
      notes: formData.notes || '',
    };

    onSaveStore(storeToSave);
    SoundPlayer.playSuccessFanfare();
    setActionNotice(`Store location "${storeToSave.name}" (#${storeToSave.storeNumber}) saved successfully!`);
    setEditingStore(null);
    setIsCreatingNew(false);

    setTimeout(() => setActionNotice(null), 4000);
  };

  const handleConfirmDelete = () => {
    if (!storeToDelete) return;
    if (allStores.length <= 1) {
      setDeleteError('You cannot delete the only configured store location.');
      SoundPlayer.playAlertChime();
      return;
    }

    const storeName = storeToDelete.name;
    onDeleteStore(storeToDelete.id);
    setStoreToDelete(null);
    setDeleteError(null);
    SoundPlayer.playDecrementSound();
    setActionNotice(`Store location "${storeName}" was deleted.`);
    setTimeout(() => setActionNotice(null), 4000);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner Card */}
      <div className="bg-slate-900/80 border border-slate-700/80 rounded-3xl p-6 shadow-xl relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
              <StoreIcon className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-white font-heading">
                  Stores & Delivery Schedule Manager
                </h3>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  {allStores.length} Location{allStores.length > 1 ? 's' : ''}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Edit store numbers, addresses, vendor truck arrival days, and order submission cutoff deadlines.
              </p>
            </div>
          </div>

          <button
            onClick={handleOpenCreate}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-400 to-orange-400 hover:from-amber-300 hover:to-orange-300 text-slate-950 font-extrabold text-xs flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 transition-all active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Add Store Location</span>
          </button>
        </div>

        {/* Action Notification */}
        {actionNotice && (
          <motion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 p-3 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-semibold flex items-center gap-2"
          >
            <Check className="w-4 h-4 text-emerald-400" />
            <span>{actionNotice}</span>
          </motion.div>
        )}
      </div>

      {/* Stores Grid / Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {allStores.map((store) => {
          const isActive = store.id === activeStore.id;
          return (
            <motion.div
              key={store.id}
              layout
              className={`p-5 rounded-3xl border transition-all flex flex-col justify-between gap-4 relative overflow-hidden ${
                isActive
                  ? 'bg-slate-900/95 border-amber-400/60 shadow-xl shadow-amber-500/5'
                  : 'bg-slate-900/70 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-white text-base font-heading truncate">
                        {store.name}
                      </h4>
                      <span className="px-2 py-0.5 rounded-lg text-[10px] font-mono font-bold bg-slate-800 text-amber-300 border border-slate-700">
                        #{store.storeNumber}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-400 flex items-center gap-1 mt-1">
                      <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                      <span>{store.address}, {store.city}, {store.state} {store.zip || ''}</span>
                    </div>
                    {store.phone && (
                      <div className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                        <Phone className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                        <span>{store.phone}</span>
                      </div>
                    )}
                  </div>

                  {isActive ? (
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1 shrink-0">
                      <Check className="w-3 h-3" /> Active Terminal
                    </span>
                  ) : (
                    <button
                      onClick={() => {
                        onSelectStore(store.id);
                        SoundPlayer.playCountBeep();
                      }}
                      className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/10 transition-colors shrink-0"
                    >
                      Switch Here
                    </button>
                  )}
                </div>

                {/* Delivery & Cutoff Summary Badge */}
                <div className="mt-4 p-3 rounded-2xl bg-slate-950/70 border border-white/5 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400 flex items-center gap-1.5 font-medium">
                      <Truck className="w-3.5 h-3.5 text-amber-400" />
                      Truck Delivery Days:
                    </span>
                    <div className="flex items-center gap-1">
                      {store.truckDays && store.truckDays.length > 0 ? (
                        store.truckDays.map((day) => (
                          <span
                            key={day}
                            className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30"
                          >
                            {day.slice(0, 3)}
                          </span>
                        ))
                      ) : (
                        <span className="text-[10px] text-slate-500">Not set</span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs pt-1.5 border-t border-white/5">
                    <span className="text-slate-400 flex items-center gap-1.5 font-medium">
                      <Clock className="w-3.5 h-3.5 text-indigo-400" />
                      Order Cutoff Deadline:
                    </span>
                    <span className="text-[11px] font-bold text-indigo-200">
                      {store.cutoffDay || 'Sunday'} at {store.cutoffTimeStr || '14:00 (2:00 PM)'}
                    </span>
                  </div>
                </div>

                {store.notes && (
                  <p className="text-[11px] text-slate-400 mt-2.5 italic">
                    "{store.notes}"
                  </p>
                )}
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-2">
                <button
                  onClick={() => handleOpenEdit(store)}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white font-bold text-xs flex items-center gap-1.5 transition-colors"
                >
                  <Edit2 className="w-3.5 h-3.5 text-amber-400" />
                  <span>Edit Schedule & Details</span>
                </button>

                {allStores.length > 1 && (
                  <button
                    onClick={() => {
                      setStoreToDelete(store);
                      setDeleteError(null);
                      SoundPlayer.playDecrementSound();
                    }}
                    className="px-3 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/20 font-bold text-xs flex items-center gap-1.5 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                    <span>Delete</span>
                  </button>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Edit / Create Store Modal */}
      <AnimatePresence>
        {(editingStore || isCreatingNew) && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="relative w-full max-w-2xl bg-slate-900 border border-slate-700 rounded-3xl p-6 shadow-2xl text-white my-8 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
                    <Building2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white font-heading">
                      {isCreatingNew ? 'Add New Store Location' : `Edit Store: ${editingStore?.name}`}
                    </h3>
                    <p className="text-xs text-slate-400">
                      Configure store identity, truck delivery schedule, and order deadlines
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => {
                    setEditingStore(null);
                    setIsCreatingNew(false);
                  }}
                  className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSaveForm} className="space-y-4 pt-4">
                {/* Store Name & Store # */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-slate-300 mb-1">
                      Store Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.name || ''}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g. Hardee's - Harrogate"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white focus:outline-none focus:border-amber-400"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">
                      Store Number *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.storeNumber || ''}
                      onChange={(e) => setFormData({ ...formData, storeNumber: e.target.value })}
                      placeholder="e.g. 1102"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white focus:outline-none focus:border-amber-400 font-mono"
                    />
                  </div>
                </div>

                {/* Address & City/State/Zip */}
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-slate-300 mb-1">
                      Street Address
                    </label>
                    <input
                      type="text"
                      value={formData.address || ''}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      placeholder="e.g. 6301 Cumberland Gap Pkwy"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white focus:outline-none focus:border-amber-400"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">
                      City
                    </label>
                    <input
                      type="text"
                      value={formData.city || ''}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      placeholder="e.g. Harrogate"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white focus:outline-none focus:border-amber-400"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">
                      State & ZIP
                    </label>
                    <div className="grid grid-cols-2 gap-1">
                      <input
                        type="text"
                        value={formData.state || ''}
                        onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                        placeholder="TN"
                        className="w-full px-2 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white text-center uppercase focus:outline-none focus:border-amber-400"
                      />
                      <input
                        type="text"
                        value={formData.zip || ''}
                        onChange={(e) => setFormData({ ...formData, zip: e.target.value })}
                        placeholder="37752"
                        className="w-full px-2 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white text-center focus:outline-none focus:border-amber-400 font-mono"
                      />
                    </div>
                  </div>
                </div>

                {/* Phone & Brand */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">
                      Store Phone Number
                    </label>
                    <input
                      type="text"
                      value={formData.phone || ''}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="(423) 869-2144"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white focus:outline-none focus:border-amber-400"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">
                      Brand / Franchise
                    </label>
                    <input
                      type="text"
                      value={formData.brand || ''}
                      onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                      placeholder="Hardee's / CKE Restaurants"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white focus:outline-none focus:border-amber-400"
                    />
                  </div>
                </div>

                {/* --- TRUCK DELIVERY SCHEDULE SECTION --- */}
                <div className="p-4 rounded-2xl bg-slate-950/80 border border-amber-500/30 space-y-3">
                  <div className="flex items-center gap-2">
                    <Truck className="w-4 h-4 text-amber-400" />
                    <h4 className="text-xs font-extrabold uppercase tracking-wider text-amber-300">
                      Truck Delivery Schedule & Order Deadline
                    </h4>
                  </div>

                  {/* Truck Days of Week Selector */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Vendor Truck Delivery Days:
                    </label>
                    <div className="grid grid-cols-4 sm:grid-cols-7 gap-1.5">
                      {DAYS_OF_WEEK.map((day) => {
                        const isSelected = formData.truckDays?.includes(day);
                        return (
                          <button
                            key={day}
                            type="button"
                            onClick={() => handleToggleTruckDay(day)}
                            className={`py-2 px-1 rounded-xl text-xs font-bold transition-all text-center ${
                              isSelected
                                ? 'bg-amber-400 text-slate-950 shadow-md shadow-amber-500/20 font-black scale-105'
                                : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800'
                            }`}
                          >
                            {day.slice(0, 3)}
                          </button>
                        );
                      })}
                    </div>
                    <span className="text-[10px] text-slate-400 mt-1 block">
                      Tap days to toggle when the delivery truck arrives at this location (e.g. Tuesday & Friday).
                    </span>
                  </div>

                  {/* Cutoff Day & Cutoff Time */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-indigo-400" />
                        Order Submission Cutoff Day:
                      </label>
                      <select
                        value={formData.cutoffDay || 'Sunday'}
                        onChange={(e) => setFormData({ ...formData, cutoffDay: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-amber-400"
                      >
                        <option value="Sunday">Sunday (for Tuesday delivery)</option>
                        <option value="Monday">Monday</option>
                        <option value="Tuesday">Tuesday</option>
                        <option value="Wednesday">Wednesday (for Friday delivery)</option>
                        <option value="Thursday">Thursday</option>
                        <option value="Friday">Friday</option>
                        <option value="Saturday">Saturday</option>
                        <option value="2 Days Prior to Delivery">2 Days Prior to Delivery</option>
                        <option value="1 Day Prior (24h)">1 Day Prior (24h Notice)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-indigo-400" />
                        Order Cutoff Time (24h or AM/PM):
                      </label>
                      <input
                        type="text"
                        value={formData.cutoffTimeStr || '14:00'}
                        onChange={(e) => setFormData({ ...formData, cutoffTimeStr: e.target.value })}
                        placeholder="e.g. 14:00 or 2:00 PM EST"
                        className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white font-mono focus:outline-none focus:border-amber-400"
                      />
                      <span className="text-[10px] text-slate-500 mt-0.5 block">
                        Time when weekly order must be transmitted to vendor (e.g. 2:00 PM).
                      </span>
                    </div>
                  </div>
                </div>

                {/* Additional Notes */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Store Notes & Delivery Instructions
                  </label>
                  <textarea
                    rows={2}
                    value={formData.notes || ''}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="e.g. US Foods delivery driver backdoor code #4491, key stored in lockbox."
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white focus:outline-none focus:border-amber-400"
                  />
                </div>

                {/* Actions */}
                <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => {
                      setEditingStore(null);
                      setIsCreatingNew(false);
                    }}
                    className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-400 to-orange-400 hover:from-amber-300 hover:to-orange-300 text-slate-950 font-extrabold text-xs shadow-lg flex items-center gap-1.5 transition-transform active:scale-95"
                  >
                    <Check className="w-4 h-4" />
                    <span>Save Store Location</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {storeToDelete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-md bg-slate-900 border border-rose-600/50 rounded-3xl p-6 shadow-2xl text-white"
            >
              <div className="w-12 h-12 rounded-2xl bg-rose-500/20 border border-rose-500/30 flex items-center justify-center text-rose-400 mb-4 mx-auto">
                <Trash2 className="w-6 h-6" />
              </div>

              <h3 className="text-lg font-bold text-white text-center font-heading">
                Delete Store Location?
              </h3>
              <p className="text-xs text-slate-300 text-center mt-1">
                Are you sure you want to remove <strong className="text-white">{storeToDelete.name} (#{storeToDelete.storeNumber})</strong>?
              </p>

              {deleteError && (
                <div className="mt-3 p-2.5 rounded-xl bg-rose-950/80 border border-rose-800 text-rose-200 text-xs text-center font-medium">
                  {deleteError}
                </div>
              )}

              <div className="flex items-center justify-center gap-3 mt-6">
                <button
                  onClick={() => setStoreToDelete(null)}
                  className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmDelete}
                  className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-extrabold text-xs shadow-lg shadow-rose-600/30 flex items-center gap-1.5 transition-all"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Delete Store</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
