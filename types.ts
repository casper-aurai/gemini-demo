
export type ProjectStatus = 'concept' | 'planning' | 'prototyping' | 'fabrication' | 'wiring' | 'assembly' | 'calibration' | 'finished';

export type TaskStatus = 'pending' | 'in_progress' | 'done';

export type MachineStatus = 'operational' | 'degraded' | 'down' | 'maintenance' | 'retired';

export type ViewMode = 'dashboard' | 'stockroom' | 'machines' | 'library' | 'supply' | 'analytics' | 'system';

export interface SecuritySettings {
    passphrase: string;
    cloudEnabled: boolean;
    cloudEndpoint: string;
    encryptCloudPayloads?: boolean;
}

export type ThemePreference = 'dark' | 'light' | 'system';
export type DensityPreference = 'comfortable' | 'compact';

export interface NotificationPreferences {
    alerts: boolean;
    maintenance: boolean;
    digest: boolean;
}

export interface UserPreferences {
    appearance: {
        theme: ThemePreference;
        density: DensityPreference;
    };
    localization: {
        language: string;
        timezone: string;
    };
    notifications: NotificationPreferences;
}

export interface BackupSettings {
    intervalMinutes: number;
    retention: number;
}

export type NotificationSource = 'inventory' | 'maintenance' | 'vendor';

export interface NotificationLink {
    view: ViewMode;
    id?: string;
}

export interface Notification {
    id: string;
    type: 'alert' | 'info' | 'success';
    message: string;
    timestamp: number;
    read: boolean;
    source: NotificationSource;
    link?: NotificationLink;
}

export interface ProjectTask {
  id: string;
  text: string;
  status: TaskStatus;
}

export interface Project {
  id: string;
  title: string;
  description: string;
  status: ProjectStatus;
  createdAt: number;
  imageUrl?: string;
  notes?: string;
  bom?: BOMItem[];
  tasks?: ProjectTask[];
  chatHistory?: ChatMessage[];
}

export interface BOMItem {
  itemName: string;
  quantity: number;
  specifications: string;
  category: string;
  unitCost?: number;
  notes?: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: number;
  images?: string[];
}

export interface InventoryItem {
    id: string;
    name: string;
    category: string;
    quantity: number;
    unit: string;
    location: string;
    minLevel: number;
    lastUpdated?: number;
    cost?: number;
}

export interface MachineMaintenanceEntry {
    date: number;
    note: string;
    cost?: number;
    technician?: string;
    parts?: string[];
}

export interface MachineStatusChange {
    date: number;
    status: MachineStatus;
    note?: string;
}

export interface MachineMaintenanceWindow {
    id: string;
    title: string;
    start: number;
    end: number;
    technician?: string;
    type?: string;
}

export interface Machine {
    id: string;
    name: string;
    type: string;
    status: MachineStatus;
    lastService: number;
    nextService: number;
    image?: string;
    notes?: string;
    maintenanceLog?: MachineMaintenanceEntry[];
    statusHistory?: MachineStatusChange[];
    utilization?: number[];
    maintenanceWindows?: MachineMaintenanceWindow[];
}

export interface Vendor {
    id: string;
    name: string;
    website: string;
    category: string;
    rating: number; // 1-5
    leadTime?: string; // e.g., "2 Days"
    lastOrder?: number;
    notes?: string;
}

export type LibraryDocType = 'pdf' | 'image' | 'link' | 'note';

export interface ReferenceDoc {
    id: string;
    title: string;
    type: LibraryDocType;
    description?: string;
    folder?: string;
    url?: string; // external link
    fileName?: string;
    previewData?: string; // data url for inline preview
    tags: string[];
    relatedInventoryIds?: string[];
    relatedMachineIds?: string[];
    dateAdded: number;
}

export enum ProjectTab {
    OVERVIEW = 'overview',
    OPERATIONS = 'operations',
    BOM = 'bom'
}
