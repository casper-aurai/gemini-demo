import React, { useCallback, useMemo, useRef, useState } from 'react';
import { InventoryItem, Machine, ReferenceDoc } from '../types';
import {
    BookOpen,
    FileUp,
    Search,
    Tag,
    Link as LinkIcon,
    Image as ImageIcon,
    FileText,
    Plus,
    Paperclip,
    Wrench,
    Package
} from 'lucide-react';

interface LibraryProps {
    docs: ReferenceDoc[];
    onUpdate: (docs: ReferenceDoc[]) => void;
    inventory: InventoryItem[];
    machines: Machine[];
}

const docTypeIcon = (type: ReferenceDoc['type']) => {
    if (type === 'image') return ImageIcon;
    if (type === 'pdf') return FileText;
    if (type === 'note') return BookOpen;
    return LinkIcon;
};

const Library: React.FC<LibraryProps> = ({ docs, onUpdate, inventory, machines }) => {
    const [search, setSearch] = useState('');
    const [folderFilter, setFolderFilter] = useState<string>('all');
    const [tagFilter, setTagFilter] = useState<string>('');
    const [dragActive, setDragActive] = useState(false);
    const [newLinkTitle, setNewLinkTitle] = useState('');
    const [newLinkUrl, setNewLinkUrl] = useState('');
    const uploadRef = useRef<HTMLInputElement>(null);

    const uniqueFolders = useMemo(() => {
        const folders = docs.map(d => d.folder || 'Unfiled');
        return Array.from(new Set(folders));
    }, [docs]);

    const uniqueTags = useMemo(() => {
        const tagSet = new Set<string>();
        docs.forEach(d => d.tags.forEach(t => tagSet.add(t)));
        return Array.from(tagSet);
    }, [docs]);

    const filteredDocs = useMemo(() => {
        return docs.filter(doc => {
            const matchesFolder = folderFilter === 'all' || (doc.folder || 'Unfiled') === folderFilter;
            const matchesTag = !tagFilter || doc.tags.includes(tagFilter);
            const matchesSearch = [doc.title, doc.description, doc.fileName, doc.folder]
                .filter(Boolean)
                .some(field => field!.toLowerCase().includes(search.toLowerCase()));
            return matchesFolder && matchesTag && matchesSearch;
        }).sort((a, b) => b.dateAdded - a.dateAdded);
    }, [docs, folderFilter, tagFilter, search]);

    const updateDoc = useCallback((id: string, updates: Partial<ReferenceDoc>) => {
        onUpdate(docs.map(d => d.id === id ? { ...d, ...updates } : d));
    }, [docs, onUpdate]);

    const toggleAssociation = (docId: string, targetId: string, type: 'inventory' | 'machine') => {
        const key = type === 'inventory' ? 'relatedInventoryIds' : 'relatedMachineIds';
        const doc = docs.find(d => d.id === docId);
        if (!doc) return;
        const current = doc[key] || [];
        const exists = current.includes(targetId);
        const next = exists ? current.filter(id => id !== targetId) : [...current, targetId];
        updateDoc(docId, { [key]: next } as Partial<ReferenceDoc>);
    };

    const onTagAdd = (docId: string, tag: string) => {
        if (!tag.trim()) return;
        const doc = docs.find(d => d.id === docId);
        if (!doc) return;
        if (doc.tags.includes(tag.trim())) return;
        updateDoc(docId, { tags: [...doc.tags, tag.trim()] });
    };

    const handleFiles = async (fileList: FileList) => {
        const uploads = Array.from(fileList);
        for (const file of uploads) {
            const reader = new FileReader();
            reader.onload = () => {
                const dataUrl = reader.result as string;
                const isPdf = file.type.includes('pdf');
                const newDoc: ReferenceDoc = {
                    id: `${Date.now()}-${file.name}`,
                    title: file.name,
                    fileName: file.name,
                    type: isPdf ? 'pdf' : file.type.startsWith('image') ? 'image' : 'note',
                    previewData: dataUrl,
                    tags: [],
                    folder: 'Uploads',
                    dateAdded: Date.now(),
                    description: `${file.type || 'file'} • ${(file.size / 1024).toFixed(1)} KB`
                };
                onUpdate([newDoc, ...docs]);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setDragActive(false);
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            handleFiles(e.dataTransfer.files);
        }
    };

    const addLink = () => {
        if (!newLinkTitle.trim() || !newLinkUrl.trim()) return;
        const newDoc: ReferenceDoc = {
            id: `${Date.now()}`,
            title: newLinkTitle.trim(),
            url: newLinkUrl.trim(),
            type: 'link',
            tags: [],
            folder: 'Links',
            dateAdded: Date.now(),
            description: 'External reference link'
        };
        onUpdate([newDoc, ...docs]);
        setNewLinkTitle('');
        setNewLinkUrl('');
    };

    const previewFor = (doc: ReferenceDoc) => {
        if (doc.type === 'image' && doc.previewData) {
            return <img src={doc.previewData} alt={doc.title} className="w-full h-40 object-cover rounded" />;
        }
        if (doc.type === 'pdf' && (doc.previewData || doc.url)) {
            return (
                <object data={doc.previewData || doc.url} type="application/pdf" className="w-full h-40 rounded border border-zinc-200" />
            );
        }
        if (doc.type === 'link' && doc.url) {
            return (
                <div className="w-full h-40 rounded border border-dashed border-blue-200 bg-blue-50 text-blue-600 flex items-center justify-center">
                    <LinkIcon size={18} className="mr-2" />
                    {doc.url}
                </div>
            );
        }
        return (
            <div className="w-full h-40 rounded border border-dashed border-zinc-200 bg-zinc-50 text-zinc-500 flex items-center justify-center">
                <Paperclip size={18} className="mr-2" />
                No preview available
            </div>
        );
    };

    return (
        <div className="p-8 h-full bg-zinc-50 flex flex-col">
            <header className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between mb-6">
                <div>
                    <h2 className="font-serif text-2xl font-bold text-zinc-900 flex items-center gap-2">
                        <BookOpen /> Knowledge Library
                    </h2>
                    <p className="text-zinc-500 text-sm">Drag & drop uploads, inline previews, and relationships to your assets.</p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={14}/>
                        <input
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            placeholder="Search title, tags, folder..."
                            className="pl-9 pr-4 py-2 rounded border border-zinc-300 text-sm w-64 focus:outline-none focus:ring-1 focus:ring-zinc-500 bg-white"
                        />
                    </div>
                    <select
                        value={folderFilter}
                        onChange={e => setFolderFilter(e.target.value)}
                        className="border border-zinc-300 rounded px-3 py-2 text-sm bg-white"
                    >
                        <option value="all">All Folders</option>
                        {uniqueFolders.map(folder => (
                            <option key={folder} value={folder}>{folder}</option>
                        ))}
                    </select>
                    <select
                        value={tagFilter}
                        onChange={e => setTagFilter(e.target.value)}
                        className="border border-zinc-300 rounded px-3 py-2 text-sm bg-white"
                    >
                        <option value="">All Tags</option>
                        {uniqueTags.map(tag => (
                            <option key={tag} value={tag}>{tag}</option>
                        ))}
                    </select>
                </div>
            </header>

            <div
                className={`border-2 border-dashed rounded-xl p-6 mb-4 bg-white transition-colors ${dragActive ? 'border-zinc-900 bg-zinc-50' : 'border-zinc-200'}`}
                onDragOver={e => { e.preventDefault(); setDragActive(true); }}
                onDragLeave={() => setDragActive(false)}
                onDrop={handleDrop}
            >
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="bg-zinc-100 p-3 rounded-full text-zinc-700">
                            <FileUp />
                        </div>
                        <div>
                            <h3 className="font-bold text-zinc-800">Drop PDFs or images to upload</h3>
                            <p className="text-sm text-zinc-500">Inline previews are created automatically. Tag and relate them to machines or stock.</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => uploadRef.current?.click()}
                            className="px-4 py-2 bg-zinc-900 text-white text-sm font-bold rounded shadow-sm hover:bg-zinc-800"
                        >
                            Upload file
                        </button>
                        <input
                            ref={uploadRef}
                            type="file"
                            multiple
                            accept="application/pdf,image/*"
                            className="hidden"
                            onChange={e => e.target.files && handleFiles(e.target.files)}
                        />
                        <div className="flex gap-2">
                            <input
                                value={newLinkTitle}
                                onChange={e => setNewLinkTitle(e.target.value)}
                                placeholder="Link title"
                                className="border border-zinc-300 rounded px-2 py-2 text-sm bg-white"
                            />
                            <input
                                value={newLinkUrl}
                                onChange={e => setNewLinkUrl(e.target.value)}
                                placeholder="https://..."
                                className="border border-zinc-300 rounded px-2 py-2 text-sm bg-white w-48"
                            />
                            <button
                                onClick={addLink}
                                className="px-3 py-2 bg-white border border-zinc-300 text-sm font-bold rounded hover:bg-zinc-50"
                            >
                                <Plus size={14} className="inline mr-1" />Save Link
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 flex-1 overflow-auto">
                {filteredDocs.map(doc => {
                    const Icon = docTypeIcon(doc.type);
                    return (
                        <div key={doc.id} className="bg-white rounded-xl border border-zinc-200 shadow-sm p-4 flex flex-col gap-3 hover:shadow-md transition-shadow">
                            <div className="flex items-start justify-between">
                                <div className="flex items-center gap-2">
                                    <div className="p-2 rounded bg-zinc-100 text-zinc-700">
                                        <Icon size={16} />
                                    </div>
                                    <div>
                                        <input
                                            value={doc.title}
                                            onChange={e => updateDoc(doc.id, { title: e.target.value })}
                                            className="font-bold text-zinc-900 bg-transparent focus:bg-zinc-50 rounded px-1"
                                        />
                                        <p className="text-[11px] uppercase tracking-wide text-zinc-400 font-bold">{doc.folder || 'Unfiled'}</p>
                                    </div>
                                </div>
                                <span className="text-[10px] text-zinc-400">{new Date(doc.dateAdded).toLocaleDateString()}</span>
                            </div>

                            {previewFor(doc)}

                            {doc.description && <p className="text-sm text-zinc-600">{doc.description}</p>}

                            {doc.url && (
                                <a href={doc.url} target="_blank" rel="noreferrer" className="text-xs text-blue-600 hover:underline flex items-center gap-1">
                                    <LinkIcon size={12}/>Open link
                                </a>
                            )}

                            <div className="flex flex-wrap gap-2">
                                {doc.tags.map(tag => (
                                    <span key={tag} className="text-[11px] px-2 py-1 rounded-full bg-zinc-100 text-zinc-600 border border-zinc-200 flex items-center gap-1">
                                        <Tag size={10}/> {tag}
                                    </span>
                                ))}
                                <label className="text-[11px] flex items-center gap-1 text-zinc-500 cursor-text">
                                    <Plus size={10}/> Tag
                                    <input
                                        type="text"
                                        className="w-20 bg-transparent border-b border-dashed border-zinc-300 focus:outline-none text-xs"
                                        onKeyDown={e => {
                                            if (e.key === 'Enter') {
                                                onTagAdd(doc.id, (e.target as HTMLInputElement).value);
                                                (e.target as HTMLInputElement).value = '';
                                            }
                                        }}
                                    />
                                </label>
                            </div>

                            <div className="border-t border-zinc-100 pt-3 grid grid-cols-2 gap-3">
                                <div>
                                    <div className="flex items-center gap-1 text-[11px] uppercase tracking-wide text-zinc-500 font-bold mb-1">
                                        <Package size={12}/> Inventory
                                    </div>
                                    <div className="space-y-1">
                                        {inventory.map(item => (
                                            <label key={item.id} className="flex items-center gap-2 text-xs text-zinc-600">
                                                <input
                                                    type="checkbox"
                                                    checked={Boolean(doc.relatedInventoryIds?.includes(item.id))}
                                                    onChange={() => toggleAssociation(doc.id, item.id, 'inventory')}
                                                />
                                                <span className="truncate">{item.name}</span>
                                            </label>
                                        ))}
                                        {inventory.length === 0 && <p className="text-[11px] text-zinc-400">No inventory loaded</p>}
                                    </div>
                                </div>
                                <div>
                                    <div className="flex items-center gap-1 text-[11px] uppercase tracking-wide text-zinc-500 font-bold mb-1">
                                        <Wrench size={12}/> Machines
                                    </div>
                                    <div className="space-y-1">
                                        {machines.map(machine => (
                                            <label key={machine.id} className="flex items-center gap-2 text-xs text-zinc-600">
                                                <input
                                                    type="checkbox"
                                                    checked={Boolean(doc.relatedMachineIds?.includes(machine.id))}
                                                    onChange={() => toggleAssociation(doc.id, machine.id, 'machine')}
                                                />
                                                <span className="truncate">{machine.name}</span>
                                            </label>
                                        ))}
                                        {machines.length === 0 && <p className="text-[11px] text-zinc-400">No machines added</p>}
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}
                {filteredDocs.length === 0 && (
                    <div className="col-span-full border border-dashed border-zinc-200 rounded-xl p-10 text-center text-zinc-400 bg-white">
                        <p className="font-bold mb-2">No documents match your filters.</p>
                        <p className="text-sm">Try clearing the search, folder, or tag filters.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Library;
