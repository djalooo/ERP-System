import Database from 'better-sqlite3';
import path from 'path';
import { app } from 'electron';

let db = null;

export function initDatabase() {
  const userDataPath = app.getPath('userData');
  const dbPath = path.join(userDataPath, 'store.db');
  console.log('Initializing database at:', dbPath);

  try {
    db = new Database(dbPath, { verbose: console.log });
    db.pragma('journal_mode = WAL');
    createTables();
    return true;
  } catch (error) {
    console.error('Failed to initialize database:', error);
    return false;
  }
}

function createTables() {
  if (!db) return;

  const tables = [
    `CREATE TABLE IF NOT EXISTS products (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      serialNumber TEXT,
      price REAL NOT NULL,
      purchasePrice REAL DEFAULT 0,
      tax REAL DEFAULT 0,
      quantity INTEGER NOT NULL,
      sold INTEGER DEFAULT 0,
      totalSales REAL DEFAULT 0,
      profit REAL DEFAULT 0,
      categoryId TEXT,
      description TEXT,
      barcode TEXT,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL
    )`,
    `CREATE TABLE IF NOT EXISTS orders (
      id TEXT PRIMARY KEY,
      customerName TEXT,
      totalAmount REAL NOT NULL,
      amountPaid REAL DEFAULT 0,
      remainingAmount REAL DEFAULT 0,
      status TEXT,
      type TEXT DEFAULT 'regular',
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL,
      cashierId TEXT,
      cashierName TEXT,
      items TEXT NOT NULL
    )`,
    `CREATE TABLE IF NOT EXISTS returns (
      id TEXT PRIMARY KEY,
      orderId TEXT NOT NULL,
      productId TEXT NOT NULL,
      productName TEXT NOT NULL,
      quantity INTEGER NOT NULL,
      returnPrice REAL DEFAULT 0,
      purchasePrice REAL DEFAULT 0,
      date TEXT NOT NULL,
      reason TEXT,
      notes TEXT,
      status TEXT,
      processedBy TEXT,
      processedAt TEXT,
      cashierId TEXT,
      cashierName TEXT
    )`,
    `CREATE TABLE IF NOT EXISTS providers (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      phone TEXT,
      email TEXT,
      address TEXT,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL
    )`,
    `CREATE TABLE IF NOT EXISTS employees (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      phone TEXT,
      role TEXT,
      password TEXT,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL
    )`,
    `CREATE TABLE IF NOT EXISTS bills (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      amount REAL NOT NULL,
      dueDate TEXT,
      status TEXT,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL,
      paymentTime TEXT,
      paymentDate TEXT,
      procedures TEXT
    )`,
    `CREATE TABLE IF NOT EXISTS unknown_products (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      price REAL NOT NULL,
      quantity INTEGER NOT NULL,
      totalSales REAL NOT NULL,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL,
      cashierId TEXT,
      cashierName TEXT,
      orderIndex INTEGER,
      orderItemIndex INTEGER,
      linkedProductId TEXT,
      addedProfit REAL,
      hidden INTEGER DEFAULT 0
    )`,
    `CREATE TABLE IF NOT EXISTS unknown_requests (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      price REAL NOT NULL,
      time TEXT NOT NULL,
      date TEXT NOT NULL,
      cashierId TEXT,
      cashierName TEXT,
      createdAt TEXT NOT NULL
    )`,
    `CREATE TABLE IF NOT EXISTS top_returns (
      id TEXT PRIMARY KEY,
      productId TEXT NOT NULL,
      productName TEXT NOT NULL,
      originalPrice REAL NOT NULL,
      returnPrice REAL NOT NULL,
      quantity INTEGER NOT NULL,
      date TEXT NOT NULL,
      cashierId TEXT,
      cashierName TEXT,
      createdAt TEXT NOT NULL
    )`,
    `CREATE TABLE IF NOT EXISTS categories (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL
    )`,
    `CREATE TABLE IF NOT EXISTS reports (
        id TEXT PRIMARY KEY,
        content TEXT NOT NULL,
        cashierId TEXT,
        cashierName TEXT,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL
    )`,
    `CREATE TABLE IF NOT EXISTS cashiers (
      id TEXT PRIMARY KEY,
      name TEXT,
      code TEXT,
      isActive INTEGER,
      createdAt TEXT,
      lastLoginAt TEXT
    )`,
    `CREATE TABLE IF NOT EXISTS cashier_activities (
      id TEXT PRIMARY KEY,
      cashierId TEXT,
      cashierName TEXT,
      activityType TEXT,
      description TEXT,
      orderId TEXT,
      productId TEXT,
      productName TEXT,
      amount REAL,
      timestamp TEXT
    )`,
    `CREATE TABLE IF NOT EXISTS daily_sales (
      id TEXT PRIMARY KEY,
      date TEXT,
      totalAmount REAL,
      orderCount INTEGER,
      createdAt TEXT,
      updatedAt TEXT
    )`,
    `CREATE TABLE IF NOT EXISTS customers (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      points INTEGER DEFAULT 0,
      totalPurchases INTEGER DEFAULT 0,
      totalSpent REAL DEFAULT 0,
      debt REAL DEFAULT 0,
      prepaidBalance REAL DEFAULT 0,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL
    )`,
    `CREATE TABLE IF NOT EXISTS settings (
      id TEXT PRIMARY KEY,
      key TEXT NOT NULL UNIQUE,
      value TEXT NOT NULL
    )`
  ];

  tables.forEach(sql => db.prepare(sql).run());
  console.log('Tables initialized');
}

