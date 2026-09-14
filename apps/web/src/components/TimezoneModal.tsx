import React, { useState } from 'react';
import { useTimezone } from '../context/TimezoneContext';
import { POPULAR_TIMEZONES, getTimezoneOffsetString, getTimezoneShortCode } from '../lib/timezone';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { X, Globe, Search, Check, RotateCcw, Clock } from 'lucide-react';

interface TimezoneModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TimezoneModal: React.FC<TimezoneModalProps> = ({ isOpen, onClose }) => {
  const { timeZone, detectedTimeZone, setTimeZone, resetToDetected } = useTimezone();
  const [search, setSearch] = useState('');

  if (!isOpen) return null;

  const filtered = POPULAR_TIMEZONES.filter((tz) => {
    const q = search.toLowerCase();
    return (
      tz.label.toLowerCase().includes(q) ||
      tz.id.toLowerCase().includes(q) ||
      tz.city.toLowerCase().includes(q) ||
      tz.region.toLowerCase().includes(q)
    );
  });

  const getLiveTimePreview = (tzId: string) => {
    try {
      return new Intl.DateTimeFormat('en-US', {
        timeZone: tzId,
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      }).format(new Date());
    } catch {
      return '--:--';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-150">
      <div
        className="w-full max-w-xl bg-[#080B12]/92 backdrop-blur-2xl border border-white/[0.12] rounded-2xl shadow-[0_24px_64px_rgba(0,0,0,0.8),inset_0_1px_0_rgba(255,255,255,0.08)] overflow-hidden flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 border-b border-white/[0.08] flex items-center justify-between bg-white/[0.02]">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-[#3e8bff]/15 border border-[#3e8bff]/30 flex items-center justify-center text-[#3e8bff]">
              <Globe className="h-4.5 w-4.5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#F2F4F8] flex items-center gap-2">
                Timezone Settings
                <Badge variant="outline" className="text-[10px] font-mono border-white/[0.12] bg-white/[0.04] text-[#C6CBD5]">
                  {getTimezoneOffsetString(timeZone)}
                </Badge>
              </h2>
              <p className="text-xs text-[#8A8F9C]">
                All mock interview slots will automatically convert to your selected timezone.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="h-8 w-8 rounded-lg hover:bg-white/[0.08] text-[#8A8F9C] hover:text-[#F2F4F8] flex items-center justify-center transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Search & Reset Bar */}
        <div className="p-4 border-b border-white/[0.06] bg-white/[0.015] flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by city, country, or code (e.g. New York, London, IST)..."
              className="pl-9 text-xs h-9"
              autoFocus
            />
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              resetToDetected();
              onClose();
            }}
            className="w-full sm:w-auto text-xs h-9 gap-1.5 whitespace-nowrap"
            title={`Detected system timezone: ${detectedTimeZone}`}
          >
            <RotateCcw className="h-3 w-3" />
            Reset to Device ({getTimezoneShortCode(detectedTimeZone)})
          </Button>
        </div>

        {/* List of Timezones */}
        <div className="overflow-y-auto p-3 space-y-1.5 flex-1">
          {filtered.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground text-xs">
              No matching timezones found for "{search}".
            </div>
          ) : (
            filtered.map((tz) => {
              const isSelected = tz.id === timeZone;
              const offset = getTimezoneOffsetString(tz.id);
              const liveTime = getLiveTimePreview(tz.id);

              return (
                <button
                  key={tz.id}
                  onClick={() => {
                    setTimeZone(tz.id);
                    onClose();
                  }}
                  className={`w-full text-left p-3 rounded-xl border transition-all duration-150 flex items-center justify-between gap-3 ${
                    isSelected
                      ? 'bg-[#3e8bff]/15 border-[#3e8bff]/50 text-[#F2F4F8] shadow-[0_0_20px_rgba(62,139,255,0.15)] ring-1 ring-[#3e8bff]/30'
                      : 'border-white/[0.08] bg-white/[0.02] hover:bg-white/[0.05] text-[#8A8F9C] hover:text-[#F2F4F8]'
                  }`}
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-[#F2F4F8] truncate">
                        {tz.label}
                      </span>
                      {tz.id === detectedTimeZone && (
                        <Badge variant="secondary" className="text-[9px] px-1 py-0 border-white/[0.1] bg-white/[0.05] text-[#A0A5B1] font-mono">
                          Device
                        </Badge>
                      )}
                    </div>
                    <div className="text-[11px] text-[#8A8F9C] truncate mt-0.5">
                      {tz.city} • <span className="font-mono text-[10px]">{tz.id}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <div className="text-right">
                      <div className="flex items-center gap-1 font-mono text-xs font-bold text-[#F2F4F8]">
                        <Clock className="h-3 w-3 text-[#3e8bff]" />
                        {liveTime}
                      </div>
                      <div className="text-[10px] font-mono text-[#8A8F9C]">
                        {offset}
                      </div>
                    </div>

                    <div
                      className={`h-6 w-6 rounded-full flex items-center justify-center border transition-colors ${
                        isSelected
                          ? 'bg-[#3e8bff] border-[#3e8bff] text-white'
                          : 'border-white/[0.15] bg-white/[0.03] text-transparent'
                      }`}
                    >
                      <Check className="h-3.5 w-3.5 stroke-[2.5]" />
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-white/[0.08] bg-white/[0.015] flex items-center justify-between text-[11px] text-[#8A8F9C]">
          <span>Active: <strong className="text-[#F2F4F8]">{timeZone}</strong> ({getTimezoneOffsetString(timeZone)})</span>
          <Button size="sm" variant="ghost" onClick={onClose} className="h-7 text-xs hover:bg-white/[0.06] text-[#C6CBD5]">
            Done
          </Button>
        </div>
      </div>
    </div>
  );
};
