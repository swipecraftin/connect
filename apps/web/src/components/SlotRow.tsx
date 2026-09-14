import React from 'react';
import { Slot } from '../types/database';
import { useTimezone } from '../context/TimezoneContext';
import { usePresence } from '../context/PresenceContext';
import { calculateUserKarma } from '../utils/karma';

interface SlotRowProps {
  slot: Slot;
  onRequestSlot: (slot: Slot) => void;
  onReviewApplicants?: (slot: Slot) => void;
  hasRequested?: boolean;
  isBookedByMe?: boolean;
  currentUserId?: string;
  onCancelSlot?: (slotId: string) => void;
  pendingRequestsCount?: number;
  isSelected?: boolean;
  onSelect?: () => void;
}

export const SlotRow: React.FC<SlotRowProps> = ({
  slot,
  onRequestSlot,
  onReviewApplicants,
  hasRequested = false,
  isBookedByMe = false,
  currentUserId,
  pendingRequestsCount = 0,
  isSelected = false,
  onSelect,
}) => {
  const { formatSlot } = useTimezone();
  const { isUserOnline } = usePresence();
  const isMySlot = Boolean(currentUserId && slot.creator_id === currentUserId);
  const isOnline = isUserOnline(slot.creator_id);

  const initials = slot.creator?.full_name
    ? slot.creator.full_name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .slice(0, 2)
        .toUpperCase()
    : 'PM';

  const karmaData = calculateUserKarma(slot.creator || null, [], slot.creator_id);
  const karmaScore = karmaData.karmaScore;

  return (
    <div
      onClick={onSelect}
      className={`grid grid-cols-1 md:grid-cols-[minmax(0,1.3fr)_minmax(0,1.7fr)_92px_138px_78px_110px] gap-3.5 md:gap-4 items-center px-5 py-3.5 rounded-xl border border-transparent hover:border-white/[0.06] transition-colors cursor-pointer select-none ${
        isSelected
          ? 'bg-[#3e8bff]/[0.09] shadow-[inset_2px_0_0_#3e8bff]'
          : 'hover:bg-white/[0.028] bg-transparent'
      }`}
    >
      {/* Col 1: Peer Name & Initials */}
      <div className="flex items-center gap-3 min-w-0">
        <div className="relative shrink-0">
          {slot.creator?.avatar_url ? (
            <img
              src={slot.creator.avatar_url}
              alt={slot.creator.full_name}
              className="w-[28px] h-[28px] rounded-full object-cover border border-white/[0.08]"
            />
          ) : (
            <div className="w-[28px] h-[28px] rounded-full border border-white/[0.08] bg-gradient-to-br from-[#1e2434] to-[#0f1219] flex items-center justify-center font-mono text-[9.5px] text-[#B6BDC9]">
              {initials}
            </div>
          )}
          <span
            className={`absolute -right-[1px] -bottom-[1px] w-[7px] h-[7px] rounded-full border-[1.5px] border-[#0E1015] transition-colors ${
              isOnline ? 'bg-[#34D399]' : 'bg-[#61666F]'
            }`}
            title={isOnline ? 'Host is currently online' : 'Host is currently offline'}
          />
        </div>
        <span className="text-[12.5px] font-semibold text-[#E8EAF0] truncate">
          {slot.creator?.full_name || 'Verified Peer'}
        </span>
        <span className="text-[11px] text-[#61666F] truncate hidden sm:inline">
          {slot.domain}
        </span>
        {isMySlot && (
          <span className="rounded bg-[#3e8bff]/15 text-[#8fb6ff] px-1 py-[0.5px] text-[8.5px] font-mono font-bold">
            You
          </span>
        )}
      </div>

      {/* Col 2: Focus Topic */}
      <span className="text-[12.5px] text-[#B8BEC9] truncate">
        {slot.topic_title}
      </span>

      {/* Col 3: Reliability */}
      <span className="font-mono text-[11px] text-[#6EE7B7] hidden md:inline">
        {slot.creator?.reliability_score ?? 100}%
      </span>

      {/* Col 4: Slot Timing */}
      <span className="font-mono text-[11px] text-[#AEB5C2] truncate hidden md:inline">
        {formatSlot(slot.start_time)}
      </span>

      {/* Col 5: Karma */}
      <span className="font-mono text-[11px] text-[#9AA1AE] hidden md:inline-flex items-center gap-1">
        <span className="text-amber-400/80">★</span>
        <span>{karmaScore}</span>
        <span className="text-[#61666F]">Karma</span>
      </span>

      {/* Col 6: Action Button */}
      <div className="justify-self-end w-full md:w-auto flex justify-end">
        {isMySlot ? (
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (onReviewApplicants) onReviewApplicants(slot);
            }}
            className="h-[32px] px-3 rounded-[8px] border border-[#3e8bff]/45 bg-[#3e8bff]/15 text-[#cfe0ff] text-xs font-semibold hover:bg-[#3e8bff]/25 transition-all whitespace-nowrap backdrop-blur-sm shadow-xs"
          >
            {pendingRequestsCount > 0 ? `Applicants (${pendingRequestsCount})` : 'Awaiting'}
          </button>
        ) : isBookedByMe ? (
          <span className="h-[32px] px-3 rounded-[8px] border border-emerald-500/30 bg-emerald-500/10 text-emerald-300 text-xs font-semibold flex items-center backdrop-blur-sm">
            Confirmed
          </span>
        ) : hasRequested ? (
          <span className="h-[32px] px-3 rounded-[8px] border border-white/[0.08] bg-white/[0.03] text-[#8A8F9C] text-xs font-medium flex items-center backdrop-blur-sm">
            Requested
          </span>
        ) : (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onRequestSlot(slot);
            }}
            className="h-[32px] px-3.5 rounded-[8px] border border-[#3e8bff]/50 bg-[#3e8bff]/15 hover:bg-[#3e8bff]/25 text-[#cfe0ff] text-xs font-semibold transition-all whitespace-nowrap active:scale-[0.98] backdrop-blur-sm shadow-[0_0_14px_rgba(62,139,255,0.16)]"
          >
            Request
          </button>
        )}
      </div>
    </div>
  );
};