// Handler functions for IPC
export const dbHandlers = {
  getAll: (table) => {
    try {
      return db.prepare(`SELECT * FROM ${table}`).all();
    } catch (err) {
      console.error(`Error getting all from ${table}:`, err);
      // Fallback for secure query if table name is dynamic - though IPC usually sends string
      return [];
    }
  },

  getById: (table, id) => {
    return db.prepare(`SELECT * FROM ${table} WHERE id = ?`).get(id);
  },

  insert: (table, data) => {
    const keys = Object.keys(data);
    const placeholders = keys.map(() => '?').join(',');
    const stmt = db.prepare(`INSERT INTO ${table} (${keys.join(',')}) VALUES (${placeholders})`);
    return stmt.run(...Object.values(data));
  },

  update: (table, id, data) => {
    const keys = Object.keys(data);
    const setClause = keys.map(k => `${k} = ?`).join(',');
    const stmt = db.prepare(`UPDATE ${table} SET ${setClause} WHERE id = ?`);
    return stmt.run(...Object.values(data), id);
  },

  delete: (table, id) => {
    return db.prepare(`DELETE FROM ${table} WHERE id = ?`).run(id);
  },

  query: (sql, params = []) => {
    // Dangerous if SQL is raw from renderer, but acceptable for this local app migration
    // For parameterized queries, params should be array
    return db.prepare(sql).all(...params);
  },

  insertMany: (table, items) => {
    if (!items || items.length === 0) return 0;

    // Filter valid columns for this table to prevent errors with added properties
    const tableInfo = db.prepare(`PRAGMA table_info(${table})`).all();
    const validColumns = tableInfo.map(col => col.name);

    // Use first item's keys that exist in the database schema
    const keys = Object.keys(items[0]).filter(key => validColumns.includes(key));
    const placeholders = keys.map(() => '?').join(',');

    const insert = db.prepare(`INSERT OR REPLACE INTO ${table} (${keys.join(',')}) VALUES (${placeholders})`);

    const insertMany = db.transaction((rows) => {
      for (const row of rows) {
        const values = keys.map(k => row[k]);
        insert.run(...values);
      }
    });

    insertMany(items);
    return items.length;
  },

  clear: (table) => {
    // Whitelist tables to prevent unintended deletions
    // For now, allow generic
    return db.prepare(`DELETE FROM ${table}`).run();
  }
};
