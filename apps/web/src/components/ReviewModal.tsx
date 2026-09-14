import React, { useState } from 'react';
import { Slot } from '../types/database';
import {
  X,
  Star,
  ThumbsUp,
  AlertTriangle,
  ShieldCheck,
  Sparkles,
  CheckCircle2,
} from 'lucide-react';

interface ReviewModalProps {
  slot: Slot;
  isOpen: boolean;
  onClose: () => void;
  onSubmitReview: (reviewData: {
    attended: boolean;
    communication: number;
    technical: number;
    structure: number;
    feedback: string;
  }) => void;
}

const QUICK_FEEDBACK_TAGS = [
  'Clear & concise communication',
  'Structured problem breakdown',
  'Strong algorithmic depth',
  'Great trade-off analysis',
  'Effective time management',
  'Deep system design intuition',
  'Needs deeper edge-case coverage',
  'Recommend clarifying constraints early',
];

export const ReviewModal: React.FC<ReviewModalProps> = ({
  slot,
  isOpen,
  onClose,
  onSubmitReview,
}) => {
  const [attended, setAttended] = useState(true);
  const [communication, setCommunication] = useState(5);
  const [technical, setTechnical] = useState(5);
  const [structure, setStructure] = useState(5);
  const [feedback, setFeedback] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setTimeout(() => {
      onSubmitReview({
        attended,
        communication,
        technical,
        structure,
        feedback,
      });
      setSubmitting(false);
      onClose();
    }, 400);
  };

  const handleAddTag = (tag: string) => {
    if (feedback.includes(tag)) return;
    setFeedback((prev) => (prev.trim() ? `${prev.trim()}. ${tag}` : tag));
  };

  const renderStarRating = (
    label: string,
    value: number,
    setValue: (val: number) => void
  ) => (
    <div className="flex items-center justify-between py-1">
      <span className="font-medium text-xs text-[#E8EAF0]">{label}</span>
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => setValue(star)}
            className="p-1 hover:scale-125 transition-transform"
          >
            <Star
              className={`h-4 w-4 transition-colors ${
                star <= value
                  ? 'fill-amber-400 text-amber-400'
                  : 'text-white/20'
              }`}
            />
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 grid place-items-center p-4 bg-[#040507]/80 backdrop-blur-md animate-in fade-in duration-150"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-[500px] flex flex-col gap-3.5 p-4 sm:p-6 rounded-[16px] border border-white/[0.12] bg-[#080B12]/92 backdrop-blur-2xl shadow-[0_24px_64px_rgba(0,0,0,0.8),inset_0_1px_0_rgba(255,255,255,0.08)] max-h-[92vh] overflow-hidden animate-in zoom-in-95 duration-200"
      >
        {/* Header */}
        <div className="shrink-0 flex items-start justify-between">
          <div className="flex flex-col gap-1">
            <span className="font-sans font-bold text-[16px] sm:text-[17px] tracking-[-0.02em] text-[#F2F4F8]">
              Peer Evaluation & Mutual Feedback
            </span>
            <span className="text-[11.5px] sm:text-[12px] text-[#8A8F9C] truncate max-w-[380px]">
              Session: "{slot.topic_title}"
            </span>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-md hover:bg-white/[0.08] text-[#8A8F9C] hover:text-[#F2F4F8] flex items-center justify-center transition-colors shrink-0 ml-2"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden text-xs">
          <div className="flex flex-col gap-3.5 overflow-y-auto flex-1 pr-1 overscroll-contain">
            {/* Importance & Profile Calibration Notice */}
            <div className="p-3 rounded-xl border border-[#3e8bff]/30 bg-[#3e8bff]/10 backdrop-blur-md flex items-start gap-2.5 text-xs text-[#cfe0ff] leading-relaxed">
              <ShieldCheck className="w-4 h-4 text-[#3e8bff] shrink-0 mt-0.5" />
              <div className="flex flex-col gap-0.5">
                <span className="font-semibold text-[12px] text-[#F2F4F8]">
                  Why this review is critical:
                </span>
                <span className="text-[11.5px] text-[#A6BDDC]">
                  Mutual feedback immediately calibrates your peer's profile reliability score, increments completed sessions in the database, and awards you +1 Interview Credit to keep the platform 100% free.
                </span>
              </div>
            </div>
          {/* Attendance Check */}
          <div className="flex flex-col gap-1.5">
            <span className="font-mono text-[10px] uppercase tracking-wider text-[#8A8F9C]">
              Did your peer attend the session?
            </span>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setAttended(true)}
                className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg border text-xs font-semibold transition-all ${
                  attended
                    ? 'border-emerald-500/50 bg-emerald-500/15 text-[#6EE7B7] shadow-xs'
                    : 'border-white/[0.08] bg-white/[0.02] text-[#8A8F9C] hover:text-[#E8EAF0]'
                }`}
              >
                <ThumbsUp className="w-3.5 h-3.5 text-[#34D399]" />
                <span>Yes, Met as Scheduled</span>
              </button>
              <button
                type="button"
                onClick={() => setAttended(false)}
                className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg border text-xs font-semibold transition-all ${
                  !attended
                    ? 'border-red-500/50 bg-red-500/15 text-red-300 shadow-xs'
                    : 'border-white/[0.08] bg-white/[0.02] text-[#8A8F9C] hover:text-[#E8EAF0]'
                }`}
              >
                <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
                <span>No, Peer Flaked</span>
              </button>
            </div>
          </div>

          {attended ? (
            <>
              {/* Scoring Rubric */}
              <div className="p-3 rounded-xl bg-white/[0.025] backdrop-blur-md border border-white/[0.08] flex flex-col gap-1">
                {renderStarRating('Communication & Articulation', communication, setCommunication)}
                {renderStarRating('Technical Rigor & Problem Solving', technical, setTechnical)}
                {renderStarRating('Session Structure & Time Management', structure, setStructure)}
              </div>

              {/* Quick Tag Recommendations */}
              <div className="flex flex-col gap-1.5">
                <span className="font-mono text-[10px] uppercase tracking-wider text-[#8A8F9C] flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-[#3e8bff]" />
                  <span>Quick Feedback Highlights (click to add)</span>
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {QUICK_FEEDBACK_TAGS.map((tag, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleAddTag(tag)}
                      className={`text-[11px] px-2 py-1 rounded-md border transition-colors ${
                        feedback.includes(tag)
                          ? 'border-[#3e8bff]/50 bg-[#3e8bff]/20 text-[#cfe0ff]'
                          : 'border-white/[0.06] bg-white/[0.02] text-[#8A8F9C] hover:text-[#E8EAF0] hover:border-white/[0.15]'
                      }`}
                    >
                      + {tag}
                    </button>
                  ))}
                </div>
              </div>

              {/* Constructive Feedback Textarea */}
              <div className="flex flex-col gap-1.5">
                <label className="font-mono text-[10px] uppercase tracking-wider text-[#8A8F9C]">
                  Constructive Feedback & Actionable Advice
                </label>
                <textarea
                  rows={3}
                  required
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  placeholder="e.g. Excellent explanation of trade-offs between indexing and write throughput. Recommend preparing concrete calculation examples..."
                  className="p-3 rounded-lg border border-white/[0.08] bg-white/[0.03] backdrop-blur-md text-[#E8EAF0] text-xs focus:outline-none focus:border-[#3e8bff]/60 transition-colors leading-relaxed"
                />
              </div>
            </>
          ) : (
            <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs flex flex-col gap-1.5 leading-relaxed">
              <div className="font-semibold flex items-center gap-1.5 text-red-400">
                <AlertTriangle className="w-4 h-4" />
                <span>Anti-Flake Honor Code Enforcement</span>
              </div>
              <p className="text-[11.5px] text-red-300/90">
                Reporting an unexcused no-show logs an immediate 25% reliability deduction on this user's profile in the database to protect community members from unreliability.
              </p>
            </div>
          )}
          </div>

          {/* Action buttons (Sticky Pinned Footer) */}
          <div className="shrink-0 flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2 pt-3 border-t border-white/[0.08] bg-transparent mt-2">
            <button
              type="button"
              onClick={onClose}
              className="w-full sm:w-auto h-[36px] px-4 rounded-lg border border-white/[0.08] hover:border-white/[0.18] bg-transparent text-[#C6CBD5] text-xs font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="w-full sm:w-auto h-[36px] px-5 rounded-lg border border-[#3e8bff]/55 bg-[#3e8bff]/15 hover:bg-[#3e8bff]/25 text-[#cfe0ff] text-xs font-semibold flex items-center justify-center gap-1.5 transition-all active:scale-[0.97]"
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-[#3e8bff]" />
              <span>{submitting ? 'Updating Database...' : 'Submit Feedback'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
