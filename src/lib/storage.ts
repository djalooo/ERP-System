// استيراد نظام إدارة التخزين
import {
  managedProductStorage,
  managedOrderStorage,
  managedReturnsStorage,
  managedProviderStorage,
  managedEmployeeStorage,
  managedBillStorage,
  managedUnknownProductStorage,
  managedUnknownRequestStorage,
  managedTopReturnStorage,
  managedReportsStorage,
  managedCashierActivityStorage,
  managedDailySalesStorage,
  managedCategoryStorage,
  managedCustomerStorage,
  managedRedemptionStorage
} from './managedStorage';
import { STORAGE_KEYS } from './storageKeys';
import type { ManagedStorage } from './managedStorage';

// تصدير النظام المُدار للاستخدام في التطبيق
export const productStorage = managedProductStorage;
export const orderStorage = managedOrderStorage;
export const returnsStorage = managedReturnsStorage;
export const providerStorage = managedProviderStorage;
export const employeeStorage = managedEmployeeStorage;
export const billStorage = managedBillStorage;
export const cashierActivityStorage: ManagedStorage<CashierActivity> = managedCashierActivityStorage;
export const dailySalesStorage: ManagedStorage<DailySales> = managedDailySalesStorage;
export const unknownProductStorage: ManagedStorage<UnknownProduct> = managedUnknownProductStorage;
export const unknownRequestStorage = managedUnknownRequestStorage;
export const topReturnStorage = managedTopReturnStorage;
export const reportsStorage = managedReportsStorage;
export const categoryStorage = managedCategoryStorage;
export const customerStorage = managedCustomerStorage;
export const redemptionStorage = managedRedemptionStorage;

// --- START: Settings Management ---
export interface AppSettings {
  allowPriceModification: boolean;
  showUnknownProductButton: boolean;
}

export const settingsStorage = {
  get: (): AppSettings => {
    const defaults: AppSettings = { allowPriceModification: false, showUnknownProductButton: true };
    const settings = storage.get<AppSettings>(STORAGE_KEYS.SETTINGS);
    return { ...defaults, ...settings };
  },
  set: (settings: Partial<AppSettings>): void => {
    const current = settingsStorage.get();
    const newSettings = { ...current, ...settings };
    storage.set(STORAGE_KEYS.SETTINGS, newSettings);
  }
};
// --- END: Settings Management ---

// Optimized localStorage with in-memory cache and SQLite support
class OptimizedStorage {
  private cache: Map<string, any> = new Map();
  private writeQueue: Map<string, NodeJS.Timeout> = new Map();
  private initialized: boolean = false;
  private isElectron: boolean = false;
  private LOCAL_ONLY_KEYS = ['user', 'language', 'settings', 'pending_orders', 'pending_order_times'];

  constructor() {
    this.isElectron = typeof window !== 'undefined' && !!window.api;
  }

  async initialize(): Promise<void> {
    console.log('Initializing Optimized Storage...');

    if (this.isElectron) {
      console.log('Electron environment detected. Loading from SQLite...');
      // Explicitly iterate keys to wait for all async loads
      for (const key of Object.values(STORAGE_KEYS)) {
        if (this.LOCAL_ONLY_KEYS.includes(key)) {
          // Load local-only keys from localStorage
          try {
            const fullKey = `mpm_${key}`;
            const item = localStorage.getItem(fullKey);
            this.cache.set(key, item ? JSON.parse(item) : []);
          } catch (e) {
            this.cache.set(key, []);
          }
          continue;
        }

        try {
          // Map storage key (e.g., 'products_data') to table name if needed
          // For now, assuming table names match keys or are handled by main process mapping
          // But wait, keys like 'mpm_products' might be different from table 'products'
          // We need a mapper if they differ. Keys in 'storageKeys.ts' are like 'products', 'orders'.
          // Tables in 'database-main.js' are 'products', 'orders'. They MATCH!

          const data = await window.api!.db.getAll(key);

          // Parse JSON strings back to objects
          if (Array.isArray(data)) {
            data.forEach((item: any) => {
              Object.keys(item).forEach(k => {
                if (typeof item[k] === 'string' && (item[k].startsWith('[') || item[k].startsWith('{'))) {
                  try {
                    item[k] = JSON.parse(item[k]);
                  } catch (e) {
                    // Not valid JSON, leave as string
                  }
                }
              });
            });
          }

          this.cache.set(key, data || []);
        } catch (e) {
          console.error(`Failed to load ${key} from SQLite:`, e);
          this.cache.set(key, []);
        }
      }
    } else {
      console.log('Web environment. Loading from localStorage...');
      Object.values(STORAGE_KEYS).forEach(key => {
        const fullKey = `mpm_${key}`;
        const item = localStorage.getItem(fullKey);
        try {
          this.cache.set(key, item ? JSON.parse(item) : (key === 'settings' ? null : []));
        } catch (e) {
          // If JSON parse fails, store as raw string (common for 'language' or 'user')
          this.cache.set(key, item || (key === 'settings' ? null : []));
        }
      });
    }

    // Listen for storage events from other tabs to keep cache in sync (Web only or mixed)
    if (!this.isElectron) {
      window.addEventListener('storage', (e) => {
        if (e.key && e.key.startsWith('mpm_')) {
          const key = e.key.replace('mpm_', '');
          try {
            const newValue = e.newValue ? JSON.parse(e.newValue) : (key === 'settings' ? null : []);
            this.cache.set(key, newValue);
            console.log(`Syncing cache for ${key} from another tab`);
            window.dispatchEvent(new Event('storage-updated'));
          } catch (err) {
            console.error(`Failed to sync cache for ${key}:`, err);
          }
        }
      });
    }

    this.initialized = true;
    console.log('Storage initialized successfully');
  }

