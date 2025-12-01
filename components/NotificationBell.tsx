import React, { useMemo, useState } from 'react';
import { AlertTriangle, Bell, CheckCircle2, Filter, Info } from 'lucide-react';
import { Notification, NotificationLink, NotificationSource } from '../types';

type SourceFilter = NotificationSource | 'all';
type StatusFilter = 'all' | 'unread';

interface NotificationBellProps {
  notifications: Notification[];
  onMarkRead: (id: string) => void;
  onMarkAllRead: () => void;
  onNavigate?: (link?: NotificationLink) => void;
}

const sourceLabels: Record<NotificationSource, string> = {
  inventory: 'Inventory',
  maintenance: 'Maintenance',
  vendor: 'Vendors',
};

const NotificationBell: React.FC<NotificationBellProps> = ({
  notifications,
  onMarkRead,
  onMarkAllRead,
  onNavigate,
}) => {
  const [open, setOpen] = useState(false);
  const [sourceFilter, setSourceFilter] = useState<SourceFilter>('all');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');

  const unreadCount = notifications.filter((n) => !n.read).length;

  const filtered = useMemo(
    () =>
      notifications.filter((n) => {
        if (sourceFilter !== 'all' && n.source !== sourceFilter) return false;
        if (statusFilter === 'unread' && n.read) return false;
        return true;
      }),
    [notifications, sourceFilter, statusFilter],
  );

  const handleNavigate = (link?: NotificationLink) => {
    if (link && onNavigate) onNavigate(link);
  };

  const renderIcon = (type: Notification['type']) => {
    if (type === 'success') return <CheckCircle2 size={14} className="text-emerald-400" />;
    if (type === 'info') return <Info size={14} className="text-blue-400" />;
    return <AlertTriangle size={14} className="text-amber-400" />;
  };

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((prev) => !prev)}
        className="relative p-2 rounded hover:bg-zinc-900 transition-colors border border-transparent hover:border-zinc-800"
        aria-label="Notifications"
      >
        <Bell size={16} className="text-zinc-500 hover:text-zinc-300 transition-colors" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-red-500 text-[10px] font-bold text-white rounded-full flex items-center justify-center">
            {unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-96 bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl overflow-hidden z-40">
          <div className="px-4 py-3 border-b border-zinc-800 flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-zinc-100">Notifications</p>
              <p className="text-xs text-zinc-500">Stay ahead of resource risks.</p>
            </div>
            <button
              onClick={onMarkAllRead}
              className="text-[11px] uppercase tracking-wide text-zinc-400 hover:text-zinc-100"
            >
              Mark all read
            </button>
          </div>

          <div className="px-4 py-2 border-b border-zinc-800 flex items-center gap-2 text-xs text-zinc-400">
            <Filter size={14} className="text-zinc-500" />
            <div className="flex gap-2">
              {(['all', 'inventory', 'maintenance', 'vendor'] as SourceFilter[]).map((filter) => (
                <button
                  key={filter}
                  onClick={() => setSourceFilter(filter)}
                  className={`px-2 py-1 rounded border text-[11px] transition-colors ${
                    sourceFilter === filter
                      ? 'border-zinc-600 bg-zinc-800 text-zinc-100'
                      : 'border-zinc-800 bg-zinc-950 hover:border-zinc-700 hover:text-zinc-100'
                  }`}
                >
                  {filter === 'all' ? 'All' : sourceLabels[filter]}
                </button>
              ))}
            </div>
            <div className="ml-auto flex gap-2">
              {(['all', 'unread'] as StatusFilter[]).map((filter) => (
                <button
                  key={filter}
                  onClick={() => setStatusFilter(filter)}
                  className={`px-2 py-1 rounded border text-[11px] transition-colors ${
                    statusFilter === filter
                      ? 'border-zinc-600 bg-zinc-800 text-zinc-100'
                      : 'border-zinc-800 bg-zinc-950 hover:border-zinc-700 hover:text-zinc-100'
                  }`}
                >
                  {filter === 'all' ? 'All' : 'Unread'}
                </button>
              ))}
            </div>
          </div>

          <div className="max-h-96 overflow-y-auto divide-y divide-zinc-800">
            {filtered.length === 0 ? (
              <div className="py-10 text-center text-sm text-zinc-500">No notifications</div>
            ) : (
              filtered.map((note) => (
                <button
                  key={note.id}
                  onClick={() => {
                    onMarkRead(note.id);
                    handleNavigate(note.link);
                    setOpen(false);
                  }}
                  className={`w-full text-left px-4 py-3 flex items-start gap-3 hover:bg-zinc-800 transition-colors ${
                    note.read ? 'opacity-70' : ''
                  }`}
                >
                  <div className="pt-0.5">{renderIcon(note.type)}</div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm text-zinc-100 font-medium">{note.message}</span>
                      <span className="text-[10px] uppercase tracking-wide text-zinc-500 bg-zinc-900 px-2 py-0.5 rounded-full border border-zinc-800">
                        {sourceLabels[note.source]}
                      </span>
                    </div>
                    <div className="mt-1 text-[11px] text-zinc-500 flex items-center gap-2">
                      {!note.read && <span className="w-2 h-2 bg-emerald-500 rounded-full"></span>}
                      <span>{new Date(note.timestamp).toLocaleString()}</span>
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
