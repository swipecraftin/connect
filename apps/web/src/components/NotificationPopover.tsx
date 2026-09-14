import React, { useState, useRef, useEffect } from 'react';
import { useNotifications } from '../context/NotificationContext';
import { InAppNotification } from '../types/notification';
import { Badge } from './ui/badge';
import {
  Bell,
  CheckCheck,
  Trash2,
  Calendar,
  Clock,
  Sparkles,
  ShieldAlert,
  Info,
  XCircle,
} from 'lucide-react';

interface NotificationPopoverProps {
  onNavigateTab?: (tab: 'marketplace' | 'my-sessions' | 'profile', slotId?: string) => void;
}

export const NotificationPopover: React.FC<NotificationPopoverProps> = ({ onNavigateTab }) => {
  const { notifications, unreadCount, markAsRead, markAllAsRead, clearAll } = useNotifications();
  const [isOpen, setIsOpen] = useState(false);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const popoverRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const displayedList = notifications.filter((n) => {
    if (filter === 'unread') return !n.read;
    return true;
  });

  const formatTimeAgo = (isoString: string) => {
    try {
      const diffMs = Date.now() - new Date(isoString).getTime();
      const diffMin = Math.floor(diffMs / (1000 * 60));
      if (diffMin < 1) return 'Just now';
      if (diffMin < 60) return `${diffMin}m ago`;
      const diffHrs = Math.floor(diffMin / 60);
      if (diffHrs < 24) return `${diffHrs}h ago`;
      const diffDays = Math.floor(diffHrs / 24);
      return `${diffDays}d ago`;
    } catch {
      return '';
    }
  };

  const getIconForType = (type: InAppNotification['type']) => {
    switch (type) {
      case 'booking':
        return <Calendar className="h-3.5 w-3.5 text-emerald-500" />;
      case 'reminder':
        return <Clock className="h-3.5 w-3.5 text-amber-500" />;
      case 'credit':
        return <Sparkles className="h-3.5 w-3.5 text-purple-500" />;
      case 'strike':
        return <ShieldAlert className="h-3.5 w-3.5 text-red-500" />;
      case 'cancellation':
        return <XCircle className="h-3.5 w-3.5 text-amber-400" />;
      default:
        return <Info className="h-3.5 w-3.5 text-primary" />;
    }
  };

  const handleNotificationClick = (item: InAppNotification) => {
    markAsRead(item.id);
    if (item.actionTab && onNavigateTab) {
      onNavigateTab(item.actionTab, item.slotId);
      setIsOpen(false);
    }
  };

  return (
    <div className="relative" ref={popoverRef}>
      {/* Trigger Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="h-8 w-8 rounded-lg bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.08] backdrop-blur-md flex items-center justify-center text-[#8A8F9C] hover:text-[#E8EAF0] transition-all duration-150 relative shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]"
        title="Notifications"
      >
        <Bell className="h-3.5 w-3.5 stroke-[1.75]" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#3e8bff] px-1 text-[9px] font-mono font-bold text-white shadow-[0_0_8px_rgba(62,139,255,0.6)] animate-in zoom-in-50">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Popover Dropdown */}
      {isOpen && (
        <>
          {/* Mobile backdrop to lock screen drift and allow tap outside to dismiss */}
          <div
            onClick={() => setIsOpen(false)}
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm sm:hidden animate-in fade-in duration-150"
          />

          <div className="fixed left-3 right-3 top-16 z-50 sm:absolute sm:left-auto sm:right-0 sm:top-full sm:mt-2 sm:w-96 max-w-[calc(100vw-24px)] sm:max-w-none bg-[#080B12]/90 backdrop-blur-2xl border border-white/[0.12] rounded-2xl shadow-[0_24px_70px_rgba(0,0,0,0.85),inset_0_1px_0_rgba(255,255,255,0.08)] overflow-hidden flex flex-col max-h-[75vh] sm:max-h-[460px] overscroll-contain animate-in fade-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="p-3.5 border-b border-white/[0.08] bg-white/[0.02] backdrop-blur-md flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-[#F2F4F8]">Notifications</span>
                {unreadCount > 0 && (
                  <Badge variant="secondary" className="text-[10px] font-mono px-1.5 py-0 bg-[#3e8bff]/20 text-[#9cc0ff] border border-[#3e8bff]/30">
                    {unreadCount} unread
                  </Badge>
                )}
              </div>

              <div className="flex items-center gap-1">
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="text-[10px] font-medium text-[#3e8bff] hover:underline flex items-center gap-1 px-1.5 py-0.5 rounded hover:bg-[#3e8bff]/10 transition-colors"
                    title="Mark all as read"
                  >
                    <CheckCheck className="h-3 w-3 stroke-[1.75]" />
                    Mark read
                  </button>
                )}
                {notifications.length > 0 && (
                  <button
                    onClick={clearAll}
                    className="h-6 w-6 rounded hover:bg-red-500/10 text-[#8A8F9C] hover:text-red-400 flex items-center justify-center transition-colors"
                    title="Clear all"
                  >
                    <Trash2 className="h-3 w-3 stroke-[1.75]" />
                  </button>
                )}
              </div>
            </div>

            {/* Sub-header Filter Tabs */}
            <div className="px-3 py-1.5 border-b border-white/[0.06] bg-white/[0.01] backdrop-blur-md flex items-center gap-2 text-[11px] shrink-0">
              <button
                onClick={() => setFilter('all')}
                className={`px-2 py-0.5 rounded-md font-medium transition-colors ${
                  filter === 'all'
                    ? 'bg-white/[0.09] text-[#F2F4F8] shadow-xs'
                    : 'text-[#8A8F9C] hover:text-[#F2F4F8]'
                }`}
              >
                All ({notifications.length})
              </button>
              <button
                onClick={() => setFilter('unread')}
                className={`px-2 py-0.5 rounded-md font-medium transition-colors ${
                  filter === 'unread'
                    ? 'bg-white/[0.09] text-[#F2F4F8] shadow-xs'
                    : 'text-[#8A8F9C] hover:text-[#F2F4F8]'
                }`}
              >
                Unread ({unreadCount})
              </button>
            </div>

          {/* Notification List */}
          <div className="overflow-y-auto divide-y divide-white/[0.06] flex-1 overscroll-contain">
            {displayedList.length === 0 ? (
              <div className="p-8 text-center text-xs text-[#8A8F9C]">
                <Bell className="h-6 w-6 mx-auto mb-2 opacity-30 text-[#61666F]" />
                No notifications right now.
              </div>
            ) : (
              displayedList.map((item) => (
                <div
                  key={item.id}
                  onClick={() => handleNotificationClick(item)}
                  className={`p-3 transition-colors cursor-pointer flex items-start gap-3 text-left ${
                    item.read
                      ? 'hover:bg-white/[0.03] opacity-75'
                      : 'bg-[#3e8bff]/[0.05] hover:bg-[#3e8bff]/[0.09]'
                  }`}
                >
                  <div className="mt-0.5 p-1.5 rounded-lg bg-[#141720] border border-white/[0.08] shrink-0">
                    {getIconForType(item.type)}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <h4 className="text-xs font-semibold text-[#F2F4F8] truncate">
                        {item.title}
                      </h4>
                      <span className="text-[10px] font-mono text-[#7A808C] shrink-0">
                        {formatTimeAgo(item.timestamp)}
                      </span>
                    </div>
                    <p className="text-[11.5px] text-[#A6ACB8] mt-0.5 line-clamp-2 leading-relaxed">
                      {item.message}
                    </p>
                    {item.actionTab && (
                      <span className="inline-flex items-center gap-1 text-[10.5px] font-mono text-[#3e8bff] mt-1 font-medium">
                        Open {item.actionTab === 'my-sessions' ? 'My Sessions' : item.actionTab === 'marketplace' ? 'Marketplace' : 'Profile'} →
                      </span>
                    )}
                  </div>

                  {!item.read && (
                    <span className="h-1.5 w-1.5 rounded-full bg-[#3e8bff] mt-1.5 shrink-0 shadow-[0_0_6px_rgba(62,139,255,0.8)]" />
                  )}
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="p-2 border-t border-white/[0.06] bg-[#0A0C10] text-center shrink-0">
            <span className="text-[10px] text-[#7A808C] font-mono">
              Connect by Swipecraft · Realtime Notifications
            </span>
          </div>
        </div>
      </>
    )}
  </div>
);
};