  get<T>(key: string): T | null {
    return this.cache.get(key) ?? null;
  }

  set<T>(key: string, value: T): void {
    this.cache.set(key, value);

    // Debounced write
    const existingTimeout = this.writeQueue.get(key);
    if (existingTimeout) clearTimeout(existingTimeout);

    const timeout = setTimeout(async () => {
      if (this.isElectron && !this.LOCAL_ONLY_KEYS.includes(key)) {
        // SQLite Persistence
        try {
          // For arrays (lists), we perform a full sync (Clear + InsertMany)
          // For single objects (like settings), this strategy needs a 'settings' table or key-value table.
          // Current DB schema has 'tables' for each key.
          // Exception: 'settings' key. 'database-main.js' DOES NOT HAVE a settings table.
          // We should skip settings or handle it differently.

          if (Array.isArray(value)) {
            await window.api!.db.clear(key);
            // Format data if needed (e.g. stringify arrays for text columns)
            // But 'value' here is raw JS objects.
            // database-main.js 'insertMany' expects objects matching columns.
            // We need to ensure object structure matches table columns.
            // Critical: JSON Array fields!
            // For 'products', 'serialNumbers' is array? No, table has 'serialNumber' TEXT.
            // If frontend model has 'serialNumbers' array, we must stringify it before sending to DB?
            // The `dbHandlers` don't auto-stringify.

            // Let's do a safe mapping for complex objects
            const safeItems = value.map(item => {
              const newItem: any = { ...item };
              // Convert arrays/objects to string for TEXT columns if they are not primitives
              Object.keys(newItem).forEach(k => {
                if (typeof newItem[k] === 'object' && newItem[k] !== null) {
                  newItem[k] = JSON.stringify(newItem[k]);
                }
              });
              return newItem;
            });

            if (safeItems.length > 0) {
              await window.api!.db.insertMany(key, safeItems);
            }
          }
        } catch (e) {
          console.error(`Failed to persist ${key} to SQLite:`, e);
        }
      } else {
        // LocalStorage Persistence
        try {
          const fullKey = `mpm_${key}`;
          localStorage.setItem(fullKey, JSON.stringify(value));
        } catch (e) {
          console.error(`Failed to persist ${key}:`, e);
        }
      }
      this.writeQueue.delete(key);
    }, 100); // 100ms debounce

    this.writeQueue.set(key, timeout);
  }

  remove(key: string): void {
    this.cache.delete(key);
    if (this.isElectron && !this.LOCAL_ONLY_KEYS.includes(key)) {
      // Clear table
      window.api!.db.clear(key).catch(e => console.error(e));
    } else {
      try {
        localStorage.removeItem(`mpm_${key}`);
      } catch (e) {
        console.error(`Failed to remove ${key}:`, e);
      }
    }
  }

