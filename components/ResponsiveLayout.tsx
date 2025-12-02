import React, { useMemo, useState } from 'react';
import { LucideIcon, Menu, X } from 'lucide-react';

interface NavItemConfig {
  label: string;
  icon: LucideIcon;
  active?: boolean;
  onClick: () => void;
}

interface NavGroup {
  title: string;
  items: NavItemConfig[];
}

interface ResponsiveLayoutProps {
  navGroups: NavGroup[];
  breadcrumbs: React.ReactNode;
  headerActions?: React.ReactNode;
  onOpenCommand: () => void;
  children: React.ReactNode;
}

const ResponsiveLayout: React.FC<ResponsiveLayoutProps> = ({
  navGroups,
  breadcrumbs,
  headerActions,
  onOpenCommand,
  children,
}) => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(() =>
    navGroups.reduce((acc, group) => ({ ...acc, [group.title]: true }), {}),
  );

  const toggleGroup = (title: string) => {
    setOpenGroups((prev) => ({ ...prev, [title]: !prev[title] }));
  };

  const nav = useMemo(
    () => (
      <div className="flex-1 px-4 space-y-6 overflow-y-auto">
        {navGroups.map((group) => (
          <div key={group.title}>
            <button
              className="flex items-center justify-between w-full text-[10px] font-bold uppercase tracking-widest text-zinc-600 mb-2"
              onClick={() => toggleGroup(group.title)}
            >
              <span>{group.title}</span>
              <span className="text-[11px] text-zinc-500">{openGroups[group.title] ? '−' : '+'}</span>
            </button>
            {openGroups[group.title] && (
              <div className="space-y-1">
                {group.items.map((item) => (
                  <button
                    key={item.label}
                    onClick={() => {
                      item.onClick();
                      setMobileOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors border border-transparent ${
                      item.active
                        ? 'bg-zinc-900 text-zinc-100 border-zinc-800'
                        : 'text-zinc-400 hover:bg-zinc-900 hover:text-zinc-100'
                    }`}
                  >
                    <item.icon size={16} />
                    <span>{item.label}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    ),
    [navGroups, openGroups],
  );

  return (
    <div className="flex h-screen bg-zinc-950 text-zinc-200 font-sans">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-64 bg-zinc-950 text-zinc-400 flex-col flex-shrink-0 border-r border-zinc-900">
        <div className="p-6">
          <h1 className="font-serif text-2xl text-zinc-100 font-bold tracking-tight">Construct OS</h1>
          <div className="flex items-center gap-2 mt-2">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
            <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-mono">System V2.0</p>
          </div>
        </div>
        {nav}
        <div className="p-4 border-t border-zinc-900">
          <button className="flex items-center gap-3 w-full p-2 hover:bg-zinc-900 rounded-md transition-colors">
            <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center font-bold text-xs border border-zinc-700">JS</div>
            <div className="text-left">
              <div className="text-xs font-bold text-zinc-300">Jane Smith</div>
              <div className="text-[10px] text-zinc-600">Lead Engineer</div>
            </div>
          </button>
        </div>
      </aside>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          ></div>
          <div className="absolute inset-y-0 left-0 w-72 bg-zinc-950 border-r border-zinc-900 shadow-xl flex flex-col">
            <div className="p-4 border-b border-zinc-900 flex items-center justify-between">
              <div>
                <div className="font-serif text-lg text-zinc-100">Construct OS</div>
                <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-mono">System V2.0</p>
              </div>
              <button onClick={() => setMobileOpen(false)} className="p-2 rounded-md hover:bg-zinc-900">
                <X size={16} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto py-4">{nav}</div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden h-screen bg-zinc-950 relative">
        <header className="h-14 border-b border-zinc-900 bg-zinc-950 flex items-center justify-between px-4 sm:px-6 flex-shrink-0">
          <div className="flex items-center gap-2">
            <button
              className="lg:hidden p-2 rounded-md hover:bg-zinc-900 text-zinc-400"
              onClick={() => setMobileOpen(true)}
            >
              <Menu size={16} />
            </button>
            <div className="hidden lg:block">
              <p className="text-[11px] uppercase tracking-widest text-zinc-500 font-mono">Control Surface</p>
              <p className="text-sm text-zinc-200">Construct OS</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={onOpenCommand}
              className="flex items-center gap-2 px-3 py-1.5 bg-zinc-900 rounded border border-zinc-800 text-xs text-zinc-400 hover:border-zinc-700 hover:text-zinc-200 transition-all"
            >
              <span className="text-[11px] bg-zinc-800 px-1 rounded">⌘K</span>
              <span>Quick Actions</span>
            </button>
            {headerActions}
          </div>
        </header>
        <div className="border-b border-zinc-900 bg-zinc-950 px-4 sm:px-6 py-2 flex items-center">
          {breadcrumbs}
        </div>
        <div className="flex-1 overflow-hidden relative">{children}</div>
      </main>
    </div>
  );
};

export default ResponsiveLayout;
