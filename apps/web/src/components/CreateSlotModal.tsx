import React, { useState, useEffect } from 'react';
import { Slot, SlotRole } from '../types/database';
import { X, AlertCircle, Video } from 'lucide-react';
import { DateTimePicker } from './DateTimePicker';
import { CustomSelect } from './ui/CustomSelect';

interface CreateSlotModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSlotCreated: (newSlot: Partial<Slot>) => void;
  creatorId?: string;
}

const DOMAINS = [
  'Systems Design',
  'Frontend',
  'Backend',
  'DSA',
  'Distributed Systems',
  'Behavioral',
  'ML',
  'Data',
];

const SENIORITY_LEVELS = [
  'Junior (0-2y)',
  'Mid (3-5y)',
  'Senior (6-9y)',
  'Staff/Lead (10y+)',
];

export const CreateSlotModal: React.FC<CreateSlotModalProps> = ({
  isOpen,
  onClose,
  onSlotCreated,
  creatorId,
}) => {
  const [roleType, setRoleType] = useState<SlotRole>('evaluator');
  const [domain, setDomain] = useState(DOMAINS[0]);
  const [headline, setHeadline] = useState('');
  const [targetExperience, setTargetExperience] = useState(SENIORITY_LEVELS[1]);
  const [skillsTags, setSkillsTags] = useState('');
  const [dateTime, setDateTime] = useState('');
  const [meetingUrl, setMeetingUrl] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const generateMeetingUrl = () => {
    if (!dateTime) return;
    const dt = new Date(dateTime);
    // Generate valid 3-4-3 google meet slug derived from selected date and time
    const timeMs = dt.getTime().toString(36).replace(/[^a-z0-9]/g, '');
    const cleanLetters = (timeMs + Math.random().toString(36).substring(2, 9)).replace(/[^a-z]/g, 'm');
    const part1 = (cleanLetters.substring(0, 3) || 'mtg').padEnd(3, 'a');
    const part2 = (cleanLetters.substring(3, 7) || 'peer').padEnd(4, 'b');
    const part3 = (cleanLetters.substring(7, 10) || 'cal').padEnd(3, 'c');
    setMeetingUrl(`https://meet.google.com/${part1}-${part2}-${part3}`);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    if (!creatorId) {
      setValidationError('You must be signed in to post a practice slot.');
      return;
    }

    if (!headline.trim() || headline.trim().length < 5) {
      setValidationError('Please provide a descriptive headline (at least 5 characters).');
      return;
    }

    if (!dateTime) {
      setValidationError('Please select a session start time.');
      return;
    }

    const startDate = new Date(dateTime);
    if (isNaN(startDate.getTime())) {
      setValidationError('Invalid date format.');
      return;
    }

    if (startDate.getTime() < Date.now() + 5 * 60 * 1000) {
      setValidationError('Session start time must be at least 5 minutes in the future.');
      return;
    }

    // Ensure meeting URL is populated with date/time context
    let finalMeetingUrl = meetingUrl.trim();
    if (!finalMeetingUrl) {
      const timeMs = startDate.getTime().toString(36).replace(/[^a-z0-9]/g, '');
      const cleanLetters = (timeMs + Math.random().toString(36).substring(2, 9)).replace(/[^a-z]/g, 'm');
      const part1 = (cleanLetters.substring(0, 3) || 'mtg').padEnd(3, 'a');
      const part2 = (cleanLetters.substring(3, 7) || 'peer').padEnd(4, 'b');
      const part3 = (cleanLetters.substring(7, 10) || 'cal').padEnd(3, 'c');
      finalMeetingUrl = `https://meet.google.com/${part1}-${part2}-${part3}`;
    }

    setIsSubmitting(true);
    const tags = skillsTags
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    const endDate = new Date(startDate.getTime() + 45 * 60 * 1000);

    const newSlot: Partial<Slot> = {
      creator_id: creatorId,
      role_type: roleType,
      domain,
      topic_title: headline.trim(),
      topic_description: headline.trim(),
      target_experience: targetExperience,
      skills_tags: tags.length > 0 ? tags : [domain, 'Tech'],
      start_time: startDate.toISOString(),
      end_time: endDate.toISOString(),
      meeting_url: finalMeetingUrl,
      status: 'open',
    };

    onSlotCreated(newSlot);
    setIsSubmitting(false);
    onClose();
  };

  return (
    <div
      onClick={onClose}
      data-lenis-prevent="true"
      className="fixed inset-0 z-50 grid place-items-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-150 overscroll-contain"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        data-lenis-prevent="true"
        className="w-full max-w-[540px] flex flex-col gap-4 p-5 sm:p-6 rounded-[16px] border border-white/[0.12] bg-[#080B12]/92 backdrop-blur-2xl shadow-[0_30px_80px_rgba(0,0,0,0.85),inset_0_1px_0_rgba(255,255,255,0.08)] max-h-[90vh] overflow-y-auto overscroll-contain animate-in zoom-in-95 duration-200"
      >
        {/* Header matching Nocturne Screen 5 */}
        <div className="flex items-start justify-between shrink-0">
          <div className="flex flex-col gap-1">
            <span className="font-sans font-bold text-[17px] tracking-[-0.02em] text-[#F2F4F8]">
              Post a slot
            </span>
            <span className="text-[12px] text-[#8A8F9C] leading-relaxed">
              45 minutes on Google Meet · Connect with peers for high-signal technical practice.
            </span>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-md hover:bg-white/[0.08] text-[#8A8F9C] hover:text-[#F2F4F8] flex items-center justify-center transition-colors shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {validationError && (
          <div className="p-2.5 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2 shrink-0">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{validationError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0 text-xs">
          <div className="flex-1 overflow-y-auto overscroll-contain pr-1 flex flex-col gap-3">
            {/* Posture Toggle */}
            <div className="grid grid-cols-2 gap-1.5 p-1 rounded-xl bg-white/[0.03] backdrop-blur-md border border-white/[0.08] shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
              <button
                type="button"
                onClick={() => setRoleType('evaluator')}
                className={`py-2 px-2 sm:px-3 rounded-lg text-xs font-semibold transition-all text-center ${
                  roleType === 'evaluator'
                    ? 'bg-[#3e8bff]/15 text-[#9cc0ff] border border-[#3e8bff]/40 shadow-xs'
                    : 'text-[#8A8F9C] hover:text-[#E8EAF0]'
                }`}
              >
                Giving (Evaluator)
              </button>
              <button
                type="button"
                onClick={() => setRoleType('candidate')}
                className={`py-2 px-2 sm:px-3 rounded-lg text-xs font-semibold transition-all text-center ${
                  roleType === 'candidate'
                    ? 'bg-emerald-500/15 text-[#6EE7B7] border border-emerald-500/40 shadow-xs'
                    : 'text-[#8A8F9C] hover:text-[#E8EAF0]'
                }`}
              >
                Seeking (Candidate)
              </button>
            </div>

            {/* Headline Input */}
            <div className="flex flex-col gap-1">
              <input
                type="text"
                value={headline}
                onChange={(e) => setHeadline(e.target.value)}
                placeholder="Headline — e.g. Systems design, ex-AWS depth"
                className="h-[36px] px-3 rounded-lg border border-white/[0.08] bg-white/[0.03] backdrop-blur-md shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] text-[#E8EAF0] text-xs focus:outline-none focus:bg-[#0A0D14]/90 focus:border-[#3e8bff]/60 transition-colors"
                required
              />
            </div>

            {/* Domain & Seniority */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <CustomSelect
                value={domain}
                onChange={setDomain}
                options={DOMAINS}
                placeholder="Domain"
              />

              <CustomSelect
                value={targetExperience}
                onChange={setTargetExperience}
                options={SENIORITY_LEVELS}
                placeholder="Seniority Level"
              />
            </div>

            {/* Modern Date & Time Picker */}
            <DateTimePicker
              value={dateTime}
              onChange={setDateTime}
              minMinutesInAdvance={15}
            />

            {/* Skills Tags */}
            <div className="flex flex-col gap-1">
              <input
                type="text"
                value={skillsTags}
                onChange={(e) => setSkillsTags(e.target.value)}
                placeholder="Skills & topics (comma separated — e.g. Distributed Systems, Latency, STAR)"
                className="h-[36px] px-3 rounded-lg border border-white/[0.08] bg-white/[0.03] backdrop-blur-md shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] text-[#E8EAF0] text-xs focus:outline-none focus:bg-[#0A0D14]/90 focus:border-[#3e8bff]/60 transition-colors"
              />
            </div>

            {/* Meeting Link with generator */}
            <div className="flex flex-col gap-1.5">
              <div className="flex gap-1.5">
                <div className="relative flex-1">
                  <input
                    type="url"
                    value={meetingUrl}
                    onChange={(e) => setMeetingUrl(e.target.value)}
                    placeholder={dateTime ? "Google Meet Link (click Generate or paste your own)" : "Select date & time above first..."}
                    className="w-full h-[36px] px-3 rounded-lg border border-white/[0.08] bg-white/[0.03] backdrop-blur-md shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] text-[#E8EAF0] font-mono text-[11px] focus:outline-none focus:bg-[#0A0D14]/90 focus:border-[#3e8bff]/60 transition-colors"
                  />
                </div>
                <button
                  type="button"
                  disabled={!dateTime}
                  onClick={generateMeetingUrl}
                  title={!dateTime ? "Select date & time above first to generate Google Meet link" : "Generate Google Meet link for selected date & time"}
                  className={`h-[36px] px-3 rounded-lg border text-xs flex items-center gap-1.5 font-semibold shrink-0 transition-all backdrop-blur-sm ${
                    !dateTime
                      ? 'border-white/[0.05] bg-white/[0.02] text-white/30 cursor-not-allowed opacity-50'
                      : 'border-emerald-500/40 bg-emerald-500/15 hover:bg-emerald-500/25 text-[#6EE7B7] cursor-pointer shadow-[0_0_14px_rgba(16,185,129,0.18)]'
                  }`}
                >
                  <Video className={`w-3.5 h-3.5 ${!dateTime ? 'text-white/30' : 'text-[#34D399]'}`} />
                  <span className="hidden xs:inline">Generate</span>
                </button>
              </div>

              <div className="text-[11px] flex items-center justify-between px-1">
                {!dateTime ? (
                  <span className="text-[#717684]">
                    Select session date & time above to generate Google Meet link
                  </span>
                ) : meetingUrl ? (
                  <span className="text-emerald-400 font-mono text-[10.5px] flex items-center gap-1">
                    ✓ Google Meet link calibrated for scheduled time
                  </span>
                ) : (
                  <span className="text-[#3e8bff] font-mono text-[10.5px]">
                    Date & time calibrated — click Generate to lock Google Meet room
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Sticky Action Buttons */}
          <div className="shrink-0 flex items-center justify-end gap-2 pt-3 border-t border-white/[0.08] mt-2">
            <button
              type="button"
              onClick={onClose}
              className="h-[36px] px-4 rounded-lg border border-white/[0.08] hover:border-white/[0.18] bg-white/[0.02] text-[#C6CBD5] text-xs font-medium flex items-center gap-1.5 transition-colors flex-1 sm:flex-initial justify-center"
            >
              <span>Cancel</span>
              <kbd className="font-mono text-[9.5px] text-[#61666F] hidden sm:inline">esc</kbd>
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="h-[36px] px-5 rounded-lg border border-[#3e8bff]/55 bg-[#3e8bff]/20 hover:bg-[#3e8bff]/30 text-[#cfe0ff] text-xs font-semibold transition-all active:scale-[0.97] flex-1 sm:flex-initial text-center justify-center shadow-xs"
            >
              {isSubmitting ? 'Publishing...' : 'Publish slot'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