  async migrate() {
    if (!this.isElectron) {
      console.log('Migration skipped (localStorage mode)');
      return;
    }

    if (localStorage.getItem('mpm_migration_completed')) {
      console.log('Migration already completed. Skipping.');
      return;
    }

    console.log('Starting migration from localStorage to SQLite...');
    // 1. Read all mpm_ keys from localStorage
    // 2. Parse and Insert into SQLite

    for (const key of Object.values(STORAGE_KEYS)) {
      if (this.LOCAL_ONLY_KEYS.includes(key)) continue; // Skip settings and other local-only keys

      try {
        const fullKey = `mpm_${key}`;
        const raw = localStorage.getItem(fullKey);
        if (raw) {
          const data = JSON.parse(raw);
          if (Array.isArray(data) && data.length > 0) {
            console.log(`Migrating ${key}: ${data.length} items...`);
            const safeItems = data.map(item => {
              const newItem: any = { ...item };
              Object.keys(newItem).forEach(k => {
                if (typeof newItem[k] === 'object' && newItem[k] !== null) {
                  newItem[k] = JSON.stringify(newItem[k]);
                }
              });
              return newItem;
            });

            await window.api!.db.clear(key);
            await window.api!.db.insertMany(key, safeItems);
            console.log(`Migrated ${key} successfully.`);
          }
        }
      } catch (e) {
        console.error(`Error migrating ${key}:`, e);
      }
    }

    localStorage.setItem('mpm_migration_completed', 'true');
    console.log('Data migration complete!');
  }
}

const optimizedStorage = new OptimizedStorage();

// Generic storage functions
export const storage = {
  get: <T>(key: string): T | null => {
    return optimizedStorage.get<T>(key);
  },

  set: <T>(key: string, value: T): void => {
    optimizedStorage.set(key, value);
  },

  remove: (key: string): void => {
    optimizedStorage.remove(key);
  },

  initialize: async () => {
    await optimizedStorage.initialize();
  },

  migrate: async () => {
    await optimizedStorage.migrate();
  },

  replaceAll: <T>(key: string, value: T[]): void => {
    optimizedStorage.set(key, value);
  },

  clearAllData: () => {
    console.log('Clearing all data...');
    Object.values(STORAGE_KEYS).forEach(key => storage.remove(key));
    localStorage.clear();
    console.log('All data cleared');
  },

  getStorageStatus: () => {
    return {
      products: productStorage.getAll().length,
      orders: orderStorage.getAll().length,
      returns: returnsStorage.getAll().length,
      providers: providerStorage.getAll().length,
      employees: employeeStorage.getAll().length,
      bills: billStorage.getAll().length,
      unknownProducts: unknownProductStorage.getAll().length,
      unknownRequests: unknownRequestStorage.getAll().length,
      topReturns: topReturnStorage.getAll().length,
      totalSize: 0
    };
  },

  testStorage: () => { return true; },
  cleanupOldData: () => { },
  cleanupCorruptedData: () => { }
};

// Stub functions for missing imports in AdminDashboard
export const diagnoseAndFixData = () => {
  console.log('diagnoseAndFixData called');
  return { returns: [] as Return[] };
};
export const createTestReturns = () => { console.log('createTestReturns called'); };
export const debugStorage = () => { console.log('debugStorage called'); };
export const rebuildTopReturns = () => { console.log('rebuildTopReturns called'); };

// Interfaces
export interface Product {
  id: string;
  name: string;
  serialNumber: string;
  price: number;
  purchasePrice: number;
  tax: number;
  quantity: number;
  totalSales: number;
  createdAt: string;
  updatedAt: string;
  salesAmount?: number;
  profit?: number;
  profitPerUnit?: number;
  sold?: number;
  categoryId?: string;
  description?: string;
  barcode?: string;
}

