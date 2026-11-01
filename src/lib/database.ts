// Note: Database operations are not available in browser environment
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

// مسار قاعدة البيانات (for Node.js/Electron only)
const DB_PATH = isBrowser ? '' : 'data/store.db';

// إنشاء اتصال قاعدة البيانات
let db: unknown;

if (!isBrowser) {
  // Database operations would be initialized here in Node.js/Electron
  console.warn('Database operations not available in browser environment');
} else {
  console.log('Running in browser mode - database operations disabled');
}

// إنشاء الجداول
function createTables() {
  // جدول المنتجات
  db.exec(`
    CREATE TABLE IF NOT EXISTS products (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      price REAL NOT NULL,
      purchasePrice REAL DEFAULT 0,
      quantity INTEGER NOT NULL,
      sold INTEGER DEFAULT 0,
      totalSales REAL DEFAULT 0,
      salesAmount REAL DEFAULT 0,
      profit REAL DEFAULT 0,
      category TEXT,
      description TEXT,
      barcode TEXT,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL
    )
  `);

  // جدول الطلبات
  db.exec(`
    CREATE TABLE IF NOT EXISTS orders (
      id TEXT PRIMARY KEY,
      customerName TEXT,
      totalAmount REAL NOT NULL,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL,
      cashierId TEXT,
      cashierName TEXT,
      items TEXT NOT NULL -- JSON string
    )
  `);

  // جدول المرتجعات
  db.exec(`
    CREATE TABLE IF NOT EXISTS returns (
      id TEXT PRIMARY KEY,
      orderId TEXT NOT NULL,
      productId TEXT NOT NULL,
      productName TEXT NOT NULL,
      quantity INTEGER NOT NULL,
      date TEXT NOT NULL,
      reason TEXT,
      notes TEXT,
      returnAmount REAL DEFAULT 0,
      returnTime TEXT,
      processedBy TEXT,
      processedAt TEXT
    )
  `);

  // جدول الموردين
  db.exec(`
    CREATE TABLE IF NOT EXISTS providers (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      contactInfo TEXT,
      address TEXT,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL
    )
  `);

  // جدول الموظفين
  db.exec(`
    CREATE TABLE IF NOT EXISTS employees (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      position TEXT,
      salary REAL DEFAULT 0,
      contactInfo TEXT,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL
    )
  `);

  // جدول الفواتير
  db.exec(`
    CREATE TABLE IF NOT EXISTS bills (
      id TEXT PRIMARY KEY,
      providerId TEXT NOT NULL,
      providerName TEXT NOT NULL,
      amount REAL NOT NULL,
      description TEXT,
      date TEXT NOT NULL,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL
    )
  `);

  // جدول المنتجات المجهولة
  db.exec(`
    CREATE TABLE IF NOT EXISTS unknown_products (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      price REAL NOT NULL,
      quantity INTEGER NOT NULL,
      totalSales REAL NOT NULL,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL,
      cashierId TEXT,
      cashierName TEXT
    )
  `);

  // جدول طلبات المنتجات المجهولة
  db.exec(`
    CREATE TABLE IF NOT EXISTS unknown_requests (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      price REAL NOT NULL,
      time TEXT NOT NULL,
      date TEXT NOT NULL,
      cashierId TEXT,
      cashierName TEXT,
      createdAt TEXT NOT NULL
    )
  `);

  // جدول أعلى المرتجعات
  db.exec(`
    CREATE TABLE IF NOT EXISTS top_returns (
      id TEXT PRIMARY KEY,
      productId TEXT NOT NULL,
      productName TEXT NOT NULL,
      originalPrice REAL NOT NULL,
      returnPrice REAL NOT NULL,
      quantity INTEGER NOT NULL,
      date TEXT NOT NULL,
      cashierId TEXT,
      cashierName TEXT
    )
  `);

  console.log('Database tables created successfully');
}

// فئة قاعدة البيانات العامة
class DatabaseStorage<T extends { id: string }> {
  private tableName: string;
  private insertStmt: Database.Statement;
  private updateStmt: Database.Statement;
  private deleteStmt: Database.Statement;
  private selectAllStmt: Database.Statement;
  private selectByIdStmt: Database.Statement;
  private countStmt: Database.Statement;

