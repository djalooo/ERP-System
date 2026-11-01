// Note: File storage is not available in browser environment
// This module is designed for Node.js/Electron environments
import { 
  Product, 
  Order, 
  Return, 
  Provider, 
  Employee, 
  Bill, 
  UnknownProduct, 
  UnknownRequest, 
  TopReturn 
} from './storage';

// Browser compatibility check
const isBrowser = typeof window !== 'undefined';

// مسار مجلد البيانات (for Node.js/Electron only)
const DATA_DIR = isBrowser ? '' : 'data';

// أسماء ملفات البيانات
const FILES = {
  products: isBrowser ? '' : `${DATA_DIR}/products.json`,
  orders: isBrowser ? '' : `${DATA_DIR}/orders.json`,
  returns: isBrowser ? '' : `${DATA_DIR}/returns.json`,
  providers: isBrowser ? '' : `${DATA_DIR}/providers.json`,
  employees: isBrowser ? '' : `${DATA_DIR}/employees.json`,
  bills: isBrowser ? '' : `${DATA_DIR}/bills.json`,
  unknownProducts: isBrowser ? '' : `${DATA_DIR}/unknownProducts.json`,
  unknownRequests: isBrowser ? '' : `${DATA_DIR}/unknownRequests.json`,
  topReturns: isBrowser ? '' : `${DATA_DIR}/topReturns.json`,
  settings: isBrowser ? '' : `${DATA_DIR}/settings.json`
};

// قراءة البيانات من ملف (Browser fallback to localStorage)
function readFromFile<T>(filePath: string, defaultValue: T[] = []): T[] {
  if (isBrowser) {
    // Fallback to localStorage in browser
    const key = filePath.split('/').pop()?.replace('.json', '') || 'data';
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : defaultValue as T[];
  }
  
  // Node.js/Electron file operations would go here
  console.warn('File operations not available in browser environment');
  return defaultValue as T[];
}

// كتابة البيانات إلى ملف (Browser fallback to localStorage)
function writeToFile<T>(filePath: string, data: T[]): void {
  if (isBrowser) {
    // Fallback to localStorage in browser
    const key = filePath.split('/').pop()?.replace('.json', '') || 'data';
    localStorage.setItem(key, JSON.stringify(data));
    return;
  }
  
  // Node.js/Electron file operations would go here
  console.warn('File operations not available in browser environment');
}

// فئة التخزين العامة
class FileStorage<T extends { id: string }> {
  private filePath: string;
  private cache: T[] = [];
  private cacheLoaded = false;

  constructor(filePath: string) {
    this.filePath = filePath;
  }

  private loadCache(): void {
    if (!this.cacheLoaded) {
      this.cache = readFromFile<T>(this.filePath, []);
      this.cacheLoaded = true;
    }
  }

  private saveCache(): void {
    writeToFile(this.filePath, this.cache);
  }

  getAll(): T[] {
    this.loadCache();
    return [...this.cache];
  }

  getById(id: string): T | undefined {
    this.loadCache();
    return this.cache.find(item => item.id === id);
  }

  add(item: T): void {
    this.loadCache();
    this.cache.push(item);
    this.saveCache();
  }

  update(id: string, updates: Partial<T>): void {
    this.loadCache();
    const index = this.cache.findIndex(item => item.id === id);
    if (index !== -1) {
      this.cache[index] = { ...this.cache[index], ...updates };
      this.saveCache();
    }
  }

  delete(id: string): void {
    this.loadCache();
    this.cache = this.cache.filter(item => item.id !== id);
    this.saveCache();
  }

  clear(): void {
    this.cache = [];
    this.saveCache();
  }

  count(): number {
    this.loadCache();
    return this.cache.length;
  }
}

// إنشاء مخازن البيانات
export const fileProductStorage = new FileStorage<Product>(FILES.products);
export const fileOrderStorage = new FileStorage<Order>(FILES.orders);
export const fileReturnStorage = new FileStorage<Return>(FILES.returns);
export const fileProviderStorage = new FileStorage<Provider>(FILES.providers);
export const fileEmployeeStorage = new FileStorage<Employee>(FILES.employees);
export const fileBillStorage = new FileStorage<Bill>(FILES.bills);
export const fileUnknownProductStorage = new FileStorage<UnknownProduct>(FILES.unknownProducts);
export const fileUnknownRequestStorage = new FileStorage<UnknownRequest>(FILES.unknownRequests);
export const fileTopReturnStorage = new FileStorage<TopReturn>(FILES.topReturns);

