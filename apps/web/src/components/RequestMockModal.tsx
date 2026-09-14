import React, { useState } from 'react';
import { Slot, Profile } from '../types/database';
import { useTimezone } from '../context/TimezoneContext';
import { useAlert } from '../context/AlertContext';
import {
  Send,
  X,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';

interface RequestMockModalProps {
  isOpen: boolean;
  onClose: () => void;
  slot: Slot | null;
  applicant?: Profile | null;
  onSubmitRequest: (slotId: string, message: string) => Promise<void>;
}

export const RequestMockModal: React.FC<RequestMockModalProps> = ({
  isOpen,
  onClose,
  slot,
  onSubmitRequest,
}) => {
  const { formatSlot } = useTimezone();
  const { showAlert } = useAlert();
  const [message, setMessage] = useState(
    "Hi! I'm preparing for upcoming tech rounds and would value practicing together. I will come prepared and provide rubric-based feedback."
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen || !slot) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await onSubmitRequest(slot.id, message.trim());
      onClose();
    } catch (err: any) {
      await showAlert({
        title: 'Request Error',
        message: err.message || 'Error submitting request',
        type: 'danger',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getInitials = (name: string) => {
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return (name.slice(0, 2) || 'PM').toUpperCase();
  };

  const hostName = slot.creator?.full_name || 'Verified Peer';
  const hostInitials = getInitials(hostName);
  const hostRole = slot.creator?.headline || slot.target_experience;
  const hostRel = slot.creator?.reliability_score || 99;

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 grid place-items-center p-4 bg-[#040507]/80 backdrop-blur-md animate-in fade-in duration-150"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        data-lenis-prevent="true"
        className="w-full max-w-[500px] flex flex-col gap-4 p-5 sm:p-6 rounded-[16px] border border-white/[0.12] bg-[#080B12]/92 backdrop-blur-2xl shadow-[0_30px_80px_rgba(0,0,0,0.85),inset_0_1px_0_rgba(255,255,255,0.08)] animate-in zoom-in-95 duration-200"
      >
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <span className="font-sans font-bold text-[17px] tracking-[-0.02em] text-[#F2F4F8]">
                Request to Practice
              </span>
              <span className="font-mono text-[10px] px-2 py-0.5 rounded-[4px] border border-[#3e8bff]/40 bg-[#3e8bff]/12 text-[#9cc0ff]">
                Zero Platform Fees
              </span>
            </div>
            <span className="text-[12px] text-[#8A8F9C] leading-relaxed">
              Send an invite to {hostName}. When accepted, your Google Meet room and calendar invite are confirmed.
            </span>
          </div>
          <button
            onClick={onClose}
            className="w-6 h-6 rounded-md hover:bg-white/[0.08] text-[#8A8F9C] hover:text-[#F2F4F8] flex items-center justify-center transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Slot Context Preview */}
        <div className="p-3.5 rounded-xl border border-white/[0.08] bg-white/[0.03] backdrop-blur-md shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] flex flex-col gap-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full border border-white/[0.08] bg-gradient-to-br from-[#1e2434] to-[#0f1219] flex items-center justify-center font-mono text-[9.5px] text-[#B6BDC9]">
                {hostInitials}
              </div>
              <div className="flex flex-col">
                <span className="text-[12px] font-semibold text-[#E8EAF0]">
                  {hostName}
                </span>
                <span className="text-[10px] text-[#8A8F9C]">
                  {hostRole}
                </span>
              </div>
            </div>
            <span className="font-mono text-[10.5px] text-emerald-400 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 stroke-[1.75]" />
              {hostRel}% reliable
            </span>
          </div>

          <div className="flex flex-col gap-0.5">
            <span className="text-[13px] font-semibold text-[#F2F4F8]">
              {slot.topic_title}
            </span>
            <span className="text-[11px] text-[#8A8F9C]">
              {slot.domain} · {slot.target_experience}
            </span>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-white/[0.06] font-mono text-[11px] text-[#AEB5C2]">
            <span>{formatSlot(slot.start_time)}</span>
            <span>45 minutes · Google Meet</span>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-3 text-xs">
          <div className="flex flex-col gap-1.5">
            <label className="font-mono text-[10px] uppercase tracking-wider text-[#8A8F9C]">
              Note to host (brief intro & goals)
            </label>
            <textarea
              rows={3}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="p-3 rounded-lg border border-white/[0.08] bg-white/[0.03] backdrop-blur-md shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] text-[#E8EAF0] text-xs focus:outline-none focus:bg-[#0A0D14]/90 focus:border-[#3e8bff]/60 transition-colors leading-relaxed"
              required
            />
          </div>

          <div className="p-3 rounded-lg border border-white/[0.06] bg-white/[0.02] backdrop-blur-sm flex items-start gap-2.5 text-[11px] text-[#8A8F9C]">
            <Sparkles className="w-4 h-4 text-[#3e8bff] shrink-0 mt-0.5 stroke-[1.75]" />
            <span>
              By requesting, you commit to attending promptly and providing constructive peer feedback. Practice with intent to elevate your skills and empower your peer.
            </span>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/[0.06]">
            <button
              type="button"
              onClick={onClose}
              className="h-[32px] px-3.5 rounded-lg border border-white/[0.08] hover:border-white/[0.18] bg-white/[0.02] text-[#C6CBD5] text-xs font-medium flex items-center gap-1.5 transition-colors"
            >
              <span>Cancel</span>
              <kbd className="font-mono text-[9.5px] text-[#61666F]">esc</kbd>
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="h-[32px] px-4 rounded-lg border border-[#3e8bff]/55 bg-[#3e8bff]/15 hover:bg-[#3e8bff]/25 text-[#cfe0ff] text-xs font-semibold flex items-center gap-1.5 transition-all active:scale-[0.97] backdrop-blur-md shadow-[0_0_14px_rgba(62,139,255,0.16)]"
            >
              <Send className="w-3 h-3 text-[#3e8bff] stroke-[1.75]" />
              <span>{isSubmitting ? 'Sending...' : 'Send Request'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
