import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Project, InventoryItem, Machine } from '../types';
import {
    Activity,
    AlertTriangle,
    ArrowUpRight,
    BarChart3,
    Battery,
    Bolt,
    DollarSign,
    Gauge,
    LineChart,
    Target,
    TrendingUp,
} from 'lucide-react';

interface AnalyticsProps {
    projects: Project[];
    inventory: InventoryItem[];
    machines: Machine[];
}

type RangeKey = '14d' | '30d' | '90d';

interface KpiCardProps {
    title: string;
    value: string;
    delta: string;
    target?: string;
    trendData: number[];
    icon: React.ElementType;
    accent: string;
    onSelect?: () => void;
    active?: boolean;
}

const ranges: Record<RangeKey, number> = {
    '14d': 14,
    '30d': 30,
    '90d': 90,
};

const buildSparklinePath = (points: number[], width = 120, height = 48) => {
    if (points.length === 0) return '';
    const max = Math.max(...points);
    const min = Math.min(...points);
    const span = max - min || 1;
    const step = width / Math.max(points.length - 1, 1);

    return points
        .map((value, index) => {
            const x = index * step;
            const y = height - ((value - min) / span) * height;
            return `${index === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
        })
        .join(' ');
};

const KpiCard: React.FC<KpiCardProps> = ({ title, value, delta, target, trendData, icon: Icon, accent, onSelect, active }) => {
    const path = buildSparklinePath(trendData);
    const deltaPositive = delta.startsWith('+');

    return (
        <button
            onClick={onSelect}
            className={`bg-white p-5 rounded-xl border border-zinc-200 shadow-sm relative overflow-hidden group text-left transition-all duration-200 hover:-translate-y-0.5 ${
                active ? 'ring-2 ring-offset-2 ring-zinc-800' : ''
            }`}
        >
            <div className={`absolute top-0 right-0 p-4 opacity-10 ${accent}`}>
                <Icon size={64} />
            </div>
            <div className="flex items-center gap-2 text-zinc-500 mb-2">
                <Icon size={16} />
                <span className="text-[10px] uppercase font-bold tracking-widest">{title}</span>
            </div>
            <div className="flex items-end justify-between gap-3">
                <div>
                    <div className="text-3xl font-mono font-bold text-zinc-900 leading-tight">{value}</div>
                    {target && <div className="text-[11px] text-zinc-400">Target: {target}</div>}
                </div>
                <span
                    className={`text-[10px] font-bold px-1.5 py-0.5 rounded flex items-center gap-1 ${deltaPositive ? 'text-green-600 bg-green-50' : 'text-red-600 bg-red-50'}`}
                >
                    <ArrowUpRight size={10} /> {delta}
                </span>
            </div>
            <svg viewBox="0 0 120 48" className="mt-3 w-full h-12 text-zinc-800">
                <path d={path} fill="none" stroke="currentColor" strokeWidth={2} className="opacity-80" />
            </svg>
        </button>
    );
};

const Analytics: React.FC<AnalyticsProps> = ({ projects, inventory, machines }) => {
    const [range, setRange] = useState<RangeKey>('30d');
    const [selectedStage, setSelectedStage] = useState<string>('all');
    const [throughputSeries, setThroughputSeries] = useState<{ label: string; value: number }[]>([]);
    const [mtbfSeries, setMtbfSeries] = useState<number[]>([]);
    const [inventoryTurns, setInventoryTurns] = useState<number[]>([]);
    const [budgetSeries, setBudgetSeries] = useState<{ spend: number; budget: number }[]>([]);
    const tooltipRef = useRef<HTMLDivElement | null>(null);

    const totalProjects = projects.length;
    const activeProjects = projects.filter((p) => p.status !== 'finished').length;

    const operationalMachines = machines.filter((m) => m.status === 'operational').length;
    const machineUptime = machines.length > 0 ? Math.round((operationalMachines / machines.length) * 100) : 100;

    const stockValue = inventory.reduce((acc, item) => acc + item.quantity * (item.cost || 0), 0);

    const projectBOMValue = projects.reduce((acc, p) => {
        return (
            acc +
            (p.bom || []).reduce((bAcc, item) => bAcc + item.quantity * (item.unitCost || 0), 0)
        );
    }, 0);

    const totalAssetValue = stockValue + projectBOMValue;

    useEffect(() => {
        const seed = Array.from({ length: 30 }).map((_, idx) => ({
            label: `Day ${idx + 1}`,
            value: Math.max(2, Math.round(8 + Math.sin(idx / 3) * 3 + Math.random() * 2)),
        }));
        setThroughputSeries(seed);
        setMtbfSeries(Array.from({ length: 12 }, (_, i) => 60 + i * 2 + Math.random() * 8));
        setInventoryTurns(Array.from({ length: 12 }, (_, i) => 4 + Math.sin(i / 2) + Math.random()));
        setBudgetSeries(
            Array.from({ length: 12 }, (_, i) => ({
                spend: 12000 + i * 900 + Math.random() * 1500,
                budget: 15000 + i * 600,
            }))
        );
    }, []);

    useEffect(() => {
        const interval = setInterval(() => {
            setThroughputSeries((prev) => {
                const next = Math.max(1, Math.round(prev[prev.length - 1]?.value + (Math.random() - 0.4) * 3));
                const label = `Day ${prev.length + 1}`;
                return [...prev.slice(-90), { label, value: next }];
            });
            setMtbfSeries((prev) => {
                const next = Math.max(45, Math.round((prev[prev.length - 1] || 70) + (Math.random() - 0.5) * 5));
                return [...prev.slice(-30), next];
            });
            setInventoryTurns((prev) => {
                const next = Math.max(2, Number(((prev[prev.length - 1] || 4) + (Math.random() - 0.5) * 0.4).toFixed(2)));
                return [...prev.slice(-30), next];
            });
            setBudgetSeries((prev) => {
                const last = prev[prev.length - 1] || { spend: 12000, budget: 15000 };
                const spend = last.spend + 900 + Math.random() * 700;
                const budget = last.budget + 700;
                return [...prev.slice(-30), { spend, budget }];
            });
        }, 4000);

        return () => clearInterval(interval);
    }, []);

    const filteredThroughput = useMemo(() => {
        const slice = throughputSeries.slice(-ranges[range]);
        if (selectedStage === 'all') return slice;
        const bias = selectedStage === 'finished' ? 2 : 0;
        return slice.map((entry, idx) => ({ ...entry, value: Math.max(1, entry.value - bias + (idx % 3)) }));
    }, [range, selectedStage, throughputSeries]);

    const throughputAvg = filteredThroughput.reduce((acc, cur) => acc + cur.value, 0) / Math.max(filteredThroughput.length, 1);

    const mtbf = useMemo(() => {
        const base = mtbfSeries.slice(-ranges[range]);
        const avg = base.reduce((acc, cur) => acc + cur, 0) / Math.max(base.length, 1);
        const mttr = Math.max(1, 8 - operationalMachines * 0.3);
        return { mtbf: Number(avg.toFixed(1)), mttr: Number(mttr.toFixed(1)) };
    }, [mtbfSeries, operationalMachines, range]);

    const inventoryTurnover = useMemo(() => {
        const turns = inventoryTurns.slice(-ranges[range]);
        const latest = turns[turns.length - 1] || 4;
        const safetyBuffer = inventory.filter((item) => item.quantity <= item.minLevel).length;
        return { latest: Number(latest.toFixed(2)), safetyBuffer };
    }, [inventory, inventoryTurns, range]);

    const budgetHealth = useMemo(() => {
        const slice = budgetSeries.slice(-ranges[range]);
        const last = slice[slice.length - 1] || { spend: 0, budget: 1 };
        const burnRate = ((last.spend / last.budget) * 100).toFixed(1);
        return { slice, burnRate };
    }, [budgetSeries, range]);

    const supplierPerformance = useMemo(
        () => [
            { name: 'Nova Circuits', rating: 4.7, onTime: 96, trend: [92, 94, 93, 95, 96, 97, 96] },
            { name: 'Alpine Metals', rating: 4.3, onTime: 91, trend: [88, 89, 90, 91, 91, 92, 91] },
            { name: 'Vector Plastics', rating: 4.1, onTime: 89, trend: [85, 86, 87, 88, 89, 90, 89] },
        ],
        []
    );

    const hoveredTooltip = (label: string, value: number, event: React.MouseEvent<HTMLDivElement>) => {
        const node = tooltipRef.current;
        if (!node) return;
        node.style.opacity = '1';
        node.style.transform = `translate(${event.clientX - 80}px, ${event.clientY - 70}px)`;
        node.innerHTML = `<div class="text-[10px] uppercase tracking-wide text-zinc-400">${label}</div><div class="font-mono text-sm font-bold text-zinc-900">${value}</div>`;
    };

    const hideTooltip = () => {
        const node = tooltipRef.current;
        if (!node) return;
        node.style.opacity = '0';
    };

    const kpiData: KpiCardProps[] = [
        {
            title: 'Project Throughput',
            value: `${throughputAvg.toFixed(1)} / day`,
            delta: '+6% vs. last range',
            target: '8 / day',
            trendData: filteredThroughput.map((d) => d.value),
            icon: Activity,
            accent: 'text-blue-500',
            onSelect: () => setSelectedStage('all'),
            active: selectedStage === 'all',
        },
        {
            title: 'Machine Uptime',
            value: `${machineUptime}%`,
            delta: '+3% resilience',
            target: '95%+',
            trendData: mtbfSeries.slice(-ranges[range]),
            icon: Battery,
            accent: 'text-green-500',
        },
        {
            title: 'Inventory Turnover',
            value: `${inventoryTurnover.latest}x`,
            delta: '+0.2x velocity',
            target: '5x',
            trendData: inventoryTurns.slice(-ranges[range]),
            icon: AlertTriangle,
            accent: 'text-amber-500',
        },
        {
            title: 'Budget Health',
            value: `${budgetHealth.burnRate}% burn`,
            delta: '+1.1% vs. plan',
            target: ' < 95%',
            trendData: budgetHealth.slice.map((d) => Number(((d.spend / d.budget) * 100).toFixed(1))),
            icon: DollarSign,
            accent: 'text-purple-500',
        },
    ];

    return (
        <div className="p-8 h-full bg-zinc-50 overflow-y-auto">
            <header className="flex justify-between items-center mb-8">
                <div>
                    <h2 className="font-serif text-2xl font-bold text-zinc-900 flex items-center gap-2">
                        <BarChart3 /> Analytics Dashboard
                    </h2>
                    <p className="text-zinc-500 text-sm">Real-time system performance and asset valuation.</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="text-xs text-zinc-400 font-mono bg-zinc-100 px-3 py-1 rounded">
                        Live refresh every 4s
                    </div>
                    <div className="text-xs text-zinc-400 font-mono bg-zinc-100 px-3 py-1 rounded">
                        Last Updated: {new Date().toLocaleTimeString()}
                    </div>
                </div>
            </header>

            <div className="flex flex-wrap gap-2 mb-6">
                {Object.keys(ranges).map((key) => (
                    <button
                        key={key}
                        onClick={() => setRange(key as RangeKey)}
                        className={`text-xs px-3 py-1 rounded-full border ${range === key ? 'bg-zinc-900 text-white border-zinc-900' : 'bg-white border-zinc-200 text-zinc-600'}`}
                    >
                        {key.toUpperCase()}
                    </button>
                ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
                {kpiData.map((kpi) => (
                    <KpiCard key={kpi.title} {...kpi} />
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-10">
                <div className="lg:col-span-2 bg-white rounded-xl p-6 border border-zinc-200 shadow-sm flex flex-col">
                    <div className="flex justify-between items-center mb-4">
                        <div>
                            <h3 className="font-bold text-zinc-800 text-sm">Project Throughput</h3>
                            <p className="text-xs text-zinc-500">Hover for volume. Click stage filters.</p>
                        </div>
                        <div className="flex gap-2 text-xs">
                            {['all', 'finished', 'in_progress'].map((stage) => (
                                <button
                                    key={stage}
                                    onClick={() => setSelectedStage(stage)}
                                    className={`px-3 py-1 rounded-full border ${selectedStage === stage ? 'bg-zinc-900 text-white border-zinc-900' : 'bg-white border-zinc-200 text-zinc-600'}`}
                                >
                                    {stage === 'all' ? 'All' : stage.replace('_', ' ')}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div className="flex-1 flex items-end gap-2 h-64 relative">
                        {filteredThroughput.map((bar, idx) => (
                            <div
                                key={bar.label}
                                className="flex-1 flex flex-col justify-end"
                                onMouseMove={(e) => hoveredTooltip(bar.label, bar.value, e)}
                                onMouseLeave={hideTooltip}
                            >
                                <div
                                    className="bg-zinc-900 w-full rounded-t-sm opacity-80 hover:opacity-100 transition-all cursor-pointer"
                                    style={{ height: `${(bar.value / Math.max(...filteredThroughput.map((b) => b.value), 1)) * 100}%` }}
                                    onClick={() => setSelectedStage(selectedStage === 'in_progress' ? 'finished' : 'in_progress')}
                                ></div>
                            </div>
                        ))}
                        <div
                            ref={tooltipRef}
                            className="pointer-events-none absolute top-0 left-0 bg-white border border-zinc-200 shadow-md rounded px-3 py-2 text-xs transition-opacity duration-150 opacity-0"
                        ></div>
                    </div>
                    <div className="flex justify-between mt-3 text-[10px] text-zinc-400 font-mono uppercase">
                        <span>Stage Velocity</span>
                        <span>{throughputAvg.toFixed(1)} units avg</span>
                    </div>
                </div>

                <div className="bg-zinc-900 rounded-xl p-6 border border-zinc-800 shadow-sm text-zinc-100 flex flex-col relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-zinc-800 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 opacity-50"></div>
                    <h3 className="font-bold text-zinc-300 text-sm mb-4 relative z-10">Equipment MTBF / MTTR</h3>
                    <div className="grid grid-cols-2 gap-3 relative z-10">
                        <div className="bg-zinc-800 rounded-lg p-3 border border-zinc-700">
                            <div className="text-[10px] uppercase text-zinc-500">MTBF</div>
                            <div className="text-2xl font-mono font-bold">{mtbf.mtbf} hrs</div>
                            <div className="flex items-center gap-2 text-xs text-green-400">
                                <TrendingUp size={14} /> +4.2% stability
                            </div>
                        </div>
                        <div className="bg-zinc-800 rounded-lg p-3 border border-zinc-700">
                            <div className="text-[10px] uppercase text-zinc-500">MTTR</div>
                            <div className="text-2xl font-mono font-bold">{mtbf.mttr} hrs</div>
                            <div className="flex items-center gap-2 text-xs text-amber-300">
                                <Target size={14} /> Target &lt; 6h
                            </div>
                        </div>
                    </div>
                    <div className="mt-6 relative z-10">
                        <svg viewBox="0 0 220 90" className="w-full h-24 text-green-300">
                            <path
                                d={buildSparklinePath(mtbfSeries.slice(-ranges[range]), 220, 70)}
                                fill="none"
                                stroke="currentColor"
                                strokeWidth={2.5}
                                className="opacity-90"
                            />
                        </svg>
                        <p className="text-[11px] text-zinc-400 flex items-center gap-2">
                            <Gauge size={14} /> Reliability improvements tracked hourly
                        </p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-10">
                <div className="bg-white rounded-xl p-6 border border-zinc-200 shadow-sm">
                    <div className="flex justify-between items-center mb-3">
                        <h3 className="font-bold text-zinc-800 text-sm">Inventory Turnover</h3>
                        <span className="text-xs text-zinc-500">Live safety alerts</span>
                    </div>
                    <div className="text-3xl font-mono font-bold text-zinc-900">{inventoryTurnover.latest}x</div>
                    <div className="text-xs text-zinc-500 mb-4">{inventoryTurnover.safetyBuffer} items at or below min level</div>
                    <div className="h-32 flex items-end gap-2">
                        {inventoryTurns.slice(-ranges[range]).map((val, idx) => (
                            <div key={idx} className="flex-1 flex flex-col justify-end">
                                <div
                                    className="bg-amber-500/70 w-full rounded-t-sm hover:bg-amber-500 transition-all"
                                    style={{ height: `${(val / Math.max(...inventoryTurns)) * 100}%` }}
                                ></div>
                            </div>
                        ))}
                    </div>
                    <p className="text-[11px] text-zinc-500 mt-3 flex items-center gap-2">
                        <Bolt size={14} className="text-amber-500" /> Faster cycling indicates healthier cash flow
                    </p>
                </div>

                <div className="bg-white rounded-xl p-6 border border-zinc-200 shadow-sm">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="font-bold text-zinc-800 text-sm">Supplier Performance</h3>
                        <span className="text-xs text-zinc-500">Click rows to focus</span>
                    </div>
                    <div className="space-y-3">
                        {supplierPerformance.map((supplier) => (
                            <div
                                key={supplier.name}
                                className="p-3 border border-zinc-200 rounded-lg hover:border-zinc-400 cursor-pointer"
                                onClick={() => setSelectedStage('finished')}
                            >
                                <div className="flex justify-between text-sm font-semibold text-zinc-800">
                                    <span>{supplier.name}</span>
                                    <span className="text-zinc-500">{supplier.rating.toFixed(1)} ★</span>
                                </div>
                                <div className="text-[11px] text-zinc-500 mb-2">{supplier.onTime}% on-time delivery</div>
                                <svg viewBox="0 0 160 40" className="w-full h-10 text-blue-500">
                                    <path d={buildSparklinePath(supplier.trend, 160, 30)} fill="none" stroke="currentColor" strokeWidth={2} />
                                </svg>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="bg-white rounded-xl p-6 border border-zinc-200 shadow-sm">
                    <div className="flex justify-between items-center mb-3">
                        <h3 className="font-bold text-zinc-800 text-sm">Budget Health</h3>
                        <span className="text-xs text-zinc-500">Hover for spend vs plan</span>
                    </div>
                    <div className="text-2xl font-mono font-bold text-zinc-900 mb-1">{budgetHealth.burnRate}% burn</div>
                    <div className="text-xs text-zinc-500 mb-4">Tracking project + stock spend</div>
                    <div className="relative h-32">
                        <svg viewBox="0 0 220 100" className="absolute inset-0 text-blue-500">
                            <path
                                d={buildSparklinePath(budgetHealth.slice.map((d) => d.spend), 220, 80)}
                                fill="none"
                                stroke="currentColor"
                                strokeWidth={2}
                            />
                            <path
                                d={buildSparklinePath(budgetHealth.slice.map((d) => d.budget), 220, 80)}
                                fill="none"
                                stroke="currentColor"
                                strokeWidth={2}
                                className="text-green-500"
                            />
                        </svg>
                    </div>
                    <div className="text-[11px] text-zinc-500 flex items-center gap-2">
                        <LineChart size={14} /> Spend (blue) vs Budget (green)
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white rounded-xl p-6 border border-zinc-200 shadow-sm">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="font-bold text-zinc-800 text-sm">Asset Valuation</h3>
                        <div className="text-xs text-zinc-500">Live BOM + stock</div>
                    </div>
                    <div className="text-3xl font-mono font-bold text-zinc-900 mb-1">${totalAssetValue.toLocaleString()}</div>
                    <div className="text-xs text-zinc-500 mb-4">Projects: ${projectBOMValue.toLocaleString()} · Stock: ${stockValue.toLocaleString()}</div>
                    <div className="flex gap-2 h-3 rounded-full overflow-hidden">
                        <div className="bg-zinc-900" style={{ width: `${(projectBOMValue / Math.max(totalAssetValue, 1)) * 100}%` }}></div>
                        <div className="bg-zinc-200 flex-1"></div>
                    </div>
                </div>

                <div className="bg-white rounded-xl p-6 border border-zinc-200 shadow-sm">
                    <div className="flex justify-between items-center mb-3">
                        <h3 className="font-bold text-zinc-800 text-sm">Operational Snapshot</h3>
                        <span className="text-xs text-zinc-500">Click to toggle filter</span>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                        <div
                            className={`p-3 rounded-lg border ${selectedStage === 'in_progress' ? 'border-zinc-900' : 'border-zinc-200'} cursor-pointer`}
                            onClick={() => setSelectedStage('in_progress')}
                        >
                            <div className="text-[11px] text-zinc-500 uppercase">Active Projects</div>
                            <div className="text-2xl font-mono font-bold">{activeProjects}</div>
                        </div>
                        <div className="p-3 rounded-lg border border-zinc-200">
                            <div className="text-[11px] text-zinc-500 uppercase">Machines</div>
                            <div className="text-2xl font-mono font-bold">{operationalMachines}/{machines.length}</div>
                        </div>
                        <div className="p-3 rounded-lg border border-zinc-200">
                            <div className="text-[11px] text-zinc-500 uppercase">Inventory SKUs</div>
                            <div className="text-2xl font-mono font-bold">{inventory.length}</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Analytics;
