
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Project, ProjectStatus, InventoryItem, Machine, Vendor, ReferenceDoc, ViewMode, Notification, SecuritySettings } from './types';
import ProjectCard from './components/ProjectCard';
import ProjectDetail from './components/ProjectDetail';
import Stockroom from './components/Stockroom';
import MachinePark from './components/MachinePark';
import ReferenceLibrary from './components/ReferenceLibrary';
import SupplyChain from './components/SupplyChain';
import Analytics from './components/Analytics';
import SystemCore from './components/SystemCore';
import CommandPalette from './components/CommandPalette';
import SearchService, { SearchEntry } from './services/searchService';
import { CloudSyncProvider, EncryptedLocalStorageProvider, SystemSnapshot } from './services/dataProvider';
import { Badge, Box as MuiBox, Button, IconButton, Stack, Typography } from '@mui/material';
import SettingsMenu from './components/SettingsMenu';
import { useDensity } from './designSystem';

import {
    LayoutDashboard, Plus, Search, Box, Package, Settings,
    Book, Truck, BarChart3, Database, ChevronRight, Command
} from 'lucide-react';

const App: React.FC = () => {
  const { density } = useDensity();
  // --- STATE MANAGEMENT ---
  const [currentView, setCurrentView] = useState<ViewMode>('dashboard');
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  
  const [projects, setProjects] = useState<Project[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [machines, setMachines] = useState<Machine[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [docs, setDocs] = useState<ReferenceDoc[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    const unsubscribe = notificationService.subscribe(setNotifications);
    return () => unsubscribe();
  }, []);

  const loadSecuritySettings = (): SecuritySettings => {
    const raw = localStorage.getItem('construct_os_security_settings');
    if (raw) {
        try {
            const parsed = JSON.parse(raw);
            return {
                passphrase: parsed.passphrase || 'construct-os-local',
                cloudEnabled: Boolean(parsed.cloudEnabled),
                cloudEndpoint: parsed.cloudEndpoint || 'http://localhost:4000/snapshot'
            };
        } catch (err) {
            console.warn('Failed to parse security settings', err);
        }
    }
    return { passphrase: 'construct-os-local', cloudEnabled: false, cloudEndpoint: 'http://localhost:4000/snapshot' };
  };

  const [securitySettings, setSecuritySettings] = useState<SecuritySettings>(() => loadSecuritySettings());
  const [syncStatus, setSyncStatus] = useState<string>('Idle');
  
  const [searchTerm, setSearchTerm] = useState('');
  
  // Command Palette State
  const [isCmdOpen, setIsCmdOpen] = useState(false);
  const [cmdQuery, setCmdQuery] = useState('');
  const [stockroomPresetSearch, setStockroomPresetSearch] = useState<string | null>(null);
  const searchIndexRef = useRef(new SearchService());

  // --- PERSISTENCE ---
  const seedSnapshot: SystemSnapshot = {
    projects: [
        {
            id: '1', title: '3-Axis CNC Router V4', description: 'Aluminum extrusion frame 1500x1500mm. NEMA 23 High Torque steppers.', status: 'wiring', createdAt: Date.now(), imageUrl: 'https://picsum.photos/seed/cnc/800/600',
            bom: [{ category: 'Frame', itemName: '2080 Extrusion', quantity: 4, specifications: '1500mm, Black Anodized', unitCost: 45.00 }],
            tasks: [{ id: '101', text: 'Assemble Base Frame', status: 'done' }], chatHistory: []
        },
        {
            id: '2', title: 'Hydraulic Log Splitter', description: '20-ton cylinder force. 6.5HP gas engine.', status: 'fabrication', createdAt: Date.now() - 10000000, imageUrl: 'https://picsum.photos/seed/hydro/800/600', bom: [], tasks: [], chatHistory: []
        }
    ],
    inventory: [
        { id: '1', name: '6061 Aluminum Plate', category: 'Raw Material', quantity: 4, unit: 'sheets', location: 'Rack 1', minLevel: 2, cost: 120 },
        { id: '2', name: 'M5x20mm SHCS', category: 'Hardware', quantity: 150, unit: 'pcs', location: 'Bin A12', minLevel: 50, cost: 0.15 }
    ],
    machines: [
        { id: '1', name: 'Bridgeport Mill', type: 'Milling', status: 'operational', lastService: Date.now() - 10000000, nextService: Date.now() + 2000000, notes: 'Quill feed sticky.' },
        { id: '2', name: 'Ender 3 Pro', type: '3D Printer', status: 'maintenance', lastService: Date.now(), nextService: Date.now() + 5000000, notes: 'Nozzle clog.' },
        { id: '3', name: 'Bosch GTS 10 XC', type: 'Table Saw', status: 'operational', lastService: Date.now() - 2000000, nextService: Date.now() + 4000000, notes: 'Blade alignment perfect.' },
        { id: '4', name: 'Bosch 18V Prof Set', type: 'Power Tools', status: 'operational', lastService: Date.now() - 5000000, nextService: Date.now() + 10000000, notes: 'Includes GSB, GDR, GKS.' },
        { id: '5', name: 'Makita DGA504', type: 'Grinder', status: 'operational', lastService: Date.now() - 1000000, nextService: Date.now() + 2000000, notes: 'Paddle switch.' },
        { id: '6', name: 'Makita DMR115', type: 'Audio', status: 'operational', lastService: Date.now() - 8000000, nextService: Date.now() + 20000000, notes: 'Workshop Radio / DAB+.' },
        { id: '7', name: 'Kärcher WD 6 P', type: 'Vacuum', status: 'degraded', lastService: Date.now() - 500000, nextService: Date.now() - 1000000, notes: 'Filter clean needed overdue.' }
    ],
    vendors: [
        { id: '1', name: 'McMaster-Carr', website: 'mcmaster.com', category: 'General', rating: 5, notes: 'Next day delivery.', leadTime: '1 Day', lastOrder: Date.now() - 86400000 },
        { id: '2', name: 'DigiKey', website: 'digikey.com', category: 'Electronics', rating: 4, leadTime: '3 Days' }
    ],
    docs: []
  };

  const snapshotFromState = (): SystemSnapshot => ({ projects, inventory, machines, vendors, docs });

  const persistSnapshot = useCallback(async (snapshot: SystemSnapshot) => {
    const localProvider = new EncryptedLocalStorageProvider('construct_os_snapshot', () => securitySettings.passphrase);
    await localProvider.saveSnapshot(snapshot);

    if (securitySettings.cloudEnabled && securitySettings.cloudEndpoint) {
        const cloudProvider = new CloudSyncProvider(securitySettings.cloudEndpoint, () => securitySettings.passphrase);
        try {
            await cloudProvider.saveSnapshot(snapshot);
            setSyncStatus('Synced to cloud');
        } catch (err) {
            console.error('Cloud sync failed', err);
            setSyncStatus('Cloud sync failed');
        }
    }
  }, [securitySettings]);

  useEffect(() => {
    const restore = async () => {
        const localProvider = new EncryptedLocalStorageProvider('construct_os_snapshot', () => securitySettings.passphrase);
        const cloudProvider = new CloudSyncProvider(securitySettings.cloudEndpoint, () => securitySettings.passphrase);
        let snapshot: SystemSnapshot | null = null;

        if (securitySettings.cloudEnabled) {
            try {
                snapshot = await cloudProvider.loadSnapshot();
                if (snapshot) setSyncStatus('Restored from cloud');
            } catch (err) {
                console.warn('Cloud restore failed', err);
                setSyncStatus('Cloud restore failed; using local data');
            }
        }

        if (!snapshot) {
            snapshot = await localProvider.loadSnapshot();
        }

        if (!snapshot) snapshot = seedSnapshot;

        setProjects(snapshot.projects);
        setInventory(snapshot.inventory);
        setMachines(snapshot.machines);
        setVendors(snapshot.vendors);
        setDocs(snapshot.docs);
        setInitialized(true);
    };

    restore();
  }, []);

  // Save on Change
  useEffect(() => localStorage.setItem('construct_os_projects', JSON.stringify(projects)), [projects]);
  useEffect(() => {
    localStorage.setItem('construct_os_inventory', JSON.stringify(inventory));
  }, [inventory]);
  useEffect(() => localStorage.setItem('construct_os_machines', JSON.stringify(machines)), [machines]);
  useEffect(() => localStorage.setItem('construct_os_vendors', JSON.stringify(vendors)), [vendors]);
  useEffect(() => localStorage.setItem('construct_os_docs', JSON.stringify(docs)), [docs]);

  useEffect(() => {
    if (!initialized) return;
    notificationService.recompute({ inventory, machines, vendors });
  }, [inventory, machines, vendors, initialized]);

  // --- GLOBAL KEYBOARD SHORTCUTS ---
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
        if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
            e.preventDefault();
            setIsCmdOpen(prev => !prev);
        }
        if (e.key === 'Escape') setIsCmdOpen(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // --- ACTIONS ---
  const addProject = useCallback((title: string) => {
    const newProject: Project = { id: Date.now().toString(), title, description: "Initialize definition...", status: 'concept', createdAt: Date.now(), bom: [], tasks: [], chatHistory: [] };
    setProjects(prev => [newProject, ...prev]);
    setSelectedProjectId(newProject.id);
  }, []);

  const updateProject = (p: Project) => setProjects(prev => prev.map(old => old.id === p.id ? p : old));
  const deleteProject = (id: string) => { if(confirm("Delete Project?")) setProjects(prev => prev.filter(p => p.id !== id)); };

  const exportSystem = () => {
      const dump = JSON.stringify({ projects, inventory, machines, vendors, docs });
      const blob = new Blob([dump], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `construct_os_backup_${Date.now()}.json`;
      link.click();
  };

  const importSystem = (json: string) => {
      const data = JSON.parse(json);
      if(data.projects) setProjects(data.projects);
      if(data.inventory) setInventory(data.inventory);
      if(data.machines) setMachines(data.machines);
      if(data.vendors) setVendors(data.vendors);
      if(data.docs) setDocs(data.docs);
  };

  const markNotificationRead = (id: string) => notificationService.markRead(id);
  const markAllNotificationsRead = () => notificationService.markAllRead();
  const handleNotificationNavigate = (link: { view: ViewMode; id?: string }) => {
    setCurrentView(link.view);
    setSelectedProjectId(null);
  };

  const updateSecuritySettings = (partial: Partial<SecuritySettings>) => {
      setSecuritySettings(prev => ({ ...prev, ...partial }));
  };

  const manualCloudSync = async () => {
      if (!initialized) return;
      await persistSnapshot(snapshotFromState());
  };

  const clearStockroomPreset = useCallback(() => setStockroomPresetSearch(null), []);

  useEffect(() => {
    const entries: SearchEntry[] = [];

    projects.forEach((p) => {
      entries.push({
        id: `project-${p.id}`,
        type: 'project',
        title: p.title,
        subtitle: p.status,
        keywords: [p.description || '', ...(p.tasks?.map((t) => t.text) || [])],
        action: () => {
          setSelectedProjectId(p.id);
          setIsCmdOpen(false);
        },
      });
    });

    inventory.forEach((item) => {
      entries.push({
        id: `inventory-${item.id}`,
        type: 'inventory',
        title: item.name,
        subtitle: `${item.quantity} ${item.unit} • ${item.location}`,
        keywords: [item.category, 'inventory', item.location],
        action: () => {
          setCurrentView('stockroom');
          setStockroomPresetSearch(item.name);
        },
      });
    });

    machines.forEach((machine) => {
      entries.push({
        id: `machine-${machine.id}`,
        type: 'machine',
        title: machine.name,
        subtitle: machine.status,
        keywords: [machine.type, machine.notes || ''],
        action: () => {
          setCurrentView('machines');
        },
      });
    });

    vendors.forEach((vendor) => {
      entries.push({
        id: `vendor-${vendor.id}`,
        type: 'vendor',
        title: vendor.name,
        subtitle: `${vendor.category} • ${vendor.leadTime || 'Lead time unknown'}`,
        keywords: [vendor.website, vendor.notes || ''],
        action: () => setCurrentView('supply'),
      });
    });

    docs.forEach((doc) => {
      entries.push({
        id: `doc-${doc.id}`,
        type: 'document',
        title: doc.title,
        subtitle: `${doc.type} • ${doc.tags.join(', ')}`,
        keywords: doc.tags,
        action: () => setCurrentView('library'),
      });
    });

    const actionEntries: SearchEntry[] = [
      {
        id: 'action-create-project',
        type: 'action',
        title: 'Create new project',
        subtitle: 'Initialize a pipeline record',
        keywords: ['new', 'project', 'add'],
        action: () => {
          const name = prompt('Project designation:');
          if (name) addProject(name);
        },
      },
      {
        id: 'action-create-inventory',
        type: 'action',
        title: 'Create inventory item',
        subtitle: 'Seed a stock entry from the palette',
        keywords: ['stock', 'inventory', 'add'],
        action: () => {
          const name = prompt('Inventory item name:');
          if (!name) return;
          const newItem: InventoryItem = {
            id: Date.now().toString(),
            name,
            category: 'General',
            quantity: 0,
            unit: 'pcs',
            location: 'Unassigned',
            minLevel: 5,
            cost: 0,
            lastUpdated: Date.now(),
          };
          setInventory((prev) => [newItem, ...prev]);
          setCurrentView('stockroom');
        },
      },
      {
        id: 'action-create-vendor',
        type: 'action',
        title: 'Register vendor',
        subtitle: 'Capture a new supply partner',
        keywords: ['vendor', 'supply', 'add'],
        action: () => {
          const name = prompt('Vendor name:');
          if (!name) return;
          const newVendor: Vendor = {
            id: Date.now().toString(),
            name,
            website: 'vendor.example.com',
            category: 'General',
            rating: 3,
            leadTime: 'Unknown',
            notes: '',
          };
          setVendors((prev) => [newVendor, ...prev]);
          setCurrentView('supply');
        },
      },
      {
        id: 'action-open-analytics',
        type: 'action',
        title: 'Open Analytics dashboard',
        subtitle: 'Navigate to operational reporting',
        keywords: ['analytics', 'dashboard', 'metrics'],
        action: () => setCurrentView('analytics'),
      },
      {
        id: 'action-open-system',
        type: 'action',
        title: 'Open System Core',
        subtitle: 'Backup, security, and sync controls',
        keywords: ['system', 'settings', 'backup'],
        action: () => setCurrentView('system'),
      },
    ];

    searchIndexRef.current.setEntries([...entries, ...actionEntries]);
  }, [projects, inventory, machines, vendors, docs, addProject]);

  // --- RENDER HELPERS ---
  const filteredProjects = projects.filter(p => p.title.toLowerCase().includes(searchTerm.toLowerCase()));
  const selectedProject = projects.find(p => p.id === selectedProjectId);

  const Breadcrumbs = () => {
      if(selectedProject) return (
          <div className="flex items-center text-xs font-mono text-zinc-500 gap-2">
              <span>Main Registry</span>
              <ChevronRight size={12} />
              <span className="text-zinc-300">{selectedProject.title}</span>
          </div>
      );
      
      const labels: Record<string, string> = {
          'dashboard': 'Main Registry',
          'stockroom': 'Resources / Stockroom',
          'machines': 'Resources / Machine Park',
          'supply': 'Resources / Supply Chain',
          'library': 'Resources / Library',
          'analytics': 'Operations / Analytics',
          'system': 'System / Core Config'
      };

      return (
          <div className="flex items-center text-xs font-mono text-zinc-500 gap-2">
             <span>Construct OS</span>
             <ChevronRight size={12} />
             <span className="text-zinc-300">{labels[currentView]}</span>
          </div>
      );
  };

  const trimmedCmdQuery = cmdQuery.trim();
  const dynamicPaletteActions: SearchEntry[] = [];

  if (trimmedCmdQuery) {
    dynamicPaletteActions.push({
      id: `action-filter-projects-${trimmedCmdQuery}`,
      type: 'action',
      title: `Filter projects by "${trimmedCmdQuery}"`,
      subtitle: 'Apply text to project registry filter',
      keywords: ['filter', 'projects', 'search'],
      action: () => {
        setCurrentView('dashboard');
        setSearchTerm(trimmedCmdQuery);
      },
    });

    dynamicPaletteActions.push({
      id: `action-filter-stock-${trimmedCmdQuery}`,
      type: 'action',
      title: `Filter inventory by "${trimmedCmdQuery}"`,
      subtitle: 'Open stockroom scoped to this query',
      keywords: ['filter', 'inventory', 'stockroom'],
      action: () => {
        setCurrentView('stockroom');
        setStockroomPresetSearch(trimmedCmdQuery);
      },
    });
  }

  const paletteResults = searchIndexRef.current.search(cmdQuery, dynamicPaletteActions);

  const handleCommandSelect = (res: SearchEntry) => {
    res.action?.();
    setIsCmdOpen(false);
  };

  // If detailed view
  if (selectedProject) {
      return (
          <ProjectDetail 
            project={selectedProject} 
            onBack={() => setSelectedProjectId(null)}
            onUpdateProject={updateProject}
          />
      );
  }

  return (
    <ResponsiveLayout
        navGroups={navGroups}
        breadcrumbs={<Breadcrumbs />}
        onOpenCommand={() => setIsCmdOpen(true)}
        headerActions={(
            <div className="relative">
                <Bell size={16} className="text-zinc-500 hover:text-zinc-300 cursor-pointer transition-colors" />
                {unreadCount > 0 && (
                    <span className="absolute -top-2 -right-2 min-w-[18px] h-[18px] px-1 bg-red-500 text-[10px] font-bold text-white rounded-full flex items-center justify-center">
                        {unreadCount}
                    </span>
                )}
            </div>
        </nav>
        
        {/* User Profile / Quick Settings */}
        <div className="p-4 border-t border-zinc-900">
            <button className="flex items-center gap-3 w-full p-2 hover:bg-zinc-900 rounded-md transition-colors">
                <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center font-bold text-xs border border-zinc-700">JS</div>
                <div className="text-left">
                    <div className="text-xs font-bold text-zinc-300">Jane Smith</div>
                    <div className="text-[10px] text-zinc-600">Lead Engineer</div>
                </div>
            </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden h-screen bg-zinc-950 relative">
        
        {/* Header */}
        <header className="h-14 border-b border-zinc-900 bg-zinc-950 flex items-center justify-between px-6 flex-shrink-0">
             <Breadcrumbs />

             <Stack direction="row" spacing={1.5} alignItems="center">
                <Button
                  variant="outlined"
                  size={density === 'compact' ? 'small' : 'medium'}
                  onClick={() => setIsCmdOpen(true)}
                  startIcon={<Command size={14} />}
                  sx={{ borderColor: 'divider', color: 'text.secondary' }}
                >
                  <Typography variant="body2" sx={{ display: { xs: 'none', sm: 'inline' } }}>
                    Search...
                  </Typography>
                  <MuiBox
                    component="span"
                    sx={{
                      fontSize: 10,
                      bgcolor: 'action.hover',
                      px: 0.75,
                      py: 0.25,
                      borderRadius: 1,
                      ml: 1,
                      display: { xs: 'none', md: 'inline-flex' },
                    }}
                  >
                    ⌘K
                  </MuiBox>
                </Button>
                <IconButton color="inherit" aria-label="notifications">
                  <Badge badgeContent={unreadCount} color="error" overlap="circular">
                    <Bell size={18} />
                  </Badge>
                </IconButton>
                <SettingsMenu />
             </Stack>
        </header>

        <CommandPalette
          isOpen={isCmdOpen}
          query={cmdQuery}
          results={paletteResults}
          onClose={() => setIsCmdOpen(false)}
          onQueryChange={setCmdQuery}
          onSelect={handleCommandSelect}
        />

        {currentView === 'dashboard' && (
            <div className="flex-1 h-full overflow-y-auto p-8 bg-zinc-950">
                 <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between mb-8">
                    <div>
                        <h2 className="text-2xl font-serif font-bold text-zinc-100">Project Registry</h2>
                        <p className="text-zinc-500 text-sm mt-1">Active pipelines and engineering status.</p>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
                         <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600" size={14} />
                            <input
                                type="text"
                                placeholder="Filter projects..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-9 pr-4 py-2 bg-zinc-900 border border-zinc-800 rounded-md text-xs focus:outline-none focus:ring-1 focus:ring-zinc-600 w-full sm:w-64 text-zinc-200"
                            />
                        </div>
                        <button
                            onClick={() => { const t = prompt("Project Designation:"); if(t) addProject(t); }}
                            className="bg-zinc-100 text-zinc-900 px-4 py-2 rounded-md text-xs font-bold hover:bg-white flex items-center gap-2 uppercase tracking-wide transition-colors"
                        >
                            <Plus size={14} /> Initialize Project
                        </button>
                    </div>
                 </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {filteredProjects.length === 0 ? (
                        <div className="col-span-full flex flex-col items-center justify-center text-zinc-700 py-20 border border-dashed border-zinc-800 rounded-xl">
                            <Box size={48} className="mb-4 opacity-20" />
                            <p className="font-mono text-sm">REGISTRY EMPTY</p>
                        </div>
                    ) : (
                        filteredProjects.map(project => (
                            <div key={project.id} onClick={() => setSelectedProjectId(project.id)} className="cursor-pointer h-full">
                                <ProjectCard
                                    project={project}
                                    onStatusChange={(id, status) => setProjects(p => p.map(pr => pr.id === id ? { ...pr, status } : pr))}
                                    onDelete={deleteProject}
                                />
                            </div>
                        ))
                    )}
                </div>
            )}

            {currentView === 'stockroom' && (
              <Stockroom
                items={inventory}
                onUpdate={setInventory}
                presetSearch={stockroomPresetSearch ?? undefined}
                onClearPresetSearch={clearStockroomPreset}
              />
            )}
            {currentView === 'machines' && <MachinePark machines={machines} onUpdate={setMachines} />}
            {currentView === 'supply' && <SupplyChain vendors={vendors} onUpdate={setVendors} />}
            {currentView === 'library' && <ReferenceLibrary docs={docs} onUpdate={setDocs} />}
            {currentView === 'analytics' && <Analytics projects={projects} inventory={inventory} machines={machines} />}
            {currentView === 'system' && (
                <SystemCore
                    exportData={exportSystem}
                    importData={importSystem}
                    securitySettings={securitySettings}
                    onUpdateSecurity={updateSecuritySettings}
                    onSync={manualCloudSync}
                    syncStatus={syncStatus}
                />
            )}
        </div>

      </main>
    </div>
  );
};

export default App;