  constructor(tableName: string, columns: string[], values: string[]) {
    this.tableName = tableName;
    
    // إعداد الاستعلامات المحضرة
    this.insertStmt = db.prepare(`INSERT INTO ${tableName} (${columns.join(', ')}) VALUES (${values.join(', ')})`);
    this.updateStmt = db.prepare(`UPDATE ${tableName} SET ${columns.slice(1).map(col => `${col} = @${col}`).join(', ')} WHERE id = @id`);
    this.deleteStmt = db.prepare(`DELETE FROM ${tableName} WHERE id = ?`);
    this.selectAllStmt = db.prepare(`SELECT * FROM ${tableName}`);
    this.selectByIdStmt = db.prepare(`SELECT * FROM ${tableName} WHERE id = ?`);
    this.countStmt = db.prepare(`SELECT COUNT(*) as count FROM ${tableName}`);
  }

  getAll(): T[] {
    try {
      return this.selectAllStmt.all() as T[];
    } catch (error) {
      console.error(`Error getting all from ${this.tableName}:`, error);
      return [];
    }
  }

  getById(id: string): T | undefined {
    try {
      return this.selectByIdStmt.get(id) as T | undefined;
    } catch (error) {
      console.error(`Error getting by id from ${this.tableName}:`, error);
      return undefined;
    }
  }

  add(item: T): void {
    try {
      this.insertStmt.run(item);
    } catch (error) {
      console.error(`Error adding to ${this.tableName}:`, error);
    }
  }

  update(id: string, updates: Partial<T>): void {
    try {
      this.updateStmt.run({ ...updates, id });
    } catch (error) {
      console.error(`Error updating ${this.tableName}:`, error);
    }
  }

  delete(id: string): void {
    try {
      this.deleteStmt.run(id);
    } catch (error) {
      console.error(`Error deleting from ${this.tableName}:`, error);
    }
  }

  clear(): void {
    try {
      db.exec(`DELETE FROM ${this.tableName}`);
    } catch (error) {
      console.error(`Error clearing ${this.tableName}:`, error);
    }
  }

  count(): number {
    try {
      const result = this.countStmt.get() as { count: number };
      return result.count;
    } catch (error) {
      console.error(`Error counting ${this.tableName}:`, error);
      return 0;
    }
  }
}

// إنشاء الجداول
createTables();

// إنشاء مخازن البيانات
export const dbProductStorage = new DatabaseStorage<Product>(
  'products',
  ['id', 'name', 'price', 'purchasePrice', 'quantity', 'sold', 'totalSales', 'salesAmount', 'profit', 'category', 'description', 'barcode', 'createdAt', 'updatedAt'],
  ['@id', '@name', '@price', '@purchasePrice', '@quantity', '@sold', '@totalSales', '@salesAmount', '@profit', '@category', '@description', '@barcode', '@createdAt', '@updatedAt']
);

export const dbOrderStorage = new DatabaseStorage<Order & { items: string }>(
  'orders',
  ['id', 'customerName', 'totalAmount', 'createdAt', 'updatedAt', 'cashierId', 'cashierName', 'items'],
  ['@id', '@customerName', '@totalAmount', '@createdAt', '@updatedAt', '@cashierId', '@cashierName', '@items']
);

export const dbReturnStorage = new DatabaseStorage<Return>(
  'returns',
  ['id', 'orderId', 'productId', 'productName', 'quantity', 'date', 'reason', 'notes', 'returnAmount', 'returnTime', 'processedBy', 'processedAt'],
  ['@id', '@orderId', '@productId', '@productName', '@quantity', '@date', '@reason', '@notes', '@returnAmount', '@returnTime', '@processedBy', '@processedAt']
);

export const dbProviderStorage = new DatabaseStorage<Provider>(
  'providers',
  ['id', 'name', 'contactInfo', 'address', 'createdAt', 'updatedAt'],
  ['@id', '@name', '@contactInfo', '@address', '@createdAt', '@updatedAt']
);

export const dbEmployeeStorage = new DatabaseStorage<Employee>(
  'employees',
  ['id', 'name', 'position', 'salary', 'contactInfo', 'createdAt', 'updatedAt'],
  ['@id', '@name', '@position', '@salary', '@contactInfo', '@createdAt', '@updatedAt']
);

export const dbBillStorage = new DatabaseStorage<Bill>(
  'bills',
  ['id', 'providerId', 'providerName', 'amount', 'description', 'date', 'createdAt', 'updatedAt'],
  ['@id', '@providerId', '@providerName', '@amount', '@description', '@date', '@createdAt', '@updatedAt']
);

export const dbUnknownProductStorage = new DatabaseStorage<UnknownProduct>(
  'unknown_products',
  ['id', 'name', 'price', 'quantity', 'totalSales', 'createdAt', 'updatedAt', 'cashierId', 'cashierName'],
  ['@id', '@name', '@price', '@quantity', '@totalSales', '@createdAt', '@updatedAt', '@cashierId', '@cashierName']
);

