
import React, { useState, useEffect, useRef } from 'react';
import { Project, ProjectStatus, InventoryItem, Machine, Vendor, ReferenceDoc, ViewMode, Notification } from './types';
import ProjectCard from './components/ProjectCard';
import ProjectDetail from './components/ProjectDetail';
import Stockroom from './components/Stockroom';
import MachinePark from './components/MachinePark';
import ReferenceLibrary from './components/ReferenceLibrary';
import SupplyChain from './components/SupplyChain';
import Analytics from './components/Analytics';
import SystemCore from './components/SystemCore';

import { 
    LayoutDashboard, Plus, Search, Activity, Box, Package, Settings, 
    Book, Truck, BarChart3, Database, Bell, ChevronRight, Command, 
    Layers, AlertCircle, Menu, X, LogOut
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
  
  const [searchTerm, setSearchTerm] = useState('');
  
  // Mobile & UI State
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isCmdOpen, setIsCmdOpen] = useState(false);
  const [cmdQuery, setCmdQuery] = useState('');
  const cmdInputRef = useRef<HTMLInputElement>(null);

  // --- PERSISTENCE ---
  useEffect(() => {
    const load = (key: string, setter: any, seed: any) => {
        const saved = localStorage.getItem(key);
        if (saved) setter(JSON.parse(saved));
        else setter(seed);
    };

    // Initial Seeds
    load('construct_os_projects', setProjects, [
        {
            id: '1', title: '3-Axis CNC Router V4', description: 'Aluminum extrusion frame 1500x1500mm. NEMA 23 High Torque steppers.', status: 'wiring', createdAt: Date.now(), imageUrl: 'https://picsum.photos/seed/cnc/800/600',
            bom: [{ category: 'Frame', itemName: '2080 Extrusion', quantity: 4, specifications: '1500mm, Black Anodized', unitCost: 45.00 }],
            tasks: [{ id: '101', text: 'Assemble Base Frame', status: 'done' }], chatHistory: []
        },
        {
            id: '2', title: 'Hydraulic Log Splitter', description: '20-ton cylinder force. 6.5HP gas engine.', status: 'fabrication', createdAt: Date.now() - 10000000, imageUrl: 'https://picsum.photos/seed/hydro/800/600', bom: [], tasks: [], chatHistory: []
        }
    ]);

    load('construct_os_inventory', setInventory, [
        { id: '1', name: '6061 Aluminum Plate', category: 'Raw Material', quantity: 4, unit: 'sheets', location: 'Rack 1', minLevel: 2, cost: 120 },
        { id: '2', name: 'M5x20mm SHCS', category: 'Hardware', quantity: 150, unit: 'pcs', location: 'Bin A12', minLevel: 50, cost: 0.15 }
    ]);

    load('construct_os_machines', setMachines, [
        { id: '1', name: 'Bridgeport Mill', type: 'Milling', status: 'operational', lastService: Date.now() - 10000000, nextService: Date.now() + 2000000, notes: 'Quill feed sticky.', maintenanceLog: [] },
        { id: '2', name: 'Ender 3 Pro', type: '3D Printer', status: 'maintenance', lastService: Date.now(), nextService: Date.now() + 5000000, notes: 'Nozzle clog.', maintenanceLog: [] },
        { id: '3', name: 'Bosch GTS 10 XC', type: 'Table Saw', status: 'operational', lastService: Date.now() - 2000000, nextService: Date.now() + 4000000, notes: 'Blade alignment perfect.', maintenanceLog: [] },
        { id: '4', name: 'Bosch 18V Prof Set', type: 'Power Tools', status: 'operational', lastService: Date.now() - 5000000, nextService: Date.now() + 10000000, notes: 'Includes GSB, GDR, GKS.', maintenanceLog: [] },
        { id: '5', name: 'Makita DGA504', type: 'Grinder', status: 'operational', lastService: Date.now() - 1000000, nextService: Date.now() + 2000000, notes: 'Paddle switch.', maintenanceLog: [] },
        { id: '6', name: 'Makita DMR115', type: 'Audio', status: 'operational', lastService: Date.now() - 8000000, nextService: Date.now() + 20000000, notes: 'Workshop Radio / DAB+.', maintenanceLog: [] },
        { id: '7', name: 'Kärcher WD 6 P', type: 'Vacuum', status: 'degraded', lastService: Date.now() - 500000, nextService: Date.now() - 1000000, notes: 'Filter clean needed overdue.', maintenanceLog: [] }
    ]);

    load('construct_os_vendors', setVendors, [
        { id: '1', name: 'McMaster-Carr', website: 'mcmaster.com', category: 'General', rating: 5, notes: 'Next day delivery.', leadTime: '1 Day', lastOrder: Date.now() - 86400000 },
        { id: '2', name: 'DigiKey', website: 'digikey.com', category: 'Electronics', rating: 4, leadTime: '3 Days' }
    ]);
    
    load('construct_os_docs', setDocs, []);

  }, []);

  // --- SYSTEM WATCHDOG (NOTIFICATIONS) ---
  useEffect(() => {
      const generateNotifications = () => {
          const newNotes: Notification[] = [];
          
          // Check Inventory
          inventory.forEach(item => {
              if (item.quantity <= item.minLevel) {
                  newNotes.push({
                      id: `low_stock_${item.id}`,
                      type: item.quantity === 0 ? 'alert' : 'info',
                      message: `Low Stock: ${item.name} (${item.quantity} ${item.unit} remaining)`,
                      timestamp: Date.now(),
                      read: false
                  });
              }
          });

          // Check Machines
          machines.forEach(machine => {
              if (machine.status === 'down' || machine.status === 'maintenance') {
                   newNotes.push({
                      id: `machine_${machine.id}`,
                      type: 'alert',
                      message: `Equipment Alert: ${machine.name} is ${machine.status.toUpperCase()}`,
                      timestamp: Date.now(),
                      read: false
                  });
              }
              if (Date.now() > machine.nextService) {
                   newNotes.push({
                      id: `service_${machine.id}`,
                      type: 'info',
                      message: `Maintenance Due: ${machine.name}`,
                      timestamp: Date.now(),
                      read: false
                  });
              }
          });
          
          // Deduplicate based on ID and keep latest
          setNotifications(newNotes);
      };

      generateNotifications();
  }, [inventory, machines]);

  // Save on Change
  useEffect(() => localStorage.setItem('construct_os_projects', JSON.stringify(projects)), [projects]);
  useEffect(() => localStorage.setItem('construct_os_inventory', JSON.stringify(inventory)), [inventory]);
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

  const NavItem = ({ view, icon: Icon, label }: { view: ViewMode, icon: any, label: string }) => (
      <button 
        onClick={() => { setCurrentView(view); setIsMobileMenuOpen(false); }}
        className={`w-full flex items-center gap-3 px-3 py-3 md:py-2 rounded-md transition-all mb-1 ${currentView === view ? 'bg-zinc-800 text-zinc-100' : 'text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200'} active:scale-95 duration-75`}
      >
        <Icon size={18} />
        <span className="font-medium text-sm md:text-xs lg:text-sm">{label}</span>
      </button>
  );

  const Breadcrumbs = () => {
      if(selectedProject) return (
          <div className="flex items-center text-xs font-mono text-zinc-500 gap-2 overflow-hidden whitespace-nowrap">
              <span className="hidden sm:inline">Main Registry</span>
              <ChevronRight size={12} className="hidden sm:inline" />
              <span className="text-zinc-300 truncate">{selectedProject.title}</span>
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
          <div className="flex items-center text-xs font-mono text-zinc-500 gap-2 overflow-hidden whitespace-nowrap">
             <span className="hidden sm:inline">Construct OS</span>
             <ChevronRight size={12} className="hidden sm:inline" />
             <span className="text-zinc-300 truncate">{labels[currentView]}</span>
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
    <div className="flex flex-col md:flex-row h-screen bg-zinc-950 text-zinc-200 font-sans overflow-hidden">
      
      {/* Mobile Header */}
      <div className="md:hidden h-14 bg-zinc-950 border-b border-zinc-900 flex items-center justify-between px-4 z-50 relative flex-shrink-0">
          <div className="flex items-center gap-3">
              <button onClick={() => setIsMobileMenuOpen(true)} className="p-2 -ml-2 text-zinc-400">
                  <Menu size={20} />
              </button>
              <span className="font-serif font-bold text-zinc-100">Construct OS</span>
          </div>
          <div className="flex items-center gap-3">
               <button onClick={() => setIsCmdOpen(true)} className="p-2 text-zinc-400">
                  <Search size={20} />
              </button>
              <div className="relative">
                  {notifications.length > 0 && <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>}
                  <Bell size={20} className="text-zinc-500" />
              </div>
          </div>
      </div>

      {/* Sidebar Navigation (Desktop: Fixed, Mobile: Overlay) */}
      <>
        {/* Mobile Overlay Backdrop */}
        {isMobileMenuOpen && (
            <div 
                className="fixed inset-0 bg-black/80 z-40 md:hidden backdrop-blur-sm animate-in fade-in duration-200"
                onClick={() => setIsMobileMenuOpen(false)}
            />
        )}
        
        {/* The Sidebar Itself */}
        <aside className={`
            fixed inset-y-0 left-0 z-50 w-72 bg-zinc-950 border-r border-zinc-900 flex flex-col transition-transform duration-300
            md:relative md:translate-x-0 md:w-64 flex-shrink-0
            ${isMobileMenuOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'}
        `}>
            <div className="p-6 flex justify-between items-start">
            <div>
                <h1 className="font-serif text-2xl text-zinc-100 font-bold tracking-tight">Construct OS</h1>
                <div className="flex items-center gap-2 mt-2">
                    <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                    <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-mono">System V2.0</p>
                </div>
            </div>
            {/* Close button for mobile */}
            <button onClick={() => setIsMobileMenuOpen(false)} className="md:hidden text-zinc-500 p-1">
                <X size={20} />
            </button>
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
                    <LogOut size={14} className="ml-auto text-zinc-600" />
                </button>
            </div>
        </aside>
      </>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden h-[calc(100vh-3.5rem)] md:h-screen bg-zinc-950 relative w-full">
        
        {/* Desktop Header */}
        <header className="hidden md:flex h-14 border-b border-zinc-900 bg-zinc-950 items-center justify-between px-6 flex-shrink-0">
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

                 <div className="relative group">
                     <Bell size={16} className={`cursor-pointer transition-colors ${notifications.length > 0 ? 'text-zinc-200' : 'text-zinc-500'}`} />
                     {notifications.length > 0 && (
                         <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
                     )}
                     
                     {/* Notification Dropdown */}
                     <div className="absolute right-0 top-full mt-2 w-72 bg-zinc-900 border border-zinc-800 rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 overflow-hidden">
                        <div className="p-3 border-b border-zinc-800 text-xs font-bold text-zinc-400 uppercase tracking-wider">
                            System Alerts
                        </div>
                        <div className="max-h-64 overflow-y-auto">
                            {notifications.length === 0 ? (
                                <div className="p-4 text-center text-xs text-zinc-600">All systems nominal</div>
                            ) : (
                                notifications.map(n => (
                                    <div key={n.id} className="p-3 border-b border-zinc-800 hover:bg-zinc-800/50">
                                        <div className={`text-xs font-bold mb-1 flex items-center gap-2 ${n.type === 'alert' ? 'text-red-400' : 'text-blue-400'}`}>
                                            {n.type === 'alert' ? <AlertCircle size={12} /> : <Activity size={12} />}
                                            {n.type === 'alert' ? 'CRITICAL' : 'NOTICE'}
                                        </div>
                                        <div className="text-xs text-zinc-300 leading-tight">{n.message}</div>
                                        <div className="text-[10px] text-zinc-600 mt-2 font-mono">{new Date(n.timestamp).toLocaleTimeString()}</div>
                                    </div>
                                ))
                            )}
                        </div>
                     </div>
                 </div>
             </div>
        </header>

        {/* Global Command Palette Modal */}
        {isCmdOpen && (
            <div className="absolute inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-start justify-center pt-20 md:pt-32 animate-in fade-in duration-200 p-4">
                <div className="bg-zinc-900 w-full max-w-xl rounded-xl border border-zinc-700 shadow-2xl overflow-hidden flex flex-col max-h-[60vh]">
                    <div className="p-4 border-b border-zinc-800 flex items-center gap-3">
                        <Search className="text-zinc-400" size={20} />
                        <input 
                            ref={cmdInputRef}
                            value={cmdQuery}
                            onChange={(e) => setCmdQuery(e.target.value)}
                            placeholder="Type a command or search..."
                            className="bg-transparent text-lg text-zinc-100 focus:outline-none flex-1 font-sans placeholder:text-zinc-600"
                        />
                        <button onClick={() => setIsCmdOpen(false)} className="text-xs text-zinc-500 bg-zinc-800 px-2 py-1 rounded">ESC</button>
                    </div>
                    <div className="flex-1 overflow-y-auto p-2">
                        {commandResults().length === 0 ? (
                            <div className="text-center py-8 text-zinc-500 text-sm">No results found.</div>
                        ) : (
                            commandResults().map((res, i) => (
                                <button 
                                    key={i} 
                                    onClick={res.action}
                                    className="w-full text-left p-3 hover:bg-zinc-800 rounded-lg flex items-center justify-between group active:scale-[0.98] transition-transform"
                                >
                                    <div className="flex items-center gap-3 overflow-hidden">
                                        <span className={`flex-shrink-0 text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded ${
                                            res.type === 'Project' ? 'bg-blue-900/30 text-blue-400' : 
                                            res.type === 'Stock' ? 'bg-green-900/30 text-green-400' :
                                            res.type === 'Machine' ? 'bg-amber-900/30 text-amber-400' :
                                            'bg-zinc-800 text-zinc-400'
                                        }`}>{res.type}</span>
                                        <span className="text-zinc-200 font-medium truncate">{res.label}</span>
                                    </div>
                                    <span className="text-xs text-zinc-500 group-hover:text-zinc-400 flex-shrink-0 ml-2">{res.desc}</span>
                                </button>
                            ))
                        )}
                    </div>
                </div>
                <div className="absolute inset-0 -z-10" onClick={() => setIsCmdOpen(false)}></div>
            </div>
        )}

        {/* Content Views */}
        <div className="flex-1 overflow-hidden relative w-full">
            {currentView === 'dashboard' && (
                <div className="flex-1 h-full overflow-y-auto p-4 md:p-8 bg-zinc-950">
                     <div className="flex flex-col md:flex-row md:justify-between md:items-end mb-6 md:mb-8 gap-4">
                        <div>
                            <h2 className="text-xl md:text-2xl font-serif font-bold text-zinc-100">Project Registry</h2>
                            <p className="text-zinc-500 text-sm mt-1">Active pipelines and engineering status.</p>
                        </div>
                        <div className="flex gap-2 md:gap-4 w-full md:w-auto">
                             <div className="relative flex-1 md:flex-none">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600" size={14} />
                                <input 
                                    type="text" 
                                    placeholder="Filter..." 
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full md:w-64 pl-9 pr-4 py-2 bg-zinc-900 border border-zinc-800 rounded-md text-xs focus:outline-none focus:ring-1 focus:ring-zinc-600 text-zinc-200"
                                />
                            </div>
                            <button 
                                onClick={() => { const t = prompt("Project Designation:"); if(t) addProject(t); }}
                                className="bg-zinc-100 text-zinc-900 px-4 py-2 rounded-md text-xs font-bold hover:bg-white flex items-center gap-2 uppercase tracking-wide transition-colors whitespace-nowrap active:scale-95"
                            >
                                <Plus size={14} /> <span className="hidden sm:inline">Initialize Project</span><span className="sm:hidden">New</span>
                            </button>
                        </div>
                     </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6 pb-20 md:pb-0">
                        {filteredProjects.length === 0 ? (
                            <div className="col-span-full flex flex-col items-center justify-center text-zinc-700 py-20 border border-dashed border-zinc-800 rounded-xl">
                                <Box size={48} className="mb-4 opacity-20" />
                                <p className="font-mono text-sm">REGISTRY EMPTY</p>
                            </div>
                        ) : (
                            filteredProjects.map(project => (
                                <div key={project.id} onClick={() => setSelectedProjectId(project.id)} className="cursor-pointer h-full active:scale-[0.98] transition-transform">
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

            {currentView === 'stockroom' && <Stockroom items={inventory} onUpdate={setInventory} />}
            {currentView === 'machines' && <MachinePark machines={machines} onUpdate={setMachines} />}
            {currentView === 'supply' && <SupplyChain vendors={vendors} onUpdate={setVendors} />}
            {currentView === 'library' && <ReferenceLibrary docs={docs} onUpdate={setDocs} />}
            {currentView === 'analytics' && <Analytics projects={projects} inventory={inventory} machines={machines} />}
            {currentView === 'system' && <SystemCore exportData={exportSystem} importData={importSystem} />}
        </div>

      </main>
    </div>
  );
};

export default App;
