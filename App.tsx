
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Project, ProjectStatus, InventoryItem, Machine, Vendor, ReferenceDoc, ViewMode, Notification, SecuritySettings } from './types';
import ProjectCard from './components/ProjectCard';
import ProjectDetail from './components/ProjectDetail';
import Stockroom from './components/Stockroom';
import MachinePark from './components/MachinePark';
import Library from './components/Library';
import SupplyChain from './components/SupplyChain';
import Analytics from './components/Analytics';
import SystemCore from './components/SystemCore';
import { CloudSyncProvider, EncryptedLocalStorageProvider, SystemSnapshot } from './services/dataProvider';

import {
    LayoutDashboard, Plus, Search, Box, Package, Settings,
    Book, Truck, BarChart3, Database, Bell, ChevronRight, Command
} from 'lucide-react';

const App: React.FC = () => {
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
  const cmdInputRef = useRef<HTMLInputElement>(null);

  const reconcileInventoryNotifications = (
    items: InventoryItem[],
    existingNotifications: Notification[],
  ): Notification[] => {
    const nonInventory = existingNotifications.filter(n => !n.id.startsWith('inv-'));

    const inventoryAlerts = items
      .filter(item => item.quantity <= item.minLevel)
      .map(item => {
        const id = `inv-${item.id}`;
        const previous = existingNotifications.find(n => n.id === id);

        return {
          id,
          type: 'alert' as const,
          message: `Low stock: ${item.name} (${item.quantity} ${item.unit})`,
          timestamp: previous?.timestamp ?? Date.now(),
          read: previous?.read ?? false,
        };
      });

    return [...nonInventory, ...inventoryAlerts];
  };

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
    docs: [
        {
            id: 'd1',
            title: 'Safety Manual - 3 Axis Router',
            type: 'pdf',
            folder: 'Machines',
            url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
            tags: ['safety', 'cnc'],
            relatedMachineIds: ['1'],
            description: 'Lockout and startup procedure reference for the CNC router.',
            dateAdded: Date.now() - 1000000
        },
        {
            id: 'd2',
            title: 'Material Cert - 6061 Plate',
            type: 'image',
            folder: 'Materials',
            fileName: '6061-cert.svg',
            previewData: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="320" height="180" viewBox="0 0 320 180"><defs><linearGradient id="g" x1="0" x2="1" y1="0" y2="1"><stop offset="0%" stop-color="%23e2e8f0"/><stop offset="100%" stop-color="%23cbd5e1"/></linearGradient></defs><rect width="320" height="180" rx="16" fill="url(%23g)"/><text x="24" y="72" font-size="18" fill="%233334" font-family="Arial" font-weight="700">Material Certificate</text><text x="24" y="104" font-size="13" fill="%23555" font-family="Arial">Alloy 6061-T6 | Batch ACX-4471</text><text x="24" y="128" font-size="12" fill="%2371717a" font-family="Arial">Heat Treated / Anodize Ready</text></svg>',
            tags: ['material', 'qa'],
            relatedInventoryIds: ['1'],
            description: 'Supplier provided certificate of conformance for the plate stock.',
            dateAdded: Date.now() - 500000
        },
        {
            id: 'd3',
            title: 'Ender 3 Quick Service Checklist',
            type: 'note',
            folder: 'Service',
            tags: ['maintenance', '3d printing'],
            relatedMachineIds: ['2'],
            description: 'Five minute preflight check for common 3D printer issues.',
            dateAdded: Date.now() - 250000
        }
    ]
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
        setNotifications([
            { id: '1', type: 'alert', message: 'Kärcher WD 6 P maintenance overdue', timestamp: Date.now(), read: false },
            { id: '2', type: 'info', message: 'Low stock: 6061 Aluminum', timestamp: Date.now() - 100000, read: false }
        ]);
        setInitialized(true);
    };

    restore();
  }, []);

  // Save on Change
  useEffect(() => localStorage.setItem('construct_os_projects', JSON.stringify(projects)), [projects]);
  useEffect(() => {
    localStorage.setItem('construct_os_inventory', JSON.stringify(inventory));
    setNotifications(prev => reconcileInventoryNotifications(inventory, prev));
  }, [inventory]);
  useEffect(() => localStorage.setItem('construct_os_machines', JSON.stringify(machines)), [machines]);
  useEffect(() => localStorage.setItem('construct_os_vendors', JSON.stringify(vendors)), [vendors]);
  useEffect(() => localStorage.setItem('construct_os_docs', JSON.stringify(docs)), [docs]);

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

  useEffect(() => {
      if(isCmdOpen && cmdInputRef.current) {
          cmdInputRef.current.focus();
      }
  }, [isCmdOpen]);

  // --- ACTIONS ---
  const addProject = (title: string) => {
    const newProject: Project = { id: Date.now().toString(), title, description: "Initialize definition...", status: 'concept', createdAt: Date.now(), bom: [], tasks: [], chatHistory: [] };
    setProjects(prev => [newProject, ...prev]);
    setSelectedProjectId(newProject.id);
  };

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

  const updateSecuritySettings = (partial: Partial<SecuritySettings>) => {
      setSecuritySettings(prev => ({ ...prev, ...partial }));
  };

  const manualCloudSync = async () => {
      if (!initialized) return;
      await persistSnapshot(snapshotFromState());
  };

  // --- COMMAND PALETTE SEARCH LOGIC ---
  const commandResults = () => {
      if(!cmdQuery) return [];
      const q = cmdQuery.toLowerCase();
      const results: {type: string, label: string, desc: string, action: () => void}[] = [];

      // Projects
      projects.filter(p => p.title.toLowerCase().includes(q)).forEach(p => {
          results.push({ type: 'Project', label: p.title, desc: p.status, action: () => { setSelectedProjectId(p.id); setIsCmdOpen(false); }});
      });
      // Inventory
      inventory.filter(i => i.name.toLowerCase().includes(q)).forEach(i => {
          results.push({ type: 'Stock', label: i.name, desc: `${i.quantity} ${i.unit}`, action: () => { setCurrentView('stockroom'); setIsCmdOpen(false); }});
      });
      // Machines
      machines.filter(m => m.name.toLowerCase().includes(q)).forEach(m => {
          results.push({ type: 'Machine', label: m.name, desc: m.status, action: () => { setCurrentView('machines'); setIsCmdOpen(false); }});
      });
      // Views
      if('analytics'.includes(q)) results.push({ type: 'View', label: 'Analytics', desc: 'Dashboard', action: () => { setCurrentView('analytics'); setIsCmdOpen(false); }});
      if('stockroom'.includes(q)) results.push({ type: 'View', label: 'Stockroom', desc: 'Inventory', action: () => { setCurrentView('stockroom'); setIsCmdOpen(false); }});
      
      return results;
  };

  // --- RENDER HELPERS ---
  const filteredProjects = projects.filter(p => p.title.toLowerCase().includes(searchTerm.toLowerCase()));
  const selectedProject = projects.find(p => p.id === selectedProjectId);
  const unreadCount = notifications.filter(n => !n.read).length;

  const NavItem = ({ view, icon: Icon, label }: { view: ViewMode, icon: any, label: string }) => (
      <button 
        onClick={() => setCurrentView(view)}
        className={`w-full flex items-center gap-3 px-3 py-2 rounded-md transition-all mb-1 ${currentView === view ? 'bg-zinc-800 text-zinc-100' : 'text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200'}`}
      >
        <Icon size={16} />
        <span className="font-medium text-sm">{label}</span>
      </button>
  );

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
    <div className="flex h-screen bg-zinc-950 text-zinc-200 font-sans">
      
      {/* Sidebar */}
      <aside className="w-64 bg-zinc-950 text-zinc-400 flex flex-col flex-shrink-0 border-r border-zinc-900">
        <div className="p-6">
          <h1 className="font-serif text-2xl text-zinc-100 font-bold tracking-tight">Construct OS</h1>
          <div className="flex items-center gap-2 mt-2">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
            <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-mono">System V2.0</p>
          </div>
        </div>

        <nav className="flex-1 px-4 space-y-6 overflow-y-auto">
            <div>
                <div className="text-[10px] font-bold uppercase tracking-widest text-zinc-600 mb-2">Registry</div>
                <NavItem view="dashboard" icon={LayoutDashboard} label="Active Projects" />
            </div>
            
            <div>
                <div className="text-[10px] font-bold uppercase tracking-widest text-zinc-600 mb-2">Resources</div>
                <NavItem view="stockroom" icon={Package} label="Stockroom" />
                <NavItem view="machines" icon={Settings} label="Machine Park" />
                <NavItem view="supply" icon={Truck} label="Supply Chain" />
                <NavItem view="library" icon={Book} label="Library" />
            </div>
            
            <div>
                <div className="text-[10px] font-bold uppercase tracking-widest text-zinc-600 mb-2">Operations</div>
                <NavItem view="analytics" icon={BarChart3} label="Analytics" />
                <NavItem view="system" icon={Database} label="System Core" />
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
             
                 <div className="flex items-center gap-4">
                 <button 
                    onClick={() => setIsCmdOpen(true)}
                    className="flex items-center gap-2 px-3 py-1.5 bg-zinc-900 rounded border border-zinc-800 text-xs text-zinc-400 hover:border-zinc-700 hover:text-zinc-200 transition-all"
                 >
                     <Command size={12} />
                     <span>Search...</span>
                     <span className="ml-2 bg-zinc-800 px-1 rounded text-[10px]">⌘K</span>
                 </button>

                <div className="relative">
                    <Bell size={16} className="text-zinc-500 hover:text-zinc-300 cursor-pointer transition-colors" />
                    {unreadCount > 0 && (
                        <span className="absolute -top-2 -right-2 min-w-[18px] h-[18px] px-1 bg-red-500 text-[10px] font-bold text-white rounded-full flex items-center justify-center">
                            {unreadCount}
                        </span>
                    )}
                </div>
             </div>
        </header>

        {/* Global Command Palette Modal */}
        {isCmdOpen && (
            <div className="absolute inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-start justify-center pt-32 animate-in fade-in duration-200">
                <div className="bg-zinc-900 w-[600px] rounded-xl border border-zinc-700 shadow-2xl overflow-hidden flex flex-col">
                    <div className="p-4 border-b border-zinc-800 flex items-center gap-3">
                        <Search className="text-zinc-400" size={20} />
                        <input 
                            ref={cmdInputRef}
                            value={cmdQuery}
                            onChange={(e) => setCmdQuery(e.target.value)}
                            placeholder="Type a command or search..."
                            className="bg-transparent text-lg text-zinc-100 focus:outline-none flex-1 font-sans"
                        />
                        <button onClick={() => setIsCmdOpen(false)} className="text-xs text-zinc-500 bg-zinc-800 px-2 py-1 rounded">ESC</button>
                    </div>
                    <div className="max-h-96 overflow-y-auto p-2">
                        {commandResults().length === 0 ? (
                            <div className="text-center py-8 text-zinc-500 text-sm">No results found.</div>
                        ) : (
                            commandResults().map((res, i) => (
                                <button 
                                    key={i} 
                                    onClick={res.action}
                                    className="w-full text-left p-3 hover:bg-zinc-800 rounded-lg flex items-center justify-between group"
                                >
                                    <div className="flex items-center gap-3">
                                        <span className={`text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded ${
                                            res.type === 'Project' ? 'bg-blue-900/30 text-blue-400' : 
                                            res.type === 'Stock' ? 'bg-green-900/30 text-green-400' :
                                            res.type === 'Machine' ? 'bg-amber-900/30 text-amber-400' :
                                            'bg-zinc-800 text-zinc-400'
                                        }`}>{res.type}</span>
                                        <span className="text-zinc-200 font-medium">{res.label}</span>
                                    </div>
                                    <span className="text-xs text-zinc-500 group-hover:text-zinc-400">{res.desc}</span>
                                </button>
                            ))
                        )}
                    </div>
                </div>
                <div className="absolute inset-0 -z-10" onClick={() => setIsCmdOpen(false)}></div>
            </div>
        )}

        {/* Content Views */}
        <div className="flex-1 overflow-hidden relative">
            {currentView === 'dashboard' && (
                <div className="flex-1 h-full overflow-y-auto p-8 bg-zinc-950">
                     <div className="flex justify-between items-end mb-8">
                        <div>
                            <h2 className="text-2xl font-serif font-bold text-zinc-100">Project Registry</h2>
                            <p className="text-zinc-500 text-sm mt-1">Active pipelines and engineering status.</p>
                        </div>
                        <div className="flex gap-4">
                             <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600" size={14} />
                                <input 
                                    type="text" 
                                    placeholder="Filter projects..." 
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-9 pr-4 py-2 bg-zinc-900 border border-zinc-800 rounded-md text-xs focus:outline-none focus:ring-1 focus:ring-zinc-600 w-64 text-zinc-200"
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
                </div>
            )}

            {currentView === 'stockroom' && <Stockroom items={inventory} onUpdate={setInventory} docs={docs} onDocsUpdate={setDocs} />}
            {currentView === 'machines' && <MachinePark machines={machines} onUpdate={setMachines} docs={docs} onDocsUpdate={setDocs} />}
            {currentView === 'supply' && <SupplyChain vendors={vendors} onUpdate={setVendors} />}
            {currentView === 'library' && <Library docs={docs} onUpdate={setDocs} inventory={inventory} machines={machines} />}
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
