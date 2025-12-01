
import React from 'react';
import { Vendor } from '../types';
import { Truck, ExternalLink, Star, Plus, Trash2, Clock, Calendar } from 'lucide-react';

interface SupplyChainProps {
    vendors: Vendor[];
    onUpdate: (vendors: Vendor[]) => void;
}

const SupplyChain: React.FC<SupplyChainProps> = ({ vendors, onUpdate }) => {
    
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
            lastOrder: undefined,
            notes: ''
        };
        onUpdate([...vendors, newVendor]);
    };

    const updateVendor = (id: string, updates: Partial<Vendor>) => {
        onUpdate(vendors.map(v => v.id === id ? { ...v, ...updates } : v));
    };

    const deleteVendor = (id: string) => {
        if(confirm("Remove vendor?")) onUpdate(vendors.filter(v => v.id !== id));
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
                <button onClick={addVendor} className="bg-zinc-900 text-white px-4 py-2 rounded text-sm font-bold flex items-center gap-2 hover:bg-zinc-800 shadow-sm">
                    <Plus size={16}/> Add Vendor
                </button>
            </header>

            <div className="bg-white rounded-lg border border-zinc-200 overflow-hidden shadow-sm">
                <table className="w-full text-sm text-left">
                    <thead className="bg-zinc-100 text-zinc-600 font-bold uppercase text-[10px] tracking-wider">
                        <tr>
                            <th className="px-6 py-3 w-[25%]">Vendor</th>
                            <th className="px-6 py-3 w-[15%]">Category</th>
                            <th className="px-6 py-3 w-[15%]">Rating</th>
                            <th className="px-6 py-3 w-[15%]">Lead Time</th>
                            <th className="px-6 py-3 w-[15%]">Last Order</th>
                            <th className="px-6 py-3 w-[10%]"></th>
                            <th className="px-6 py-3 w-[5%]"></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100">
                        {vendors.map(vendor => (
                            <tr key={vendor.id} className="hover:bg-zinc-50 group">
                                <td className="px-6 py-3">
                                    <input 
                                        value={vendor.name}
                                        onChange={e => updateVendor(vendor.id, { name: e.target.value })}
                                        className="font-bold text-zinc-900 bg-transparent focus:bg-white rounded px-1 w-full"
                                    />
                                    <div className="flex items-center gap-1 mt-1">
                                         <input 
                                            value={vendor.website}
                                            onChange={e => updateVendor(vendor.id, { website: e.target.value })}
                                            className="text-blue-600 bg-transparent text-xs focus:bg-white rounded px-1 w-full"
                                            placeholder="https://..."
                                        />
                                        {vendor.website && (
                                            <a href={vendor.website.startsWith('http') ? vendor.website : `https://${vendor.website}`} target="_blank" rel="noreferrer" className="text-zinc-400 hover:text-blue-600">
                                                <ExternalLink size={10} />
                                            </a>
                                        )}
                                    </div>
                                </td>
                                <td className="px-6 py-3">
                                    <span className="inline-block bg-zinc-100 border border-zinc-200 text-zinc-600 text-[10px] font-bold uppercase px-2 py-0.5 rounded">
                                        <input 
                                            value={vendor.category}
                                            onChange={e => updateVendor(vendor.id, { category: e.target.value })}
                                            className="bg-transparent border-none w-20 text-center focus:outline-none"
                                        />
                                    </span>
                                </td>
                                <td className="px-6 py-3">
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
                                </td>
                                <td className="px-6 py-3">
                                    <div className="flex items-center gap-2 text-zinc-600">
                                        <Clock size={14} className="text-zinc-400"/>
                                        <input 
                                            value={vendor.leadTime || ''}
                                            onChange={e => updateVendor(vendor.id, { leadTime: e.target.value })}
                                            className="bg-transparent w-full focus:bg-white px-1 rounded text-sm"
                                            placeholder="e.g. 2 Days"
                                        />
                                    </div>
                                </td>
                                <td className="px-6 py-3">
                                    <div className="flex items-center gap-2 text-zinc-600">
                                        <Calendar size={14} className="text-zinc-400"/>
                                        <span className="font-mono text-xs">
                                            {vendor.lastOrder ? new Date(vendor.lastOrder).toLocaleDateString() : 'Never'}
                                        </span>
                                    </div>
                                </td>
                                <td className="px-6 py-3">
                                     <input 
                                        value={vendor.notes || ''}
                                        onChange={e => updateVendor(vendor.id, { notes: e.target.value })}
                                        className="text-zinc-400 italic bg-transparent focus:bg-white rounded px-1 w-full text-xs"
                                        placeholder="Add notes..."
                                    />
                                </td>
                                <td className="px-6 py-3 text-right">
                                    <button onClick={() => deleteVendor(vendor.id)} className="text-zinc-300 hover:text-red-500 opacity-0 group-hover:opacity-100">
                                        <Trash2 size={16} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default SupplyChain;
