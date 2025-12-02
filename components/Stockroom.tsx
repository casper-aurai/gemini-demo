
import React, { useState } from 'react';
import { InventoryItem } from '../types';
import { Package, Plus, Trash2, AlertTriangle, Search, Filter, ArrowUpDown, ChevronDown, X, MapPin, Truck, History, ExternalLink, DollarSign, Calendar } from 'lucide-react';

interface StockroomProps {
    items: InventoryItem[];
    onUpdate: (items: InventoryItem[]) => void;
}

const Stockroom: React.FC<StockroomProps> = ({ items, onUpdate }) => {
    const [search, setSearch] = useState('');
    const [filterLowStock, setFilterLowStock] = useState(false);
    const [filterCategory, setFilterCategory] = useState<string>('All');
    const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);

    // Extract unique categories for filter
    const categories = ['All', ...Array.from(new Set(items.map(i => i.category)))];

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
        setSelectedItem(newItem);
    };

    const updateItem = (id: string, field: keyof InventoryItem, value: any) => {
        onUpdate(items.map(i => i.id === id ? { ...i, [field]: value, lastUpdated: Date.now() } : i));
    };

    const deleteItem = (id: string) => {
        if(confirm('Remove from inventory?')) {
            onUpdate(items.filter(i => i.id !== id));
            if (selectedItem?.id === id) setSelectedItem(null);
        }
    };

    const filtered = items.filter(i => {
        const matchesSearch = i.name.toLowerCase().includes(search.toLowerCase()) || i.category.toLowerCase().includes(search.toLowerCase());
        const matchesLowStock = filterLowStock ? i.quantity <= i.minLevel : true;
        const matchesCategory = filterCategory === 'All' ? true : i.category === filterCategory;
        return matchesSearch && matchesLowStock && matchesCategory;
    });

    const categoryColor = (cat: string) => {
        const c = cat.toLowerCase();
        if(c.includes('raw')) return 'bg-blue-100 text-blue-700 border-blue-200';
        if(c.includes('hard')) return 'bg-zinc-100 text-zinc-700 border-zinc-200';
        if(c.includes('elec')) return 'bg-amber-100 text-amber-700 border-amber-200';
        return 'bg-gray-50 text-gray-600 border-gray-200';
    };

    const handleRowClick = (e: React.MouseEvent, item: InventoryItem) => {
        const target = e.target as HTMLElement;
        if (target.tagName === 'INPUT' || target.closest('button')) return;
        setSelectedItem(item);
    };

    return (
        <div className="p-4 md:p-8 h-full flex flex-col bg-zinc-50 relative">
            <header className="flex flex-col md:flex-row md:justify-between md:items-end mb-4 md:mb-6 gap-4">
                <div>
                    <h2 className="font-serif text-xl md:text-2xl font-bold text-zinc-900 flex items-center gap-2">
                        <Package /> Stockroom
                    </h2>
                    <p className="text-zinc-500 text-sm mt-1">Global inventory tracking and material logistics.</p>
                </div>
                <div className="flex flex-wrap gap-2 md:gap-3 items-center w-full md:w-auto">
                    {/* Category Filter */}
                    <div className="relative group flex-1 md:flex-none">
                         <div className="flex items-center justify-between md:justify-start gap-2 px-3 py-2 bg-white border border-zinc-300 rounded text-xs font-medium text-zinc-700 cursor-pointer hover:bg-zinc-50">
                            <div className="flex items-center gap-2">
                                <Filter size={14} />
                                <span>{filterCategory}</span>
                            </div>
                            <ChevronDown size={14} className="text-zinc-400" />
                         </div>
                         <select 
                            value={filterCategory}
                            onChange={(e) => setFilterCategory(e.target.value)}
                            className="absolute inset-0 opacity-0 w-full cursor-pointer"
                         >
                             {categories.map(cat => (
                                 <option key={cat} value={cat}>{cat}</option>
                             ))}
                         </select>
                    </div>

                    <button 
                        onClick={() => setFilterLowStock(!filterLowStock)}
                        className={`text-xs font-bold px-3 py-2 rounded border flex items-center gap-2 transition-colors flex-1 md:flex-none justify-center ${filterLowStock ? 'bg-amber-100 border-amber-300 text-amber-800' : 'bg-white border-zinc-300 text-zinc-600 hover:bg-zinc-50'}`}
                    >
                        <AlertTriangle size={14} />
                        Low
                    </button>
                    
                    <div className="relative flex-grow md:flex-grow-0 w-full md:w-auto mt-2 md:mt-0">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={14}/>
                        <input 
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            placeholder="Search items..."
                            className="pl-9 pr-4 py-2 rounded border border-zinc-300 text-sm w-full md:w-48 focus:outline-none focus:ring-1 focus:ring-zinc-500"
                        />
                    </div>
                    <button onClick={addItem} className="bg-zinc-900 text-white px-4 py-2 rounded text-sm font-bold flex items-center gap-2 hover:bg-zinc-800 shadow-sm ml-0 md:ml-2 w-full md:w-auto justify-center mt-2 md:mt-0">
                        <Plus size={16}/> Add
                    </button>
                </div>
            </header>

            <div className="flex-1 bg-white md:bg-white md:rounded-lg md:border md:border-zinc-200 overflow-hidden md:shadow-sm flex flex-col relative rounded-lg border border-zinc-200 shadow-sm">
                <div className="overflow-auto flex-1">
                    <table className="w-full text-sm text-left">
                        <thead className="hidden md:table-header-group bg-zinc-100 text-zinc-600 font-bold uppercase text-[10px] tracking-wider sticky top-0 border-b border-zinc-200 z-10">
                            <tr>
                                <th className="px-6 py-3 w-[30%]">Item Name / SKU</th>
                                <th className="px-6 py-3 w-[15%]">Category</th>
                                <th className="px-6 py-3 w-[20%]">Location</th>
                                <th className="px-6 py-3 w-[10%] text-center">Unit</th>
                                <th className="px-6 py-3 w-[20%]">Stock Level</th>
                                <th className="px-6 py-3 w-[5%]"></th>
                            </tr>
                        </thead>
                        <tbody className="block md:table-row-group divide-y divide-zinc-100 p-2 md:p-0">
                            {filtered.length === 0 ? (
                                <tr className="block md:table-row">
                                    <td colSpan={6} className="text-center py-12 text-zinc-400 italic block md:table-cell">No inventory matches filter criteria.</td>
                                </tr>
                            ) : (
                                filtered.map(item => {
                                const stockPercent = Math.min(100, (item.quantity / (item.minLevel * 3)) * 100);
                                const isLow = item.quantity <= item.minLevel;
                                return (
                                <tr 
                                    key={item.id} 
                                    className={`group transition-colors cursor-pointer block md:table-row mb-2 md:mb-0 bg-white border md:border-none border-zinc-200 rounded-lg md:rounded-none shadow-sm md:shadow-none ${selectedItem?.id === item.id ? 'ring-2 ring-blue-500 md:ring-0 md:bg-blue-50/50' : 'hover:bg-zinc-50'}`}
                                    onClick={(e) => handleRowClick(e, item)}
                                >
                                    {/* Mobile View: Card Layout */}
                                    <td className="md:hidden p-4 block">
                                        <div className="flex justify-between items-start mb-2">
                                             <div className="flex-1">
                                                 <div className={`inline-block px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wide mb-1 ${categoryColor(item.category)}`}>
                                                     {item.category}
                                                 </div>
                                                 <div className="font-bold text-zinc-900">{item.name}</div>
                                             </div>
                                             <div className="text-right">
                                                 <div className={`text-lg font-mono font-bold ${isLow ? 'text-red-600' : 'text-zinc-800'}`}>
                                                     {item.quantity}
                                                     <span className="text-xs text-zinc-400 font-sans ml-1">{item.unit}</span>
                                                 </div>
                                                 {isLow && <div className="text-[9px] text-red-500 font-bold uppercase">Low Stock</div>}
                                             </div>
                                        </div>
                                        <div className="flex justify-between items-center text-xs text-zinc-500 mt-2 pt-2 border-t border-zinc-50">
                                            <div className="flex items-center gap-1">
                                                <MapPin size={12} /> {item.location}
                                            </div>
                                            <div className="w-24 h-1.5 bg-zinc-100 rounded-full overflow-hidden">
                                                <div className={`h-full ${isLow ? 'bg-red-500' : 'bg-green-500'}`} style={{ width: `${stockPercent}%` }}></div>
                                            </div>
                                        </div>
                                    </td>

                                    {/* Desktop View: Table Cells */}
                                    <td className="px-6 py-3 hidden md:table-cell">
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
                                    <td className="px-6 py-3 hidden md:table-cell">
                                        <div className={`inline-block px-2 py-0.5 rounded border text-[10px] font-bold uppercase tracking-wide ${categoryColor(item.category)}`}>
                                            <input 
                                                value={item.category}
                                                onChange={e => updateItem(item.id, 'category', e.target.value)}
                                                className="bg-transparent border-none w-24 text-center focus:outline-none"
                                            />
                                        </div>
                                    </td>
                                    <td className="px-6 py-3 hidden md:table-cell">
                                        <input 
                                            value={item.location}
                                            onChange={e => updateItem(item.id, 'location', e.target.value)}
                                            className="w-full bg-transparent text-zinc-600 focus:bg-white focus:ring-1 focus:ring-zinc-200 rounded px-1 font-mono text-xs"
                                        />
                                    </td>
                                    <td className="px-6 py-3 hidden md:table-cell">
                                        <input 
                                            value={item.unit}
                                            onChange={e => updateItem(item.id, 'unit', e.target.value)}
                                            className="w-full bg-transparent text-center text-zinc-400 text-xs focus:bg-white focus:ring-1 focus:ring-zinc-200 rounded px-1"
                                        />
                                    </td>
                                    <td className="px-6 py-3 hidden md:table-cell">
                                        <div className="flex items-center justify-between mb-1">
                                            <input 
                                                type="number"
                                                value={item.quantity}
                                                onChange={e => updateItem(item.id, 'quantity', parseInt(e.target.value))}
                                                className={`w-16 bg-transparent font-mono font-bold text-right focus:bg-white rounded px-1 ${isLow ? 'text-red-600' : 'text-zinc-700'}`}
                                            />
                                        </div>
                                        <div className="w-full bg-zinc-100 h-1.5 rounded-full overflow-hidden">
                                            <div 
                                                className={`h-full rounded-full transition-all duration-500 ${isLow ? 'bg-red-500' : stockPercent < 50 ? 'bg-amber-400' : 'bg-green-500'}`} 
                                                style={{ width: `${stockPercent}%` }}
                                            ></div>
                                        </div>
                                        {isLow && <span className="text-[9px] text-red-500 font-bold uppercase mt-1 block">Reorder Required</span>}
                                    </td>
                                    <td className="px-6 py-3 text-center hidden md:table-cell">
                                        <button onClick={() => deleteItem(item.id)} className="text-zinc-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Trash2 size={16} />
                                        </button>
                                    </td>
                                </tr>
                            )})
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Detail Panel */}
                <div className={`
                    absolute inset-y-0 right-0 w-full md:w-96 bg-white shadow-2xl border-l border-zinc-200 
                    transform transition-transform duration-300 z-50 overflow-y-auto
                    ${selectedItem ? 'translate-x-0' : 'translate-x-full'}
                `}>
                    {selectedItem && (
                        <>
                            {/* Header */}
                            <div className="p-6 border-b border-zinc-100 flex justify-between items-start bg-zinc-50">
                                <div>
                                    <h3 className="font-serif text-xl font-bold text-zinc-900 leading-tight">{selectedItem.name}</h3>
                                    <div className="flex gap-2 mt-2">
                                        <span className={`text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded border ${categoryColor(selectedItem.category)}`}>
                                            {selectedItem.category}
                                        </span>
                                        {selectedItem.quantity <= selectedItem.minLevel && (
                                            <span className="text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded bg-red-100 text-red-600 border border-red-200 flex items-center gap-1">
                                                <AlertTriangle size={10} /> Low Stock
                                            </span>
                                        )}
                                    </div>
                                </div>
                                <button onClick={() => setSelectedItem(null)} className="text-zinc-400 hover:text-zinc-600 p-2 hover:bg-zinc-200 rounded">
                                    <X size={24} />
                                </button>
                            </div>
                            
                            {/* Content */}
                            <div className="p-6 space-y-8 pb-24">
                                {/* Stats */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-white p-4 rounded-xl border border-zinc-100 shadow-sm">
                                        <div className="text-xs text-zinc-500 mb-1 flex items-center gap-1">
                                            <Package size={12} /> Stock Level
                                        </div>
                                        <div className="text-xl font-mono font-bold text-zinc-800">
                                            {selectedItem.quantity} <span className="text-sm text-zinc-400 font-sans">{selectedItem.unit}</span>
                                        </div>
                                        <div className="text-[10px] text-zinc-400 mt-1">Min: {selectedItem.minLevel}</div>
                                    </div>
                                    <div className="bg-white p-4 rounded-xl border border-zinc-100 shadow-sm">
                                        <div className="text-xs text-zinc-500 mb-1 flex items-center gap-1">
                                            <DollarSign size={12} /> Unit Value
                                        </div>
                                        <div className="text-xl font-mono font-bold text-zinc-800">
                                            ${(selectedItem.cost || 0).toFixed(2)}
                                        </div>
                                        <div className="text-[10px] text-zinc-400 mt-1">Total: ${((selectedItem.quantity || 0) * (selectedItem.cost || 0)).toFixed(2)}</div>
                                    </div>
                                </div>

                                {/* Location */}
                                <div>
                                    <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-500 mb-3 flex items-center gap-2">
                                        <MapPin size={12} /> Logistics
                                    </h4>
                                    <div className="bg-zinc-50 border border-zinc-200 rounded-lg p-4 flex items-center justify-between">
                                        <div>
                                            <div className="text-xs text-zinc-400 uppercase font-bold">Location</div>
                                            <div className="font-mono text-sm text-zinc-800 font-bold">{selectedItem.location}</div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-xs text-zinc-400 uppercase font-bold">Last Updated</div>
                                            <div className="font-mono text-sm text-zinc-600">
                                                {selectedItem.lastUpdated ? new Date(selectedItem.lastUpdated).toLocaleDateString() : 'Unknown'}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Mobile Actions */}
                                <div className="md:hidden space-y-3 pt-4 border-t border-zinc-100">
                                    <button 
                                        onClick={() => deleteItem(selectedItem.id)} 
                                        className="w-full py-3 bg-red-50 text-red-600 font-bold rounded-lg text-sm flex items-center justify-center gap-2"
                                    >
                                        <Trash2 size={16} /> Remove Item
                                    </button>
                                </div>

                                {/* Stock History */}
                                <div>
                                    <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-500 mb-3 flex items-center gap-2">
                                        <History size={12} /> Transaction Log
                                    </h4>
                                    <div className="border-l-2 border-zinc-200 pl-4 space-y-6">
                                        <div className="relative">
                                            <div className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-blue-500 border-2 border-white"></div>
                                            <div className="text-xs text-zinc-400 font-mono mb-0.5">{new Date().toLocaleDateString()}</div>
                                            <div className="text-sm font-medium text-zinc-800">Current Stock Verified</div>
                                            <div className="text-xs text-zinc-500">Inventory check completed.</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Stockroom;
