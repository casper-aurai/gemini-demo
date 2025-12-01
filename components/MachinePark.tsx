
import React, { useMemo, useState } from 'react';
import { Machine, MachineMaintenanceEntry, MachineMaintenanceWindow, MachineStatus } from '../types';
import { Wrench, Settings, AlertCircle, CheckCircle2, Plus, Calendar, Activity, XCircle, Archive, BarChart3, Clock, User, DollarSign, Tool, FileText, X } from 'lucide-react';

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

    const [selectedMachineId, setSelectedMachineId] = useState<string | null>(null);
    const [calendarView, setCalendarView] = useState<'week' | 'month'>('week');
    const [scheduleMachineId, setScheduleMachineId] = useState<string | null>(null);
    const [scheduleDraft, setScheduleDraft] = useState<{ title: string; start: string; end: string; technician: string; type: string }>({
        title: 'Preventive service',
        start: '',
        end: '',
        technician: 'Unassigned',
        type: 'Inspection'
    });

    const selectedMachine = machines.find(m => m.id === selectedMachineId) || null;

    const addMachine = () => {
        const newMachine: Machine = {
            id: Date.now().toString(),
            name: 'New Machine',
            type: 'General',
            status: 'operational',
            lastService: Date.now(),
            nextService: Date.now() + 1000 * 60 * 60 * 24 * 30, // 30 days
            notes: '',
            utilization: [65, 70, 68, 75, 72, 77, 80, 79, 76, 74, 78, 82],
            maintenanceLog: [
                { date: Date.now() - 1000 * 60 * 60 * 24 * 40, note: 'Bearing inspection', cost: 420, technician: 'A. Diaz', parts: ['Bearing kit'] },
                { date: Date.now() - 1000 * 60 * 60 * 24 * 14, note: 'Coolant flush', cost: 210, technician: 'M. Chen', parts: ['Coolant concentrate'] }
            ],
            statusHistory: [
                { date: Date.now() - 1000 * 60 * 60 * 24 * 15, status: 'maintenance', note: 'Planned downtime' },
                { date: Date.now() - 1000 * 60 * 60 * 24 * 12, status: 'operational', note: 'Service completed' }
            ],
            maintenanceWindows: [
                {
                    id: `${Date.now()}-window`,
                    title: 'Q3 Preventive',
                    start: Date.now() + 1000 * 60 * 60 * 24 * 6,
                    end: Date.now() + 1000 * 60 * 60 * 24 * 6 + 1000 * 60 * 60 * 4,
                    technician: 'Planner',
                    type: 'Preventive'
                }
            ]
        };
        onUpdate([...machines, newMachine]);
    };

    const cycleStatus = (machine: Machine) => {
        const states: MachineStatus[] = ['operational', 'degraded', 'maintenance', 'down', 'retired'];
        const idx = states.indexOf(machine.status);
        const next = states[(idx + 1) % states.length];
        updateMachine(machine.id, {
            status: next,
            statusHistory: [...(machine.statusHistory || []), { date: Date.now(), status: next, note: 'Status cycled' }]
        });
    };

    const updateMachine = (id: string, updates: Partial<Machine>) => {
        onUpdate(machines.map(m => m.id === id ? { ...m, ...updates } : m));
    };

    const deleteMachine = (id: string) => {
        if(confirm("Decommission machine completely?")) {
            onUpdate(machines.filter(m => m.id !== id));
        }
    };

    const handleAddWindow = () => {
        if (!scheduleMachineId) return;
        const machine = machines.find(m => m.id === scheduleMachineId);
        if (!machine) return;

        const newWindow: MachineMaintenanceWindow = {
            id: `${Date.now()}`,
            title: scheduleDraft.title || 'Maintenance',
            start: scheduleDraft.start ? new Date(scheduleDraft.start).getTime() : Date.now(),
            end: scheduleDraft.end ? new Date(scheduleDraft.end).getTime() : Date.now() + 1000 * 60 * 60,
            technician: scheduleDraft.technician,
            type: scheduleDraft.type
        };

        updateMachine(machine.id, {
            maintenanceWindows: [...(machine.maintenanceWindows || []), newWindow],
            statusHistory: [...(machine.statusHistory || []), { date: Date.now(), status: machine.status, note: `Scheduled ${newWindow.title}` }]
        });
        setScheduleMachineId(null);
        setScheduleDraft({ title: 'Preventive service', start: '', end: '', technician: 'Unassigned', type: 'Inspection' });
    };

    const maintenanceWindows = useMemo(() => {
        const now = Date.now();
        const horizonDays = calendarView === 'week' ? 7 : 30;
        const horizonEnd = now + horizonDays * 24 * 60 * 60 * 1000;
        return machines
            .flatMap(m => (m.maintenanceWindows || []).map(w => ({ ...w, machineName: m.name, status: m.status })))
            .filter(w => w.start <= horizonEnd && w.end >= now - 24 * 60 * 60 * 1000)
            .sort((a, b) => a.start - b.start);
    }, [machines, calendarView]);

    const formatDate = (timestamp: number) => new Date(timestamp).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });

    const renderSparkline = (values: number[] = []) => {
        if (!values.length) values = [60, 62, 65, 63, 67, 70, 72, 71, 73, 75, 74, 76];
        const max = Math.max(...values);
        const min = Math.min(...values);
        const range = max - min || 1;
        const width = 120;
        const height = 48;
        const step = width / (values.length - 1);
        const points = values
            .map((v, i) => {
                const x = i * step;
                const y = height - ((v - min) / range) * height;
                return `${x},${y}`;
            })
            .join(' ');

        return (
            <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-16">
                <polyline points={points} className="fill-none stroke-blue-500" strokeWidth={2} />
                <linearGradient id="spark" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.2" />
                    <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
                </linearGradient>
                <polygon points={`${points} ${width},${height} 0,${height}`} fill="url(#spark)" />
            </svg>
        );
    };

    return (
        <div className="p-8 h-full bg-zinc-50 overflow-y-auto">
            <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-6">
                <div>
                    <h2 className="font-serif text-2xl font-bold text-zinc-900 flex items-center gap-2">
                        <Settings /> Machine Park
                    </h2>
                    <p className="text-zinc-500 text-sm">Equipment health, utilization, and scheduled maintenance.</p>
                </div>
                <div className="flex flex-wrap gap-2">
                    <div className="flex rounded-full border border-zinc-200 overflow-hidden text-xs font-semibold bg-white shadow-sm">
                        {['week', 'month'].map(view => (
                            <button
                                key={view}
                                onClick={() => setCalendarView(view as 'week' | 'month')}
                                className={`px-3 py-1 flex items-center gap-1 ${calendarView === view ? 'bg-zinc-900 text-white' : 'text-zinc-600'}`}
                            >
                                <Calendar size={14} /> {view === 'week' ? 'Week' : 'Month'} view
                            </button>
                        ))}
                    </div>
                    <button onClick={addMachine} className="bg-zinc-900 text-white px-4 py-2 rounded text-sm font-bold flex items-center gap-2 hover:bg-zinc-800 shadow-sm">
                        <Plus size={16}/> Add Equipment
                    </button>
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                <div className="bg-white rounded-xl border border-zinc-200 shadow-sm p-4 lg:col-span-2">
                    <div className="flex items-center gap-2 mb-4">
                        <Calendar size={18} className="text-zinc-500" />
                        <div>
                            <h3 className="font-semibold text-zinc-900">Maintenance windows ({calendarView})</h3>
                            <p className="text-xs text-zinc-500">Plan technicians and downtime coverage.</p>
                        </div>
                    </div>
                    <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                        {maintenanceWindows.length === 0 && (
                            <div className="text-sm text-zinc-500">No maintenance scheduled for this {calendarView}.</div>
                        )}
                        {maintenanceWindows.map(window => (
                            <div key={`${window.id}-${window.machineName}`} className="flex items-center gap-3 p-3 rounded-lg border border-zinc-100 bg-zinc-50">
                                <div className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide border ${statusConfig[window.status as MachineStatus]?.color || 'bg-zinc-100 text-zinc-700 border-zinc-200'}`}>
                                    {window.type || 'Maintenance'}
                                </div>
                                <div className="flex-1">
                                    <div className="text-sm font-semibold text-zinc-800">{window.title} · {window.machineName}</div>
                                    <div className="text-xs text-zinc-500">{formatDate(window.start)} – {formatDate(window.end)} {window.technician && `· ${window.technician}`}</div>
                                </div>
                                <button
                                    className="text-xs text-blue-600 hover:text-blue-800 font-semibold"
                                    onClick={() => setSelectedMachineId(machines.find(m => (m.maintenanceWindows || []).some(w => w.id === window.id))?.id || null)}
                                >
                                    Open
                                </button>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="bg-white rounded-xl border border-zinc-200 shadow-sm p-4 space-y-3">
                    <div className="flex items-center gap-2">
                        <BarChart3 size={18} className="text-blue-600" />
                        <div>
                            <h3 className="font-semibold text-zinc-900">Status mix</h3>
                            <p className="text-xs text-zinc-500">Quick view of operational readiness.</p>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                        {Object.keys(statusConfig).map(key => {
                            const typedKey = key as MachineStatus;
                            const count = machines.filter(m => m.status === typedKey).length;
                            return (
                                <div key={key} className="border border-zinc-100 rounded-lg p-3 bg-zinc-50">
                                    <div className="text-[10px] uppercase font-bold text-zinc-500">{statusConfig[typedKey].label}</div>
                                    <div className="text-2xl font-semibold text-zinc-900">{count}</div>
                                    <div className="text-[11px] text-zinc-500">machines</div>
                                </div>
                            );
                        })}
                    </div>
                    <div className="text-xs text-zinc-500 leading-relaxed">
                        Keep change logs updated for auditability and to understand the impact of downtime across the park.
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {machines.map(machine => {
                    const StatusIcon = statusConfig[machine.status].icon;
                    const isServiceDue = Date.now() > machine.nextService;
                    const utilization = machine.utilization || [];
                    const recentStatus = (machine.statusHistory || []).slice(-3).reverse();

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
                                onClick={() => cycleStatus(machine)}
                                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide border transition-all hover:opacity-80 ${statusConfig[machine.status].color}`}
                            >
                                <StatusIcon size={12} />
                                {statusConfig[machine.status].label}
                            </button>
                        </div>

                        <div className="grid grid-cols-2 gap-3 mb-3">
                            <div className="bg-zinc-50 rounded-lg p-3 border border-zinc-100">
                                <div className="text-[10px] font-bold uppercase text-zinc-400 mb-1 flex items-center gap-1"><CheckCircle2 size={12} /> Last Service</div>
                                <div className="font-mono text-xs text-zinc-800">{new Date(machine.lastService).toLocaleDateString()}</div>
                            </div>
                            <div className={`rounded-lg p-3 border ${isServiceDue ? 'bg-red-50 border-red-100' : 'bg-zinc-50 border-zinc-100'}`}>
                                <div className="text-[10px] font-bold uppercase text-zinc-400 mb-1 flex items-center gap-1"><Calendar size={12} /> Next Due</div>
                                <div className={`font-mono text-xs ${isServiceDue ? 'text-red-600 font-semibold' : 'text-zinc-800'}`}>{new Date(machine.nextService).toLocaleDateString()}</div>
                            </div>
                        </div>

                        <div className="mb-3">
                            <div className="flex items-center justify-between mb-1">
                                <div className="text-[10px] font-bold uppercase text-zinc-500 flex items-center gap-1"><Activity size={12} /> Utilization</div>
                                <div className="text-[11px] text-zinc-500">{utilization.length ? `${utilization[utilization.length - 1]}%` : 'n/a'}</div>
                            </div>
                            <div className="rounded-lg bg-zinc-50 border border-zinc-100 p-2">
                                {renderSparkline(utilization)}
                            </div>
                        </div>

                        <div className="bg-zinc-50 rounded-lg p-3 border border-zinc-100 mb-3">
                            <div className="text-[10px] uppercase font-bold text-zinc-500 mb-2 flex items-center gap-1"><Clock size={12} /> Status changes</div>
                            <div className="space-y-1">
                                {recentStatus.length === 0 && <div className="text-xs text-zinc-500">No change log yet.</div>}
                                {recentStatus.map(entry => (
                                    <div key={entry.date} className="flex items-center gap-2 text-xs text-zinc-600">
                                        <div className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide border ${statusConfig[entry.status].color}`}>
                                            {statusConfig[entry.status].label}
                                        </div>
                                        <div className="flex-1 truncate">{entry.note || 'Status updated'}</div>
                                        <div className="text-[10px] text-zinc-400">{new Date(entry.date).toLocaleDateString()}</div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <textarea
                            value={machine.notes || ''}
                            onChange={(e) => updateMachine(machine.id, { notes: e.target.value })}
                            placeholder="Operating notes..."
                            className="w-full text-xs bg-transparent border-none focus:ring-0 resize-none h-16 text-zinc-600 italic p-0"
                        />

                        <div className="mt-auto pt-4 border-t border-zinc-100 flex justify-between items-center gap-2">
                            <div className="flex gap-2">
                                <button onClick={() => updateMachine(machine.id, { lastService: Date.now() })} className="text-xs text-zinc-600 hover:text-zinc-900 flex items-center gap-1 font-bold bg-zinc-100 px-2 py-1 rounded">
                                    <Wrench size={12} /> Log Service
                                </button>
                                <button onClick={() => setScheduleMachineId(machine.id)} className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1 font-bold bg-blue-50 px-2 py-1 rounded">
                                    <Calendar size={12} /> Schedule
                                </button>
                            </div>
                            <div className="flex gap-2">
                                <button onClick={() => setSelectedMachineId(machine.id)} className="text-xs text-zinc-600 hover:text-zinc-900 flex items-center gap-1 font-bold bg-zinc-100 px-2 py-1 rounded">
                                    <FileText size={12} /> Details
                                </button>
                                <button onClick={() => deleteMachine(machine.id)} className="text-xs text-red-400 hover:text-red-600 px-2">
                                    Delete
                                </button>
                            </div>
                        </div>
                    </div>
                )})}
            </div>

            {selectedMachine && (
                <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex justify-end z-30" onClick={() => setSelectedMachineId(null)}>
                    <div className="w-full max-w-xl bg-white h-full shadow-2xl border-l border-zinc-200 overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                        <div className="p-4 border-b border-zinc-200 flex items-center justify-between">
                            <div>
                                <div className="text-xs uppercase text-zinc-500 font-bold">Machine details</div>
                                <div className="text-xl font-semibold text-zinc-900">{selectedMachine.name}</div>
                            </div>
                            <button className="text-zinc-500 hover:text-zinc-900" onClick={() => setSelectedMachineId(null)}><X /></button>
                        </div>

                        <div className="p-4 space-y-4">
                            <div className="flex items-center gap-3">
                                <div className={`px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wide border ${statusConfig[selectedMachine.status].color}`}>
                                    {statusConfig[selectedMachine.status].label}
                                </div>
                                <div className="text-xs text-zinc-500">Last service {new Date(selectedMachine.lastService).toLocaleDateString()}</div>
                                <div className={`text-xs ${Date.now() > selectedMachine.nextService ? 'text-red-600 font-semibold' : 'text-zinc-600'}`}>Next due {new Date(selectedMachine.nextService).toLocaleDateString()}</div>
                            </div>

                            <div className="bg-zinc-50 border border-zinc-100 rounded-lg p-3">
                                <div className="text-[11px] uppercase font-bold text-zinc-500 mb-2 flex items-center gap-1"><Tool size={14} /> Maintenance timeline</div>
                                <div className="space-y-2">
                                    {(selectedMachine.maintenanceLog || []).map((entry: MachineMaintenanceEntry) => (
                                        <div key={entry.date} className="flex gap-3 text-sm text-zinc-700 items-start">
                                            <div className="text-[11px] text-zinc-400 w-24 shrink-0">{new Date(entry.date).toLocaleDateString()}</div>
                                            <div className="flex-1">
                                                <div className="font-semibold text-zinc-800">{entry.note}</div>
                                                <div className="flex gap-2 text-xs text-zinc-500 flex-wrap">
                                                    {entry.technician && <span className="flex items-center gap-1"><User size={12} /> {entry.technician}</span>}
                                                    {typeof entry.cost === 'number' && <span className="flex items-center gap-1"><DollarSign size={12} /> ${entry.cost}</span>}
                                                    {entry.parts?.length && <span className="flex items-center gap-1"><Tool size={12} /> Parts: {entry.parts.join(', ')}</span>}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                    {(selectedMachine.maintenanceLog || []).length === 0 && <div className="text-xs text-zinc-500">No maintenance entries yet.</div>}
                                </div>
                            </div>

                            <div className="bg-zinc-50 border border-zinc-100 rounded-lg p-3">
                                <div className="text-[11px] uppercase font-bold text-zinc-500 mb-2 flex items-center gap-1"><Clock size={14} /> Status change log</div>
                                <div className="space-y-2">
                                    {(selectedMachine.statusHistory || []).map(change => (
                                        <div key={change.date} className="flex gap-3 text-sm text-zinc-700 items-center">
                                            <div className="text-[11px] text-zinc-400 w-24 shrink-0">{new Date(change.date).toLocaleDateString()}</div>
                                            <div className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide border ${statusConfig[change.status].color}`}>
                                                {statusConfig[change.status].label}
                                            </div>
                                            <div className="text-xs text-zinc-600">{change.note || 'Updated'}</div>
                                        </div>
                                    ))}
                                    {(selectedMachine.statusHistory || []).length === 0 && <div className="text-xs text-zinc-500">No changes logged.</div>}
                                </div>
                            </div>

                            <div className="bg-zinc-50 border border-zinc-100 rounded-lg p-3">
                                <div className="flex items-center justify-between mb-2">
                                    <div className="text-[11px] uppercase font-bold text-zinc-500 flex items-center gap-1"><Calendar size={14} /> Scheduled windows</div>
                                    <button onClick={() => setScheduleMachineId(selectedMachine.id)} className="text-xs text-blue-600 hover:text-blue-800 font-semibold">New window</button>
                                </div>
                                <div className="space-y-2">
                                    {(selectedMachine.maintenanceWindows || []).map(window => (
                                        <div key={window.id} className="flex gap-3 text-sm text-zinc-700 items-start">
                                            <div className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide border bg-blue-50 text-blue-700 border-blue-100`}>{window.type || 'Maintenance'}</div>
                                            <div className="flex-1">
                                                <div className="font-semibold text-zinc-800">{window.title}</div>
                                                <div className="text-xs text-zinc-500">{formatDate(window.start)} – {formatDate(window.end)} {window.technician && `· ${window.technician}`}</div>
                                            </div>
                                        </div>
                                    ))}
                                    {(selectedMachine.maintenanceWindows || []).length === 0 && <div className="text-xs text-zinc-500">No future windows.</div>}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {scheduleMachineId && (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-40" onClick={() => setScheduleMachineId(null)}>
                    <div className="bg-white rounded-xl shadow-2xl border border-zinc-200 w-full max-w-lg" onClick={(e) => e.stopPropagation()}>
                        <div className="p-4 border-b border-zinc-200 flex items-center justify-between">
                            <div>
                                <div className="text-xs uppercase text-zinc-500 font-bold">Create schedule</div>
                                <div className="text-lg font-semibold text-zinc-900">Maintenance window</div>
                            </div>
                            <button className="text-zinc-500 hover:text-zinc-900" onClick={() => setScheduleMachineId(null)}><X /></button>
                        </div>
                        <div className="p-4 space-y-3">
                            <div>
                                <label className="text-xs text-zinc-500 font-semibold">Title</label>
                                <input value={scheduleDraft.title} onChange={(e) => setScheduleDraft({ ...scheduleDraft, title: e.target.value })} className="w-full mt-1 rounded border border-zinc-200 px-3 py-2 text-sm" />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-xs text-zinc-500 font-semibold">Start</label>
                                    <input type="datetime-local" value={scheduleDraft.start} onChange={(e) => setScheduleDraft({ ...scheduleDraft, start: e.target.value })} className="w-full mt-1 rounded border border-zinc-200 px-3 py-2 text-sm" />
                                </div>
                                <div>
                                    <label className="text-xs text-zinc-500 font-semibold">End</label>
                                    <input type="datetime-local" value={scheduleDraft.end} onChange={(e) => setScheduleDraft({ ...scheduleDraft, end: e.target.value })} className="w-full mt-1 rounded border border-zinc-200 px-3 py-2 text-sm" />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-xs text-zinc-500 font-semibold">Technician</label>
                                    <input value={scheduleDraft.technician} onChange={(e) => setScheduleDraft({ ...scheduleDraft, technician: e.target.value })} className="w-full mt-1 rounded border border-zinc-200 px-3 py-2 text-sm" />
                                </div>
                                <div>
                                    <label className="text-xs text-zinc-500 font-semibold">Type</label>
                                    <input value={scheduleDraft.type} onChange={(e) => setScheduleDraft({ ...scheduleDraft, type: e.target.value })} className="w-full mt-1 rounded border border-zinc-200 px-3 py-2 text-sm" />
                                </div>
                            </div>
                        </div>
                        <div className="p-4 border-t border-zinc-200 flex justify-end gap-2">
                            <button onClick={() => setScheduleMachineId(null)} className="px-4 py-2 text-sm text-zinc-600 hover:text-zinc-900">Cancel</button>
                            <button onClick={handleAddWindow} className="px-4 py-2 text-sm font-bold bg-zinc-900 text-white rounded hover:bg-zinc-800">Create</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MachinePark;
