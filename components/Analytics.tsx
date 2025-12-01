
import React from 'react';
import { Project, InventoryItem, Machine } from '../types';
import { BarChart3, TrendingUp, DollarSign, Activity, AlertTriangle, ArrowUpRight } from 'lucide-react';

interface AnalyticsProps {
    projects: Project[];
    inventory: InventoryItem[];
    machines: Machine[];
}

const Analytics: React.FC<AnalyticsProps> = ({ projects, inventory, machines }) => {
    
    // Calculations
    const totalProjects = projects.length;
    const activeProjects = projects.filter(p => p.status !== 'finished').length;
    
    const operationalMachines = machines.filter(m => m.status === 'operational').length;
    const machineUptime = machines.length > 0 ? Math.round((operationalMachines / machines.length) * 100) : 100;

    const stockValue = inventory.reduce((acc, item) => acc + (item.quantity * (item.cost || 0)), 0);
    
    const projectBOMValue = projects.reduce((acc, p) => {
        return acc + (p.bom || []).reduce((bAcc, item) => bAcc + ((item.quantity * (item.unitCost || 0))), 0);
    }, 0);

    const totalAssetValue = stockValue + projectBOMValue;

    const KpiCard = ({ title, value, sub, trend, icon: Icon, color }: any) => (
        <div className="bg-white p-6 rounded-xl border border-zinc-200 shadow-sm relative overflow-hidden group hover:border-zinc-300 transition-all">
            <div className={`absolute top-0 right-0 p-4 opacity-10 ${color}`}>
                <Icon size={64} />
            </div>
            <div className="flex items-center gap-2 text-zinc-500 mb-3">
                <Icon size={16} />
                <span className="text-[10px] uppercase font-bold tracking-widest">{title}</span>
            </div>
            <div className="text-3xl font-mono font-bold text-zinc-900 mb-1">{value}</div>
            <div className="flex justify-between items-end">
                <span className="text-xs text-zinc-400">{sub}</span>
                {trend && (
                    <span className="text-[10px] font-bold text-green-600 bg-green-50 px-1.5 py-0.5 rounded flex items-center gap-1">
                        <ArrowUpRight size={10} /> {trend}
                    </span>
                )}
            </div>
        </div>
    );

    return (
        <div className="p-8 h-full bg-zinc-50 overflow-y-auto">
             <header className="flex justify-between items-center mb-8">
                <div>
                    <h2 className="font-serif text-2xl font-bold text-zinc-900 flex items-center gap-2">
                        <BarChart3 /> Analytics Dashboard
                    </h2>
                    <p className="text-zinc-500 text-sm">Real-time system performance and asset valuation.</p>
                </div>
                <div className="text-xs text-zinc-400 font-mono bg-zinc-100 px-3 py-1 rounded">
                    Last Updated: {new Date().toLocaleTimeString()}
                </div>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <KpiCard 
                    title="Active Pipelines" 
                    value={`${activeProjects} / ${totalProjects}`} 
                    sub="Project Throughput" 
                    trend="+2 this month"
                    icon={Activity}
                    color="text-blue-500"
                />
                 <KpiCard 
                    title="Machine Health" 
                    value={`${machineUptime}%`} 
                    sub="Operational Capacity" 
                    trend="Stable"
                    icon={TrendingUp}
                    color="text-green-500"
                />
                 <KpiCard 
                    title="Asset Valuation" 
                    value={`$${totalAssetValue.toLocaleString()}`} 
                    sub="Est. Material & Stock" 
                    trend="+12% value"
                    icon={DollarSign}
                    color="text-amber-500"
                />
                 <KpiCard 
                    title="Inventory SKUs" 
                    value={inventory.length} 
                    sub="Stockroom Items" 
                    icon={AlertTriangle}
                    color="text-purple-500"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-white rounded-xl p-6 border border-zinc-200 shadow-sm flex flex-col">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="font-bold text-zinc-800 text-sm">Project Velocity</h3>
                        <select className="bg-zinc-50 border border-zinc-200 text-xs rounded px-2 py-1 outline-none">
                            <option>Last 6 Months</option>
                            <option>Year to Date</option>
                        </select>
                    </div>
                    <div className="flex-1 flex items-end justify-between gap-2 px-4 h-64">
                         {[40, 65, 45, 80, 55, 90, 70, 85].map((h, i) => (
                             <div key={i} className="flex-1 flex flex-col justify-end group">
                                <div className="bg-zinc-900 w-full rounded-t-sm opacity-80 group-hover:opacity-100 transition-all relative" style={{ height: `${h}%` }}>
                                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-zinc-900 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                                        {h} pts
                                    </div>
                                </div>
                             </div>
                         ))}
                    </div>
                    <div className="flex justify-between mt-2 text-[10px] text-zinc-400 font-mono uppercase">
                        <span>Jan</span><span>Feb</span><span>Mar</span><span>Apr</span><span>May</span><span>Jun</span><span>Jul</span><span>Aug</span>
                    </div>
                </div>

                 <div className="bg-zinc-900 rounded-xl p-6 border border-zinc-800 shadow-sm text-zinc-100 flex flex-col relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-zinc-800 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 opacity-50"></div>
                    <h3 className="font-bold text-zinc-300 text-sm mb-6 relative z-10">Cost Distribution</h3>
                    
                    <div className="space-y-4 relative z-10">
                        <div>
                            <div className="flex justify-between text-xs mb-1">
                                <span className="text-zinc-400">Raw Material</span>
                                <span className="font-mono">45%</span>
                            </div>
                            <div className="w-full bg-zinc-800 h-1.5 rounded-full">
                                <div className="bg-blue-500 h-full rounded-full w-[45%]"></div>
                            </div>
                        </div>
                        <div>
                            <div className="flex justify-between text-xs mb-1">
                                <span className="text-zinc-400">Electronics</span>
                                <span className="font-mono">30%</span>
                            </div>
                            <div className="w-full bg-zinc-800 h-1.5 rounded-full">
                                <div className="bg-amber-500 h-full rounded-full w-[30%]"></div>
                            </div>
                        </div>
                         <div>
                            <div className="flex justify-between text-xs mb-1">
                                <span className="text-zinc-400">Hardware</span>
                                <span className="font-mono">15%</span>
                            </div>
                            <div className="w-full bg-zinc-800 h-1.5 rounded-full">
                                <div className="bg-zinc-500 h-full rounded-full w-[15%]"></div>
                            </div>
                        </div>
                        <div>
                            <div className="flex justify-between text-xs mb-1">
                                <span className="text-zinc-400">Consumables</span>
                                <span className="font-mono">10%</span>
                            </div>
                            <div className="w-full bg-zinc-800 h-1.5 rounded-full">
                                <div className="bg-purple-500 h-full rounded-full w-[10%]"></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Analytics;
