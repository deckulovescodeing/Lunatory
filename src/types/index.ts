export type UserRole = 'crew' | 'manager' | 'gm' | 'admin';

export interface User {
  id: string;
  name: string;
  title?: string; // Job title e.g. "General Manager", "Shift Leader", "Kitchen Prep Lead", "Biscuit Specialist"
  email: string;
  role: UserRole;
  employeeId?: string;
  pinCode: string;
  avatarUrl?: string;
  avatarColor?: string; // Hex or tailwind color
  avatarEmoji?: string; // e.g. "⭐", "🍔", "🦊", "👑", "🍳", "📦"
  phoneNumber?: string;
  department?: string; // e.g. "Kitchen / Back of House", "Drive-Thru & Front", "Store Management"
  preferredShift?: string; // e.g. "Opening (5 AM - 1 PM)", "Mid (11 AM - 7 PM)", "Closing (4 PM - 12 AM)"
  emergencyContact?: string;
  favoriteItemIds?: string[]; // Quick-access inventory items pinned by this user
  shiftNotes?: string; // User personal handover notes / shift scratchpad
  shiftStartTime?: string; // ISO string when active shift started
  storeIds: string[];
  activeStoreId?: string;
  lastLogin?: string;
}

export interface Store {
  id: string;
  storeNumber: string;
  name: string;
  brand?: string;
  address: string;
  city: string;
  state: string;
  zip?: string;
  zipCode?: string;
  phone?: string;
  phoneNumber?: string;
  truckDays: string[]; // e.g. ["Monday", "Thursday"] or ["Tuesday", "Friday"]
  orderCutoffHours?: number; // e.g. 14 for 2:00 PM
  cutoffHour?: number;
  cutoffDay?: string; // e.g. "Sunday" or "2 Days Prior"
  cutoffTimeStr?: string; // e.g. "14:00" or "2:00 PM EST"
  defaultParMultiplier?: number;
  leadTimeDays: number;
  currencySymbol?: string;
  notes?: string;
}

export type StorageLocation = 
  | 'Walk-in Freezer'
  | 'Walk-in Cooler'
  | 'Dry Storage Room'
  | 'Front Counter / Dispenser'
  | 'Kitchen Prep Line'
  | 'Chemical / Supply Rack';

export type UnitType = 
  | 'case'
  | 'bag'
  | 'box'
  | 'lb'
  | 'each'
  | 'carton'
  | 'gallon'
  | 'pack'
  | 'roll';

export interface Category {
  id: string;
  name: string;
  iconName: string;
  color: string;
  sortOrder: number;
  description: string;
}

export interface InventoryItem {
  id: string;
  storeId: string;
  sku: string;
  barcode: string;
  name: string;
  categoryId: string;
  unitType: UnitType;
  packSize: string; // e.g., "4 x 10 lb bags (40 lb total)"
  unitsPerPack: number; // e.g. 4
  vendor: string;
  costPerUnit: number;
  parLevel: number;
  minTarget: number;
  maxTarget: number;
  reorderThreshold: number;
  currentQuantity: number;
  previousQuantity: number;
  storageLocation: StorageLocation;
  notes?: string;
  lastCountedAt?: string;
  lastCountedBy?: string;
  usageRatePerDay: number; // estimated average units used per day
  wasteLast7Days: number;
  isPopular?: boolean;
}

export interface CountItemRecord {
  itemId: string;
  itemName: string;
  counted: number;
  systemExpected: number;
  variance: number;
  varianceCost: number;
  notes?: string;
  skipped?: boolean;
  timestamp: string;
}

export interface CountEntry {
  itemId: string;
  itemName: string;
  expectedQuantity: number;
  countedQuantity: number;
  variance: number;
  dollarVariance: number;
  unitType: UnitType;
  notes?: string;
}

export interface InventoryCountSession {
  id: string;
  storeId: string;
  date?: string;
  startedAt: string;
  completedAt?: string;
  status: 'draft' | 'submitted' | 'reviewed' | 'approved' | 'completed';
  countedBy: {
    userId: string;
    userName: string;
    role?: UserRole;
  };
  approvedBy?: {
    userId: string;
    userName: string;
  };
  location?: StorageLocation | 'All Locations';
  categoryFilter?: string; // all or specific category
  counts?: Record<string, CountItemRecord>;
  entries?: CountEntry[];
  totalItemsCounted: number;
  totalVarianceCost?: number;
  notes?: string;
}

export type WasteReason = 
  | 'expired'
  | 'dropped_floor'
  | 'overcooked_burnt'
  | 'hold_time_expired'
  | 'prep_trim_loss'
  | 'damaged_shipping'
  | 'quality_check'
  | 'customer_remake'
  | 'Hold time expired'
  | 'Dropped / Spilled on floor'
  | 'Burnt / Overcooked on grill'
  | 'Damaged packaging / Case crushed'
  | 'Expired shelf date'
  | 'Quality inspection rejection'
  | 'Customer return / Remake'
  | 'Prep / Thaw loss'
  | 'Equipment failure / Freezer thaw';

