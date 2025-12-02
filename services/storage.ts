import { decryptSnapshot, encryptSnapshot, SystemSnapshot } from './dataProvider';

export interface BackupSummary {
    id: string;
    createdAt: number;
    label?: string;
    encrypted: boolean;
    size: number;
}

interface StoredBackup extends BackupSummary {
    payload: string;
}

export interface BackupOptions {
    label?: string;
    passphrase?: string;
}

export class IndexedDBStorage {
    private dbPromise: Promise<IDBDatabase>;

    constructor(private dbName = 'construct_os', private storeName = 'backups') {
        this.dbPromise = this.open();
    }

    private open(): Promise<IDBDatabase> {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, 1);
            request.onupgradeneeded = () => {
                const db = request.result;
                if (!db.objectStoreNames.contains(this.storeName)) {
                    db.createObjectStore(this.storeName, { keyPath: 'id' });
                }
            };
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    private async transaction(mode: IDBTransactionMode) {
        const db = await this.dbPromise;
        return db.transaction(this.storeName, mode).objectStore(this.storeName);
    }

    async saveSnapshot(snapshot: SystemSnapshot, options: BackupOptions = {}): Promise<string> {
        const id = `${Date.now()}`;
        const encrypted = Boolean(options.passphrase);
        const payload = encrypted
            ? await encryptSnapshot(snapshot, options.passphrase || '')
            : JSON.stringify(snapshot);

        const record: StoredBackup = {
            id,
            createdAt: Date.now(),
            label: options.label,
            encrypted,
            payload,
            size: payload.length,
        };

        const store = await this.transaction('readwrite');
        await new Promise((resolve, reject) => {
            const request = store.put(record);
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });

        return id;
    }

    async listBackups(): Promise<BackupSummary[]> {
        const store = await this.transaction('readonly');
        return new Promise((resolve, reject) => {
            const request = store.getAll();
            request.onsuccess = () => {
                const results = (request.result as StoredBackup[]).map(({ payload, ...meta }) => meta);
                results.sort((a, b) => b.createdAt - a.createdAt);
                resolve(results);
            };
            request.onerror = () => reject(request.error);
        });
    }

    async loadSnapshot(id: string, passphrase?: string): Promise<SystemSnapshot | null> {
        const store = await this.transaction('readonly');
        return new Promise((resolve, reject) => {
            const request = store.get(id);
            request.onsuccess = async () => {
                const record = request.result as StoredBackup | undefined;
                if (!record) return resolve(null);

                try {
                    if (record.encrypted) {
                        if (!passphrase) throw new Error('Passphrase required for encrypted backup');
                        const snapshot = await decryptSnapshot(record.payload, passphrase);
                        resolve(snapshot);
                    } else {
                        resolve(JSON.parse(record.payload));
                    }
                } catch (error) {
                    reject(error);
                }
            };
            request.onerror = () => reject(request.error);
        });
    }

    async deleteBackup(id: string): Promise<void> {
        const store = await this.transaction('readwrite');
        await new Promise((resolve, reject) => {
            const request = store.delete(id);
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async prune(retention: number): Promise<void> {
        const backups = await this.listBackups();
        const excess = backups.slice(retention);
        await Promise.all(excess.map(b => this.deleteBackup(b.id)));
    }
}
