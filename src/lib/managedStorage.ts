import { 
  Product, 
  Order, 
  Return, 
  Provider, 
  Employee, 
  Bill, 
  Cashier, 
  CashierActivity, 
  DailySales, 
  UnknownProduct, 
  UnknownRequest, 
  TopReturn,
  Report,
  Category,
  Customer,
  Redemption,
  storage,
} from './storage';
import { STORAGE_KEYS } from './storageKeys';

// فئة إدارة التخزين المُدار
export class ManagedStorage<T> {
  private storageKey: string;
  private backupEnabled: boolean;
  private autoSync: boolean;

  constructor(storageKey: string, options: { backupEnabled?: boolean; autoSync?: boolean } = {}) {
    this.storageKey = storageKey;
    this.backupEnabled = options.backupEnabled ?? false; // تعطيل النسخ الاحتياطي التلقائي
    this.autoSync = options.autoSync ?? true;
  }

  // الحصول على جميع العناصر
  getAll(): T[] {
    return storage.get<T[]>(this.storageKey) || [];
  }

  // الحصول على عنصر بالمعرف
  getById(id: string): T | null {
    const items = this.getAll();
    return items.find((item: T) => (item as T & { id: string }).id === id) || null;
  }

  // إضافة عنصر جديد
  add(item: Omit<T, 'id' | 'createdAt' | 'updatedAt'>): T {
    const items = this.getAll();
    const newItem: T = {
      ...item,
      id: `${Date.now().toString()}-${Math.random().toString(36).substring(2, 9)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    } as T;
    
    items.push(newItem);
    this.save(items);
    return newItem;
  }

  // تحديث عنصر
  update(id: string, updates: Partial<Omit<T, 'id' | 'createdAt'>>): T | null {
    const items = this.getAll();
    const index = items.findIndex((item: T) => (item as T & { id: string }).id === id);
    
    if (index === -1) return null;
    
    items[index] = {
      ...items[index],
      ...updates,
      updatedAt: new Date().toISOString()
    } as T;
    
    this.save(items);
    return items[index];
  }

  // تحديث عنصر بدون إرسال حدث
  updateSilently(id: string, updates: Partial<Omit<T, 'id' | 'createdAt'>>): T | null {
    const items = this.getAll();
    const index = items.findIndex((item: T) => (item as T & { id: string }).id === id);
    
    if (index === -1) return null;
    
    items[index] = {
      ...items[index],
      ...updates,
      updatedAt: new Date().toISOString()
    } as T;
    
    this.save(items, true);
    return items[index];
  }

  // حذف عنصر
  delete(id: string): boolean {
    const items = this.getAll();
    const filtered = items.filter((item: T) => (item as T & { id: string }).id !== id);
    
    if (filtered.length === items.length) return false;
    
    this.save(filtered);
    return true;
  }

  // حفظ البيانات
  private save(items: T[], silent: boolean = false): void {
    storage.set(this.storageKey, items);
    
    if (this.backupEnabled) {
      this.createBackup(items);
    }
    
    if (this.autoSync && typeof window !== 'undefined' && !silent) {
      window.dispatchEvent(new Event('storage-updated'));
    }
  }

  // إنشاء نسخة احتياطية
  private createBackup(items: T[]): void {
    const backupKey = `${this.storageKey}_backup_${Date.now()}`;
    storage.set(backupKey, items);
    
    // الاحتفاظ بآخر 5 نسخ احتياطية فقط
    const backupKeys = Object.keys(localStorage)
      .filter(key => key.startsWith(`${this.storageKey}_backup_`))
      .sort()
      .reverse();
    
    if (backupKeys.length > 5) {
      backupKeys.slice(5).forEach(key => localStorage.removeItem(key));
    }
  }

  // استيراد البيانات
  import(data: T[]): void {
    this.save(data);
  }

  // تصدير البيانات
  export(): T[] {
    return this.getAll();
  }

  // مسح جميع البيانات
  clear(): void {
    this.save([]);
    // حذف جميع النسخ الاحتياطية المرتبطة بهذا المفتاح
    this.clearAllBackups();
  }

  // حذف جميع النسخ الاحتياطية
  private clearAllBackups(): void {
    const backupKeys = Object.keys(localStorage)
      .filter(key => key.startsWith(`mpm_${this.storageKey}_backup_`));
    
    backupKeys.forEach(key => localStorage.removeItem(key));
    console.log(`Cleared ${backupKeys.length} backup files for ${this.storageKey}`);
  }

  // دالة عامة لحذف جميع النسخ الاحتياطية في النظام
  static clearAllSystemBackups(): void {
    const allKeys = Object.keys(localStorage);
    const backupKeys = allKeys.filter(key => key.includes('_backup_'));
    
    backupKeys.forEach(key => localStorage.removeItem(key));
    console.log(`Cleared ${backupKeys.length} system backup files`);
  }
}

// إنشاء مثيلات مُدارة لكل نوع بيانات
export const managedProductStorage = new ManagedStorage<Product>(STORAGE_KEYS.PRODUCTS);
export const managedOrderStorage = new ManagedStorage<Order>(STORAGE_KEYS.ORDERS);
export const managedReturnsStorage = new ManagedStorage<Return>(STORAGE_KEYS.RETURNS);
export const managedProviderStorage = new ManagedStorage<Provider>(STORAGE_KEYS.PROVIDERS);
export const managedEmployeeStorage = new ManagedStorage<Employee>(STORAGE_KEYS.EMPLOYEES);
export const managedBillStorage = new ManagedStorage<Bill>(STORAGE_KEYS.BILLS);
export const managedCashierStorage = new ManagedStorage<Cashier>(STORAGE_KEYS.CASHIERS);

class CashierActivityStorage extends ManagedStorage<CashierActivity> {}
export const managedCashierActivityStorage = new CashierActivityStorage(STORAGE_KEYS.CASHIER_ACTIVITIES);

class DailySalesStorage extends ManagedStorage<DailySales> {}
export const managedDailySalesStorage = new DailySalesStorage(STORAGE_KEYS.DAILY_SALES);

class UnknownProductStorage extends ManagedStorage<UnknownProduct> {
  recordSale(id: string, quantity: number, price: number, cashierId?: string, cashierName?: string): void {
    const product = this.getById(id);
    if (product) {
      // تحديث الكمية المباعة بإضافة الكمية الجديدة
      const newQuantity = (product.quantity || 0) + quantity;
      this.update(id, {
        quantity: newQuantity,
        totalSales: (product.totalSales || 0) + (quantity * price),
        cashierId,
        cashierName,
        updatedAt: new Date().toISOString()
      });
      
      // تحديث المنتج المعروف إذا وُجد
      const knownProduct = managedProductStorage.getAll().find(p => p.name.toLowerCase() === product.name.toLowerCase());
      if (knownProduct) {
        const newSold = (knownProduct.sold || 0) + quantity;
        managedProductStorage.update(knownProduct.id, { sold: newSold });
      }
    }
  }

  async convertToProduct(id: string, newName: string, serialNumber: string, purchasePrice: number, tax: number): Promise<Product | null> {
    const unknownProduct = this.getById(id);
    if (!unknownProduct) return null;

    const existingProduct = managedProductStorage.getAll().find(p => p.name.toLowerCase() === newName.toLowerCase());
    const unknownSales = unknownProduct.totalSales || 0;
    const unknownQuantity = unknownProduct.price > 0 ? Math.round(unknownSales / unknownProduct.price) : 0;

    if (existingProduct) {
      const profitFromUnknown = unknownSales - (unknownQuantity * (existingProduct.purchasePrice || 0));
      managedProductStorage.update(existingProduct.id, {
        totalSales: (existingProduct.totalSales || 0) + unknownSales,
        sold: (existingProduct.sold || 0) + unknownQuantity,
        profit: (existingProduct.profit || 0) + profitFromUnknown,
      });
      this.delete(id);
      return managedProductStorage.getById(existingProduct.id);
    } else {
      const profit = unknownSales - (unknownQuantity * (purchasePrice || 0));

      const newProduct = managedProductStorage.add({
        name: newName,
        serialNumber,
        price: unknownProduct.price,
        purchasePrice,
        tax,
        quantity: 0, // New products start with 0 stock unless specified
        totalSales: unknownSales,
        sold: unknownQuantity,
        profit: profit,
      });
      this.delete(id);
      return newProduct;
    }
  }
}
export const managedUnknownProductStorage = new UnknownProductStorage(STORAGE_KEYS.UNKNOWN_PRODUCTS);
export const managedUnknownRequestStorage = new ManagedStorage<UnknownRequest>(STORAGE_KEYS.UNKNOWN_REQUESTS);
export const managedTopReturnStorage = new ManagedStorage<TopReturn>(STORAGE_KEYS.TOP_RETURNS);
export const managedReportsStorage = new ManagedStorage<Report>(STORAGE_KEYS.REPORTS);
export const managedCategoryStorage = new ManagedStorage<Category>(STORAGE_KEYS.CATEGORIES);
export const managedCustomerStorage = new ManagedStorage<Customer>(STORAGE_KEYS.CUSTOMERS);
export const managedRedemptionStorage = new ManagedStorage<Redemption>(STORAGE_KEYS.REDEMPTIONS);

// إضافة الوظائف المخصصة للطلبات المجهولة
Object.assign(managedUnknownRequestStorage, {
  getLast5: (): UnknownRequest[] => {
    const requests = managedUnknownRequestStorage.getAll();
    return requests
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5);
  }
});

// إضافة الوظائف المخصصة للمرتجعات العليا
Object.assign(managedTopReturnStorage, {
  getRecent: (limit: number = 10): TopReturn[] => {
    const returns = managedTopReturnStorage.getAll();
    return returns
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, limit);
  },

  getTopAggregated: (limit: number = 10): TopReturn[] => {
    const returns = managedTopReturnStorage.getAll();
    
    const aggregated: { [productId: string]: TopReturn } = {};
    for (const ret of returns) {
      if (!aggregated[ret.productId]) {
        aggregated[ret.productId] = { ...ret, quantity: Number(ret.quantity) };
      } else {
        aggregated[ret.productId].quantity += Number(ret.quantity);
      }
    }
    
    return Object.values(aggregated)
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, limit);
  }
});

// إضافة الوظائف المخصصة للكاشير
Object.assign(managedCashierStorage, {
  getByCode: (code: string): Cashier | null => {
    const cashiers = managedCashierStorage.getAll();
    return cashiers.find(c => c.code === code) || null;
  },

  login: (code: string, password: string): Cashier | null => {
    const cashiers = managedCashierStorage.getAll();
    const cashier = cashiers.find(c => c.code === code);
    if (cashier && (cashier as any).password === password) {
      managedCashierStorage.update(cashier.id, {
        lastLoginAt: new Date().toISOString()
      });
      return cashier;
    }
    return null;
  }
});

// إضافة الوظائف المخصصة لنشاط الكاشير
Object.assign(managedCashierActivityStorage, {
  getByCashierId: (cashierId: string): CashierActivity[] => {
    const activities = managedCashierActivityStorage.getAll();
    return activities.filter(a => a.cashierId === cashierId);
  },

  logActivity: (cashierId: string, cashierName: string, activityType: 'login' | 'logout' | 'order_completed' | 'order_cancelled' | 'return_processed' | 'unknown_product_added', description: string, orderId?: string, productId?: string, productName?: string, amount?: number): CashierActivity => {
    return managedCashierActivityStorage.add({
      cashierId,
      cashierName,
      activityType,
      description,
      orderId,
      productId,
      productName,
      amount,
      timestamp: new Date().toISOString()
    });
  }
});

// إضافة الوظائف المخصصة للمبيعات اليومية
Object.assign(managedDailySalesStorage, {
  getByDate: (date: string): DailySales | null => {
    const sales = managedDailySalesStorage.getAll();
    return sales.find(s => s.date === date) || null;
  },

  getLastWeek: (): DailySales[] => {
    const sales = managedDailySalesStorage.getAll();
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    
    return sales
      .filter(s => new Date(s.date) >= weekAgo)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  },

  getLast15Days: (): DailySales[] => {
    const sales = managedDailySalesStorage.getAll();
    const fifteenDaysAgo = new Date();
    fifteenDaysAgo.setDate(fifteenDaysAgo.getDate() - 15);
    
    return sales
      .filter(s => new Date(s.date) >= fifteenDaysAgo)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  },

  addOrUpdate: (date: string, sales: number, orders: number): DailySales => {
    const existing = managedDailySalesStorage.getAll().find(s => s.date === date);
    if (existing) {
      // Update existing daily sales record with new totals
      return managedDailySalesStorage.update(existing.id, {
        totalAmount: Math.max(0, sales), // Ensure sales is not negative
        orderCount: Math.max(0, orders) // Ensure orders is not negative
      }) ?? null; // Return null if update fails instead of forcing non-null
    } else {
      return managedDailySalesStorage.add({
        date,
        totalAmount: sales,
        orderCount: orders
      });
    }
  },

  recordOrder: (orderTotal: number): void => {
    const today = new Date().toISOString().split('T')[0];
    const existing = managedDailySalesStorage.getAll().find(s => s.date === today);
    
    if (existing) {
      managedDailySalesStorage.update(existing.id, {
        totalAmount: (existing.totalAmount || 0) + orderTotal,
        orderCount: existing.orderCount + 1
      });
    } else {
      managedDailySalesStorage.add({
        date: today,
        totalAmount: orderTotal,
        orderCount: 1
      });
    }
  }
});