
import React, { useMemo, useState } from 'react';
import { InventoryItem } from '../types';
import { Package, Plus, Trash2, AlertTriangle, Search, Filter, ArrowUpDown, Clock3, ChevronDown, CheckSquare, Download } from 'lucide-react';

interface StockroomProps {
    items: InventoryItem[];
    onUpdate: (items: InventoryItem[]) => void;
}

const Stockroom: React.FC<StockroomProps> = ({ items, onUpdate }) => {
    const [search, setSearch] = useState('');
    const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
    const [selectedLocations, setSelectedLocations] = useState<string[]>([]);
    const [selectedUnits, setSelectedUnits] = useState<string[]>([]);
    const [stockStatusFilter, setStockStatusFilter] = useState<'all' | 'healthy' | 'caution' | 'critical'>('all');
    const [minStockLevel, setMinStockLevel] = useState(0);
    const [quickFilters, setQuickFilters] = useState({ lowStock: false, recent: false, expiring: false });
    const [ratingFilter, setRatingFilter] = useState(0);
    const [leadTimeFilter, setLeadTimeFilter] = useState<number | null>(null);
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [expandedRows, setExpandedRows] = useState<string[]>([]);

    const addItem = () => {
        const newItem: InventoryItem = {
            id: Date.now().toString(),
            name: 'New Item',
            category: 'General',
            quantity: 0,
            unit: 'pcs',
            location: 'Unassigned',
            minLevel: 5,
            cost: 0,
            lastUpdated: Date.now()
        };
        onUpdate([newItem, ...items]);
    };

    const updateItem = (id: string, field: keyof InventoryItem, value: any) => {
        onUpdate(items.map(i => i.id === id ? { ...i, [field]: value, lastUpdated: Date.now() } : i));
    };

    const deleteItem = (id: string) => {
        if(confirm('Remove from inventory?')) {
            onUpdate(items.filter(i => i.id !== id));
        }
    };

    const uniqueCategories = useMemo(() => Array.from(new Set(items.map(i => i.category))), [items]);
    const uniqueLocations = useMemo(() => Array.from(new Set(items.map(i => i.location))), [items]);
    const uniqueUnits = useMemo(() => Array.from(new Set(items.map(i => i.unit))), [items]);

    const maxQuantity = useMemo(() => Math.max(100, ...items.map(i => i.quantity)), [items]);
    const maxLeadTime = useMemo(() => Math.max(30, ...items.map(i => i.leadTimeDays || 0)), [items]);

    const stockStatus = (item: InventoryItem) => {
        if (item.quantity <= item.minLevel) return 'critical' as const;
        if (item.quantity <= item.minLevel * 1.5) return 'caution' as const;
        return 'healthy' as const;
    };

    const filtered = items.filter(i => {
        const matchesSearch = i.name.toLowerCase().includes(search.toLowerCase()) || i.category.toLowerCase().includes(search.toLowerCase()) || i.location.toLowerCase().includes(search.toLowerCase());

        const matchesCategory = selectedCategories.length === 0 || selectedCategories.includes(i.category);
        const matchesLocation = selectedLocations.length === 0 || selectedLocations.includes(i.location);
        const matchesUnit = selectedUnits.length === 0 || selectedUnits.includes(i.unit);

        const status = stockStatus(i);
        const matchesStatusFilter = stockStatusFilter === 'all' || status === stockStatusFilter;
        const matchesMinStock = i.quantity >= minStockLevel;
        const matchesRating = ratingFilter === 0 || (i.vendorRating ?? 0) >= ratingFilter;
        const matchesLeadTime = leadTimeFilter === null || (i.leadTimeDays ?? 0) <= leadTimeFilter;

        const isLowStock = status === 'critical';
        const isRecent = i.lastUpdated ? (Date.now() - i.lastUpdated) < (1000 * 60 * 60 * 24 * 7) : false;
        const isExpiring = i.lastUpdated && i.leadTimeDays ? (Date.now() - i.lastUpdated) > (i.leadTimeDays * 24 * 60 * 60 * 1000) : false;

        const matchesQuickLow = quickFilters.lowStock ? isLowStock : true;
        const matchesQuickRecent = quickFilters.recent ? isRecent : true;
        const matchesQuickExpiring = quickFilters.expiring ? isExpiring : true;

        return matchesSearch && matchesCategory && matchesLocation && matchesUnit && matchesStatusFilter && matchesMinStock && matchesRating && matchesLeadTime && matchesQuickLow && matchesQuickRecent && matchesQuickExpiring;
    });

    const toggleSelection = (id: string) => {
        setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
    };

    const toggleExpand = (id: string) => {
        setExpandedRows(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
    };

    const bulkUpdateField = (field: keyof InventoryItem, value: any) => {
        onUpdate(items.map(i => selectedIds.includes(i.id) ? { ...i, [field]: value, lastUpdated: Date.now() } : i));
    };

    const bulkAdjustQuantity = () => {
        const delta = prompt('Adjust quantity by (use negative for decrease):');
        if(delta === null) return;
        const adjust = parseInt(delta, 10);
        if(Number.isNaN(adjust)) return;
        onUpdate(items.map(i => selectedIds.includes(i.id) ? { ...i, quantity: Math.max(0, i.quantity + adjust), lastUpdated: Date.now() } : i));
    };

    const exportCsv = () => {
        const data = (selectedIds.length ? items.filter(i => selectedIds.includes(i.id)) : filtered)
            .map(i => ({
                id: i.id,
                name: i.name,
                category: i.category,
                location: i.location,
                quantity: i.quantity,
                unit: i.unit,
                minLevel: i.minLevel,
                leadTimeDays: i.leadTimeDays ?? '',
                vendorRating: i.vendorRating ?? ''
            }));

        const header = Object.keys(data[0] || {}).join(',');
        const rows = data.map(row => Object.values(row).join(',')).join('\n');
        const csv = [header, rows].filter(Boolean).join('\n');

        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'stockroom.csv';
        link.click();
        URL.revokeObjectURL(url);
    };

    const categoryColor = (cat: string) => {
        const c = cat.toLowerCase();
        if(c.includes('raw')) return 'bg-blue-100 text-blue-700 border-blue-200';
        if(c.includes('hard')) return 'bg-zinc-100 text-zinc-700 border-zinc-200';
        if(c.includes('elec')) return 'bg-amber-100 text-amber-700 border-amber-200';
        return 'bg-gray-50 text-gray-600 border-gray-200';
    };

    return (
        <div className="p-8 h-full flex flex-col bg-zinc-50">
            <header className="flex justify-between items-end mb-6">
                <div>
                    <h2 className="font-serif text-2xl font-bold text-zinc-900 flex items-center gap-2">
                        <Package /> Stockroom
                    </h2>
                    <p className="text-zinc-500 text-sm mt-1">Global inventory tracking and material logistics.</p>
                </div>
                <div className="flex gap-4 items-center">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={14}/>
                        <input
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            placeholder="Filter SKU, Category, or Location..."
                            className="pl-9 pr-4 py-2 rounded border border-zinc-300 text-sm w-64 focus:outline-none focus:ring-1 focus:ring-zinc-500"
                        />
                    </div>
                    <button onClick={addItem} className="bg-zinc-900 text-white px-4 py-2 rounded text-sm font-bold flex items-center gap-2 hover:bg-zinc-800 shadow-sm">
                        <Plus size={16}/> Add Stock
                    </button>
                </div>
            </header>

            {selectedIds.length > 0 && (
                <div className="flex flex-wrap items-center gap-2 mb-4 bg-white border border-zinc-200 rounded-lg p-3 shadow-sm">
                    <span className="text-xs font-bold text-zinc-500">Bulk Actions ({selectedIds.length} selected)</span>
                    <button onClick={() => {
                        const val = prompt('New Category?');
                        if(val) bulkUpdateField('category', val);
                    }} className="text-xs px-3 py-1.5 rounded border border-zinc-200 hover:border-zinc-300">Edit Category</button>
                    <button onClick={() => {
                        const val = prompt('New Location?');
                        if(val) bulkUpdateField('location', val);
                    }} className="text-xs px-3 py-1.5 rounded border border-zinc-200 hover:border-zinc-300">Edit Location</button>
                    <button onClick={bulkAdjustQuantity} className="text-xs px-3 py-1.5 rounded border border-zinc-200 hover:border-zinc-300">Adjust Quantity</button>
                    <button onClick={exportCsv} className="text-xs px-3 py-1.5 rounded border border-zinc-200 hover:border-zinc-300 flex items-center gap-1"><Download size={14}/> Export CSV</button>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-3 mb-4">
                <div className="bg-white border border-zinc-200 rounded-lg p-3 shadow-sm">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-[11px] uppercase tracking-wide text-zinc-500 font-bold flex items-center gap-2"><Filter size={12}/> Category</span>
                        <span className="text-[10px] text-zinc-400">Multi-select</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {uniqueCategories.map(cat => (
                            <button
                                key={cat}
                                onClick={() => setSelectedCategories(prev => prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat])}
                                className={`px-2 py-1 rounded-full text-[11px] border transition-colors ${selectedCategories.includes(cat) ? 'bg-zinc-900 text-white border-zinc-900' : 'bg-white text-zinc-600 border-zinc-200 hover:border-zinc-300'}`}
                            >
                                {cat}
                            </button>
                        ))}
                        {uniqueCategories.length === 0 && <span className="text-[11px] text-zinc-400">No categories</span>}
                    </div>
                </div>

                <div className="bg-white border border-zinc-200 rounded-lg p-3 shadow-sm">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-[11px] uppercase tracking-wide text-zinc-500 font-bold flex items-center gap-2"><Filter size={12}/> Location</span>
                        <span className="text-[10px] text-zinc-400">Multi-select</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {uniqueLocations.map(loc => (
                            <button
                                key={loc}
                                onClick={() => setSelectedLocations(prev => prev.includes(loc) ? prev.filter(l => l !== loc) : [...prev, loc])}
                                className={`px-2 py-1 rounded-full text-[11px] border transition-colors ${selectedLocations.includes(loc) ? 'bg-zinc-900 text-white border-zinc-900' : 'bg-white text-zinc-600 border-zinc-200 hover:border-zinc-300'}`}
                            >
                                {loc}
                            </button>
                        ))}
                        {uniqueLocations.length === 0 && <span className="text-[11px] text-zinc-400">No locations</span>}
                    </div>
                </div>

                <div className="bg-white border border-zinc-200 rounded-lg p-3 shadow-sm">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-[11px] uppercase tracking-wide text-zinc-500 font-bold flex items-center gap-2"><ArrowUpDown size={12}/> Stock Level</span>
                        <span className="text-[10px] text-zinc-400">Min {minStockLevel}</span>
                    </div>
                    <div className="flex items-center gap-2 mb-3">
                        <select
                            value={stockStatusFilter}
                            onChange={e => setStockStatusFilter(e.target.value as 'all' | 'healthy' | 'caution' | 'critical')}
                            className="border border-zinc-200 rounded px-2 py-1 text-xs text-zinc-600 bg-white focus:outline-none focus:ring-1 focus:ring-zinc-300"
                        >
                            <option value="all">All States</option>
                            <option value="healthy">Healthy</option>
                            <option value="caution">Caution</option>
                            <option value="critical">Critical</option>
                        </select>
                        <AlertTriangle className="text-amber-500" size={14}/>
                    </div>
                    <input
                        type="range"
                        min={0}
                        max={maxQuantity}
                        value={minStockLevel}
                        onChange={e => setMinStockLevel(parseInt(e.target.value))}
                        className="w-full accent-zinc-900"
                    />
                    <div className="flex justify-between text-[10px] text-zinc-400 mt-1">
                        <span>0</span>
                        <span>{maxQuantity}</span>
                    </div>
                </div>

                <div className="bg-white border border-zinc-200 rounded-lg p-3 shadow-sm">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-[11px] uppercase tracking-wide text-zinc-500 font-bold flex items-center gap-2"><Filter size={12}/> Unit Type</span>
                        <span className="text-[10px] text-zinc-400">Multi-select</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {uniqueUnits.map(unit => (
                            <button
                                key={unit}
                                onClick={() => setSelectedUnits(prev => prev.includes(unit) ? prev.filter(u => u !== unit) : [...prev, unit])}
                                className={`px-2 py-1 rounded-full text-[11px] border transition-colors ${selectedUnits.includes(unit) ? 'bg-zinc-900 text-white border-zinc-900' : 'bg-white text-zinc-600 border-zinc-200 hover:border-zinc-300'}`}
                            >
                                {unit}
                            </button>
                        ))}
                        {uniqueUnits.length === 0 && <span className="text-[11px] text-zinc-400">No units</span>}
                    </div>
                </div>
                <div className="bg-white border border-zinc-200 rounded-lg p-3 shadow-sm">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-[11px] uppercase tracking-wide text-zinc-500 font-bold flex items-center gap-2"><Filter size={12}/> Vendor Rating</span>
                        <span className="text-[10px] text-zinc-400">Min {ratingFilter}★</span>
                    </div>
                    <input
                        type="range"
                        min={0}
                        max={5}
                        value={ratingFilter}
                        onChange={e => setRatingFilter(parseInt(e.target.value))}
                        className="w-full accent-zinc-900"
                    />
                    <div className="flex justify-between text-[10px] text-zinc-400 mt-1">
                        <span>0</span>
                        <span>5</span>
                    </div>
                </div>
                <div className="bg-white border border-zinc-200 rounded-lg p-3 shadow-sm">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-[11px] uppercase tracking-wide text-zinc-500 font-bold flex items-center gap-2"><Clock3 size={12}/> Lead Time</span>
                        <span className="text-[10px] text-zinc-400">Max {leadTimeFilter ?? maxLeadTime}d</span>
                    </div>
                    <input
                        type="range"
                        min={0}
                        max={maxLeadTime}
                        value={leadTimeFilter ?? maxLeadTime}
                        onChange={e => setLeadTimeFilter(parseInt(e.target.value))}
                        className="w-full accent-zinc-900"
                    />
                    <div className="flex justify-between text-[10px] text-zinc-400 mt-1">
                        <span>0d</span>
                        <span>{maxLeadTime}d</span>
                    </div>
                    <button onClick={() => setLeadTimeFilter(null)} className="mt-2 text-[11px] text-blue-600 hover:underline">Clear lead-time cap</button>
                </div>
            </div>

            <div className="flex items-center gap-3 mb-4">
                <span className="text-[11px] uppercase tracking-wide text-zinc-500 font-bold">Quick Filters:</span>
                <button
                    onClick={() => setQuickFilters(prev => ({ ...prev, lowStock: !prev.lowStock }))}
                    className={`text-xs font-bold px-3 py-2 rounded border flex items-center gap-2 transition-colors ${quickFilters.lowStock ? 'bg-red-100 border-red-300 text-red-800' : 'bg-white border-zinc-300 text-zinc-600 hover:bg-zinc-50'}`}
                >
                    <AlertTriangle size={14} />
                    Low Stock
                </button>
                <button
                    onClick={() => setQuickFilters(prev => ({ ...prev, recent: !prev.recent }))}
                    className={`text-xs font-bold px-3 py-2 rounded border flex items-center gap-2 transition-colors ${quickFilters.recent ? 'bg-emerald-100 border-emerald-300 text-emerald-800' : 'bg-white border-zinc-300 text-zinc-600 hover:bg-zinc-50'}`}
                >
                    <Clock3 size={14} />
                    Recently Added
                </button>
                <button
                    onClick={() => setQuickFilters(prev => ({ ...prev, expiring: !prev.expiring }))}
                    className={`text-xs font-bold px-3 py-2 rounded border flex items-center gap-2 transition-colors ${quickFilters.expiring ? 'bg-amber-100 border-amber-300 text-amber-800' : 'bg-white border-zinc-300 text-zinc-600 hover:bg-zinc-50'}`}
                >
                    <Clock3 size={14} />
                    Expiring POs
                </button>
            </div>

            <div className="flex-1 bg-white rounded-lg border border-zinc-200 overflow-hidden shadow-sm flex flex-col">
                <div className="overflow-auto flex-1 hidden md:block">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-zinc-100 text-zinc-600 font-bold uppercase text-[10px] tracking-wider sticky top-0 border-b border-zinc-200">
                            <tr>
                                <th className="px-4 py-3 w-[5%]"><input type="checkbox" checked={selectedIds.length === filtered.length && filtered.length > 0} onChange={() => setSelectedIds(selectedIds.length === filtered.length ? [] : filtered.map(i => i.id))} /></th>
                                <th className="px-4 py-3 w-[30%]">Item / SKU</th>
                                <th className="px-4 py-3 w-[25%]">Category & Location</th>
                                <th className="px-4 py-3 w-[25%]">Stock & Status</th>
                                <th className="px-4 py-3 w-[15%]"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-100">
                            {filtered.map(item => {
                                const stockPercent = Math.min(100, (item.quantity / (item.minLevel * 3)) * 100);
                                const status = stockStatus(item);
                                const isLow = status === 'critical';
                                const statusStyles = {
                                    healthy: 'bg-emerald-100 text-emerald-800 border-emerald-200',
                                    caution: 'bg-amber-100 text-amber-800 border-amber-200',
                                    critical: 'bg-red-100 text-red-800 border-red-200'
                                }[status];
                                const barColor = status === 'critical' ? 'bg-red-500' : status === 'caution' ? 'bg-amber-400' : 'bg-green-500';
                                const expanded = expandedRows.includes(item.id);
                                return (
                                    <React.Fragment key={item.id}>
                                        <tr className="hover:bg-zinc-50 group transition-colors">
                                            <td className="px-4 py-3 align-top">
                                                <input type="checkbox" checked={selectedIds.includes(item.id)} onChange={() => toggleSelection(item.id)} />
                                            </td>
                                            <td className="px-4 py-3 align-top">
                                                <div className="flex items-start gap-2">
                                                    <button onClick={() => toggleExpand(item.id)} className="text-zinc-400 hover:text-zinc-700 mt-1"><ChevronDown size={14} className={expanded ? 'rotate-180 transition-transform' : 'transition-transform'} /></button>
                                                    <div className="flex-1">
                                                        <input
                                                            value={item.name}
                                                            onChange={e => updateItem(item.id, 'name', e.target.value)}
                                                            className="w-full bg-transparent font-bold text-zinc-800 focus:bg-white focus:ring-1 focus:ring-zinc-200 rounded px-1"
                                                        />
                                                        <div className="flex items-center gap-2 mt-1 text-[11px] text-zinc-500">
                                                            <span>Min</span>
                                                            <input
                                                                type="number"
                                                                value={item.minLevel}
                                                                onChange={e => updateItem(item.id, 'minLevel', parseInt(e.target.value))}
                                                                className="w-14 bg-transparent text-[11px] text-zinc-500 focus:bg-white rounded px-1"
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 align-top">
                                                <div className="flex flex-col gap-2">
                                                    <div className={`inline-block px-2 py-0.5 rounded border text-[10px] font-bold uppercase tracking-wide ${categoryColor(item.category)}`}>
                                                        <input
                                                            value={item.category}
                                                            onChange={e => updateItem(item.id, 'category', e.target.value)}
                                                            className="bg-transparent border-none w-24 text-center focus:outline-none"
                                                        />
                                                    </div>
                                                    <input
                                                        value={item.location}
                                                        onChange={e => updateItem(item.id, 'location', e.target.value)}
                                                        className="w-full bg-transparent text-zinc-600 focus:bg-white focus:ring-1 focus:ring-zinc-200 rounded px-1 font-mono text-xs"
                                                    />
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 align-top">
                                                <div className="flex items-center justify-between mb-2">
                                                    <div className={`px-2 py-1 rounded border text-[11px] font-bold uppercase tracking-wide ${statusStyles}`}>
                                                        {status === 'critical' ? 'Reorder' : status === 'caution' ? 'Watch' : 'Healthy'}
                                                    </div>
                                                    <span className="text-[11px] text-zinc-400">{item.vendorRating ? `${item.vendorRating.toFixed(1)}★` : 'Unrated'}</span>
                                                </div>
                                                <div className="flex items-center gap-2 mb-1">
                                                    <div className={`px-2 py-1 rounded border text-xs font-mono ${isLow ? 'border-red-200 text-red-700 bg-red-50' : 'border-zinc-200 text-zinc-700 bg-zinc-50'}`}>
                                                        {item.quantity} {item.unit}
                                                    </div>
                                                    <div className="text-[11px] text-zinc-500">Min {item.minLevel}</div>
                                                </div>
                                                <div className="w-full bg-zinc-100 h-1.5 rounded-full overflow-hidden">
                                                    <div
                                                        className={`h-full rounded-full transition-all duration-500 ${barColor}`}
                                                        style={{ width: `${stockPercent}%` }}
                                                    ></div>
                                                </div>
                                                {isLow && <span className="text-[9px] text-red-500 font-bold uppercase mt-1 block">Reorder Required</span>}
                                            </td>
                                            <td className="px-4 py-3 text-right align-top">
                                                <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button onClick={() => toggleExpand(item.id)} className="text-zinc-500 hover:text-zinc-800 text-xs flex items-center gap-1"><CheckSquare size={14}/> Details</button>
                                                    <button onClick={() => deleteItem(item.id)} className="text-zinc-300 hover:text-red-500">
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                        {expanded && (
                                            <tr className="bg-zinc-50">
                                                <td></td>
                                                <td colSpan={4} className="px-10 py-3 text-xs text-zinc-600">
                                                    <div className="flex flex-wrap gap-4">
                                                        <span className="inline-flex items-center gap-1"><Clock3 size={12}/> Lead Time: <input type="number" className="w-16 bg-white border border-zinc-200 rounded px-1" value={item.leadTimeDays ?? ''} onChange={e => updateItem(item.id, 'leadTimeDays', parseInt(e.target.value) || 0)} /> days</span>
                                                        <span className="inline-flex items-center gap-1">Cost: <input type="number" className="w-20 bg-white border border-zinc-200 rounded px-1" value={item.cost ?? ''} onChange={e => updateItem(item.id, 'cost', parseFloat(e.target.value))} /></span>
                                                        <span className="inline-flex items-center gap-1">Updated: {item.lastUpdated ? new Date(item.lastUpdated).toLocaleString() : 'Unknown'}</span>
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </React.Fragment>
                                );
                            })}
                        </tbody>
                    </table>
                </div>

                <div className="md:hidden grid grid-cols-1 gap-3 p-3">
                    {filtered.map(item => {
                        const status = stockStatus(item);
                        const statusStyles = {
                            healthy: 'bg-emerald-100 text-emerald-800 border-emerald-200',
                            caution: 'bg-amber-100 text-amber-800 border-amber-200',
                            critical: 'bg-red-100 text-red-800 border-red-200'
                        }[status];
                        const barColor = status === 'critical' ? 'bg-red-500' : status === 'caution' ? 'bg-amber-400' : 'bg-green-500';
                        return (
                            <div key={item.id} className="border border-zinc-200 rounded-lg p-3 shadow-sm bg-white">
                                <div className="flex items-start justify-between mb-2">
                                    <div className="flex items-start gap-2">
                                        <input type="checkbox" checked={selectedIds.includes(item.id)} onChange={() => toggleSelection(item.id)} className="mt-1" />
                                        <div>
                                            <input value={item.name} onChange={e => updateItem(item.id, 'name', e.target.value)} className="font-bold text-zinc-900 bg-transparent" />
                                            <div className="text-[11px] text-zinc-500">{item.location}</div>
                                        </div>
                                    </div>
                                    <span className={`px-2 py-1 rounded border text-[11px] font-bold uppercase tracking-wide ${statusStyles}`}>
                                        {status === 'critical' ? 'Reorder' : status === 'caution' ? 'Watch' : 'Healthy'}
                                    </span>
                                </div>
                                <div className="flex items-center gap-2 mb-2">
                                    <div className={`inline-block px-2 py-0.5 rounded border text-[10px] font-bold uppercase tracking-wide ${categoryColor(item.category)}`}>
                                        <input value={item.category} onChange={e => updateItem(item.id, 'category', e.target.value)} className="bg-transparent border-none w-24 text-center focus:outline-none" />
                                    </div>
                                    <div className="text-[11px] text-zinc-500">Lead: {item.leadTimeDays ?? '—'}d</div>
                                </div>
                                <div className="flex items-center gap-2 mb-2">
                                    <input type="number" value={item.quantity} onChange={e => updateItem(item.id, 'quantity', parseInt(e.target.value))} className="w-20 bg-transparent font-mono font-bold text-right border border-zinc-200 rounded px-1" />
                                    <input value={item.unit} onChange={e => updateItem(item.id, 'unit', e.target.value)} className="w-16 bg-transparent text-left text-zinc-500 text-xs border border-zinc-200 rounded px-1" />
                                    <span className="text-[11px] text-zinc-500">Min {item.minLevel}</span>
                                </div>
                                <div className="w-full bg-zinc-100 h-1.5 rounded-full overflow-hidden">
                                    <div className={`h-full rounded-full ${barColor}`} style={{ width: `${Math.min(100, (item.quantity / (item.minLevel * 3)) * 100)}%` }}></div>
                                </div>
                                <div className="flex justify-between mt-2 text-xs text-zinc-500">
                                    <button onClick={() => toggleExpand(item.id)} className="flex items-center gap-1 text-blue-600">{expandedRows.includes(item.id) ? 'Hide details' : 'Show details'} <ChevronDown size={12} className={expandedRows.includes(item.id) ? 'rotate-180' : ''} /></button>
                                    <button onClick={() => deleteItem(item.id)} className="text-red-500 text-xs">Delete</button>
                                </div>
                                {expandedRows.includes(item.id) && (
                                    <div className="mt-2 text-[11px] text-zinc-600 space-y-1">
                                        <div>Rating: {item.vendorRating ?? 'N/A'}★</div>
                                        <div>Last updated: {item.lastUpdated ? new Date(item.lastUpdated).toLocaleDateString() : 'Unknown'}</div>
                                        <div>Cost: {item.cost ?? '—'}</div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default Stockroom;
