
import React, { useMemo, useState } from 'react';
import { Vendor } from '../types';
import { Truck, ExternalLink, Star, Plus, Trash2, Clock, Calendar, MapPin, Search, Filter, ChevronDown, Download } from 'lucide-react';

interface SupplyChainProps {
    vendors: Vendor[];
    onUpdate: (vendors: Vendor[]) => void;
}

const SupplyChain: React.FC<SupplyChainProps> = ({ vendors, onUpdate }) => {
    const [search, setSearch] = useState('');
    const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
    const [selectedLocations, setSelectedLocations] = useState<string[]>([]);
    const [minRating, setMinRating] = useState(0);
    const [maxLeadTime, setMaxLeadTime] = useState<number | null>(null);
    const [quickFilters, setQuickFilters] = useState({ lowStock: false, recent: false, expiring: false });
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [expandedRows, setExpandedRows] = useState<string[]>([]);

    const addVendor = () => {
        const name = prompt("Vendor Name:");
        if(!name) return;

        const newVendor: Vendor = {
            id: Date.now().toString(),
            name,
            website: '',
            category: 'General',
            rating: 3,
            leadTime: 'Unknown',
            lastOrder: Date.now(),
            notes: '',
            location: 'Unassigned'
        };
        onUpdate([...vendors, newVendor]);
    };

    const updateVendor = (id: string, updates: Partial<Vendor>) => {
        onUpdate(vendors.map(v => v.id === id ? { ...v, ...updates } : v));
    };

    const deleteVendor = (id: string) => {
        if(confirm("Remove vendor?")) onUpdate(vendors.filter(v => v.id !== id));
    };

    const categories = useMemo(() => Array.from(new Set(vendors.map(v => v.category))), [vendors]);
    const locations = useMemo(() => Array.from(new Set(vendors.map(v => v.location || 'Unassigned'))), [vendors]);

    const filtered = vendors.filter(v => {
        const matchesSearch = v.name.toLowerCase().includes(search.toLowerCase()) || v.category.toLowerCase().includes(search.toLowerCase());
        const matchesCategory = selectedCategories.length === 0 || selectedCategories.includes(v.category);
        const matchesLocation = selectedLocations.length === 0 || selectedLocations.includes(v.location || 'Unassigned');
        const matchesRating = minRating === 0 || v.rating >= minRating;

        const leadTimeNumber = v.leadTime ? parseInt(v.leadTime) : 0;
        const matchesLeadTime = maxLeadTime === null || (!Number.isNaN(leadTimeNumber) && leadTimeNumber <= maxLeadTime);

        const isLow = v.rating <= 2;
        const isRecent = v.lastOrder ? (Date.now() - v.lastOrder) < (1000 * 60 * 60 * 24 * 30) : false;
        const isExpiring = v.leadTime ? /week|month/i.test(v.leadTime) : false;

        const matchesQuickLow = quickFilters.lowStock ? isLow : true;
        const matchesQuickRecent = quickFilters.recent ? isRecent : true;
        const matchesQuickExpiring = quickFilters.expiring ? isExpiring : true;

        return matchesSearch && matchesCategory && matchesLocation && matchesRating && matchesLeadTime && matchesQuickLow && matchesQuickRecent && matchesQuickExpiring;
    });

    const toggleSelection = (id: string) => {
        setSelectedIds(prev => prev.includes(id) ? prev.filter(v => v !== id) : [...prev, id]);
    };

    const toggleExpand = (id: string) => {
        setExpandedRows(prev => prev.includes(id) ? prev.filter(v => v !== id) : [...prev, id]);
    };

    const bulkSetCategory = () => {
        const val = prompt('New Category?');
        if(!val) return;
        onUpdate(vendors.map(v => selectedIds.includes(v.id) ? { ...v, category: val } : v));
    };

    const bulkSetLocation = () => {
        const val = prompt('New Location?');
        if(!val) return;
        onUpdate(vendors.map(v => selectedIds.includes(v.id) ? { ...v, location: val } : v));
    };

    const bulkAdjustLeadTime = () => {
        const val = prompt('Lead time (e.g., 5 days)?');
        if(!val) return;
        onUpdate(vendors.map(v => selectedIds.includes(v.id) ? { ...v, leadTime: val } : v));
    };

    const exportCsv = () => {
        const data = (selectedIds.length ? vendors.filter(v => selectedIds.includes(v.id)) : filtered)
            .map(v => ({ id: v.id, name: v.name, category: v.category, rating: v.rating, leadTime: v.leadTime || '', lastOrder: v.lastOrder ? new Date(v.lastOrder).toISOString() : '', location: v.location || '' }));
        const header = Object.keys(data[0] || {}).join(',');
        const rows = data.map(row => Object.values(row).join(',')).join('\n');
        const csv = [header, rows].filter(Boolean).join('\n');
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'vendors.csv';
        link.click();
        URL.revokeObjectURL(url);
    };

    return (
        <div className="p-8 h-full bg-zinc-50 flex flex-col">
            <header className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="font-serif text-2xl font-bold text-zinc-900 flex items-center gap-2">
                        <Truck /> Supply Chain
                    </h2>
                    <p className="text-zinc-500 text-sm">Vendor registry, procurement metrics, and ratings.</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="relative hidden md:block">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={14}/>
                        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search vendors or categories" className="pl-9 pr-4 py-2 rounded border border-zinc-300 text-sm w-64 focus:outline-none focus:ring-1 focus:ring-zinc-500" />
                    </div>
                    <button onClick={addVendor} className="bg-zinc-900 text-white px-4 py-2 rounded text-sm font-bold flex items-center gap-2 hover:bg-zinc-800 shadow-sm">
                        <Plus size={16}/> Add Vendor
                    </button>
                </div>
            </header>

            {selectedIds.length > 0 && (
                <div className="flex flex-wrap items-center gap-2 mb-4 bg-white border border-zinc-200 rounded-lg p-3 shadow-sm">
                    <span className="text-xs font-bold text-zinc-500">Bulk Actions ({selectedIds.length} selected)</span>
                    <button onClick={bulkSetCategory} className="text-xs px-3 py-1.5 rounded border border-zinc-200 hover:border-zinc-300">Edit Category</button>
                    <button onClick={bulkSetLocation} className="text-xs px-3 py-1.5 rounded border border-zinc-200 hover:border-zinc-300">Edit Location</button>
                    <button onClick={bulkAdjustLeadTime} className="text-xs px-3 py-1.5 rounded border border-zinc-200 hover:border-zinc-300">Adjust Lead Time</button>
                    <button onClick={exportCsv} className="text-xs px-3 py-1.5 rounded border border-zinc-200 hover:border-zinc-300 flex items-center gap-1"><Download size={14}/> Export CSV</button>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-3 mb-4">
                <div className="bg-white border border-zinc-200 rounded-lg p-3 shadow-sm">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-[11px] uppercase tracking-wide text-zinc-500 font-bold flex items-center gap-2"><Filter size={12}/> Category</span>
                        <span className="text-[10px] text-zinc-400">Multi-select</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {categories.map(cat => (
                            <button key={cat} onClick={() => setSelectedCategories(prev => prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat])} className={`px-2 py-1 rounded-full text-[11px] border transition-colors ${selectedCategories.includes(cat) ? 'bg-zinc-900 text-white border-zinc-900' : 'bg-white text-zinc-600 border-zinc-200 hover:border-zinc-300'}`}>
                                {cat}
                            </button>
                        ))}
                        {categories.length === 0 && <span className="text-[11px] text-zinc-400">No categories</span>}
                    </div>
                </div>
                <div className="bg-white border border-zinc-200 rounded-lg p-3 shadow-sm">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-[11px] uppercase tracking-wide text-zinc-500 font-bold flex items-center gap-2"><MapPin size={12}/> Location</span>
                        <span className="text-[10px] text-zinc-400">Multi-select</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {locations.map(loc => (
                            <button key={loc} onClick={() => setSelectedLocations(prev => prev.includes(loc) ? prev.filter(l => l !== loc) : [...prev, loc])} className={`px-2 py-1 rounded-full text-[11px] border transition-colors ${selectedLocations.includes(loc) ? 'bg-zinc-900 text-white border-zinc-900' : 'bg-white text-zinc-600 border-zinc-200 hover:border-zinc-300'}`}>
                                {loc}
                            </button>
                        ))}
                        {locations.length === 0 && <span className="text-[11px] text-zinc-400">No locations</span>}
                    </div>
                </div>
                <div className="bg-white border border-zinc-200 rounded-lg p-3 shadow-sm">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-[11px] uppercase tracking-wide text-zinc-500 font-bold flex items-center gap-2"><Star size={12}/> Rating</span>
                        <span className="text-[10px] text-zinc-400">Min {minRating}★</span>
                    </div>
                    <input type="range" min={0} max={5} value={minRating} onChange={e => setMinRating(parseInt(e.target.value))} className="w-full accent-zinc-900" />
                    <div className="flex justify-between text-[10px] text-zinc-400 mt-1">
                        <span>0</span>
                        <span>5</span>
                    </div>
                </div>
                <div className="bg-white border border-zinc-200 rounded-lg p-3 shadow-sm">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-[11px] uppercase tracking-wide text-zinc-500 font-bold flex items-center gap-2"><Clock size={12}/> Lead Time</span>
                        <span className="text-[10px] text-zinc-400">Max {maxLeadTime ?? 60}d</span>
                    </div>
                    <input type="range" min={0} max={60} value={maxLeadTime ?? 60} onChange={e => setMaxLeadTime(parseInt(e.target.value))} className="w-full accent-zinc-900" />
                    <div className="flex justify-between text-[10px] text-zinc-400 mt-1">
                        <span>0d</span>
                        <span>60d</span>
                    </div>
                    <button onClick={() => setMaxLeadTime(null)} className="mt-2 text-[11px] text-blue-600 hover:underline">Clear lead-time cap</button>
                </div>
            </div>

            <div className="flex items-center gap-3 mb-4">
                <span className="text-[11px] uppercase tracking-wide text-zinc-500 font-bold">Quick Filters:</span>
                <button onClick={() => setQuickFilters(prev => ({ ...prev, lowStock: !prev.lowStock }))} className={`text-xs font-bold px-3 py-2 rounded border flex items-center gap-2 transition-colors ${quickFilters.lowStock ? 'bg-red-100 border-red-300 text-red-800' : 'bg-white border-zinc-300 text-zinc-600 hover:bg-zinc-50'}`}>Low Rating</button>
                <button onClick={() => setQuickFilters(prev => ({ ...prev, recent: !prev.recent }))} className={`text-xs font-bold px-3 py-2 rounded border flex items-center gap-2 transition-colors ${quickFilters.recent ? 'bg-emerald-100 border-emerald-300 text-emerald-800' : 'bg-white border-zinc-300 text-zinc-600 hover:bg-zinc-50'}`}>
                    Recently Added
                </button>
                <button onClick={() => setQuickFilters(prev => ({ ...prev, expiring: !prev.expiring }))} className={`text-xs font-bold px-3 py-2 rounded border flex items-center gap-2 transition-colors ${quickFilters.expiring ? 'bg-amber-100 border-amber-300 text-amber-800' : 'bg-white border-zinc-300 text-zinc-600 hover:bg-zinc-50'}`}>
                    Expiring POs
                </button>
            </div>

            <div className="bg-white rounded-lg border border-zinc-200 overflow-hidden shadow-sm flex-1 flex flex-col">
                <div className="overflow-auto hidden md:block">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-zinc-100 text-zinc-600 font-bold uppercase text-[10px] tracking-wider">
                            <tr>
                                <th className="px-4 py-3 w-[5%]"><input type="checkbox" checked={filtered.length > 0 && selectedIds.length === filtered.length} onChange={() => setSelectedIds(selectedIds.length === filtered.length ? [] : filtered.map(v => v.id))} /></th>
                                <th className="px-4 py-3 w-[30%]">Vendor</th>
                                <th className="px-4 py-3 w-[20%]">Category / Location</th>
                                <th className="px-4 py-3 w-[15%]">Rating</th>
                                <th className="px-4 py-3 w-[15%]">Lead Time</th>
                                <th className="px-4 py-3 w-[15%]"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-100">
                            {filtered.map(vendor => {
                                const expanded = expandedRows.includes(vendor.id);
                                return (
                                    <React.Fragment key={vendor.id}>
                                        <tr className="hover:bg-zinc-50 group">
                                            <td className="px-4 py-3 align-top"><input type="checkbox" checked={selectedIds.includes(vendor.id)} onChange={() => toggleSelection(vendor.id)} /></td>
                                            <td className="px-4 py-3 align-top">
                                                <div className="flex items-start gap-2">
                                                    <button onClick={() => toggleExpand(vendor.id)} className="text-zinc-400 hover:text-zinc-700 mt-1"><ChevronDown size={14} className={expanded ? 'rotate-180 transition-transform' : 'transition-transform'} /></button>
                                                    <div className="flex-1">
                                                        <input value={vendor.name} onChange={e => updateVendor(vendor.id, { name: e.target.value })} className="font-bold text-zinc-900 bg-transparent focus:bg-white rounded px-1 w-full" />
                                                        <div className="flex items-center gap-1 mt-1">
                                                            <input value={vendor.website} onChange={e => updateVendor(vendor.id, { website: e.target.value })} className="text-blue-600 bg-transparent text-xs focus:bg-white rounded px-1 w-full" placeholder="https://..." />
                                                            {vendor.website && (
                                                                <a href={vendor.website.startsWith('http') ? vendor.website : `https://${vendor.website}`} target="_blank" rel="noreferrer" className="text-zinc-400 hover:text-blue-600">
                                                                    <ExternalLink size={10} />
                                                                </a>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 align-top">
                                                <div className="flex flex-col gap-2">
                                                    <span className="inline-block bg-zinc-100 border border-zinc-200 text-zinc-600 text-[10px] font-bold uppercase px-2 py-0.5 rounded">
                                                        <input value={vendor.category} onChange={e => updateVendor(vendor.id, { category: e.target.value })} className="bg-transparent border-none w-20 text-center focus:outline-none" />
                                                    </span>
                                                    <div className="flex items-center gap-1 text-xs text-zinc-500">
                                                        <MapPin size={12} className="text-zinc-400" />
                                                        <input value={vendor.location || ''} onChange={e => updateVendor(vendor.id, { location: e.target.value })} className="bg-transparent focus:bg-white rounded px-1" placeholder="Location" />
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 align-top">
                                                <div className="flex text-amber-400 gap-0.5">
                                                    {[1,2,3,4,5].map(star => (
                                                        <Star
                                                            key={star}
                                                            size={14}
                                                            fill={star <= vendor.rating ? "currentColor" : "none"}
                                                            className={`cursor-pointer transition-transform hover:scale-110 ${star <= vendor.rating ? "" : "text-zinc-200"}`}
                                                            onClick={() => updateVendor(vendor.id, { rating: star })}
                                                        />
                                                    ))}
                                                </div>
                                                <div className="text-[11px] text-zinc-500 mt-1">{vendor.rating} / 5</div>
                                            </td>
                                            <td className="px-4 py-3 align-top">
                                                <div className="flex items-center gap-2 text-zinc-600">
                                                    <Clock size={14} className="text-zinc-400"/>
                                                    <input
                                                        value={vendor.leadTime || ''}
                                                        onChange={e => updateVendor(vendor.id, { leadTime: e.target.value })}
                                                        className="bg-transparent w-full focus:bg-white px-1 rounded text-sm"
                                                        placeholder="e.g. 2 Days"
                                                    />
                                                </div>
                                                <div className="text-[11px] text-zinc-400 mt-1">Last order: {vendor.lastOrder ? new Date(vendor.lastOrder).toLocaleDateString() : 'Never'}</div>
                                            </td>
                                            <td className="px-4 py-3 text-right align-top">
                                                <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button onClick={() => toggleExpand(vendor.id)} className="text-zinc-500 hover:text-zinc-800 text-xs">Details</button>
                                                    <button onClick={() => deleteVendor(vendor.id)} className="text-zinc-300 hover:text-red-500">
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
                                                        <span className="inline-flex items-center gap-1"><Calendar size={12}/> Last Order: {vendor.lastOrder ? new Date(vendor.lastOrder).toLocaleString() : 'Never'}</span>
                                                        <span className="inline-flex items-center gap-1">Notes: <input value={vendor.notes || ''} onChange={e => updateVendor(vendor.id, { notes: e.target.value })} className="bg-white border border-zinc-200 rounded px-1" placeholder="Add notes" /></span>
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
                    {filtered.map(vendor => (
                        <div key={vendor.id} className="border border-zinc-200 rounded-lg p-3 shadow-sm bg-white">
                            <div className="flex items-start justify-between mb-2">
                                <div className="flex items-start gap-2">
                                    <input type="checkbox" checked={selectedIds.includes(vendor.id)} onChange={() => toggleSelection(vendor.id)} className="mt-1" />
                                    <div>
                                        <input value={vendor.name} onChange={e => updateVendor(vendor.id, { name: e.target.value })} className="font-bold text-zinc-900 bg-transparent" />
                                        <div className="text-[11px] text-zinc-500">{vendor.category}</div>
                                    </div>
                                </div>
                                <div className="text-amber-400">
                                    {[1,2,3,4,5].map(star => (
                                        <Star key={star} size={14} fill={star <= vendor.rating ? 'currentColor' : 'none'} className={star <= vendor.rating ? '' : 'text-zinc-200'} onClick={() => updateVendor(vendor.id, { rating: star })} />
                                    ))}
                                </div>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-zinc-500 mb-2">
                                <MapPin size={12}/> <input value={vendor.location || ''} onChange={e => updateVendor(vendor.id, { location: e.target.value })} className="bg-transparent border border-zinc-200 rounded px-1" placeholder="Location" />
                            </div>
                            <div className="flex items-center gap-2 text-xs text-zinc-500 mb-2">
                                <Clock size={12}/> <input value={vendor.leadTime || ''} onChange={e => updateVendor(vendor.id, { leadTime: e.target.value })} className="bg-transparent border border-zinc-200 rounded px-1" placeholder="Lead time" />
                            </div>
                            <div className="flex items-center gap-2 text-xs text-zinc-500 mb-2">
                                <Calendar size={12}/> {vendor.lastOrder ? new Date(vendor.lastOrder).toLocaleDateString() : 'Never'}
                            </div>
                            <button onClick={() => toggleExpand(vendor.id)} className="text-blue-600 text-xs flex items-center gap-1">{expandedRows.includes(vendor.id) ? 'Hide details' : 'Show details'} <ChevronDown size={12} className={expandedRows.includes(vendor.id) ? 'rotate-180' : ''} /></button>
                            {expandedRows.includes(vendor.id) && (
                                <div className="mt-2 text-[11px] text-zinc-600 space-y-1">
                                    <input value={vendor.website} onChange={e => updateVendor(vendor.id, { website: e.target.value })} className="w-full bg-transparent border border-zinc-200 rounded px-1" placeholder="https://..." />
                                    <input value={vendor.notes || ''} onChange={e => updateVendor(vendor.id, { notes: e.target.value })} className="w-full bg-transparent border border-zinc-200 rounded px-1" placeholder="Notes" />
                                    <button onClick={() => deleteVendor(vendor.id)} className="text-red-500 text-xs">Delete</button>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default SupplyChain;