// دالة لنقل البيانات من localStorage إلى الملفات
export function migrateFromLocalStorage(): void {
  try {
    // نقل المنتجات
    const products = JSON.parse(localStorage.getItem('products') || '[]');
    if (products.length > 0) {
      products.forEach((product: Product) => fileProductStorage.add(product));
      console.log(`Migrated ${products.length} products`);
    }

    // نقل الطلبات
    const orders = JSON.parse(localStorage.getItem('orders') || '[]');
    if (orders.length > 0) {
      orders.forEach((order: Order) => fileOrderStorage.add(order));
      console.log(`Migrated ${orders.length} orders`);
    }

    // نقل المرتجعات
    const returns = JSON.parse(localStorage.getItem('returns') || '[]');
    if (returns.length > 0) {
      returns.forEach((returnItem: Return) => fileReturnStorage.add(returnItem));
      console.log(`Migrated ${returns.length} returns`);
    }

    // نقل الموردين
    const providers = JSON.parse(localStorage.getItem('providers') || '[]');
    if (providers.length > 0) {
      providers.forEach((provider: Provider) => fileProviderStorage.add(provider));
      console.log(`Migrated ${providers.length} providers`);
    }

    // نقل الموظفين
    const employees = JSON.parse(localStorage.getItem('employees') || '[]');
    if (employees.length > 0) {
      employees.forEach((employee: Employee) => fileEmployeeStorage.add(employee));
      console.log(`Migrated ${employees.length} employees`);
    }

    // نقل الفواتير
    const bills = JSON.parse(localStorage.getItem('bills') || '[]');
    if (bills.length > 0) {
      bills.forEach((bill: Bill) => fileBillStorage.add(bill));
      console.log(`Migrated ${bills.length} bills`);
    }

    // نقل المنتجات المجهولة
    const unknownProducts = JSON.parse(localStorage.getItem('unknownProducts') || '[]');
    if (unknownProducts.length > 0) {
      unknownProducts.forEach((product: UnknownProduct) => fileUnknownProductStorage.add(product));
      console.log(`Migrated ${unknownProducts.length} unknown products`);
    }

    // نقل طلبات المنتجات المجهولة
    const unknownRequests = JSON.parse(localStorage.getItem('unknownRequests') || '[]');
    if (unknownRequests.length > 0) {
      unknownRequests.forEach((request: UnknownRequest) => fileUnknownRequestStorage.add(request));
      console.log(`Migrated ${unknownRequests.length} unknown requests`);
    }

    // نقل أعلى المرتجعات
    const topReturns = JSON.parse(localStorage.getItem('topReturns') || '[]');
    if (topReturns.length > 0) {
      topReturns.forEach((topReturn: TopReturn) => fileTopReturnStorage.add(topReturn));
      console.log(`Migrated ${topReturns.length} top returns`);
    }

    console.log('Migration completed successfully!');
  } catch (error) {
    console.error('Error during migration:', error);
  }
}

// دالة لإنشاء نسخة احتياطية
export function createBackup(): string {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupDir = path.join(DATA_DIR, 'backups');
  
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }

  const backupPath = path.join(backupDir, `backup-${timestamp}`);
  fs.mkdirSync(backupPath, { recursive: true });

  // نسخ جميع ملفات البيانات
  Object.entries(FILES).forEach(([key, filePath]) => {
    if (fs.existsSync(filePath)) {
      const backupFilePath = path.join(backupPath, path.basename(filePath));
      fs.copyFileSync(filePath, backupFilePath);
    }
  });

  return backupPath;
}

// دالة لاستعادة نسخة احتياطية
export function restoreBackup(backupPath: string): void {
  if (!fs.existsSync(backupPath)) {
    throw new Error('Backup path does not exist');
  }

  // استعادة جميع ملفات البيانات
  Object.entries(FILES).forEach(([key, filePath]) => {
    const backupFilePath = path.join(backupPath, path.basename(filePath));
    if (fs.existsSync(backupFilePath)) {
      fs.copyFileSync(backupFilePath, filePath);
    }
  });

  console.log('Backup restored successfully!');
}