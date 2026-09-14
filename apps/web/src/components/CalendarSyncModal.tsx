import React from 'react';
import { Slot } from '../types/database';
import { useTimezone } from '../context/TimezoneContext';
import { getGoogleCalendarUrl } from '../utils/calendar';
import {
  Calendar,
  X,
  ExternalLink,
  Clock,
  Video,
  CheckCircle2,
} from 'lucide-react';

interface CalendarSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  slot: Slot | null;
  onConfirmSync: (slotId: string) => void;
  isAlreadySynced?: boolean;
}

export const CalendarSyncModal: React.FC<CalendarSyncModalProps> = ({
  isOpen,
  onClose,
  slot,
  onConfirmSync,
  isAlreadySynced = false,
}) => {
  const { formatSlot } = useTimezone();

  if (!isOpen || !slot) return null;

  const handleProceedGoogleCalendar = () => {
    const url = getGoogleCalendarUrl(slot);
    window.open(url, '_blank', 'noopener,noreferrer');
    onConfirmSync(slot.id);
    onClose();
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-[70] grid place-items-center p-4 bg-[#040507]/80 backdrop-blur-md animate-in fade-in duration-150"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-[490px] flex flex-col gap-4 p-5 rounded-[16px] border border-white/[0.12] bg-[#080B12]/92 backdrop-blur-2xl shadow-[0_24px_64px_rgba(0,0,0,0.8),inset_0_1px_0_rgba(255,255,255,0.08)] animate-in zoom-in-95 duration-200"
      >
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl border border-[#3e8bff]/30 bg-[#3e8bff]/10 flex items-center justify-center text-[#3e8bff] shrink-0">
              <Calendar className="w-5 h-5" />
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="font-sans font-bold text-[17px] tracking-[-0.02em] text-[#F2F4F8]">
                Sync to Google Calendar
              </span>
              <span className="text-[12px] text-[#8A8F9C]">
                Save session time, reminder alerts, and direct Google Meet link
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-6 h-6 rounded-md hover:bg-white/[0.08] text-[#8A8F9C] hover:text-[#F2F4F8] flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Session Card Info */}
        <div className="p-4 rounded-xl border border-white/[0.08] bg-white/[0.025] backdrop-blur-md flex flex-col gap-3">
          <div className="flex items-start justify-between gap-3">
            <span className="font-semibold text-[14.5px] text-[#F2F4F8] leading-snug">
              {slot.topic_title}
            </span>
            <span className="font-mono text-[10.5px] px-2 py-0.5 rounded bg-white/[0.06] border border-white/[0.08] text-[#8A8F9C] shrink-0">
              45 min
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-[#9FA6B3]">
            <div className="flex items-center gap-2">
              <Clock className="w-3.5 h-3.5 text-[#3e8bff] shrink-0" />
              <span className="font-mono text-[#E8EAF0]">{formatSlot(slot.start_time)}</span>
            </div>

            <div className="flex items-center gap-2 min-w-0">
              <Video className="w-3.5 h-3.5 text-[#34D399] shrink-0" />
              <a
                href={slot.meeting_url}
                target="_blank"
                rel="noopener noreferrer"
                className="truncate text-[#9cc0ff] hover:underline"
              >
                {slot.meeting_url}
              </a>
            </div>
          </div>

          {/* Meeting Briefing Details */}
          <div className="mt-1 pt-2.5 border-t border-white/[0.06] flex flex-col gap-2 text-xs">
            <div className="flex items-center justify-between text-[11px] text-[#8A8F9C]">
              <span>Domain: <strong className="text-[#E8EAF0] font-normal">{slot.domain}</strong></span>
              <span>Level: <strong className="text-[#E8EAF0] font-normal">{slot.target_experience}</strong></span>
            </div>

            <div className="p-2.5 rounded-lg bg-white/[0.02] border border-white/[0.05] text-[11px] text-[#8A8F9C] flex flex-col gap-1 leading-relaxed">
              <span className="font-medium text-[#C6CBD5] text-[11.5px]">Session Briefing & Agenda:</span>
              <span>• 00–05m: Intro, problem setup & scope alignment</span>
              <span>• 05–35m: Live problem solving, architecture design or coding</span>
              <span>• 35–45m: Rubric calibration & structured constructive feedback</span>
              {slot.topic_description && (
                <span className="mt-1 pt-1 border-t border-white/[0.04] text-[#A0A5B1] italic">
                  "{slot.topic_description}"
                </span>
              )}
            </div>
          </div>
        </div>

        {isAlreadySynced && (
          <div className="flex items-center gap-2 p-2.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 text-emerald-300 text-xs">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-[#34D399]" />
            <span>This session was already added to your calendar. You can re-open to sync again.</span>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-white/[0.08]">
          <button
            type="button"
            onClick={onClose}
            className="h-[34px] px-4 rounded-lg border border-white/[0.08] hover:border-white/[0.18] bg-transparent text-[#C6CBD5] text-xs font-medium transition-colors"
          >
            Maybe Later
          </button>

          <button
            type="button"
            onClick={handleProceedGoogleCalendar}
            className="h-[34px] px-4 rounded-lg border border-[#3e8bff]/50 bg-[#3e8bff]/15 hover:bg-[#3e8bff]/25 text-[#cfe0ff] text-xs font-semibold flex items-center gap-2 transition-all active:scale-[0.97]"
          >
            <span>Proceed to Google Calendar</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
