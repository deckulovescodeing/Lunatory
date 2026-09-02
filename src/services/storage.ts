import {
  AppNotification,
  AppSettings,
  AuditLog,
  Category,
  InventoryCountSession,
  InventoryItem,
  NearbyPeer,
  ServerSyncConfig,
  Store,
  SyncBundlePayload,
  SyncQueueItem,
  SyncState,
  TruckOrder,
  User,
  WasteEntry,
} from '../types';
import {
  DEFAULT_APP_SETTINGS,
  SEED_AUDIT_LOGS,
  SEED_CATEGORIES,
  SEED_INVENTORY,
  SEED_NOTIFICATIONS,
  SEED_STORES,
  SEED_TRUCK_ORDERS,
  SEED_USERS,
  SEED_WASTE_ENTRIES,
} from '../data/seedData';
import { p2pSync } from './p2pSync';

const STORAGE_KEYS = {
  STORES: 'lunatory_stores',
  USERS: 'lunatory_users',
  CURRENT_USER: 'lunatory_current_user',
  CATEGORIES: 'lunatory_categories',
  INVENTORY: 'lunatory_inventory',
  COUNT_SESSIONS: 'lunatory_count_sessions',
  ACTIVE_COUNT_SESSION: 'lunatory_active_count_session',
  WASTE_ENTRIES: 'lunatory_waste_entries',
  TRUCK_ORDERS: 'lunatory_truck_orders',
  AUDIT_LOGS: 'lunatory_audit_logs',
  NOTIFICATIONS: 'lunatory_notifications',
  SETTINGS: 'lunatory_settings',
  SYNC_QUEUE: 'lunatory_sync_queue',
};

class StorageService {
  private listeners: Set<() => void> = new Set();
  private autoSyncTimer: any = null;
  private syncState: SyncState = {
    isOnline: true,
    isSyncing: false,
    lastSyncedAt: new Date().toISOString(),
    queue: [],
    hasConflicts: false,
    connectedPeersCount: 0,
    serverConnected: false,
    mode: 'offline_standalone',
    lastP2PSync: undefined,
  };

  constructor() {
    this.init();
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => this.handleNetworkChange(true));
      window.addEventListener('offline', () => this.handleNetworkChange(false));
      
      // Listen to storage events from other windows/tabs
      window.addEventListener('storage', (e) => {
        if (e.key && e.key.startsWith('lunatory_')) {
          this.notify();
        }
      });

