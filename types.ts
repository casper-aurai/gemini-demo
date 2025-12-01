
export type ProjectStatus = 'concept' | 'planning' | 'prototyping' | 'fabrication' | 'wiring' | 'assembly' | 'calibration' | 'finished';

export type TaskStatus = 'pending' | 'in_progress' | 'done';

export type MachineStatus = 'operational' | 'degraded' | 'down' | 'maintenance' | 'retired';

export type ViewMode = 'dashboard' | 'stockroom' | 'machines' | 'library' | 'supply' | 'analytics' | 'system';

export interface Notification {
    id: string;
    type: 'alert' | 'info' | 'success';
    message: string;
    timestamp: number;
    read: boolean;
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

export interface Machine {
    id: string;
    name: string;
    type: string;
    status: MachineStatus;
    lastService: number;
    nextService: number;
    image?: string;
    notes?: string;
    maintenanceLog?: { date: number; note: string }[];
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

export interface ReferenceDoc {
    id: string;
    title: string;
    type: 'datasheet' | 'manual' | 'standard' | 'receipt';
    url?: string; // external link
    tags: string[];
    dateAdded: number;
}

export enum ProjectTab {
    OVERVIEW = 'overview',
    OPERATIONS = 'operations',
    BOM = 'bom'
}