export const dbUnknownRequestStorage = new DatabaseStorage<UnknownRequest>(
  'unknown_requests',
  ['id', 'name', 'price', 'time', 'date', 'cashierId', 'cashierName', 'createdAt'],
  ['@id', '@name', '@price', '@time', '@date', '@cashierId', '@cashierName', '@createdAt']
);

export const dbTopReturnStorage = new DatabaseStorage<TopReturn>(
  'top_returns',
  ['id', 'productId', 'productName', 'originalPrice', 'returnPrice', 'quantity', 'date', 'cashierId', 'cashierName'],
  ['@id', '@productId', '@productName', '@originalPrice', '@returnPrice', '@quantity', '@date', '@cashierId', '@cashierName']
);

// دالة لنقل البيانات من localStorage إلى قاعدة البيانات
export function migrateFromLocalStorageToDatabase(): void {
  try {
    // نقل المنتجات
    const products = JSON.parse(localStorage.getItem('products') || '[]');
    if (products.length > 0) {
      products.forEach((product: Product) => dbProductStorage.add(product));
      console.log(`Migrated ${products.length} products to database`);
    }

    // نقل الطلبات
    const orders = JSON.parse(localStorage.getItem('orders') || '[]');
    if (orders.length > 0) {
      orders.forEach((order: Order) => {
        dbOrderStorage.add({ ...order, items: JSON.stringify(order.items) });
      });
      console.log(`Migrated ${orders.length} orders to database`);
    }

    // نقل المرتجعات
    const returns = JSON.parse(localStorage.getItem('returns') || '[]');
    if (returns.length > 0) {
      returns.forEach((returnItem: Return) => dbReturnStorage.add(returnItem));
      console.log(`Migrated ${returns.length} returns to database`);
    }

    // نقل الموردين
    const providers = JSON.parse(localStorage.getItem('providers') || '[]');
    if (providers.length > 0) {
      providers.forEach((provider: Provider) => dbProviderStorage.add(provider));
      console.log(`Migrated ${providers.length} providers to database`);
    }

    // نقل الموظفين
    const employees = JSON.parse(localStorage.getItem('employees') || '[]');
    if (employees.length > 0) {
      employees.forEach((employee: Employee) => dbEmployeeStorage.add(employee));
      console.log(`Migrated ${employees.length} employees to database`);
    }

    // نقل الفواتير
    const bills = JSON.parse(localStorage.getItem('bills') || '[]');
    if (bills.length > 0) {
      bills.forEach((bill: Bill) => dbBillStorage.add(bill));
      console.log(`Migrated ${bills.length} bills to database`);
    }

    // نقل المنتجات المجهولة
    const unknownProducts = JSON.parse(localStorage.getItem('unknownProducts') || '[]');
    if (unknownProducts.length > 0) {
      unknownProducts.forEach((product: UnknownProduct) => dbUnknownProductStorage.add(product));
      console.log(`Migrated ${unknownProducts.length} unknown products to database`);
    }

    // نقل طلبات المنتجات المجهولة
    const unknownRequests = JSON.parse(localStorage.getItem('unknownRequests') || '[]');
    if (unknownRequests.length > 0) {
      unknownRequests.forEach((request: UnknownRequest) => dbUnknownRequestStorage.add(request));
      console.log(`Migrated ${unknownRequests.length} unknown requests to database`);
    }

    // نقل أعلى المرتجعات
    const topReturns = JSON.parse(localStorage.getItem('topReturns') || '[]');
    if (topReturns.length > 0) {
      topReturns.forEach((topReturn: TopReturn) => dbTopReturnStorage.add(topReturn));
      console.log(`Migrated ${topReturns.length} top returns to database`);
    }

    console.log('Database migration completed successfully!');
  } catch (error) {
    console.error('Error during database migration:', error);
  }
}

// دالة لإنشاء نسخة احتياطية من قاعدة البيانات
export function createDatabaseBackup(): string {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupPath = path.join(path.dirname(DB_PATH), `backup-${timestamp}.db`);
  
  try {
    db.backup(backupPath);
    console.log(`Database backup created: ${backupPath}`);
    return backupPath;
  } catch (error) {
    console.error('Error creating database backup:', error);
    throw error;
  }
}

// إغلاق قاعدة البيانات عند إنهاء التطبيق
process.on('exit', () => {
  db.close();
});

process.on('SIGINT', () => {
  db.close();
  process.exit(0);
});

export { db };