export interface Category {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

export interface Order {
  id: string;
  customerName: string;
  items: OrderItem[];
  totalAmount: number;
  amountPaid: number;
  remainingAmount: number;
  status: 'pending' | 'completed' | 'cancelled';
  type?: 'regular' | 'bank';
  bankAction?: 'debt' | 'payment' | 'use_balance';
  debtProfit?: number; // Pre-calculated profit for debt orders, allocated upon payment
  createdAt: string;
  updatedAt: string;
  cashierId?: string;
  cashierName?: string;
}

export interface Customer {
  id: string;
  name: string;
  points: number;
  totalPurchases: number;
  totalSpent: number;
  balance: number;
  createdAt: string;
  updatedAt: string;
}

export interface Redemption {
  id: string;
  customerId: string;
  customerName: string;
  type: 'points' | 'purchases';
  amount: number;
  rewardValue?: string;
  createdAt: string;
}

export interface OrderItem {
  productId: string;
  productName: string;
  quantity: number;
  price: number;
  total: number;
  originalPrice?: number;
  purchasePrice?: number;
}

export interface Provider {
  id: string;
  name: string;
  phone: string;
  email: string;
  address: string;
  createdAt: string;
}

export interface Employee {
  id: string;
  name: string;
  phone: string;
  role: string;
  password: string;
  createdAt: string;
}

export interface Cashier {
  id: string;
  name: string;
  code: string;
  isActive: boolean;
  createdAt: string;
  lastLoginAt?: string;
}

export interface CashierActivity {
  id: string;
  cashierId: string;
  cashierName: string;
  activityType: 'login' | 'logout' | 'order_completed' | 'order_cancelled' | 'return_processed' | 'unknown_product_added';
  description: string;
  orderId?: string;
  productId?: string;
  productName?: string;
  amount?: number;
  timestamp: string;
}

export interface Bill {
  id: string;
  title: string;
  amount: number;
  dueDate: string;
  status: 'paid' | 'pending' | 'overdue';
  createdAt: string;
  paymentTime?: string;
  paymentDate?: string;
  procedures?: string;
  role?: string;
  description?: string;
}

export interface Return {
  id: string;
  orderId: string;
  productId: string;
  productName: string;
  quantity: number;
  returnPrice?: number;
  purchasePrice?: number;
  date: string;
  reason?: string;
  notes?: string;
  status?: 'pending' | 'approved' | 'rejected' | 'completed';
  processedBy?: string;
  processedAt?: string;
  cashierId?: string;
  cashierName?: string;
}

export interface DailySales {
  id: string;
  date: string;
  totalAmount: number;
  orderCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface UnknownProduct {
  id: string;
  name: string;
  price: number;
  quantity: number;
  totalSales: number;
  createdAt: string;
  updatedAt: string;
  cashierId?: string;
  cashierName?: string;
  orderIndex?: number;
  orderItemIndex?: number;
  linkedProductId?: string;
  addedProfit?: number;
  hidden?: boolean;
}

export interface UnknownRequest {
  id: string;
  name: string;
  price: number;
  time: string;
  date: string;
  cashierId?: string;
  cashierName?: string;
  createdAt: string;
}

export interface TopReturn {
  id: string;
  productId: string;
  productName: string;
  originalPrice: number;
  returnPrice: number;
  quantity: number;
  date: string;
  cashierId?: string;
  cashierName?: string;
  createdAt: string;
}

export interface Report {
  id: string;
  content: string;
  cashierId?: string;
  cashierName?: string;
  createdAt: string;
  updatedAt: string;
}

export { STORAGE_KEYS };

// Helper function exports
export const cleanPassword = (password: string): string => {
  if (!password) return '';
  let cleaned = password.trim();
  cleaned = cleaned.replace(/\s+/g, '');
  const validPasswordRegex = /^[a-zA-Z0-9\u0600-\u06FF!@#$%^&*()_+\-=[]{}|;:,.<>?]+$/;
  if (!validPasswordRegex.test(cleaned)) {
    cleaned = cleaned.replace(/[^a-zA-Z0-9\u0600-\u06FF!@#$%^&*()_+\-=[]{}|;:,.<>?]/g, '');
  }
  return cleaned;
};

export const validatePassword = (password: string): { isValid: boolean; error?: string } => {
  if (!password || password.trim() === '') {
    return { isValid: false, error: 'كلمة المرور مطلوبة' };
  }
  const cleaned = cleanPassword(password);
  if (cleaned.length < 1) {
    return { isValid: false, error: 'كلمة المرور يجب أن تكون حرفًا واحدًا على الأقل' };
  }
  if (cleaned.length > 50) {
    return { isValid: false, error: 'كلمة المرور يجب أن تكون أقل من 50 حرف' };
  }
  return { isValid: true };
};

export const analytics = {
  getTotalSales: (orders: Order[], returns: Return[]): number => {
    const sales = orders
      .filter(order => {
        // Debt orders contribute 0 to sales at order time.
        // Their value is recognized via the payment order.
        if (order.type === 'bank' && order.bankAction === 'debt') return false;
        return !(order.status === 'cancelled' && order.totalAmount < 0);
      })
      .reduce((total, order) => total + order.totalAmount, 0);
    const returnsTotal = returns.reduce((total, ret) => {
      if (ret.returnPrice && ret.returnPrice > 0) {
        return total + (ret.returnPrice * ret.quantity);
      }
      const product = managedProductStorage.getById(ret.productId);
      return total + (product ? product.price * ret.quantity : 0);
    }, 0);
    return sales - returnsTotal;
  },

  getTotalOrders: (orders: Order[]): number => orders.length,

  getTotalOrdersIncludingReturns: (orders: Order[]): number => {
    return orders.filter(order => order.items.length > 0).length;
  },

  getReturnOrders: (orders: Order[]): number => {
    return orders.filter(order =>
      order.status === 'cancelled' && order.totalAmount < 0
    ).length;
  },

  getAverageOrder: (orders: Order[], returns: Return[]): number => {
    if (orders.length === 0) return 0;
    return analytics.getTotalSales(orders, returns) / orders.length;
  },

  getTotalProfit: (orders: Order[], returns: Return[], linkedUnknownProducts: UnknownProduct[] = []): number => {
    let totalProfit = 0;
    const productMap = new Map(productStorage.getAll().map(p => [p.id, p]));

    orders.forEach(order => {
      // Debt orders: profit is deferred and will be allocated proportionally when paid
      if (order.type === 'bank' && order.bankAction === 'debt') return;

      // Payment orders: unlock proportional profit from related debt orders
      if (order.type === 'bank' && order.bankAction === 'payment') {
        // Find all debt orders for this customer using debtProfit
        const customerDebtOrders = orders.filter(
          o => o.type === 'bank' && o.bankAction === 'debt' &&
               o.customerName === order.customerName &&
               typeof o.debtProfit === 'number'
        );
        const totalCustomerDebt = customerDebtOrders.reduce((s, o) => s + o.totalAmount, 0);
        const totalCustomerDebtProfit = customerDebtOrders.reduce((s, o) => s + (o.debtProfit || 0), 0);
        if (totalCustomerDebt > 0 && totalCustomerDebtProfit > 0) {
          const proportion = Math.min(1, order.totalAmount / totalCustomerDebt);
          totalProfit += proportion * totalCustomerDebtProfit;
        }
        return; // Don't process payment items below
      }

      if (order.status === 'completed') {
        let items = order.items;
        if (typeof items === 'string') {
          try { items = JSON.parse(items); } catch (e) { items = []; }
        }
        if (Array.isArray(items)) {
          items.forEach(item => {
            const purchasePriceAtSale = item.purchasePrice;
            if (typeof purchasePriceAtSale === 'number') {
              const profitPerUnit = item.price - purchasePriceAtSale;
              totalProfit += profitPerUnit * item.quantity;
            } else {
              const knownProduct = productMap.get(item.productId);
              if (knownProduct && typeof knownProduct.purchasePrice === 'number') {
                const profitPerUnit = item.price - knownProduct.purchasePrice;
                totalProfit += profitPerUnit * item.quantity;
              }
            }
          });
        }
      }
    });

    returns.forEach(ret => {
      const purchasePriceAtReturn = ret.purchasePrice;
      const salePriceAtReturn = ret.returnPrice;

      if (typeof purchasePriceAtReturn === 'number' && typeof salePriceAtReturn === 'number') {
        const profitLossPerUnit = salePriceAtReturn - purchasePriceAtReturn;
        totalProfit -= profitLossPerUnit * ret.quantity;
      } else {
        const knownProduct = productMap.get(ret.productId);
        if (knownProduct && typeof knownProduct.purchasePrice === 'number') {
          const effectiveSalePrice = salePriceAtReturn || knownProduct.price;
          const profitLossPerUnit = effectiveSalePrice - knownProduct.purchasePrice;
          totalProfit -= profitLossPerUnit * ret.quantity;
        }
      }
    });

    linkedUnknownProducts.forEach(up => {
      if (up.linkedProductId && typeof up.addedProfit === 'number') {
        totalProfit += up.addedProfit;
      }
    });

    return totalProfit;
  },

  getTopProducts: (orders: Order[], returns: Return[], limit?: number, allUnknownProducts: UnknownProduct[] = []): { name: string; sales: number; quantity: number; profit: number; sold: number }[] => {
    const productSales: { [key: string]: { quantity: number; sales: number; price: number; profit: number } } = {};
    const allKnownProducts = productStorage.getAll();
    const knownProductMapById = new Map(allKnownProducts.map(p => [p.id, p]));
    const knownProductMapByName = new Map(allKnownProducts.map(p => [p.name.toLowerCase(), p]));

    const linkMap = new Map<string, string>();
    if (allUnknownProducts) {
      allUnknownProducts.forEach(up => {
        if (up.linkedProductId) {
          const knownProduct = knownProductMapById.get(up.linkedProductId);
          if (knownProduct) {
            linkMap.set(up.name.toLowerCase(), knownProduct.name);
          }
        }
      });
    }

    orders.forEach(order => {
      let items = order.items;
      if (typeof items === 'string') {
        try { items = JSON.parse(items); } catch (e) { items = []; }
      }
      if (Array.isArray(items)) {
        items.forEach(item => {
          const originalName = item.productName;
          const finalProductName = linkMap.get(originalName?.toLowerCase() || '') || originalName;

          if (!productSales[finalProductName]) {
            const productInfo = knownProductMapByName.get(finalProductName?.toLowerCase() || '');
            productSales[finalProductName] = { quantity: 0, sales: 0, price: productInfo?.price ?? item.price, profit: 0 };
          }

          productSales[finalProductName].quantity += item.quantity;
          productSales[finalProductName].sales += item.total;

          const productInfo = knownProductMapByName.get(finalProductName?.toLowerCase() || '');
          const purchasePrice = item.purchasePrice ?? (productInfo?.purchasePrice || 0);
          const itemProfit = (item.price - purchasePrice) * item.quantity;
          productSales[finalProductName].profit += itemProfit;
        });
      }
    });

    // Subtract returns
    const pendingReturns: { [key: string]: number } = {};
    returns.forEach(ret => {
      const originalName = ret.productName;
      const finalProductName = linkMap.get(originalName.toLowerCase()) || originalName;
      if (!pendingReturns[finalProductName]) pendingReturns[finalProductName] = 0;
      pendingReturns[finalProductName] += ret.quantity;
    });

    const result = Object.entries(productSales).map(([name, data]) => {
      const returnQty = pendingReturns[name] || 0;
      const netQuantity = data.quantity - returnQty;
      const netSales = data.sales - (returnQty * data.price);
      // Profit adjustment for returns is complex without exact original cost, assuming avg
      const avgProfit = data.profit / data.quantity;
      const netProfit = data.profit - (returnQty * avgProfit);

      return {
        name,
        sales: netSales,
        quantity: netQuantity,
        profit: netProfit,
        sold: netQuantity
      };
    });

    return result.sort((a, b) => b.sales - a.sales).slice(0, limit);
  },

  getDailyProfit: (orders: Order[], returns: Return[]): { [date: string]: number } => {
    const dailyProfit: { [date: string]: number } = {};
    const productMap = new Map(productStorage.getAll().map(p => [p.id, p]));

    orders.forEach(order => {
      if (order.status === 'completed') {
        const date = order.createdAt.split('T')[0];
        if (!dailyProfit[date]) dailyProfit[date] = 0;

        let items = order.items;
        if (typeof items === 'string') {
          try { items = JSON.parse(items); } catch (e) { items = []; }
        }
        if (Array.isArray(items)) {
          items.forEach(item => {
            const purchasePrice = item.purchasePrice ?? productMap.get(item.productId)?.purchasePrice ?? 0;
            dailyProfit[date] += (item.price - purchasePrice) * item.quantity;
          });
        }
      }
    });

    returns.forEach(ret => {
      const date = ret.date.split('T')[0];
      if (!dailyProfit[date]) dailyProfit[date] = 0;

      const purchasePrice = ret.purchasePrice ?? productMap.get(ret.productId)?.purchasePrice ?? 0;
      const salePrice = ret.returnPrice || productMap.get(ret.productId)?.price || 0;
      dailyProfit[date] -= (salePrice - purchasePrice) * ret.quantity;
    });

    return dailyProfit;
  }
};