export interface WasteEntry {
  id: string;
  storeId: string;
  itemId: string;
  itemName: string;
  categoryId?: string;
  quantity: number;
  unitType?: UnitType;
  unit?: UnitType;
  unitCost?: number;
  costPerUnit?: number;
  totalCost: number;
  reason: WasteReason;
  timestamp: string;
  loggedBy: {
    userId: string;
    userName: string;
    role?: UserRole;
  };
  notes?: string;
}

export interface TruckOrderItem {
  itemId: string;
  itemName: string;
  categoryId?: string;
  sku?: string;
  unit?: UnitType;
  unitType?: UnitType;
  packSize: string;
  unitCost: number;
  totalCost?: number;
  currentStock?: number;
  currentQuantity?: number;
  parLevel: number;
  dailyUsage?: number;
  suggestedQty?: number;
  suggestedQuantity?: number;
  orderedQty?: number;
  orderedQuantity?: number;
  receivedQty?: number;
  receivedQuantity?: number;
  status?: 'pending' | 'ok' | 'shortage' | 'overage' | 'damaged';
  reasonForSuggestion?: string;
  notes?: string;
}

export interface TruckOrder {
  id: string;
  storeId: string;
  orderNumber: string;
  vendor: string;
  createdDate?: string;
  createdAt?: string;
  scheduledDeliveryDate?: string;
  deliveryDate?: string;
  cutoffTime?: string;
  status: 'suggested' | 'reviewed' | 'ordered' | 'received' | 'partially_received';
  items: TruckOrderItem[];
  totalCost?: number;
  totalEstimatedCost?: number;
  totalActualCost?: number;
  createdBy: {
    userId: string;
    userName: string;
    role?: UserRole;
  };
  receivedBy?: {
    userId: string;
    userName: string;
    role?: UserRole;
  };
  receivedAt?: string;
  notes?: string;
}

export interface AuditLog {
  id: string;
  storeId: string;
  userId: string;
  userName: string;
  action: string;
  category: 'inventory' | 'count' | 'waste' | 'truck_order' | 'system' | 'auth';
  details: string;
  timestamp: string;
}

export interface AppNotification {
  id: string;
  type: 'low_stock' | 'count_reminder' | 'truck_reminder' | 'sync_status' | 'waste_alert' | 'system';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  priority: 'high' | 'medium' | 'low';
  actionPath?: string;
}

export type TimeTheme = 'auto_time' | 'night' | 'morning' | 'day' | 'sunset';

export interface ServerSyncConfig {
  enabled: boolean;
  serverUrl: string; // e.g. "http://localhost:3000" or custom server URL
  apiToken?: string;
  autoSyncIntervalSec: number; // 0 for manual/off, 30, 60, 300
  lastServerSync?: string;
  serverStatus?: 'connected' | 'disconnected' | 'error' | 'syncing' | 'untested';
  latencyMs?: number;
  errorMessage?: string;
}

export interface NearbyPeer {
  peerId: string;
  deviceName: string;
  userName?: string;
  role?: UserRole;
  activeStoreId?: string;
  lastSeen: number;
  isSelf?: boolean;
}

export interface SyncBundlePayload {
  version: string;
  type: 'FULL_SYNC' | 'DIFF_SYNC' | 'COUNT_UPDATE' | 'ITEM_UPDATE' | 'PING';
  storeId: string;
  timestamp: string;
  sender: {
    peerId: string;
    deviceName: string;
    userName: string;
  };
  data: {
    inventory?: InventoryItem[];
    countSessions?: InventoryCountSession[];
    wasteEntries?: WasteEntry[];
    truckOrders?: TruckOrder[];
    categories?: Category[];
  };
}

export interface AppSettings {
  themeMode: TimeTheme;
  soundEnabled: boolean;
  notificationSounds: boolean;
  soundVolume: number; // 0 to 1
  foxGuideEnabled: boolean;
  guideReactivity: 'high' | 'medium' | 'minimal';
  reducedMotion: boolean;
  activeStoreId: string;
  offlineSimulation: boolean;
  standaloneOfflineMode: boolean; // 100% offline local mode, no server needed
  developerModeUnlocked: boolean;
  lowStockThresholdPercent: number; // e.g. 30% of par
  autoSaveIntervalSeconds: number;
  serverSync: ServerSyncConfig;
  p2pMeshEnabled: boolean;
  deviceName: string;
}

export interface SyncQueueItem {
  id: string;
  action: 'UPDATE_ITEM' | 'ADD_ITEM' | 'DELETE_ITEM' | 'SAVE_COUNT' | 'LOG_WASTE' | 'SAVE_ORDER' | 'RECEIVE_ORDER';
  payload: any;
  timestamp: string;
  retryCount: number;
  status: 'pending' | 'syncing' | 'failed' | 'synced';
}

export interface SyncState {
  isOnline: boolean;
  isSyncing: boolean;
  lastSyncedAt: string;
  queue: SyncQueueItem[];
  hasConflicts: boolean;
  connectedPeersCount: number;
  serverConnected: boolean;
  mode: 'offline_standalone' | 'server_connected' | 'p2p_mesh';
  lastP2PSync?: string;
}
