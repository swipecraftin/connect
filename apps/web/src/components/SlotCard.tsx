import React, { useState } from 'react';
import { Slot } from '../types/database';
import { useTimezone } from '../context/TimezoneContext';
import { useAlert } from '../context/AlertContext';
import { usePresence } from '../context/PresenceContext';
import { calculateUserKarma } from '../utils/karma';
import {
  Video,
  ShieldCheck,
  Trash2,
  Users,
  Award,
} from 'lucide-react';

interface SlotCardProps {
  slot: Slot;
  onRequestSlot: (slot: Slot) => void;
  onReviewApplicants?: (slot: Slot) => void;
  hasRequested?: boolean;
  isBookedByMe?: boolean;
  currentUserId?: string;
  onCancelSlot?: (slotId: string) => void;
  pendingRequestsCount?: number;
}

export const SlotCard: React.FC<SlotCardProps> = ({
  slot,
  onRequestSlot,
  onReviewApplicants,
  hasRequested = false,
  isBookedByMe = false,
  currentUserId,
  onCancelSlot,
  pendingRequestsCount = 0,
}) => {
  const { formatSlot } = useTimezone();
  const { showConfirm } = useAlert();
  const { isUserOnline } = usePresence();
  const [isCancelling, setIsCancelling] = useState(false);
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

  const handleCancel = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!onCancelSlot) return;
    const confirmed = await showConfirm({
      title: 'Withdraw Slot',
      message: 'Withdraw this open listing from the marketplace?',
      confirmText: 'Withdraw Slot',
      type: 'warning',
    });
    if (confirmed) {
      setIsCancelling(true);
      try {
        await onCancelSlot(slot.id);
      } finally {
        setIsCancelling(false);
      }
    }
  };

  return (
    <article
      onClick={() => {
        if (isMySlot && onReviewApplicants) {
          onReviewApplicants(slot);
        } else if (!isMySlot && !hasRequested) {
          onRequestSlot(slot);
        }
      }}
      className="group flex flex-col gap-4 sm:gap-4.5 p-5 sm:p-6 rounded-[20px] border border-white/[0.08] bg-[#0A0D14]/75 backdrop-blur-2xl shadow-[0_8px_32px_rgba(0,0,0,0.36),inset_0_1px_0_rgba(255,255,255,0.06)] hover:bg-[#0E121E]/85 hover:border-[#3E8BFF]/45 hover:shadow-[0_16px_48px_rgba(62,139,255,0.16),inset_0_1px_0_rgba(255,255,255,0.12)] transition-all duration-200 cursor-pointer select-none"
    >
      {/* Top Peer Info Strip */}
      <div className="flex items-start gap-3.5">
        <div className="relative shrink-0">
          {slot.creator?.avatar_url ? (
            <img
              src={slot.creator.avatar_url}
              alt={slot.creator.full_name}
              className="w-[42px] h-[42px] rounded-full object-cover border border-white/[0.08]"
            />
          ) : (
            <div className="w-[42px] h-[42px] rounded-full border border-white/[0.08] bg-gradient-to-br from-[#1e2434] to-[#0f1219] flex items-center justify-center font-mono text-xs text-[#B6BDC9]">
              {initials}
            </div>
          )}
          <span
            className={`absolute -right-[1px] -bottom-[1px] w-[11px] h-[11px] rounded-full border-2 border-[#0A0D14] transition-colors ${
              isOnline
                ? 'bg-[#34D399] shadow-[0_0_8px_rgba(52,211,153,0.9)]'
                : 'bg-[#61666F]'
            }`}
            title={isOnline ? 'Host is currently online' : 'Host is currently offline'}
          />
        </div>

        <div className="flex-1 min-w-0 flex flex-col gap-0.5">
          <div className="flex items-center gap-1.5">
            <span className="text-[14px] font-bold text-[#EDEFF4] truncate">
              {slot.creator?.full_name || 'Verified Peer'}
            </span>
            {/* Meta-grade Verified Geometric Badge */}
            <span title="Verified Peer Member" className="inline-flex items-center text-[#3e8bff] shrink-0">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" className="shrink-0">
                <path
                  d="M12 2L14.7 4.2L18.1 4.3L19.4 7.4L22.4 9.1L21.9 12.5L23.4 15.6L20.8 17.8L20.3 21.2L16.9 21.7L14.6 23.9L12 22.8L9.4 23.9L7.1 21.7L3.7 21.2L3.2 17.8L0.6 15.6L2.1 12.5L1.6 9.1L4.6 7.4L5.9 4.3L9.3 4.2L12 2Z"
                  fill="#3e8bff"
                  fillOpacity="0.2"
                  stroke="#3e8bff"
                  strokeWidth="1.5"
                  strokeLinejoin="round"
                />
                <path
                  d="M8.5 12.2L10.8 14.5L15.5 9.8"
                  stroke="#3e8bff"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </span>
            {isMySlot && (
              <span className="rounded bg-[#3e8bff]/15 text-[#8fb6ff] px-1.5 py-[0.5px] text-[9.5px] font-mono font-bold">
                You
              </span>
            )}
          </div>
          <span className="text-[11.5px] text-[#8A8F9C] truncate">
            {slot.creator?.headline || slot.target_experience || 'Software Engineer'}
          </span>
        </div>

        {/* Karma & Tier Badge */}
        <div className="shrink-0 flex items-center gap-1.5">
          <span
            className="font-mono text-[9.5px] px-1.5 py-[0.5px] rounded border font-semibold"
            style={{
              borderColor: `${karmaData.tierColor}45`,
              backgroundColor: `${karmaData.tierColor}15`,
              color: karmaData.tierColor,
            }}
          >
            {karmaData.tier}
          </span>
          <span className="font-mono text-[10px] px-2 py-0.5 rounded-[6px] border border-white/[0.08] text-[#9AA1AE] bg-white/[0.03] backdrop-blur-sm flex items-center gap-1">
            <Award className="w-3 h-3 text-amber-400/80 stroke-[1.75]" />
            <span>{karmaScore}</span>
            <span className="text-[#61666F]">Karma</span>
          </span>
        </div>
      </div>

      {/* Headline & Description */}
      <div className="space-y-1">
        <h3 className="m-0 text-[13.5px] font-semibold text-[#E8EAF0] leading-[1.45] line-clamp-1 group-hover:text-[#3e8bff] transition-colors">
          {slot.topic_title}
        </h3>
        {slot.topic_description && (
          <p className="m-0 text-xs text-[#8A8F9C] line-clamp-2 leading-relaxed">
            {slot.topic_description}
          </p>
        )}
      </div>

      {/* Reliability and Schedule Badges */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[6px] bg-emerald-500/[0.08] border border-emerald-500/25 backdrop-blur-sm">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 stroke-[1.75]" />
          <span className="font-mono text-[10.5px] text-emerald-300 font-semibold">
            {slot.creator?.reliability_score ?? 100}% reliable
          </span>
        </span>

        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[6px] border border-white/[0.08] bg-white/[0.03] backdrop-blur-sm">
          <Video className="w-3.5 h-3.5 text-[#8A8F9C] stroke-[1.75]" />
          <span className="font-mono text-[10.5px] text-[#AEB5C2]">
            45 min · {formatSlot(slot.start_time)}
          </span>
        </span>
      </div>

      {/* Skill Tags */}
      <div className="flex gap-1.5 flex-wrap">
        {slot.skills_tags && slot.skills_tags.length > 0 ? (
          slot.skills_tags.map((tag) => (
            <span
              key={tag}
              className="text-[11px] px-2.5 py-0.5 rounded-[6px] bg-white/[0.04] backdrop-blur-sm text-[#AEB5C2] border border-white/[0.06]"
            >
              {tag}
            </span>
          ))
        ) : (
          <span className="text-[11px] px-2.5 py-0.5 rounded-[6px] bg-white/[0.04] backdrop-blur-sm text-[#AEB5C2] border border-white/[0.06]">
            {slot.domain}
          </span>
        )}
      </div>

      {/* Action Footer */}
      <div className="flex items-center gap-2.5 mt-auto pt-2">
        {isMySlot ? (
          <div className="flex items-center gap-2 w-full">
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (onReviewApplicants) onReviewApplicants(slot);
              }}
              className={`flex-1 flex items-center justify-center gap-2 h-[40px] rounded-[10px] font-semibold text-[13px] transition-all duration-150 backdrop-blur-md ${
                pendingRequestsCount > 0
                  ? 'border border-[#3e8bff]/50 bg-[#3e8bff]/20 text-[#cfe0ff] hover:bg-[#3e8bff]/30 shadow-[0_0_18px_rgba(62,139,255,0.2)]'
                  : 'border border-white/[0.12] bg-white/[0.03] text-[#8A8F9C] hover:text-[#E8EAF0] hover:bg-white/[0.06]'
              }`}
            >
              <Users className="w-4 h-4 stroke-[1.75]" />
              <span>
                {pendingRequestsCount > 0
                  ? `Review Applicants (${pendingRequestsCount})`
                  : 'Awaiting Applicants'}
              </span>
            </button>
            {onCancelSlot && (
              <button
                onClick={handleCancel}
                disabled={isCancelling}
                className="h-[40px] px-3 rounded-[10px] border border-white/[0.08] bg-white/[0.02] hover:border-red-500/40 hover:bg-red-500/10 text-[#8A8F9C] hover:text-red-400 flex items-center justify-center transition-colors backdrop-blur-sm"
                title="Cancel and remove listing"
              >
                <Trash2 className="w-4 h-4 stroke-[1.75]" />
              </button>
            )}
          </div>
        ) : isBookedByMe ? (
          <span className="flex-1 flex items-center justify-center h-[40px] rounded-[10px] border border-emerald-500/35 bg-emerald-500/12 backdrop-blur-md text-emerald-300 text-[13px] font-semibold">
            Booked · Session Confirmed
          </span>
        ) : hasRequested ? (
          <span className="flex-1 flex items-center justify-center h-[40px] rounded-[10px] border border-white/[0.12] bg-white/[0.03] backdrop-blur-md text-[#8A8F9C] text-[13px] font-medium">
            Request Sent · Pending Host
          </span>
        ) : (
          <>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onRequestSlot(slot);
              }}
              className="flex-1 flex items-center justify-center gap-2 h-[40px] rounded-[10px] border border-[#3e8bff]/50 bg-[#3e8bff]/15 hover:bg-[#3e8bff]/25 text-[#cfe0ff] font-semibold text-[13px] transition-all shadow-[0_0_18px_rgba(62,139,255,0.2)] active:scale-[0.98] backdrop-blur-md"
            >
              <span>Request to Practice</span>
            </button>
            <span className="font-mono text-[10px] px-2 py-1 rounded-[5px] border border-white/[0.08] text-[#61666F] bg-white/[0.03] backdrop-blur-sm hidden sm:inline-block">
              B
            </span>
          </>
        )}
      </div>
    </article>
  );
};
