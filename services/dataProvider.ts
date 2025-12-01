import { InventoryItem, Machine, Project, ReferenceDoc, Vendor } from '../types';

export interface SystemSnapshot {
    projects: Project[];
    inventory: InventoryItem[];
    machines: Machine[];
    vendors: Vendor[];
    docs: ReferenceDoc[];
}

const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder();

const bufferToBase64 = (buffer: ArrayBuffer) => btoa(String.fromCharCode(...new Uint8Array(buffer)));
const base64ToBuffer = (value: string) => Uint8Array.from(atob(value), (c) => c.charCodeAt(0));

const deriveKey = async (passphrase: string, salt: Uint8Array) => {
    const keyMaterial = await crypto.subtle.importKey(
        'raw',
        textEncoder.encode(passphrase),
        'PBKDF2',
        false,
        ['deriveKey']
    );

    return crypto.subtle.deriveKey(
        {
            name: 'PBKDF2',
            salt,
            iterations: 250000,
            hash: 'SHA-256'
        },
        keyMaterial,
        { name: 'AES-GCM', length: 256 },
        false,
        ['encrypt', 'decrypt']
    );
};

export const encryptSnapshot = async (snapshot: SystemSnapshot, passphrase: string) => {
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const key = await deriveKey(passphrase, salt);
    const payload = textEncoder.encode(JSON.stringify(snapshot));
    const encrypted = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, payload);

    return JSON.stringify({
        iv: bufferToBase64(iv),
        salt: bufferToBase64(salt),
        cipher: bufferToBase64(encrypted)
    });
};

export const decryptSnapshot = async (data: string, passphrase: string): Promise<SystemSnapshot> => {
    const parsed = JSON.parse(data);
    if (!parsed.iv || !parsed.salt || !parsed.cipher) {
        throw new Error('Invalid encrypted payload');
    }

    const iv = base64ToBuffer(parsed.iv);
    const salt = base64ToBuffer(parsed.salt);
    const cipher = base64ToBuffer(parsed.cipher);

    const key = await deriveKey(passphrase, salt);
    const decrypted = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, cipher);
    return JSON.parse(textDecoder.decode(decrypted));
};

export interface DataProvider {
    loadSnapshot(): Promise<SystemSnapshot | null>;
    saveSnapshot(snapshot: SystemSnapshot): Promise<void>;
}

export class EncryptedLocalStorageProvider implements DataProvider {
    constructor(private storageKey: string, private getPassphrase: () => string) {}

    async loadSnapshot(): Promise<SystemSnapshot | null> {
        const raw = localStorage.getItem(this.storageKey);
        if (!raw) return null;

        try {
            return await decryptSnapshot(raw, this.getPassphrase());
        } catch {
            // Backward compatibility: attempt plain JSON parsing
            try {
                return JSON.parse(raw) as SystemSnapshot;
            } catch (err) {
                console.error('Failed to load snapshot', err);
                return null;
            }
        }
    }

    async saveSnapshot(snapshot: SystemSnapshot) {
        const encrypted = await encryptSnapshot(snapshot, this.getPassphrase());
        localStorage.setItem(this.storageKey, encrypted);
    }
}

export class CloudSyncProvider implements DataProvider {
    constructor(private endpoint: string, private getPassphrase: () => string) {}

    async loadSnapshot(): Promise<SystemSnapshot | null> {
        const response = await fetch(this.endpoint, { method: 'GET' });
        if (!response.ok) throw new Error('Failed to fetch snapshot');
        const body = await response.json();
        if (!body?.payload) return null;
        return decryptSnapshot(body.payload, this.getPassphrase());
    }

    async saveSnapshot(snapshot: SystemSnapshot) {
        const payload = await encryptSnapshot(snapshot, this.getPassphrase());
        await fetch(this.endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ payload })
        });
    }
}
