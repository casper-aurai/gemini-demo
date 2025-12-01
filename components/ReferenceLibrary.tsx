
import React from 'react';
import { ReferenceDoc } from '../types';
import { Book, Link as LinkIcon, FileText, Tag, Plus, Trash2 } from 'lucide-react';

interface ReferenceLibraryProps {
    docs: ReferenceDoc[];
    onUpdate: (docs: ReferenceDoc[]) => void;
}

const ReferenceLibrary: React.FC<ReferenceLibraryProps> = ({ docs, onUpdate }) => {
    
    const addDoc = () => {
        const title = prompt("Document Title:");
        if(!title) return;
        const url = prompt("URL (optional):");
        
        const newDoc: ReferenceDoc = {
            id: Date.now().toString(),
            title,
            type: 'datasheet',
            url: url || undefined,
            tags: [],
            dateAdded: Date.now()
        };
        onUpdate([newDoc, ...docs]);
    };

    const deleteDoc = (id: string) => {
        if(confirm('Remove document?')) onUpdate(docs.filter(d => d.id !== id));
    };

    return (
        <div className="p-8 h-full bg-zinc-50 flex flex-col">
            <header className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="font-serif text-2xl font-bold text-zinc-900 flex items-center gap-2">
                        <Book /> Reference Library
                    </h2>
                    <p className="text-zinc-500 text-sm">Technical documentation and datasheets.</p>
                </div>
                <button onClick={addDoc} className="bg-zinc-900 text-white px-4 py-2 rounded text-sm font-bold flex items-center gap-2 hover:bg-zinc-800 shadow-sm">
                    <Plus size={16}/> Add Document
                </button>
            </header>

            {docs.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-zinc-400 border-2 border-dashed border-zinc-200 rounded-xl bg-zinc-50/50">
                    <Book size={48} className="mb-4 opacity-20" />
                    <p>Library Empty</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 overflow-y-auto">
                    {docs.map(doc => (
                        <div key={doc.id} className="bg-white p-4 rounded-lg border border-zinc-200 shadow-sm flex flex-col group hover:border-zinc-400 transition-colors hover:shadow-md">
                            <div className="flex items-start justify-between mb-3">
                                <div className="bg-zinc-100 p-2 rounded text-zinc-600">
                                    <FileText size={20} />
                                </div>
                                <span className={`text-[9px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded ${
                                    doc.type === 'datasheet' ? 'bg-blue-50 text-blue-600' : 'bg-zinc-100 text-zinc-500'
                                }`}>{doc.type}</span>
                            </div>
                            <h3 className="font-bold text-zinc-800 mb-1 text-sm leading-tight line-clamp-2 h-10">{doc.title}</h3>
                            {doc.url && (
                                <a href={doc.url} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline flex items-center gap-1 mb-2 mt-auto">
                                    <LinkIcon size={10} /> External Link
                                </a>
                            )}
                            <div className="mt-3 pt-3 border-t border-zinc-100 flex items-center justify-between">
                                <span className="text-[10px] text-zinc-400 font-mono">{new Date(doc.dateAdded).toLocaleDateString()}</span>
                                <button onClick={() => deleteDoc(doc.id)} className="text-zinc-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Trash2 size={14} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default ReferenceLibrary;
