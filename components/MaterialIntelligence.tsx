
import React, { useState } from 'react';
import { generateBOM } from '../services/geminiService';
import { BOMItem, Project } from '../types';
import { ClipboardList, Cpu, ArrowRight, Loader2, Download, Table, Plus, Trash2, DollarSign } from 'lucide-react';

interface MaterialIntelligenceProps {
    project: Project;
    onUpdateProject: (updatedProject: Project) => void;
}

const MaterialIntelligence: React.FC<MaterialIntelligenceProps> = ({ project, onUpdateProject }) => {
  const [loading, setLoading] = useState(false);
  const [generationPrompt, setGenerationPrompt] = useState(project.description);

  const handleGenerate = async () => {
    if (!generationPrompt.trim()) return;
    setLoading(true);
    try {
      const list = await generateBOM(generationPrompt);
      onUpdateProject({ ...project, bom: list });
    } catch (err) {
      alert("Failed to generate BOM. Ensure API connection.");
    } finally {
      setLoading(false);
    }
  };

  const updateItem = (index: number, field: keyof BOMItem, value: string | number) => {
      const newBom = [...(project.bom || [])];
      newBom[index] = { ...newBom[index], [field]: value };
      onUpdateProject({ ...project, bom: newBom });
  };

  const addItem = () => {
      const newBom = [...(project.bom || [])];
      newBom.push({ itemName: '', quantity: 1, specifications: '', category: 'General', notes: '', unitCost: 0 });
      onUpdateProject({ ...project, bom: newBom });
  };

  const deleteItem = (index: number) => {
      const newBom = [...(project.bom || [])];
      newBom.splice(index, 1);
      onUpdateProject({ ...project, bom: newBom });
  };

  const downloadCSV = () => {
      if(!project.bom || project.bom.length === 0) return;
      const headers = ["Category", "Item", "Quantity", "Specifications", "Unit Cost", "Total Cost", "Notes"];
      const rows = project.bom.map(item => [
          item.category,
          item.itemName,
          item.quantity,
          item.specifications,
          item.unitCost || 0,
          (item.quantity * (item.unitCost || 0)).toFixed(2),
          item.notes || ''
      ]);
      const csvContent = "data:text/csv;charset=utf-8," + [headers, ...rows].map(e => e.join(",")).join("\n");
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `${project.title.replace(/\s+/g, '_')}_BOM.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
  };

  const totalBudget = (project.bom || []).reduce((acc, item) => acc + (item.quantity * (item.unitCost || 0)), 0);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-full">
        {/* Input Section */}
        <div className="lg:col-span-1 bg-white p-6 rounded-xl border border-zinc-200 shadow-sm flex flex-col h-fit">
            <h3 className="font-serif text-lg font-bold mb-4 flex items-center gap-2">
                <Cpu size={20} className="text-zinc-700"/>
                AI Estimator
            </h3>
            <p className="text-xs text-zinc-500 mb-4">
                Describe the assembly to generate a parts list with estimated costs.
            </p>
            <textarea
                className="w-full bg-zinc-50 border border-zinc-300 rounded-lg p-3 resize-none focus:ring-2 focus:ring-zinc-400 focus:border-zinc-500 outline-none mb-4 text-xs font-mono h-40"
                value={generationPrompt}
                onChange={(e) => setGenerationPrompt(e.target.value)}
            />
            <button
                onClick={handleGenerate}
                disabled={loading || !generationPrompt}
                className="w-full py-2 bg-zinc-900 text-white rounded-md hover:bg-zinc-800 transition-colors flex justify-center items-center gap-2 disabled:opacity-50 text-xs font-bold uppercase tracking-wider"
            >
                {loading ? <Loader2 className="animate-spin" size={14} /> : <ArrowRight size={14} />}
                Generate B.O.M.
            </button>
        </div>

        {/* Output Section */}
        <div className="lg:col-span-3 bg-white rounded-xl border border-zinc-200 shadow-sm overflow-hidden flex flex-col h-[calc(100vh-10rem)]">
             <div className="p-3 border-b border-zinc-100 bg-zinc-50 flex justify-between items-center flex-shrink-0">
                <div className="flex items-center gap-4">
                    <h3 className="font-serif text-md font-bold flex items-center gap-2 ml-2">
                        <Table size={18} className="text-zinc-600"/>
                        Bill of Materials
                    </h3>
                    <div className="bg-zinc-200 text-zinc-700 px-2 py-0.5 rounded text-xs font-mono">
                        {project.bom?.length || 0} items
                    </div>
                </div>
                <div className="flex gap-2">
                    <button onClick={addItem} className="text-xs text-zinc-600 hover:text-zinc-900 flex items-center gap-1 font-medium border border-zinc-300 px-3 py-1.5 rounded bg-white hover:bg-zinc-50 transition-colors">
                        <Plus size={14} /> Add Item
                    </button>
                    {project.bom && project.bom.length > 0 && (
                        <button onClick={downloadCSV} className="text-xs text-zinc-600 hover:text-zinc-900 flex items-center gap-1 font-medium border border-zinc-300 px-3 py-1.5 rounded bg-white hover:bg-zinc-50 transition-colors">
                            <Download size={14} /> CSV
                        </button>
                    )}
                </div>
            </div>
            
            <div className="flex-1 overflow-auto">
                {!project.bom || project.bom.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-zinc-400 p-8 text-center">
                        <ClipboardList size={48} className="mb-4 opacity-20" />
                        <p className="font-medium">No Materials Listed</p>
                        <p className="text-xs mt-1">Generate a list or add items manually.</p>
                    </div>
                ) : (
                    <table className="w-full text-sm text-left border-collapse">
                        <thead className="bg-zinc-100 text-zinc-600 font-bold font-mono text-[10px] uppercase tracking-wider sticky top-0 z-10 shadow-sm">
                            <tr>
                                <th className="px-4 py-2 w-24">Category</th>
                                <th className="px-4 py-2">Item Name</th>
                                <th className="px-4 py-2 w-16 text-center">Qty</th>
                                <th className="px-4 py-2 w-48">Specs</th>
                                <th className="px-4 py-2 w-24 text-right">Unit Cost</th>
                                <th className="px-4 py-2 w-24 text-right">Total</th>
                                <th className="px-4 py-2 w-8"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-100">
                            {project.bom.map((item, idx) => (
                                <tr key={idx} className="hover:bg-zinc-50/50 group">
                                    <td className="p-2">
                                        <input 
                                            value={item.category} 
                                            onChange={(e) => updateItem(idx, 'category', e.target.value)}
                                            className="w-full bg-transparent border-none focus:ring-1 focus:ring-zinc-300 rounded px-2 py-1 text-xs font-bold text-zinc-500 uppercase"
                                        />
                                    </td>
                                    <td className="p-2">
                                        <input 
                                            value={item.itemName} 
                                            onChange={(e) => updateItem(idx, 'itemName', e.target.value)}
                                            className="w-full bg-transparent border-none focus:ring-1 focus:ring-zinc-300 rounded px-2 py-1 font-medium text-zinc-900"
                                        />
                                    </td>
                                    <td className="p-2">
                                        <input 
                                            type="number"
                                            value={item.quantity} 
                                            onChange={(e) => updateItem(idx, 'quantity', parseFloat(e.target.value))}
                                            className="w-full bg-transparent border-none focus:ring-1 focus:ring-zinc-300 rounded px-2 py-1 text-zinc-600 font-mono text-center"
                                        />
                                    </td>
                                    <td className="p-2">
                                        <input 
                                            value={item.specifications} 
                                            onChange={(e) => updateItem(idx, 'specifications', e.target.value)}
                                            className="w-full bg-zinc-50/50 border-none focus:ring-1 focus:ring-zinc-300 rounded px-2 py-1 text-zinc-700 font-mono text-xs"
                                        />
                                    </td>
                                    <td className="p-2">
                                        <div className="relative">
                                            <span className="absolute left-2 top-1.5 text-zinc-400 text-xs">$</span>
                                            <input 
                                                type="number"
                                                value={item.unitCost || 0} 
                                                onChange={(e) => updateItem(idx, 'unitCost', parseFloat(e.target.value))}
                                                className="w-full bg-transparent border-none focus:ring-1 focus:ring-zinc-300 rounded pl-4 pr-1 py-1 text-zinc-600 font-mono text-right text-xs"
                                            />
                                        </div>
                                    </td>
                                    <td className="p-2 text-right font-mono text-zinc-800 text-xs px-4">
                                        ${((item.quantity || 0) * (item.unitCost || 0)).toFixed(2)}
                                    </td>
                                    <td className="p-2 text-center">
                                        <button 
                                            onClick={() => deleteItem(idx)}
                                            className="text-zinc-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
            
            {/* Budget Footer */}
            <div className="bg-zinc-900 text-zinc-100 p-4 border-t border-zinc-800 flex justify-between items-center">
                <div className="text-xs text-zinc-400 uppercase tracking-widest font-bold">
                    Project Estimate
                </div>
                <div className="text-xl font-mono font-bold flex items-center gap-1 text-green-400">
                    <DollarSign size={18} />
                    {totalBudget.toFixed(2)}
                </div>
            </div>
        </div>
    </div>
  );
};

export default MaterialIntelligence;
