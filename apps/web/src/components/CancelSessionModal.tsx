import React, { useState, useEffect } from 'react';
import { Slot } from '../types/database';
import { useTimezone } from '../context/TimezoneContext';
import {
  AlertTriangle,
  X,
  Clock,
  RotateCcw,
  User,
  XCircle,
  MessageSquare,
  Trash2,
} from 'lucide-react';

interface CancelSessionModalProps {
  isOpen: boolean;
  onClose: () => void;
  slot: Slot | null;
  currentUserId?: string;
  onConfirmCancel: (
    slotId: string,
    reason: string,
    returnToFeed: boolean,
    isLate: boolean
  ) => Promise<void>;
}

const BOOKED_CANCEL_REASONS = [
  'Sudden work / emergency conflict',
  'Need more preparation time for this topic',
  'Want to reschedule to a different time slot',
  'Personal schedule conflict',
  'Technical difficulties with mic / webcam setup',
];

const OPEN_DELETE_REASONS = [
  'Need to reschedule to a different time slot',
  'No longer available for this practice session',
  'Changing topic or interview format',
  'Schedule conflict arose',
];

export const CancelSessionModal: React.FC<CancelSessionModalProps> = ({
  isOpen,
  onClose,
  slot,
  currentUserId,
  onConfirmCancel,
}) => {
  const { formatSlot } = useTimezone();
  const isOpenSlot = slot?.status === 'open';
  const presets = isOpenSlot ? OPEN_DELETE_REASONS : BOOKED_CANCEL_REASONS;

  const [selectedPreset, setSelectedPreset] = useState(presets[0]);
  const [customReason, setCustomReason] = useState('');
  const [returnToFeed, setReturnToFeed] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen && slot) {
      document.body.style.overflow = 'hidden';
      const initialPresets = slot.status === 'open' ? OPEN_DELETE_REASONS : BOOKED_CANCEL_REASONS;
      setSelectedPreset(initialPresets[0]);
      setCustomReason('');
      // If booked, default to reopening slot for other peers; if open, delete entirely (never return to feed)
      setReturnToFeed(slot.status === 'booked');
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen, slot]);

  if (!isOpen || !slot) return null;

  const now = Date.now();
  const startTime = new Date(slot.start_time).getTime();
  const hoursUntilStart = (startTime - now) / (1000 * 60 * 60);
  const isLate = slot.status === 'booked' && hoursUntilStart > 0 && hoursUntilStart < 2;
  const isHost = currentUserId ? slot.creator_id === currentUserId : true;
  const peer = isHost ? slot.participant : slot.creator;
  const peerName = peer?.full_name || (isHost ? 'Matched Candidate' : 'Session Host');

  const finalReason = customReason.trim() || selectedPreset;

  const handleConfirm = async () => {
    setIsSubmitting(true);
    try {
      // For open slots, returnToFeed MUST be false to permanently delete from feed and listings
      // When candidate cancels, returnToFeed is ALWAYS true so host's slot returns to feed automatically
      const willReturnToFeed = isOpenSlot ? false : (!isHost ? true : returnToFeed);
      await onConfirmCancel(slot.id, finalReason, willReturnToFeed, isLate);
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      onClick={onClose}
      data-lenis-prevent="true"
      className="fixed inset-0 z-[70] grid place-items-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-150 overscroll-contain"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        data-lenis-prevent="true"
        className="w-full max-w-[520px] flex flex-col gap-3.5 p-4 sm:p-6 rounded-[16px] border border-white/[0.12] bg-[#080B12]/92 backdrop-blur-2xl shadow-[0_30px_80px_rgba(0,0,0,0.85),inset_0_1px_0_rgba(255,255,255,0.08)] max-h-[92vh] overflow-hidden overscroll-contain animate-in zoom-in-95 duration-200"
      >
        {/* Header */}
        <div className="shrink-0 flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div
              className={`w-9 h-9 rounded-xl border flex items-center justify-center shrink-0 backdrop-blur-sm ${
                isOpenSlot
                  ? 'border-red-500/30 bg-red-500/10 text-red-400'
                  : 'border-amber-500/30 bg-amber-500/10 text-amber-400'
              }`}
            >
              {isOpenSlot ? <Trash2 className="w-5 h-5 stroke-[1.75]" /> : <AlertTriangle className="w-5 h-5 stroke-[1.75]" />}
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="font-sans font-bold text-[16px] sm:text-[17px] tracking-[-0.02em] text-[#F2F4F8]">
                {isOpenSlot ? 'Delete Practice Slot Listing' : 'Cancel Practice Session'}
              </span>
              <span className="text-[11.5px] sm:text-[12px] text-[#8A8F9C]">
                {isOpenSlot
                  ? 'Permanently remove this open slot from the marketplace'
                  : `Notify ${peerName} and update your schedule`}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-md hover:bg-white/[0.08] text-[#8A8F9C] hover:text-[#F2F4F8] flex items-center justify-center transition-colors shrink-0 ml-2"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Content Body */}
        <div className="flex flex-col gap-3.5 overflow-y-auto flex-1 pr-1 overscroll-contain" data-lenis-prevent="true">
          {/* Target Session Strip */}
          <div className="p-3.5 rounded-xl border border-white/[0.08] bg-white/[0.03] backdrop-blur-md shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] flex flex-col gap-2">
            <span className="font-semibold text-[14px] text-[#F2F4F8]">
              {slot.topic_title}
            </span>
            <div className="flex items-center justify-between text-xs text-[#8A8F9C] flex-wrap gap-2">
              <div className="flex items-center gap-1.5 font-mono text-[#E8EAF0]">
                <Clock className="w-3.5 h-3.5 text-[#3e8bff] stroke-[1.75]" />
                <span>{formatSlot(slot.start_time)}</span>
              </div>
              {!isOpenSlot && (
                <div className="flex items-center gap-1.5 text-[#AEB5C2]">
                  <User className="w-3.5 h-3.5 text-emerald-400 stroke-[1.75]" />
                  <span>Partner: <strong className="text-[#F2F4F8] font-medium">{peerName}</strong></span>
                </div>
              )}
              {isOpenSlot && (
                <span className="font-mono text-[10.5px] px-2 py-0.5 rounded bg-white/[0.06] text-[#A0A5B1]">
                  Unbooked Open Listing
                </span>
              )}
            </div>
          </div>

          {/* Late Penalty Alert if < 2 hours for booked session */}
          {isLate && (
            <div className="p-3 rounded-xl border border-red-500/40 bg-red-500/10 text-red-300 text-xs flex items-start gap-2.5 leading-relaxed backdrop-blur-sm">
              <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5 stroke-[1.75]" />
              <div>
                <strong className="font-semibold text-red-200">Late Cancellation Penalty Warning:</strong>
                <p className="mt-0.5 text-red-300/90 text-[11.5px]">
                  This session starts in less than 2 hours. Cancelling now will deduct <strong>25 Karma</strong> from your account and register a penalty strike per community standards.
                </p>
              </div>
            </div>
          )}

          {/* Cancellation / Deletion Reason Selection */}
          <div className="flex flex-col gap-2">
            <label className="font-mono text-[11px] uppercase tracking-wider text-[#8A8F9C] flex items-center gap-1.5">
              <MessageSquare className="w-3 h-3 text-[#3e8bff] stroke-[1.75]" />
              <span>{isOpenSlot ? 'Reason for Removing Listing' : 'Cancellation Note for Peer'}</span>
            </label>
            <div className="flex flex-col gap-1.5">
              {presets.map((preset, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setSelectedPreset(preset);
                    setCustomReason('');
                  }}
                  className={`text-left px-3 py-2 rounded-lg border text-xs transition-colors backdrop-blur-sm ${
                    selectedPreset === preset && !customReason
                      ? 'border-[#3e8bff]/50 bg-[#3e8bff]/15 text-[#cfe0ff] shadow-xs'
                      : 'border-white/[0.06] bg-white/[0.03] text-[#8A8F9C] hover:text-[#E8EAF0] hover:bg-white/[0.06]'
                  }`}
                >
                  {preset}
                </button>
              ))}
            </div>

            <textarea
              rows={2}
              value={customReason}
              onChange={(e) => setCustomReason(e.target.value)}
              placeholder={
                isOpenSlot
                  ? 'Or specify why you are deleting this slot...'
                  : 'Or write a custom courteous note to your peer partner...'
              }
              className="w-full mt-1 p-2.5 rounded-lg border border-white/[0.08] bg-white/[0.03] backdrop-blur-md shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] text-[#E8EAF0] text-xs focus:outline-none focus:bg-[#0A0D14]/90 focus:border-[#3e8bff]/60 leading-relaxed"
            />
          </div>

          {/* Return to Feed Toggle — ONLY shown for booked sessions when user is HOST */}
          {!isOpenSlot && isHost && (
            <div className="p-3 rounded-xl border border-white/[0.08] bg-white/[0.03] backdrop-blur-md shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] flex items-center justify-between gap-3">
              <div className="flex items-start gap-2.5">
                <RotateCcw className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5 stroke-[1.75]" />
                <div className="flex flex-col gap-0.5">
                  <span className="text-[12.5px] font-semibold text-[#F2F4F8]">
                    Show interview back in marketplace feed
                  </span>
                  <span className="text-[11px] text-[#8A8F9C] leading-snug">
                    Restores the slot to open status so new peers can request and practice.
                  </span>
                </div>
              </div>
              <input
                type="checkbox"
                checked={returnToFeed}
                onChange={(e) => setReturnToFeed(e.target.checked)}
                className="h-4 w-4 rounded accent-[#3e8bff] cursor-pointer"
              />
            </div>
          )}

          {/* Auto-restore notice for participant/candidate */}
          {!isOpenSlot && !isHost && (
            <div className="p-3 rounded-xl border border-emerald-500/25 bg-emerald-500/5 backdrop-blur-md flex items-start gap-2.5">
              <RotateCcw className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5 stroke-[1.75]" />
              <div className="flex flex-col gap-0.5">
                <span className="text-[12.5px] font-semibold text-[#6EE7B7]">
                  Automatic Marketplace Feed Restoration
                </span>
                <span className="text-[11px] text-[#8A8F9C] leading-snug">
                  This session will be removed from your schedule and automatically restored to the marketplace feed so another peer can practice with the host.
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Modal Actions (Sticky Footer) */}
        <div className="shrink-0 flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2.5 pt-3 border-t border-white/[0.08]">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto h-[36px] px-4 rounded-lg border border-white/[0.08] hover:border-white/[0.18] bg-white/[0.02] text-[#C6CBD5] text-xs font-medium transition-colors"
          >
            {isOpenSlot ? 'Keep Listing' : 'Keep Session'}
          </button>
          <button
            type="button"
            disabled={isSubmitting}
            onClick={handleConfirm}
            className={`w-full sm:w-auto h-[36px] px-4 rounded-lg border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all active:scale-[0.97] backdrop-blur-md ${
              isOpenSlot
                ? 'border-red-500/50 bg-red-500/20 hover:bg-red-500/30 text-red-300 shadow-[0_0_14px_rgba(239,68,68,0.2)]'
                : isLate
                ? 'border-red-500/50 bg-red-500/20 hover:bg-red-500/30 text-red-300 shadow-[0_0_14px_rgba(239,68,68,0.2)]'
                : 'border-amber-500/50 bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 shadow-[0_0_14px_rgba(245,158,11,0.2)]'
            }`}
          >
            {isOpenSlot ? (
              <>
                <Trash2 className="w-3.5 h-3.5 stroke-[1.75]" />
                <span>{isSubmitting ? 'Deleting...' : 'Delete from Marketplace'}</span>
              </>
            ) : (
              <>
                <XCircle className="w-3.5 h-3.5 stroke-[1.75]" />
                <span>
                  {isSubmitting
                    ? 'Cancelling...'
                    : isLate
                    ? 'Confirm Late Cancellation'
                    : 'Confirm Cancellation'}
                </span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
