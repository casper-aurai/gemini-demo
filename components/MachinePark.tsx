
import React from 'react';
import { Machine, MachineStatus } from '../types';
import { Wrench, Settings, AlertCircle, CheckCircle2, Plus, Calendar, Activity, XCircle, PauseCircle, Archive } from 'lucide-react';

interface MachineParkProps {
    machines: Machine[];
    onUpdate: (machines: Machine[]) => void;
}

const statusConfig: Record<MachineStatus, { color: string, icon: any, label: string }> = {
    operational: { color: 'bg-green-100 text-green-700 border-green-200', icon: CheckCircle2, label: 'Operational' },
    degraded: { color: 'bg-yellow-100 text-yellow-700 border-yellow-200', icon: AlertCircle, label: 'Degraded' },
    maintenance: { color: 'bg-blue-100 text-blue-700 border-blue-200', icon: Wrench, label: 'Maintenance' },
    down: { color: 'bg-red-100 text-red-700 border-red-200', icon: XCircle, label: 'Down' },
    retired: { color: 'bg-zinc-100 text-zinc-500 border-zinc-200', icon: Archive, label: 'Retired' }
};

const MachinePark: React.FC<MachineParkProps> = ({ machines, onUpdate }) => {
    
    const addMachine = () => {
        const newMachine: Machine = {
            id: Date.now().toString(),
            name: 'New Machine',
            type: 'General',
            status: 'operational',
            lastService: Date.now(),
            nextService: Date.now() + 1000 * 60 * 60 * 24 * 30, // 30 days
            notes: ''
        };
        onUpdate([...machines, newMachine]);
    };

    const cycleStatus = (id: string, current: MachineStatus) => {
        const states: MachineStatus[] = ['operational', 'degraded', 'maintenance', 'down', 'retired'];
        const idx = states.indexOf(current);
        const next = states[(idx + 1) % states.length];
        updateMachine(id, { status: next });
    };

    const updateMachine = (id: string, updates: Partial<Machine>) => {
        onUpdate(machines.map(m => m.id === id ? { ...m, ...updates } : m));
    };

    const deleteMachine = (id: string) => {
        if(confirm("Decommission machine completely?")) {
            onUpdate(machines.filter(m => m.id !== id));
        }
    };

    return (
        <div className="p-8 h-full bg-zinc-50 overflow-y-auto">
            <header className="flex justify-between items-center mb-8">
                <div>
                    <h2 className="font-serif text-2xl font-bold text-zinc-900 flex items-center gap-2">
                        <Settings /> Machine Park
                    </h2>
                    <p className="text-zinc-500 text-sm">Equipment health, maintenance schedules, and utilization.</p>
                </div>
                <button onClick={addMachine} className="bg-zinc-900 text-white px-4 py-2 rounded text-sm font-bold flex items-center gap-2 hover:bg-zinc-800 shadow-sm">
                    <Plus size={16}/> Add Equipment
                </button>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {machines.map(machine => {
                    const StatusIcon = statusConfig[machine.status].icon;
                    const isServiceDue = Date.now() > machine.nextService;
                    
                    return (
                    <div key={machine.id} className="bg-white rounded-xl border border-zinc-200 shadow-sm p-5 group flex flex-col h-full hover:shadow-md transition-shadow">
                        <div className="flex justify-between items-start mb-4">
                            <div className="flex-1">
                                <input 
                                    value={machine.name}
                                    onChange={(e) => updateMachine(machine.id, { name: e.target.value })}
                                    className="font-bold text-lg text-zinc-900 bg-transparent focus:bg-zinc-50 rounded px-1 -ml-1 w-full truncate"
                                />
                                <input 
                                    value={machine.type}
                                    onChange={(e) => updateMachine(machine.id, { type: e.target.value })}
                                    className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest bg-transparent focus:bg-zinc-50 rounded px-1 -ml-1 w-full"
                                />
                            </div>
                            <button 
                                onClick={() => cycleStatus(machine.id, machine.status)}
                                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide border transition-all hover:opacity-80 ${statusConfig[machine.status].color}`}
                            >
                                <StatusIcon size={12} />
                                {statusConfig[machine.status].label}
                            </button>
                        </div>

                        {/* Visualization of "Health" */}
                        <div className="flex gap-1 mb-4 h-1.5">
                            <div className={`flex-1 rounded-l-full ${machine.status === 'operational' ? 'bg-green-500' : 'bg-zinc-200'}`}></div>
                            <div className={`flex-1 ${machine.status === 'operational' ? 'bg-green-500' : 'bg-zinc-200'}`}></div>
                            <div className={`flex-1 ${machine.status === 'operational' ? 'bg-green-500' : machine.status === 'degraded' ? 'bg-yellow-400' : 'bg-zinc-200'}`}></div>
                            <div className={`flex-1 rounded-r-full ${machine.status === 'operational' ? 'bg-green-500' : 'bg-zinc-200'}`}></div>
                        </div>

                        <div className="bg-zinc-50 rounded-lg p-3 mb-4 border border-zinc-100 space-y-2">
                            <div className="flex items-center gap-3 text-sm text-zinc-600">
                                <CheckCircle2 size={14} className="text-zinc-400" />
                                <span className="text-xs text-zinc-500 font-medium">Last Service</span>
                                <span className="font-mono text-xs ml-auto text-zinc-700">{new Date(machine.lastService).toLocaleDateString()}</span>
                            </div>
                            <div className="flex items-center gap-3 text-sm text-zinc-600">
                                <Calendar size={14} className={isServiceDue ? 'text-red-500 animate-pulse' : 'text-zinc-400'} />
                                <span className="text-xs text-zinc-500 font-medium">Next Due</span>
                                <span className={`font-mono text-xs ml-auto ${isServiceDue ? 'text-red-600 font-bold' : 'text-zinc-700'}`}>{new Date(machine.nextService).toLocaleDateString()}</span>
                            </div>
                        </div>

                        <textarea 
                            value={machine.notes || ''}
                            onChange={(e) => updateMachine(machine.id, { notes: e.target.value })}
                            placeholder="Operating notes..."
                            className="w-full text-xs bg-transparent border-none focus:ring-0 resize-none h-16 text-zinc-600 italic p-0"
                        />

                        <div className="mt-auto pt-4 border-t border-zinc-100 flex justify-between items-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => updateMachine(machine.id, { lastService: Date.now() })} className="text-xs text-zinc-600 hover:text-zinc-900 flex items-center gap-1 font-bold bg-zinc-100 px-2 py-1 rounded">
                                <Wrench size={12} /> Log Service
                            </button>
                            <button onClick={() => deleteMachine(machine.id)} className="text-xs text-red-400 hover:text-red-600 px-2">
                                Delete
                            </button>
                        </div>
                    </div>
                )})}
            </div>
        </div>
    );
};

export default MachinePark;