      // Wire P2P Sync
      this.initP2P();
    }
  }

  private initP2P() {
    const settings = this.getSettings();
    const currentUser = this.getCurrentUser();
    
    p2pSync.init(
      settings.deviceName || 'Hardee’s Kitchen Terminal',
      currentUser?.name || 'Crew Member',
      currentUser?.role || 'crew',
      settings.activeStoreId || 'store-harrogate-1102',
      settings.p2pMeshEnabled !== false
    );

    p2pSync.onPeersChanged((peers) => {
      this.syncState.connectedPeersCount = peers.length;
      this.notify();
    });

    p2pSync.onSyncReceived((payload) => {
      this.handleIncomingSyncBundle(payload);
    });

    this.setupAutoSyncInterval();
  }

  public setupAutoSyncInterval() {
    if (this.autoSyncTimer) {
      clearInterval(this.autoSyncTimer);
      this.autoSyncTimer = null;
    }

    const settings = this.getSettings();
    if (settings.serverSync?.enabled && settings.serverSync.autoSyncIntervalSec > 0) {
      this.autoSyncTimer = setInterval(() => {
        this.pushToServer(settings.serverSync.serverUrl, settings.serverSync.apiToken, settings.activeStoreId).catch(() => {});
      }, settings.serverSync.autoSyncIntervalSec * 1000);
    }
  }

  public subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify() {
    this.listeners.forEach((l) => l());
  }

  private handleNetworkChange(online: boolean) {
    this.syncState.isOnline = online;
    if (online) {
      this.processSyncQueue();
    }
    this.notify();
  }

  public init() {
    if (typeof window === 'undefined') return;

    // Check if initial data exists; if not, initialize with Hardee's Harrogate seed data
    if (!localStorage.getItem(STORAGE_KEYS.STORES)) {
      this.resetToDefaults();
    } else {
      this.loadSyncQueue();
    }
  }

  public resetToDefaults() {
    localStorage.setItem(STORAGE_KEYS.STORES, JSON.stringify(SEED_STORES));
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(SEED_USERS));
    localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(SEED_CATEGORIES));
    localStorage.setItem(STORAGE_KEYS.INVENTORY, JSON.stringify(SEED_INVENTORY));
    localStorage.setItem(STORAGE_KEYS.WASTE_ENTRIES, JSON.stringify(SEED_WASTE_ENTRIES));
    localStorage.setItem(STORAGE_KEYS.TRUCK_ORDERS, JSON.stringify(SEED_TRUCK_ORDERS));
    localStorage.setItem(STORAGE_KEYS.AUDIT_LOGS, JSON.stringify(SEED_AUDIT_LOGS));
    localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(SEED_NOTIFICATIONS));
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(DEFAULT_APP_SETTINGS));
    localStorage.setItem(STORAGE_KEYS.COUNT_SESSIONS, JSON.stringify([]));
    localStorage.removeItem(STORAGE_KEYS.ACTIVE_COUNT_SESSION);
    localStorage.setItem(STORAGE_KEYS.SYNC_QUEUE, JSON.stringify([]));

    // Default current user: Store GM Admin (Alex Rivera)
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(SEED_USERS[0]));
    
    this.syncState.queue = [];
    this.syncState.lastSyncedAt = new Date().toISOString();
    this.notify();
  }

  // --- Auth & Session ---
  public getCurrentUser(): User | null {
    const raw = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
    return raw ? JSON.parse(raw) : null;
  }

  public setCurrentUser(user: User | null) {
    if (user) {
      localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
    } else {
      localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
    }
    this.notify();
  }

  public getUsers(): User[] {
    const raw = localStorage.getItem(STORAGE_KEYS.USERS);
    return raw ? JSON.parse(raw) : SEED_USERS;
  }

  public saveUser(user: User) {
    const users = this.getUsers();
    const index = users.findIndex((u) => u.id === user.id);
    if (index >= 0) {
      users[index] = user;
    } else {
      users.push(user);
    }
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
    this.logAudit('Updated User', 'system', `Updated user details for ${user.name} (${user.role})`);
    this.notify();
  }

  public deleteUser(userId: string) {
    let users = this.getUsers();
    users = users.filter((u) => u.id !== userId);
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
    this.notify();
  }

  // --- Stores ---
  public getStores(): Store[] {
    const raw = localStorage.getItem(STORAGE_KEYS.STORES);
    return raw ? JSON.parse(raw) : SEED_STORES;
  }

  public getActiveStore(): Store {
    const stores = this.getStores();
    const settings = this.getSettings();
    const active = stores.find((s) => s.id === settings.activeStoreId);
    return active || stores[0] || SEED_STORES[0];
  }

  public setActiveStoreId(storeId: string) {
    const settings = this.getSettings();
    settings.activeStoreId = storeId;
    this.saveSettings(settings);
    this.notify();
  }

  public saveStore(store: Store) {
    const stores = this.getStores();
    const idx = stores.findIndex((s) => s.id === store.id);
    const isNew = idx === -1;
    if (idx >= 0) {
      stores[idx] = store;
    } else {
      stores.push(store);
    }
    localStorage.setItem(STORAGE_KEYS.STORES, JSON.stringify(stores));
    this.logAudit(
      isNew ? 'Added Store' : 'Updated Store',
      'system',
      `${isNew ? 'Created' : 'Updated'} store configuration for ${store.name} (#${store.storeNumber})`
    );
    this.notify();
    return store;
  }

  public deleteStore(storeId: string): { success: boolean; message: string } {
    let stores = this.getStores();
    if (stores.length <= 1) {
      return { success: false, message: 'Cannot delete the only remaining store location.' };
    }
    const target = stores.find((s) => s.id === storeId);
    if (!target) {
      return { success: false, message: 'Store not found.' };
    }

    stores = stores.filter((s) => s.id !== storeId);
    localStorage.setItem(STORAGE_KEYS.STORES, JSON.stringify(stores));

    // If deleting currently active store, switch to the first remaining one
    const settings = this.getSettings();
    if (settings.activeStoreId === storeId) {
      settings.activeStoreId = stores[0].id;
      this.saveSettings(settings);
    }

    this.logAudit('Deleted Store', 'system', `Deleted store location: ${target.name} (#${target.storeNumber})`);
    this.notify();
    return { success: true, message: `Store "${target.name}" has been deleted.` };
  }

  // --- Categories ---
  public getCategories(): Category[] {
    const raw = localStorage.getItem(STORAGE_KEYS.CATEGORIES);
    return raw ? JSON.parse(raw) : SEED_CATEGORIES;
  }

  public saveCategory(category: Category) {
    const cats = this.getCategories();
    const idx = cats.findIndex((c) => c.id === category.id);
    if (idx >= 0) {
      cats[idx] = category;
    } else {
      cats.push(category);
    }
    localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(cats));
    this.notify();
  }

  // --- Inventory Items ---
  public getInventory(storeId?: string): InventoryItem[] {
    const raw = localStorage.getItem(STORAGE_KEYS.INVENTORY);
    const items: InventoryItem[] = raw ? JSON.parse(raw) : SEED_INVENTORY;
    const targetStoreId = storeId || this.getActiveStore().id;
    return items.filter((item) => item.storeId === targetStoreId);
  }

  public getAllInventory(): InventoryItem[] {
    const raw = localStorage.getItem(STORAGE_KEYS.INVENTORY);
    return raw ? JSON.parse(raw) : SEED_INVENTORY;
  }

  public getItemById(id: string): InventoryItem | undefined {
    const items = this.getAllInventory();
    return items.find((i) => i.id === id);
  }

  public getItemByBarcode(barcode: string): InventoryItem | undefined {
    const items = this.getInventory();
    const clean = barcode.trim();
    return items.find((i) => i.barcode === clean || i.sku.toLowerCase() === clean.toLowerCase());
  }

  public saveItem(item: InventoryItem) {
    const all = this.getAllInventory();
    const idx = all.findIndex((i) => i.id === item.id);
    const isNew = idx === -1;

    if (idx >= 0) {
      all[idx] = item;
    } else {
      all.push(item);
    }
    localStorage.setItem(STORAGE_KEYS.INVENTORY, JSON.stringify(all));

    this.queueMutation(isNew ? 'ADD_ITEM' : 'UPDATE_ITEM', item);
    this.logAudit(
      isNew ? 'Added Item' : 'Updated Item',
      'inventory',
      `${item.name} (${item.sku}) - Qty: ${item.currentQuantity} ${item.unitType}`
    );
    this.checkStockAlerts(item);
    this.notify();
  }

  public saveInventory(storeIdOrItems: string | InventoryItem[], itemsList?: InventoryItem[]) {
    const items = Array.isArray(storeIdOrItems) ? storeIdOrItems : (itemsList || []);
    const all = this.getAllInventory();
    const updatedMap = new Map(items.map((i) => [i.id, i]));
    const merged = all.map((item) => (updatedMap.has(item.id) ? updatedMap.get(item.id)! : item));
    // Add any brand new items not in merged
    items.forEach((item) => {
      if (!merged.some((m) => m.id === item.id)) {
        merged.push(item);
      }
    });
    localStorage.setItem(STORAGE_KEYS.INVENTORY, JSON.stringify(merged));
    this.notify();
  }

  public deleteItem(itemId: string) {
    let all = this.getAllInventory();
    const item = all.find((i) => i.id === itemId);
    all = all.filter((i) => i.id !== itemId);
    localStorage.setItem(STORAGE_KEYS.INVENTORY, JSON.stringify(all));

    this.queueMutation('DELETE_ITEM', { id: itemId });
    if (item) {
      this.logAudit('Deleted Item', 'inventory', `Removed ${item.name} (${item.sku})`);
    }
    this.notify();
  }

  public updateItemQuantity(itemId: string, newQuantity: number, reason: string = 'Quick Adjustment') {
    const all = this.getAllInventory();
    const idx = all.findIndex((i) => i.id === itemId);
    if (idx >= 0) {
      const item = all[idx];
      const prevQty = item.currentQuantity;
      const user = this.getCurrentUser();
      
      all[idx] = {
        ...item,
        previousQuantity: prevQty,
        currentQuantity: Math.max(0, Math.round(newQuantity * 100) / 100),
        lastCountedAt: new Date().toISOString(),
        lastCountedBy: user ? user.name : 'Staff',
      };
      
      localStorage.setItem(STORAGE_KEYS.INVENTORY, JSON.stringify(all));
      this.queueMutation('UPDATE_ITEM', all[idx]);
      this.logAudit(
        'Adjusted Quantity',
        'inventory',
        `${item.name}: ${prevQty} → ${newQuantity} ${item.unitType} (${reason})`
      );
      this.checkStockAlerts(all[idx]);
      this.notify();
    }
  }

  // --- Count Sessions ---
  public getCountSessions(storeId?: string): InventoryCountSession[] {
    const raw = localStorage.getItem(STORAGE_KEYS.COUNT_SESSIONS);
    const sessions: InventoryCountSession[] = raw ? JSON.parse(raw) : [];
    const targetStoreId = storeId || this.getActiveStore().id;
    return sessions.filter((s) => s.storeId === targetStoreId);
  }

  public getActiveCountSession(): InventoryCountSession | null {
    const raw = localStorage.getItem(STORAGE_KEYS.ACTIVE_COUNT_SESSION);
    return raw ? JSON.parse(raw) : null;
  }

  public saveActiveCountSession(session: InventoryCountSession | null) {
    if (session) {
      localStorage.setItem(STORAGE_KEYS.ACTIVE_COUNT_SESSION, JSON.stringify(session));
    } else {
      localStorage.removeItem(STORAGE_KEYS.ACTIVE_COUNT_SESSION);
    }
    this.notify();
  }

  public finalizeCountSession(session: InventoryCountSession) {
    const completedSession: InventoryCountSession = {
      ...session,
      status: 'submitted',
      completedAt: new Date().toISOString(),
    };

    // Update all items in inventory with new counted quantities
    const allInventory = this.getAllInventory();
    Object.entries(session.counts).forEach(([itemId, record]) => {
      if (!record.skipped) {
        const itemIdx = allInventory.findIndex((i) => i.id === itemId);
        if (itemIdx >= 0) {
          allInventory[itemIdx] = {
            ...allInventory[itemIdx],
            previousQuantity: allInventory[itemIdx].currentQuantity,
            currentQuantity: record.counted,
            lastCountedAt: completedSession.completedAt,
            lastCountedBy: session.countedBy.userName,
          };
        }
      }
    });

    localStorage.setItem(STORAGE_KEYS.INVENTORY, JSON.stringify(allInventory));

    // Save session to history
    const sessions = this.getCountSessions();
    sessions.unshift(completedSession);
    localStorage.setItem(STORAGE_KEYS.COUNT_SESSIONS, JSON.stringify(sessions));
    localStorage.removeItem(STORAGE_KEYS.ACTIVE_COUNT_SESSION);

    this.queueMutation('SAVE_COUNT', completedSession);
    this.logAudit(
      'Submitted Inventory Count',
      'count',
      `Counted ${session.totalItemsCounted} items. Variance cost: $${(session.totalVarianceCost || 0).toFixed(2)}`
    );

    // Add notification
    this.addNotification({
      type: 'system',
      title: 'Inventory Count Finalized',
      message: `${session.countedBy.userName} completed counting ${session.totalItemsCounted} items.`,
      priority: 'low',
    });

    this.notify();
  }

  // --- Waste Logging ---
  public getWasteEntries(storeId?: string): WasteEntry[] {
    const raw = localStorage.getItem(STORAGE_KEYS.WASTE_ENTRIES);
    const entries: WasteEntry[] = raw ? JSON.parse(raw) : SEED_WASTE_ENTRIES;
    const targetStoreId = storeId || this.getActiveStore().id;
    return entries.filter((e) => e.storeId === targetStoreId);
  }

  public logWaste(entry: Omit<WasteEntry, 'id' | 'timestamp'>) {
    const newEntry: WasteEntry = {
      ...entry,
      id: 'waste-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
      timestamp: new Date().toISOString(),
    };

    const entries = this.getWasteEntries();
    entries.unshift(newEntry);
    localStorage.setItem(STORAGE_KEYS.WASTE_ENTRIES, JSON.stringify(entries));

    // Deduct wasted amount from current on-hand inventory
    const all = this.getAllInventory();
    const idx = all.findIndex((i) => i.id === entry.itemId);
    if (idx >= 0) {
      all[idx].currentQuantity = Math.max(0, Math.round((all[idx].currentQuantity - entry.quantity) * 100) / 100);
      all[idx].wasteLast7Days = (all[idx].wasteLast7Days || 0) + entry.quantity;
      localStorage.setItem(STORAGE_KEYS.INVENTORY, JSON.stringify(all));
    }

    this.queueMutation('LOG_WASTE', newEntry);
    this.logAudit(
      'Logged Waste',
      'waste',
      `${entry.quantity} ${entry.unit} of ${entry.itemName} ($${entry.totalCost.toFixed(2)}) - Reason: ${entry.reason}`
    );

    if (entry.totalCost > 30) {
      this.addNotification({
        type: 'waste_alert',
        title: 'High-Value Waste Recorded',
        message: `$${entry.totalCost.toFixed(2)} waste logged for ${entry.itemName} (${entry.reason}).`,
        priority: 'medium',
      });
    }

    this.notify();
  }

  public deleteWasteEntry(id: string) {
    let entries = this.getWasteEntries();
    entries = entries.filter((e) => e.id !== id);
    localStorage.setItem(STORAGE_KEYS.WASTE_ENTRIES, JSON.stringify(entries));
    this.notify();
  }

  // --- Truck Orders ---
  public getTruckOrders(storeId?: string): TruckOrder[] {
    const raw = localStorage.getItem(STORAGE_KEYS.TRUCK_ORDERS);
    const orders: TruckOrder[] = raw ? JSON.parse(raw) : SEED_TRUCK_ORDERS;
    const targetStoreId = storeId || this.getActiveStore().id;
    return orders.filter((o) => o.storeId === targetStoreId);
  }

  public saveTruckOrder(order: TruckOrder) {
    const orders = this.getTruckOrders();
    const idx = orders.findIndex((o) => o.id === order.id);
    if (idx >= 0) {
      orders[idx] = order;
    } else {
      orders.unshift(order);
    }
    localStorage.setItem(STORAGE_KEYS.TRUCK_ORDERS, JSON.stringify(orders));
    this.queueMutation('SAVE_ORDER', order);
    const cost = order.totalEstimatedCost ?? order.totalCost ?? 0;
    this.logAudit('Saved Truck Order', 'truck_order', `Order #${order.orderNumber} - $${cost.toFixed(2)}`);
    this.notify();
  }

  public receiveTruckShipment(orderId: string, receivedItems: TruckOrder['items'], receivedBy: { userId: string; userName: string }) {
    const orders = this.getTruckOrders();
    const idx = orders.findIndex((o) => o.id === orderId);
    if (idx >= 0) {
      const order = orders[idx];
      const allInventory = this.getAllInventory();
      let totalActualCost = 0;

      // Update on-hand inventory quantities
      receivedItems.forEach((item) => {
        const qtyReceived = item.receivedQty !== undefined ? item.receivedQty : item.orderedQty;
        totalActualCost += qtyReceived * item.unitCost;

        const invIdx = allInventory.findIndex((i) => i.id === item.itemId);
        if (invIdx >= 0) {
          allInventory[invIdx] = {
            ...allInventory[invIdx],
            previousQuantity: allInventory[invIdx].currentQuantity,
            currentQuantity: Math.round((allInventory[invIdx].currentQuantity + qtyReceived) * 100) / 100,
            lastCountedAt: new Date().toISOString(),
            lastCountedBy: `Truck Delivery (${receivedBy.userName})`,
          };
        }
      });

      localStorage.setItem(STORAGE_KEYS.INVENTORY, JSON.stringify(allInventory));

      orders[idx] = {
        ...order,
        status: 'received',
        receivedBy,
        receivedAt: new Date().toISOString(),
        items: receivedItems,
        totalActualCost,
      };

      localStorage.setItem(STORAGE_KEYS.TRUCK_ORDERS, JSON.stringify(orders));
      this.queueMutation('RECEIVE_ORDER', orders[idx]);
      this.logAudit(
        'Received Truck Delivery',
        'truck_order',
        `Processed PO #${order.orderNumber}. Stock quantities replenished for ${receivedItems.length} items.`
      );

      this.addNotification({
        type: 'truck_reminder',
        title: 'Truck Delivery Received!',
        message: `PO #${order.orderNumber} received by ${receivedBy.userName}. On-hand inventory updated.`,
        priority: 'medium',
      });

      this.notify();
    }
  }

  // --- Notifications ---
  public getNotifications(): AppNotification[] {
    const raw = localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS);
    return raw ? JSON.parse(raw) : SEED_NOTIFICATIONS;
  }

  public addNotification(notif: Omit<AppNotification, 'id' | 'timestamp' | 'read'>) {
    const newNotif: AppNotification = {
      ...notif,
      id: 'notif-' + Date.now() + '-' + Math.random().toString(36).substring(2, 5),
      timestamp: new Date().toISOString(),
      read: false,
    };
    const notifs = this.getNotifications();
    notifs.unshift(newNotif);
    localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(notifs.slice(0, 50)));
    this.notify();
  }

  public markNotificationAsRead(id: string) {
    const notifs = this.getNotifications();
    const target = notifs.find((n) => n.id === id);
    if (target) {
      target.read = true;
      localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(notifs));
      this.notify();
    }
  }

  public markAllNotificationsAsRead() {
    const notifs = this.getNotifications().map((n) => ({ ...n, read: true }));
    localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(notifs));
    this.notify();
  }

  public clearNotifications() {
    localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify([]));
    this.notify();
  }

  // --- Audit Logs ---
  public getAuditLogs(storeId?: string): AuditLog[] {
    const raw = localStorage.getItem(STORAGE_KEYS.AUDIT_LOGS);
    const logs: AuditLog[] = raw ? JSON.parse(raw) : SEED_AUDIT_LOGS;
    const targetStoreId = storeId || this.getActiveStore().id;
    return logs.filter((l) => l.storeId === targetStoreId);
  }

  public logAudit(action: string, category: AuditLog['category'], details: string) {
    const user = this.getCurrentUser();
    const store = this.getActiveStore();
    const newLog: AuditLog = {
      id: 'audit-' + Date.now() + '-' + Math.random().toString(36).substring(2, 5),
      storeId: store.id,
      userId: user ? user.id : 'system',
      userName: user ? user.name : 'System Service',
      action,
      category,
      details,
      timestamp: new Date().toISOString(),
    };

    const logs = this.getAuditLogs();
    logs.unshift(newLog);
    localStorage.setItem(STORAGE_KEYS.AUDIT_LOGS, JSON.stringify(logs.slice(0, 200)));
  }

  // --- Settings ---
  public getSettings(): AppSettings {
    const raw = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    return raw ? { ...DEFAULT_APP_SETTINGS, ...JSON.parse(raw) } : DEFAULT_APP_SETTINGS;
  }

  public saveSettings(newSettings: Partial<AppSettings>) {
    const current = this.getSettings();
    const merged = { ...current, ...newSettings };
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(merged));

    const currentUser = this.getCurrentUser();
    p2pSync.init(
      merged.deviceName || 'Hardee’s Kitchen Terminal',
      currentUser?.name || 'Crew Member',
      currentUser?.role || 'crew',
      merged.activeStoreId || 'store-harrogate-1102',
      merged.p2pMeshEnabled !== false
    );

    this.setupAutoSyncInterval();
    this.notify();
  }

  // --- P2P Mesh & Sync Bundle Handlers ---
  public createSyncBundle(storeId?: string): SyncBundlePayload {
    const targetStoreId = storeId || this.getActiveStore().id;
    const settings = this.getSettings();
    const user = this.getCurrentUser();

    return {
      version: '2.4.0',
      type: 'FULL_SYNC',
      storeId: targetStoreId,
      timestamp: new Date().toISOString(),
      sender: {
        peerId: p2pSync.getPeerId(),
        deviceName: settings.deviceName || 'Hardee’s Kitchen Terminal',
        userName: user?.name || 'Crew Member',
      },
      data: {
        inventory: this.getInventory(targetStoreId),
        countSessions: this.getCountSessions(targetStoreId),
        wasteEntries: this.getWasteEntries(targetStoreId),
        truckOrders: this.getTruckOrders(targetStoreId),
        categories: this.getCategories(),
      },
    };
  }

  public broadcastCurrentStoreState(storeId?: string) {
    const targetStoreId = storeId || this.getActiveStore().id;
    const settings = this.getSettings();

    if (!settings.p2pMeshEnabled) return;

    const payload = this.createSyncBundle(targetStoreId);
    p2pSync.broadcastSyncBundle(payload);
    this.syncState.lastP2PSync = new Date().toISOString();
    this.notify();
  }

  public handleIncomingSyncBundle(payload: SyncBundlePayload): { success: boolean; message: string } {
    try {
      if (!payload || !payload.data) {
        return { success: false, message: 'Empty or invalid sync payload.' };
      }

      const targetStoreId = payload.storeId;
      let changesCount = 0;

      // 1. Merge Inventory
      if (Array.isArray(payload.data.inventory) && payload.data.inventory.length > 0) {
        const allItems = this.getAllInventory();
        const itemMap = new Map<string, InventoryItem>();
        allItems.forEach((i) => itemMap.set(i.id, i));

        payload.data.inventory.forEach((remoteItem) => {
          const localItem = itemMap.get(remoteItem.id);
          if (!localItem) {
            itemMap.set(remoteItem.id, remoteItem);
            changesCount++;
          } else {
            // Last counted date or last modified comparison
            const localTime = new Date(localItem.lastCountedAt || 0).getTime();
            const remoteTime = new Date(remoteItem.lastCountedAt || 0).getTime();
            if (remoteTime > localTime) {
              itemMap.set(remoteItem.id, { ...localItem, ...remoteItem });
              changesCount++;
            }
          }
        });

        localStorage.setItem(STORAGE_KEYS.INVENTORY, JSON.stringify(Array.from(itemMap.values())));
      }

      // 2. Merge Count Sessions
      if (Array.isArray(payload.data.countSessions) && payload.data.countSessions.length > 0) {
        const allCounts = this.getCountSessions();
        const countMap = new Map<string, InventoryCountSession>();
        allCounts.forEach((c) => countMap.set(c.id, c));

        payload.data.countSessions.forEach((remoteCount) => {
          if (!countMap.has(remoteCount.id)) {
            countMap.set(remoteCount.id, remoteCount);
            changesCount++;
          }
        });

        localStorage.setItem(STORAGE_KEYS.COUNT_SESSIONS, JSON.stringify(Array.from(countMap.values())));
      }

      // 3. Merge Waste Entries
      if (Array.isArray(payload.data.wasteEntries) && payload.data.wasteEntries.length > 0) {
        const allWaste = this.getWasteEntries();
        const wasteMap = new Map<string, WasteEntry>();
        allWaste.forEach((w) => wasteMap.set(w.id, w));

        payload.data.wasteEntries.forEach((remoteWaste) => {
          if (!wasteMap.has(remoteWaste.id)) {
            wasteMap.set(remoteWaste.id, remoteWaste);
            changesCount++;
          }
        });

        localStorage.setItem(STORAGE_KEYS.WASTE_ENTRIES, JSON.stringify(Array.from(wasteMap.values())));
      }

      // 4. Merge Truck Orders
      if (Array.isArray(payload.data.truckOrders) && payload.data.truckOrders.length > 0) {
        const allOrders = this.getTruckOrders();
        const orderMap = new Map<string, TruckOrder>();
        allOrders.forEach((o) => orderMap.set(o.id, o));

        payload.data.truckOrders.forEach((remoteOrder) => {
          const localOrder = orderMap.get(remoteOrder.id);
          if (!localOrder) {
            orderMap.set(remoteOrder.id, remoteOrder);
            changesCount++;
          } else if (remoteOrder.status === 'received' && localOrder.status !== 'received') {
            orderMap.set(remoteOrder.id, remoteOrder);
            changesCount++;
          }
        });

        localStorage.setItem(STORAGE_KEYS.TRUCK_ORDERS, JSON.stringify(Array.from(orderMap.values())));
      }

      this.syncState.lastP2PSync = new Date().toISOString();
      this.syncState.lastSyncedAt = this.syncState.lastP2PSync;

      if (changesCount > 0) {
        this.addNotification({
          type: 'sync_status',
          title: `Peer Sync: ${payload.sender?.deviceName || 'Nearby Device'}`,
          message: `Synchronized ${changesCount} update(s) seamlessly via local peer network.`,
          priority: 'low',
        });
        this.logAudit(
          'Peer Sync Merged',
          'system',
          `Merged updates from ${payload.sender?.deviceName || 'Nearby Device'} (${payload.sender?.userName || 'Crew'})`
        );
      }

      this.notify();
      return { success: true, message: `Successfully synchronized ${changesCount} items with ${payload.sender?.deviceName || 'Peer'}` };
    } catch (e: any) {
      console.error('Failed to merge sync bundle', e);
      return { success: false, message: 'Sync error: ' + e.message };
    }
  }

  // --- Custom Self-Hosted Server API Client ---
  public async testServerConnection(
    serverUrlInput?: string,
    apiTokenInput?: string
  ): Promise<{ success: boolean; latencyMs: number; message: string; version?: string }> {
    const settings = this.getSettings();
    let baseUrl = (serverUrlInput || settings.serverSync?.serverUrl || '/api').trim();
    if (baseUrl.endsWith('/')) baseUrl = baseUrl.slice(0, -1);
    
    // Normalize relative /api vs absolute URL
    let testUrl = baseUrl.startsWith('http') ? `${baseUrl}/api/sync/health` : `${baseUrl}/sync/health`;
    if (!testUrl.startsWith('http') && !testUrl.startsWith('/')) {
      testUrl = `http://${testUrl}`;
    }

    const startTime = performance.now();
    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (apiTokenInput || settings.serverSync?.apiToken) {
        headers['Authorization'] = `Bearer ${apiTokenInput || settings.serverSync?.apiToken}`;
      }

      const res = await fetch(testUrl, {
        method: 'GET',
        headers,
        signal: AbortSignal.timeout(5000),
      });

      const latencyMs = Math.round(performance.now() - startTime);

      if (res.ok) {
        const data = await res.json();
        this.saveSettings({
          serverSync: {
            ...settings.serverSync,
            serverUrl: baseUrl,
            apiToken: apiTokenInput !== undefined ? apiTokenInput : settings.serverSync?.apiToken,
            serverStatus: 'connected',
            latencyMs,
            errorMessage: undefined,
            lastServerSync: new Date().toISOString(),
          },
        });
        this.syncState.serverConnected = true;
        this.notify();
        return {
          success: true,
          latencyMs,
          message: data.message || 'Server connection verified successfully!',
          version: data.version,
        };
      } else {
        throw new Error(`Server returned HTTP ${res.status}: ${res.statusText}`);
      }
    } catch (err: any) {
      const latencyMs = Math.round(performance.now() - startTime);
      this.saveSettings({
        serverSync: {
          ...settings.serverSync,
          serverStatus: 'error',
          latencyMs,
          errorMessage: err.message || 'Failed to connect to server.',
        },
      });
      this.syncState.serverConnected = false;
      this.notify();
      return {
        success: false,
        latencyMs,
        message: err.message || 'Could not reach server endpoint.',
      };
    }
  }

  public async pushToServer(serverUrlInput?: string, apiTokenInput?: string, storeId?: string): Promise<{ success: boolean; message: string }> {
    const settings = this.getSettings();
    const targetStoreId = storeId || this.getActiveStore().id;
    let baseUrl = (serverUrlInput || settings.serverSync?.serverUrl || '/api').trim();
    if (baseUrl.endsWith('/')) baseUrl = baseUrl.slice(0, -1);

    let pushUrl = baseUrl.startsWith('http') ? `${baseUrl}/api/sync/push` : `${baseUrl}/sync/push`;

    this.syncState.isSyncing = true;
    this.notify();

    try {
      const payload = {
        storeId: targetStoreId,
        deviceName: settings.deviceName || 'Hardee’s Terminal',
        clientTimestamp: new Date().toISOString(),
        inventory: this.getInventory(targetStoreId),
        countSessions: this.getCountSessions(targetStoreId),
        wasteEntries: this.getWasteEntries(targetStoreId),
        truckOrders: this.getTruckOrders(targetStoreId),
      };

      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (apiTokenInput || settings.serverSync?.apiToken) {
        headers['Authorization'] = `Bearer ${apiTokenInput || settings.serverSync?.apiToken}`;
      }

      const res = await fetch(pushUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      }

      const data = await res.json();
      this.syncState.isSyncing = false;
      this.syncState.lastSyncedAt = new Date().toISOString();
      this.saveSettings({
        serverSync: {
          ...settings.serverSync,
          lastServerSync: this.syncState.lastSyncedAt,
          serverStatus: 'connected',
        },
      });
      this.notify();
      return { success: true, message: data.message || 'Store dataset successfully pushed to central server!' };
    } catch (e: any) {
      this.syncState.isSyncing = false;
      this.notify();
      return { success: false, message: 'Push failed: ' + e.message };
    }
  }

  public async pullFromServer(serverUrlInput?: string, apiTokenInput?: string, storeId?: string): Promise<{ success: boolean; message: string }> {
    const settings = this.getSettings();
    const targetStoreId = storeId || this.getActiveStore().id;
    let baseUrl = (serverUrlInput || settings.serverSync?.serverUrl || '/api').trim();
    if (baseUrl.endsWith('/')) baseUrl = baseUrl.slice(0, -1);

    let pullUrl = baseUrl.startsWith('http') ? `${baseUrl}/api/sync/pull?storeId=${targetStoreId}` : `${baseUrl}/sync/pull?storeId=${targetStoreId}`;

    this.syncState.isSyncing = true;
    this.notify();

    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (apiTokenInput || settings.serverSync?.apiToken) {
        headers['Authorization'] = `Bearer ${apiTokenInput || settings.serverSync?.apiToken}`;
      }

      const res = await fetch(pullUrl, { method: 'GET', headers });
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      }

      const resData = await res.json();
      if (resData.data) {
        const bundle: SyncBundlePayload = {
          version: '2.4.0',
          type: 'FULL_SYNC',
          storeId: targetStoreId,
          timestamp: new Date().toISOString(),
          sender: {
            peerId: 'central-server',
            deviceName: 'Central Server',
            userName: 'Server Sync Service',
          },
          data: resData.data,
        };
        const mergeResult = this.handleIncomingSyncBundle(bundle);
        this.syncState.isSyncing = false;
        this.notify();
        return mergeResult;
      }
      this.syncState.isSyncing = false;
      this.notify();
      return { success: true, message: 'Pull completed, server store state is up to date.' };
    } catch (e: any) {
      this.syncState.isSyncing = false;
      this.notify();
      return { success: false, message: 'Pull failed: ' + e.message };
    }
  }

  public async twoWaySync(serverUrlInput?: string, apiTokenInput?: string, storeId?: string): Promise<{ success: boolean; message: string }> {
    const pushRes = await this.pushToServer(serverUrlInput, apiTokenInput, storeId);
    if (!pushRes.success) return pushRes;
    const pullRes = await this.pullFromServer(serverUrlInput, apiTokenInput, storeId);
    return pullRes;
  }

  // --- Sync Engine ---
  private loadSyncQueue() {
    const raw = localStorage.getItem(STORAGE_KEYS.SYNC_QUEUE);
    this.syncState.queue = raw ? JSON.parse(raw) : [];
  }

  private queueMutation(action: SyncQueueItem['action'], payload: any) {
    const item: SyncQueueItem = {
      id: 'sync-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
      action,
      payload,
      timestamp: new Date().toISOString(),
      retryCount: 0,
      status: 'pending',
    };

    this.syncState.queue.push(item);
    localStorage.setItem(STORAGE_KEYS.SYNC_QUEUE, JSON.stringify(this.syncState.queue));

    // Broadcast mutation to mesh peers in real-time
    this.broadcastCurrentStoreState();

    if (this.syncState.isOnline && !this.getSettings().offlineSimulation) {
      this.processSyncQueue();
    }
  }

  public async processSyncQueue() {
    if (this.syncState.queue.length === 0 || this.syncState.isSyncing) return;
    if (this.getSettings().offlineSimulation || !this.syncState.isOnline) return;

    this.syncState.isSyncing = true;
    this.notify();

    // Simulate reliable sync batch processing with server
    await new Promise((resolve) => setTimeout(resolve, 800));

    this.syncState.queue = [];
    localStorage.setItem(STORAGE_KEYS.SYNC_QUEUE, JSON.stringify([]));
    this.syncState.lastSyncedAt = new Date().toISOString();
    this.syncState.isSyncing = false;
    this.notify();
  }

  public getSyncState(): SyncState {
    return {
      ...this.syncState,
      isOnline: this.getSettings().offlineSimulation ? false : this.syncState.isOnline,
    };
  }

  public triggerManualSync(): Promise<void> {
    return this.processSyncQueue();
  }

  // --- Alerts Checker ---
  private checkStockAlerts(item: InventoryItem) {
    if (item.currentQuantity <= item.reorderThreshold) {
      this.addNotification({
        type: 'low_stock',
        title: `Low Stock Alert: ${item.name}`,
        message: `Current on-hand (${item.currentQuantity} ${item.unitType}) is at or below reorder threshold (${item.reorderThreshold}). Par is ${item.parLevel}.`,
        priority: 'high',
        actionPath: '/orders',
      });
    }
  }

  // --- Export & Import ---
  public exportFullBackupJSON(): string {
    const data = {
      version: '1.0.0',
      exportedAt: new Date().toISOString(),
      stores: this.getStores(),
      users: this.getUsers(),
      categories: this.getCategories(),
      inventory: this.getAllInventory(),
      wasteEntries: this.getWasteEntries(),
      truckOrders: this.getTruckOrders(),
      auditLogs: this.getAuditLogs(),
      settings: this.getSettings(),
    };
    return JSON.stringify(data, null, 2);
  }

  public importFullBackupJSON(jsonStr: string): { success: boolean; message: string } {
    try {
      const parsed = JSON.parse(jsonStr);
      if (parsed.inventory && Array.isArray(parsed.inventory)) {
        if (parsed.stores) localStorage.setItem(STORAGE_KEYS.STORES, JSON.stringify(parsed.stores));
        if (parsed.users) localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(parsed.users));
        if (parsed.categories) localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(parsed.categories));
        if (parsed.inventory) localStorage.setItem(STORAGE_KEYS.INVENTORY, JSON.stringify(parsed.inventory));
        if (parsed.wasteEntries) localStorage.setItem(STORAGE_KEYS.WASTE_ENTRIES, JSON.stringify(parsed.wasteEntries));
        if (parsed.truckOrders) localStorage.setItem(STORAGE_KEYS.TRUCK_ORDERS, JSON.stringify(parsed.truckOrders));
        if (parsed.settings) localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(parsed.settings));

        this.logAudit('Restored Backup', 'system', `Imported backup created at ${parsed.exportedAt || 'unknown'}`);
        this.notify();
        return { success: true, message: 'Database successfully imported!' };
      }
      return { success: false, message: 'Invalid backup file format: missing inventory list' };
    } catch (err: any) {
      return { success: false, message: 'JSON Parse Error: ' + err.message };
    }
  }

  public exportInventoryCSV(): string {
    const items = this.getInventory();
    const headers = [
      'SKU',
      'Barcode',
      'Item Name',
      'Category',
      'Storage Location',
      'Unit Type',
      'Pack Size',
      'Cost per Unit',
      'Current Quantity',
      'Par Level',
      'Min Target',
      'Max Target',
      'Reorder Threshold',
      'Vendor',
      'Last Counted Date',
      'Last Counted By',
    ];

    const categories = this.getCategories();
    const getCatName = (id: string) => categories.find((c) => c.id === id)?.name || id;

    const rows = items.map((i) => [
      `"${i.sku}"`,
      `"${i.barcode}"`,
      `"${i.name.replace(/"/g, '""')}"`,
      `"${getCatName(i.categoryId)}"`,
      `"${i.storageLocation}"`,
      `"${i.unitType}"`,
      `"${i.packSize}"`,
      (i.costPerUnit || 0).toFixed(2),
      i.currentQuantity,
      i.parLevel,
      i.minTarget,
      i.maxTarget,
      i.reorderThreshold,
      `"${i.vendor}"`,
      `"${i.lastCountedAt || ''}"`,
      `"${i.lastCountedBy || ''}"`,
    ]);

    return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  }

  public saveCountSession(session: InventoryCountSession) {
    return this.finalizeCountSession(session);
  }

  public updateUser(user: User) {
    return this.saveUser(user);
  }

  public receiveTruckOrder(
    orderId: string,
    receivedMap: Record<string, number>,
    userName: string,
    notes?: string
  ) {
    const orders = this.getTruckOrders();
    const idx = orders.findIndex((o) => o.id === orderId);
    if (idx >= 0) {
      const order = orders[idx];
      const allInventory = this.getAllInventory();

      order.items.forEach((item) => {
        const receivedQty = receivedMap[item.itemId] ?? item.orderedQuantity ?? item.orderedQty ?? 0;
        item.receivedQuantity = receivedQty;
        item.receivedQty = receivedQty;

        const invIdx = allInventory.findIndex((i) => i.id === item.itemId);
        if (invIdx >= 0) {
          allInventory[invIdx].previousQuantity = allInventory[invIdx].currentQuantity;
          allInventory[invIdx].currentQuantity += receivedQty;
          allInventory[invIdx].lastCountedAt = new Date().toISOString();
          allInventory[invIdx].lastCountedBy = userName;
        }
      });

      order.status = 'received';
      order.receivedAt = new Date().toISOString();
      order.receivedBy = {
        userId: 'receiver-' + Date.now(),
        userName,
      };
      if (notes) {
        order.notes = (order.notes ? order.notes + '\n' : '') + notes;
      }

      orders[idx] = order;
      localStorage.setItem(STORAGE_KEYS.TRUCK_ORDERS, JSON.stringify(orders));
      localStorage.setItem(STORAGE_KEYS.INVENTORY, JSON.stringify(allInventory));

      this.logAudit(
        'Received Truck Delivery',
        'truck_order',
        `PO #${order.orderNumber} received by ${userName}`
      );
      this.notify();
    }
  }

  public setOnlineStatus(isOnline: boolean) {
    this.syncState.isOnline = isOnline;
    this.saveSettings({ offlineSimulation: !isOnline });
    this.notify();
  }

  public triggerSync() {
    return this.triggerManualSync();
  }

  public resetToFactoryData() {
    localStorage.removeItem(STORAGE_KEYS.STORES);
    localStorage.removeItem(STORAGE_KEYS.USERS);
    localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
    localStorage.removeItem(STORAGE_KEYS.CATEGORIES);
    localStorage.removeItem(STORAGE_KEYS.INVENTORY);
    localStorage.removeItem(STORAGE_KEYS.COUNT_SESSIONS);
    localStorage.removeItem(STORAGE_KEYS.ACTIVE_COUNT_SESSION);
    localStorage.removeItem(STORAGE_KEYS.WASTE_ENTRIES);
    localStorage.removeItem(STORAGE_KEYS.TRUCK_ORDERS);
    localStorage.removeItem(STORAGE_KEYS.AUDIT_LOGS);
    localStorage.removeItem(STORAGE_KEYS.NOTIFICATIONS);
    localStorage.removeItem(STORAGE_KEYS.SETTINGS);
    localStorage.removeItem(STORAGE_KEYS.SYNC_QUEUE);
    this.init();
    this.notify();
  }

  public exportDatabaseJSON(): string {
    return this.exportFullBackupJSON();
  }

  public importDatabaseJSON(jsonStr: string) {
    const res = this.importFullBackupJSON(jsonStr);
    if (!res.success) {
      throw new Error(res.message);
    }
  }

  public markAllNotificationsRead() {
    return this.markAllNotificationsAsRead();
  }
}

export const storage = new StorageService();
export const StorageServiceInstance = storage;
export { StorageService };
export default storage;
