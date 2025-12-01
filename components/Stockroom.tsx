
import React, { useMemo, useState } from 'react';
import { InventoryItem, ReferenceDoc } from '../types';
import { Package, Plus, Trash2, AlertTriangle, Search, Filter, ArrowUpDown, Clock3, Paperclip, FileText, X } from 'lucide-react';

interface StockroomProps {
    items: InventoryItem[];
    onUpdate: (items: InventoryItem[]) => void;
    docs: ReferenceDoc[];
    onDocsUpdate: (docs: ReferenceDoc[]) => void;
}

const Stockroom: React.FC<StockroomProps> = ({ items, onUpdate, docs, onDocsUpdate }) => {
    const [search, setSearch] = useState('');
    const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
    const [selectedLocations, setSelectedLocations] = useState<string[]>([]);
    const [selectedUnits, setSelectedUnits] = useState<string[]>([]);
    const [stockStatusFilter, setStockStatusFilter] = useState<'all' | 'healthy' | 'caution' | 'critical'>('all');
    const [minStockLevel, setMinStockLevel] = useState(0);
    const [quickFilters, setQuickFilters] = useState({ lowStock: false, recent: false });
    const [selectedItemId, setSelectedItemId] = useState<string | null>(null);

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

    const selectedItem = useMemo(() => items.find(i => i.id === selectedItemId) || null, [items, selectedItemId]);
    const relatedDocs = useMemo(
        () => selectedItem ? docs.filter(doc => doc.relatedInventoryIds?.includes(selectedItem.id)) : [],
        [docs, selectedItem]
    );

    const stockStatus = (item: InventoryItem) => {
        if (item.quantity <= item.minLevel) return 'critical' as const;
        if (item.quantity <= item.minLevel * 1.5) return 'caution' as const;
        return 'healthy' as const;
    };

    const toggleDocLink = (docId: string) => {
        if (!selectedItem) return;
        onDocsUpdate(docs.map(doc => {
            if (doc.id !== docId) return doc;
            const existing = doc.relatedInventoryIds || [];
            const alreadyLinked = existing.includes(selectedItem.id);
            return {
                ...doc,
                relatedInventoryIds: alreadyLinked
                    ? existing.filter(id => id !== selectedItem.id)
                    : [...existing, selectedItem.id]
            };
        }));
    };

    const filtered = items.filter(i => {
        const matchesSearch = i.name.toLowerCase().includes(search.toLowerCase()) || i.category.toLowerCase().includes(search.toLowerCase()) || i.location.toLowerCase().includes(search.toLowerCase());

        const matchesCategory = selectedCategories.length === 0 || selectedCategories.includes(i.category);
        const matchesLocation = selectedLocations.length === 0 || selectedLocations.includes(i.location);
        const matchesUnit = selectedUnits.length === 0 || selectedUnits.includes(i.unit);

        const status = stockStatus(i);
        const matchesStatusFilter = stockStatusFilter === 'all' || status === stockStatusFilter;
        const matchesMinStock = i.quantity >= minStockLevel;

        const isLowStock = status === 'critical';
        const isRecent = i.lastUpdated ? (Date.now() - i.lastUpdated) < (1000 * 60 * 60 * 24 * 7) : false;

        const matchesQuickLow = quickFilters.lowStock ? isLowStock : true;
        const matchesQuickRecent = quickFilters.recent ? isRecent : true;

        return matchesSearch && matchesCategory && matchesLocation && matchesUnit && matchesStatusFilter && matchesMinStock && matchesQuickLow && matchesQuickRecent;
    });

    const categoryColor = (cat: string) => {
        const c = cat.toLowerCase();
        if(c.includes('raw')) return 'bg-blue-100 text-blue-700 border-blue-200';
        if(c.includes('hard')) return 'bg-zinc-100 text-zinc-700 border-zinc-200';
        if(c.includes('elec')) return 'bg-amber-100 text-amber-700 border-amber-200';
        return 'bg-gray-50 text-gray-600 border-gray-200';
    };

    return (
        <div className={`p-8 h-full flex flex-col bg-zinc-50 relative ${selectedItem ? 'pr-[420px]' : ''}`}>
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

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-3 mb-4">
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
            </div>

            <div className="flex-1 bg-white rounded-lg border border-zinc-200 overflow-hidden shadow-sm flex flex-col">
                <div className="overflow-auto flex-1">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-zinc-100 text-zinc-600 font-bold uppercase text-[10px] tracking-wider sticky top-0 border-b border-zinc-200">
                            <tr>
                                <th className="px-6 py-3 w-[30%]">Item Name / SKU</th>
                                <th className="px-6 py-3 w-[15%]">Docs</th>
                                <th className="px-6 py-3 w-[20%]">Category</th>
                                <th className="px-6 py-3 w-[20%]">Location</th>
                                <th className="px-6 py-3 w-[20%]">Stock</th>
                                <th className="px-6 py-3 w-[5%]"></th>
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
                                return (
                                <tr key={item.id} className="hover:bg-zinc-50 group transition-colors">
                                    <td className="px-6 py-3">
                                        <input
                                            value={item.name}
                                            onChange={e => updateItem(item.id, 'name', e.target.value)}
                                            className="w-full bg-transparent font-bold text-zinc-800 focus:bg-white focus:ring-1 focus:ring-zinc-200 rounded px-1"
                                        />
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className="text-[10px] text-zinc-400">MIN:</span>
                                            <input 
                                                type="number"
                                                value={item.minLevel}
                                                onChange={e => updateItem(item.id, 'minLevel', parseInt(e.target.value))}
                                                className="w-12 bg-transparent text-[10px] text-zinc-500 focus:bg-white rounded px-1"
                                            />
                                        </div>
                                    </td>
                                    <td className="px-6 py-3">
                                        <button
                                            onClick={() => setSelectedItemId(item.id)}
                                            className={`px-3 py-2 rounded text-xs font-bold flex items-center gap-2 border transition-colors ${selectedItemId === item.id ? 'bg-zinc-900 text-white border-zinc-900' : 'bg-white text-zinc-600 border-zinc-200 hover:border-zinc-300'}`}
                                        >
                                            <Paperclip size={14} />
                                            Docs
                                        </button>
                                        <p className="text-[10px] text-zinc-400 mt-1">{docs.filter(d => d.relatedInventoryIds?.includes(item.id)).length} linked</p>
                                    </td>
                                    <td className="px-6 py-3">
                                        <div className={`inline-block px-2 py-0.5 rounded border text-[10px] font-bold uppercase tracking-wide ${categoryColor(item.category)}`}>
                                            <input
                                                value={item.category}
                                                onChange={e => updateItem(item.id, 'category', e.target.value)}
                                                className="bg-transparent border-none w-24 text-center focus:outline-none"
                                            />
                                        </div>
                                    </td>
                                    <td className="px-6 py-3">
                                        <input
                                            value={item.location}
                                            onChange={e => updateItem(item.id, 'location', e.target.value)}
                                            className="w-full bg-transparent text-zinc-600 focus:bg-white focus:ring-1 focus:ring-zinc-200 rounded px-1 font-mono text-xs"
                                        />
                                    </td>
                                    <td className="px-6 py-3">
                                        <div className="flex items-center justify-between mb-2">
                                            <div className={`px-2 py-1 rounded border text-[11px] font-bold uppercase tracking-wide ${statusStyles}`}>
                                                {status === 'critical' ? 'Reorder' : status === 'caution' ? 'Watch' : 'Healthy'}
                                            </div>
                                            <span className="text-[11px] text-zinc-400">Min {item.minLevel}</span>
                                        </div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <input
                                                type="number"
                                                value={item.quantity}
                                                onChange={e => updateItem(item.id, 'quantity', parseInt(e.target.value))}
                                                className={`w-20 bg-transparent font-mono font-bold text-right focus:bg-white rounded px-1 ${isLow ? 'text-red-600' : 'text-zinc-700'}`}
                                            />
                                            <input
                                                value={item.unit}
                                                onChange={e => updateItem(item.id, 'unit', e.target.value)}
                                                className="w-20 bg-transparent text-left text-zinc-500 text-xs focus:bg-white focus:ring-1 focus:ring-zinc-200 rounded px-1"
                                            />
                                        </div>
                                        <div className="w-full bg-zinc-100 h-1.5 rounded-full overflow-hidden">
                                            <div
                                                className={`h-full rounded-full transition-all duration-500 ${barColor}`}
                                                style={{ width: `${stockPercent}%` }}
                                            ></div>
                                        </div>
                                        {isLow && <span className="text-[9px] text-red-500 font-bold uppercase mt-1 block">Reorder Required</span>}
                                    </td>
                                    <td className="px-6 py-3 text-center">
                                        <button onClick={() => deleteItem(item.id)} className="text-zinc-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Trash2 size={16} />
                                        </button>
                                    </td>
                                </tr>
                            )})}
                        </tbody>
                    </table>
                </div>
            </div>

            {selectedItem && (
                <div className="absolute right-4 top-4 bottom-4 w-96 bg-white border border-zinc-200 rounded-xl shadow-lg p-5 flex flex-col z-20">
                    <div className="flex items-start justify-between mb-3">
                        <div>
                            <p className="text-[11px] uppercase tracking-wide text-zinc-400 font-bold">Inventory Detail</p>
                            <h3 className="font-serif text-xl font-bold text-zinc-900">{selectedItem.name}</h3>
                            <p className="text-xs text-zinc-500">{selectedItem.category} • {selectedItem.location}</p>
                        </div>
                        <button onClick={() => setSelectedItemId(null)} className="text-zinc-400 hover:text-zinc-600"><X size={16}/></button>
                    </div>
                    <div className="bg-zinc-50 border border-zinc-100 rounded-lg p-3 mb-3 text-sm text-zinc-600">
                        <div className="flex items-center justify-between mb-1">
                            <span className="font-bold">On Hand</span>
                            <span className="font-mono">{selectedItem.quantity} {selectedItem.unit}</span>
                        </div>
                        <div className="flex items-center justify-between text-xs text-zinc-500">
                            <span>Min level</span>
                            <span>{selectedItem.minLevel}</span>
                        </div>
                    </div>
                    <div className="mb-3">
                        <div className="flex items-center gap-2 text-[11px] uppercase tracking-wide text-zinc-500 font-bold mb-2">
                            <Paperclip size={14}/> Related documents
                        </div>
                        <div className="space-y-2">
                            {relatedDocs.length === 0 && <p className="text-sm text-zinc-500">No documents linked yet.</p>}
                            {relatedDocs.map(doc => (
                                <div key={doc.id} className="border border-zinc-200 rounded-lg p-2 text-sm flex items-start gap-2">
                                    <FileText size={16} className="text-zinc-400" />
                                    <div className="flex-1">
                                        <p className="font-bold text-zinc-800 leading-tight">{doc.title}</p>
                                        <p className="text-[11px] text-zinc-500">{doc.folder || 'Unfiled'} • {doc.tags.join(', ') || 'No tags'}</p>
                                        {doc.url && <a className="text-xs text-blue-600 hover:underline" href={doc.url} target="_blank" rel="noreferrer">Open</a>}
                                    </div>
                                    <button onClick={() => toggleDocLink(doc.id)} className="text-[10px] text-zinc-400 hover:text-red-500">Unlink</button>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="mt-auto">
                        <p className="text-[11px] uppercase tracking-wide text-zinc-500 font-bold mb-2">Attach more</p>
                        <div className="h-40 overflow-auto rounded border border-dashed border-zinc-200 p-2 space-y-2 bg-zinc-50/50">
                            {docs.map(doc => (
                                <label key={doc.id} className="flex items-start gap-2 text-sm text-zinc-700">
                                    <input
                                        type="checkbox"
                                        checked={Boolean(doc.relatedInventoryIds?.includes(selectedItem.id))}
                                        onChange={() => toggleDocLink(doc.id)}
                                        className="mt-1"
                                    />
                                    <div>
                                        <p className="font-bold leading-tight">{doc.title}</p>
                                        <p className="text-[11px] text-zinc-500">{doc.folder || 'Unfiled'} • {doc.tags.join(', ') || 'No tags'}</p>
                                    </div>
                                </label>
                            ))}
                            {docs.length === 0 && <p className="text-xs text-zinc-400">Library empty.</p>}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Stockroom;
