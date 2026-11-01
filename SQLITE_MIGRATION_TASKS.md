
# SQLite Migration Plan

- [x] **1. Architecture & IPC Setup**
    - [x] Create `database/schema.js` for table definitions.
    - [x] Create `database/db.js` for connection management.
    - [x] Define IPC channels in `main.js`.
    
- [x] **2. Electron Configuration**
    - [x] Update `preload.js` to expose a `window.api.database` object.
    - [x] Ensure `main.js` correctly initializes the DB.

- [x] **3. Frontend Refactoring (The Big One)**
    - [x] Create/Update `lib/sqliteStorage.ts` or `lib/storage.ts`.
    - [x] Modify `lib/storage.ts` to switch between SQLite and localStorage.
    - [x] Update React components to handle async loading.

- [x] **4. Data Migration Strategy**
    - [x] Create a legacy migration function.
    - [x] Read all `localStorage` keys.
    - [x] Send to main process via IPC.
    - [x] Set `migration_complete` flag.

- [x] **5. Native Module Fixes**
    - [x] Run `npm install` and `npm run rebuild` to ensure `better-sqlite3` works.
