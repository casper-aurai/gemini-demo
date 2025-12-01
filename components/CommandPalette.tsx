import React, { useEffect, useMemo, useState } from 'react';
import { Command, Search, Sparkles, X } from 'lucide-react';
import { SearchEntry, SearchEntityType } from '../services/searchService';

export type CommandResult = SearchEntry & { score?: number };

interface CommandPaletteProps {
  isOpen: boolean;
  query: string;
  results: CommandResult[];
  onClose: () => void;
  onQueryChange: (value: string) => void;
  onSelect: (result: CommandResult) => void;
}

const typeLabels: Record<SearchEntityType, { label: string; color: string }> = {
  project: { label: 'Project', color: 'bg-blue-900/30 text-blue-300 border-blue-800/80' },
  inventory: { label: 'Inventory', color: 'bg-green-900/30 text-green-300 border-green-800/80' },
  machine: { label: 'Machine', color: 'bg-amber-900/30 text-amber-300 border-amber-800/80' },
  vendor: { label: 'Vendor', color: 'bg-purple-900/30 text-purple-300 border-purple-800/80' },
  document: { label: 'Document', color: 'bg-cyan-900/30 text-cyan-300 border-cyan-800/80' },
  action: { label: 'Action', color: 'bg-zinc-800 text-zinc-200 border-zinc-700' },
};

const typeOrder: SearchEntityType[] = ['project', 'inventory', 'machine', 'vendor', 'document', 'action'];

const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  query,
  results,
  onClose,
  onQueryChange,
  onSelect,
}) => {
  const [activeIndex, setActiveIndex] = useState(0);

  const orderedResults = useMemo(() => {
    const groups: Record<SearchEntityType, CommandResult[]> = {
      project: [],
      inventory: [],
      machine: [],
      vendor: [],
      document: [],
      action: [],
    };

    results.forEach((res) => {
      groups[res.type]?.push(res);
    });

    return typeOrder.flatMap((type) => groups[type]);
  }, [results]);

  useEffect(() => {
    setActiveIndex(0);
  }, [query, isOpen, results.length]);

  useEffect(() => {
    if (!isOpen) {
      setActiveIndex(0);
      onQueryChange('');
    }
  }, [isOpen, onQueryChange]);

  const handleKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((idx) => Math.min(idx + 1, Math.max(orderedResults.length - 1, 0)));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((idx) => Math.max(idx - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const choice = orderedResults[activeIndex];
      if (choice) onSelect(choice);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="absolute inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-start justify-center pt-24 animate-in fade-in duration-200">
      <div className="bg-zinc-900 w-[700px] rounded-xl border border-zinc-700 shadow-2xl overflow-hidden flex flex-col">
        <div className="p-4 border-b border-zinc-800 flex items-center gap-3">
          <div className="flex items-center gap-2 text-zinc-400">
            <Command size={18} />
            <span className="text-xs uppercase tracking-wide text-zinc-500">Command Palette</span>
          </div>
          <div className="flex-1 flex items-center gap-3">
            <Search className="text-zinc-500" size={18} />
            <input
              value={query}
              onChange={(e) => onQueryChange(e.target.value)}
              onKeyDown={handleKey}
              placeholder="Search projects, inventory, machines, or run actions..."
              className="bg-transparent text-lg text-zinc-100 focus:outline-none flex-1 font-sans"
              autoFocus
            />
          </div>
          <button
            onClick={onClose}
            className="text-xs text-zinc-500 bg-zinc-800 px-2 py-1 rounded flex items-center gap-1 hover:text-zinc-200"
          >
            <X size={14} />
            ESC
          </button>
        </div>

        <div className="max-h-96 overflow-y-auto">
          {orderedResults.length === 0 ? (
            <div className="text-center py-10 text-zinc-500 text-sm">No matches. Try another keyword.</div>
          ) : (
            <div className="divide-y divide-zinc-800">
              {typeOrder
                .map((type) => orderedResults.filter((r) => r.type === type))
                .filter((group) => group.length > 0)
                .map((group, groupIdx) => (
                  <div key={`${group[0].type}-${groupIdx}`} className="p-2">
                    <div className="flex items-center gap-2 text-[11px] uppercase tracking-wide text-zinc-500 font-bold px-1 mb-2">
                      <Sparkles size={12} />
                      {typeLabels[group[0].type].label}
                    </div>
                    <div className="flex flex-col gap-1">
                      {group.map((res, idx) => {
                        const flattenedIndex = orderedResults.indexOf(res);
                        const isActive = flattenedIndex === activeIndex;
                        return (
                          <button
                            key={res.id}
                            onClick={() => onSelect(res)}
                            onMouseEnter={() => setActiveIndex(flattenedIndex)}
                            className={`w-full text-left p-3 rounded-lg flex items-center justify-between border transition-all ${
                              isActive
                                ? 'bg-zinc-800/80 border-zinc-600 shadow-lg'
                                : 'bg-zinc-900 border-transparent hover:border-zinc-700'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <span
                                className={`text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded border ${typeLabels[res.type].color}`}
                              >
                                {typeLabels[res.type].label}
                              </span>
                              <div>
                                <div className="text-sm text-zinc-100 font-semibold">{res.title}</div>
                                {res.subtitle && <div className="text-xs text-zinc-500">{res.subtitle}</div>}
                              </div>
                            </div>
                            <div className="text-[10px] text-zinc-600">
                              {isActive ? 'Enter ↵ to run' : res.type === 'action' ? 'Shortcut' : 'Open'}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>
      </div>
      <div className="absolute inset-0 -z-10" onClick={onClose}></div>
    </div>
  );
};

export default CommandPalette;
