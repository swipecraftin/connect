import React, { useEffect } from 'react';
import { AlertTriangle, Clock, RotateCcw, X, Compass } from 'lucide-react';
import { useTimezone } from '../context/TimezoneContext';

export interface PeerCancellationData {
  cancellingUserName: string;
  topicTitle: string;
  startTime?: string;
  reason?: string;
  reOpened?: boolean;
}

interface PeerCancellationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onBrowseMarketplace: () => void;
  data: PeerCancellationData | null;
}

export const PeerCancellationModal: React.FC<PeerCancellationModalProps> = ({
  isOpen,
  onClose,
  onBrowseMarketplace,
  data,
}) => {
  const { formatSlot } = useTimezone();

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen || !data) return null;

  return (
    <div
      onClick={onClose}
      data-lenis-prevent="true"
      className="fixed inset-0 z-[80] grid place-items-center p-4 bg-[#040507]/85 backdrop-blur-md animate-in fade-in duration-150 overscroll-contain"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        data-lenis-prevent="true"
        className="w-full max-w-[500px] flex flex-col gap-4 p-5 sm:p-6 rounded-[16px] border border-amber-500/30 bg-[#080B12]/92 backdrop-blur-2xl shadow-[0_24px_64px_rgba(0,0,0,0.85),inset_0_1px_0_rgba(255,255,255,0.08)] animate-in zoom-in-95 duration-200"
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl border border-amber-500/40 bg-amber-500/15 flex items-center justify-center text-amber-400 shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div className="flex flex-col gap-0.5">
              <div className="flex items-center gap-2">
                <span className="font-sans font-bold text-[17px] tracking-[-0.02em] text-[#F2F4F8]">
                  Session Cancelled
                </span>
                <span className="font-mono text-[10px] px-2 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300">
                  Partner Notice
                </span>
              </div>
              <span className="text-[12px] text-[#8A8F9C]">
                <strong className="text-[#E8EAF0]">{data.cancellingUserName}</strong> was unable to attend and cancelled this session.
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-md hover:bg-white/[0.08] text-[#8A8F9C] hover:text-[#F2F4F8] flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Target Session Details */}
        <div className="p-3.5 rounded-xl border border-white/[0.08] bg-white/[0.025] backdrop-blur-md flex flex-col gap-2">
          <span className="font-semibold text-[14px] text-[#F2F4F8]">
            {data.topicTitle}
          </span>
          {data.startTime && (
            <div className="flex items-center gap-1.5 font-mono text-xs text-[#8A8F9C]">
              <Clock className="w-3.5 h-3.5 text-[#3e8bff]" />
              <span className="text-[#E8EAF0]">{formatSlot(data.startTime)}</span>
            </div>
          )}
        </div>

        {/* Cancellation Reason Note */}
        <div className="p-3.5 rounded-xl border border-amber-500/30 bg-amber-500/10 backdrop-blur-md flex flex-col gap-1.5">
          <span className="font-mono text-[10.5px] uppercase tracking-wider text-amber-300/80 font-semibold">
            Note from {data.cancellingUserName}:
          </span>
          <p className="text-xs text-[#F2F4F8] italic leading-relaxed whitespace-pre-wrap">
            "{data.reason || 'A schedule conflict arose.'}"
          </p>
        </div>

        {/* Status notice */}
        <div className="p-3 rounded-xl border border-white/[0.08] bg-white/[0.02] backdrop-blur-md flex items-center gap-2.5 text-xs text-[#8A8F9C]">
          <RotateCcw className="w-4 h-4 text-[#34D399] shrink-0" />
          <span>
            {data.reOpened
              ? 'This slot has been reopened to the live marketplace feed so other peers can practice.'
              : 'This session has been removed from your active schedule.'}
          </span>
        </div>

        {/* Modal Actions */}
        <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-white/[0.08]">
          <button
            type="button"
            onClick={onClose}
            className="h-[34px] px-4 rounded-lg border border-white/[0.08] hover:border-white/[0.18] bg-transparent text-[#C6CBD5] text-xs font-medium transition-colors"
          >
            Dismiss
          </button>
          <button
            type="button"
            onClick={() => {
              onClose();
              onBrowseMarketplace();
            }}
            className="h-[34px] px-4 rounded-lg border border-[#3e8bff]/40 bg-[#3e8bff]/15 hover:bg-[#3e8bff]/25 text-[#cfe0ff] text-xs font-semibold flex items-center gap-1.5 transition-all active:scale-[0.97]"
          >
            <Compass className="w-3.5 h-3.5 text-[#3e8bff]" />
            <span>Find Another Practice Session</span>
          </button>
        </div>
      </div>
    </div>
  );
};
