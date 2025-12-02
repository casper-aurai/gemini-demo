
import React, { useState } from 'react';
import { InventoryItem } from '../types';
import { Package, Plus, Trash2, AlertTriangle, Search, Filter, ArrowUpDown, ChevronDown } from 'lucide-react';

interface StockroomProps {
    items: InventoryItem[];
    onUpdate: (items: InventoryItem[]) => void;
}

const Stockroom: React.FC<StockroomProps> = ({ items, onUpdate }) => {
    const [search, setSearch] = useState('');
    const [filterLowStock, setFilterLowStock] = useState(false);
    const [filterCategory, setFilterCategory] = useState<string>('All');

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
            cost: 0
        };
        onUpdate([newItem, ...items]);
    };

    const updateItem = (id: string, field: keyof InventoryItem, value: any) => {
        onUpdate(items.map(i => i.id === id ? { ...i, [field]: value } : i));
    };

    const deleteItem = (id: string) => {
        if(confirm('Remove from inventory?')) {
            onUpdate(items.filter(i => i.id !== id));
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

    return (
        <div className="p-8 h-full flex flex-col bg-zinc-50">
            <header className="flex justify-between items-end mb-6">
                <div>
                    <h2 className="font-serif text-2xl font-bold text-zinc-900 flex items-center gap-2">
                        <Package /> Stockroom
                    </h2>
                    <p className="text-zinc-500 text-sm mt-1">Global inventory tracking and material logistics.</p>
                </div>
                <div className="flex gap-3 items-center">
                    {/* Category Filter */}
                    <div className="relative group">
                         <div className="flex items-center gap-2 px-3 py-2 bg-white border border-zinc-300 rounded text-xs font-medium text-zinc-700 cursor-pointer hover:bg-zinc-50">
                            <Filter size={14} />
                            <span>{filterCategory}</span>
                            <ChevronDown size={14} className="text-zinc-400" />
                         </div>
                         <div className="absolute top-full right-0 mt-1 w-48 bg-white border border-zinc-200 rounded shadow-lg z-20 hidden group-hover:block">
                             {categories.map(cat => (
                                 <div 
                                    key={cat} 
                                    onClick={() => setFilterCategory(cat)}
                                    className="px-4 py-2 hover:bg-zinc-100 text-xs text-zinc-700 cursor-pointer"
                                 >
                                     {cat}
                                 </div>
                             ))}
                         </div>
                    </div>

                    <button 
                        onClick={() => setFilterLowStock(!filterLowStock)}
                        className={`text-xs font-bold px-3 py-2 rounded border flex items-center gap-2 transition-colors ${filterLowStock ? 'bg-amber-100 border-amber-300 text-amber-800' : 'bg-white border-zinc-300 text-zinc-600 hover:bg-zinc-50'}`}
                    >
                        <AlertTriangle size={14} />
                        Low Stock
                    </button>
                    
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={14}/>
                        <input 
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            placeholder="Search items..."
                            className="pl-9 pr-4 py-2 rounded border border-zinc-300 text-sm w-48 focus:outline-none focus:ring-1 focus:ring-zinc-500"
                        />
                    </div>
                    <button onClick={addItem} className="bg-zinc-900 text-white px-4 py-2 rounded text-sm font-bold flex items-center gap-2 hover:bg-zinc-800 shadow-sm ml-2">
                        <Plus size={16}/> Add Stock
                    </button>
                </div>
            </header>

            <div className="flex-1 bg-white rounded-lg border border-zinc-200 overflow-hidden shadow-sm flex flex-col">
                <div className="overflow-auto flex-1">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-zinc-100 text-zinc-600 font-bold uppercase text-[10px] tracking-wider sticky top-0 border-b border-zinc-200">
                            <tr>
                                <th className="px-6 py-3 w-[30%]">Item Name / SKU</th>
                                <th className="px-6 py-3 w-[15%]">Category</th>
                                <th className="px-6 py-3 w-[20%]">Location</th>
                                <th className="px-6 py-3 w-[10%] text-center">Unit</th>
                                <th className="px-6 py-3 w-[20%]">Stock Level</th>
                                <th className="px-6 py-3 w-[5%]"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-100">
                            {filtered.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="text-center py-12 text-zinc-400 italic">No inventory matches filter criteria.</td>
                                </tr>
                            ) : (
                                filtered.map(item => {
                                const stockPercent = Math.min(100, (item.quantity / (item.minLevel * 3)) * 100);
                                const isLow = item.quantity <= item.minLevel;
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
                                        <input 
                                            value={item.unit}
                                            onChange={e => updateItem(item.id, 'unit', e.target.value)}
                                            className="w-full bg-transparent text-center text-zinc-400 text-xs focus:bg-white focus:ring-1 focus:ring-zinc-200 rounded px-1"
                                        />
                                    </td>
                                    <td className="px-6 py-3">
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
                                    <td className="px-6 py-3 text-center">
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
            </div>
        </div>
    );
};

export default Stockroom;
