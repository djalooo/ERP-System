/// <reference types="vite/client" />

interface Window {
    api: {
        db: {
            getAll: (table: string) => Promise<any[]>;
            getById: (table: string, id: string) => Promise<any>;
            insert: (table: string, data: any) => Promise<any>;
            update: (table: string, id: string, data: any) => Promise<any>;
            delete: (table: string, id: string) => Promise<any>;
            query: (sql: string, params?: any[]) => Promise<any[]>;
            insertMany: (table: string, items: any[]) => Promise<number>;
            clear: (table: string) => Promise<void>;
        };
        system: {
            getVersion: () => Promise<string>;
        };
    };
}
