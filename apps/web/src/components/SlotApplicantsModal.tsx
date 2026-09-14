import React, { useState, useEffect } from 'react';
import { Slot, SlotRequest, Profile } from '../types/database';
import { useTimezone } from '../context/TimezoneContext';
import { useAlert } from '../context/AlertContext';
import { ApplicantProfileModal } from './ApplicantProfileModal';
import {
  Users,
  X,
  CheckCircle2,
  ShieldCheck,
  Calendar,
  Eye,
  XCircle,
  MessageSquare,
} from 'lucide-react';

interface SlotApplicantsModalProps {
  isOpen: boolean;
  onClose: () => void;
  slot: Slot | null;
  requests: SlotRequest[];
  onAcceptApplicant: (requestId: string, slotId: string, applicantId: string) => Promise<void>;
  onRejectApplicant?: (requestId: string, slotId: string, applicantId: string, note?: string) => Promise<void>;
}

const DECLINE_TEMPLATES = [
  'Slot filled by another candidate',
  'Looking for a different seniority level for this topic',
  'Schedule conflict arose',
  'Focusing on another domain specialization today',
];

export const SlotApplicantsModal: React.FC<SlotApplicantsModalProps> = ({
  isOpen,
  onClose,
  slot,
  requests,
  onAcceptApplicant,
  onRejectApplicant,
}) => {
  const { formatSlot } = useTimezone();
  const { showConfirm, showAlert } = useAlert();
  const [acceptingId, setAcceptingId] = useState<string | null>(null);
  const [decliningRequest, setDecliningRequest] = useState<SlotRequest | null>(null);
  const [declineNote, setDeclineNote] = useState('');
  const [isDeclining, setIsDeclining] = useState(false);
  const [inspectedApplicant, setInspectedApplicant] = useState<Profile | null>(null);
  const [inspectedRequest, setInspectedRequest] = useState<SlotRequest | null>(null);

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

  if (!isOpen || !slot) return null;

  const slotRequests = requests.filter(
    (r) => r.slot_id === slot.id && r.status === 'pending'
  );

  const handleAccept = async (request: SlotRequest) => {
    const candidateName = request.applicant?.full_name || 'this peer';
    const confirmed = await showConfirm({
      title: 'Confirm Match & Lock Slot',
      message: `Pair with ${candidateName}? This locks the slot, creates the Google Meet confirmation, and dispatches calendar invitations.`,
      confirmText: 'Confirm & Pair',
      type: 'info',
    });

    if (confirmed) {
      setAcceptingId(request.id);
      try {
        await onAcceptApplicant(request.id, slot.id, request.applicant_id);
        onClose();
      } catch (err: any) {
        await showAlert({
          title: 'Acceptance Error',
          message: err.message || 'Error accepting candidate',
          type: 'danger',
        });
      } finally {
        setAcceptingId(null);
      }
    }
  };

  const handleOpenDecline = (request: SlotRequest) => {
    setInspectedApplicant(null);
    setDecliningRequest(request);
    setDeclineNote(DECLINE_TEMPLATES[0]);
  };

  const handleConfirmDecline = async () => {
    if (!decliningRequest) return;
    setIsDeclining(true);
    try {
      if (onRejectApplicant) {
        await onRejectApplicant(
          decliningRequest.id,
          slot.id,
          decliningRequest.applicant_id,
          declineNote
        );
      }
      setDecliningRequest(null);
      setDeclineNote('');
    } catch (err: any) {
      await showAlert({
        title: 'Decline Error',
        message: err.message || 'Error declining candidate request',
        type: 'danger',
      });
    } finally {
      setIsDeclining(false);
    }
  };

  const getInitials = (name: string) => {
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return (name.slice(0, 2) || 'PM').toUpperCase();
  };

  return (
    <>
      <div
        onClick={onClose}
        data-lenis-prevent="true"
        className="fixed inset-0 z-50 grid place-items-center p-4 bg-[#040507]/80 backdrop-blur-md animate-in fade-in duration-150 overscroll-contain"
      >
        <div
          onClick={(e) => e.stopPropagation()}
          data-lenis-prevent="true"
          className="w-full max-w-[620px] flex flex-col gap-3.5 p-4 sm:p-6 rounded-[16px] border border-white/[0.12] bg-[#080B12]/92 backdrop-blur-2xl shadow-[0_24px_64px_rgba(0,0,0,0.8),inset_0_1px_0_rgba(255,255,255,0.08)] max-h-[92vh] overflow-hidden overscroll-contain animate-in zoom-in-95 duration-200"
        >
          {/* Header */}
          <div className="shrink-0 flex items-start justify-between">
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-[#3e8bff]" />
                <span className="font-sans font-bold text-[16px] sm:text-[17px] tracking-[-0.02em] text-[#F2F4F8]">
                  Peer Applications ({slotRequests.length})
                </span>
              </div>
              <span className="text-[11.5px] sm:text-[12px] text-[#8A8F9C] leading-relaxed line-clamp-1 max-w-md">
                Select the peer you'd like to practice with for "{slot.topic_title}".
              </span>
            </div>
            <button
              onClick={onClose}
              className="w-7 h-7 rounded-md hover:bg-white/[0.08] text-[#8A8F9C] hover:text-[#F2F4F8] flex items-center justify-center transition-colors shrink-0 ml-2"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Slot context bar */}
          <div className="shrink-0 p-3 rounded-xl border border-white/[0.08] bg-white/[0.025] backdrop-blur-md flex items-center justify-between font-mono text-[11px] gap-2">
            <div className="flex items-center gap-2 text-[#E8EAF0] truncate">
              <Calendar className="w-3.5 h-3.5 text-[#3e8bff] shrink-0" />
              <span className="truncate">{formatSlot(slot.start_time)}</span>
            </div>
            <span className="text-[#8A8F9C] shrink-0">
              {slot.domain} · {slot.target_experience}
            </span>
          </div>

          {/* List of Applicants */}
          <div className="flex flex-col gap-2.5 overflow-y-auto flex-1 pr-1 overscroll-contain" data-lenis-prevent="true">
            {slotRequests.length > 0 ? (
              slotRequests.map((req) => {
                const app: Profile = req.applicant || {
                  id: req.applicant_id,
                  full_name: 'Peer Candidate',
                  headline: 'Software Engineer',
                  primary_domain: slot.domain || 'Software Engineering',
                  skills_tags: slot.skills_tags || ['Systems Design', 'Backend'],
                  years_of_experience: slot.target_experience || 'Mid (3-5y)',
                  reliability_score: 100,
                  total_sessions_completed: 3,
                  no_show_count: 0,
                  bio: req.message || 'Ready for peer mock interview and mutual calibration.',
                  target_companies: 'Meta, Google, Stripe',
                  created_at: req.created_at,
                };
                const appName = app?.full_name || 'Peer Candidate';
                const appInitials = getInitials(appName);
                const appRel = app?.reliability_score || 100;
                const appHeadline = app?.headline || 'Tech Candidate';
                const appSkills = app?.skills_tags || [];
                const isProcessing = acceptingId === req.id;

                return (
                  <div
                    key={req.id}
                    className="p-4 rounded-xl border border-white/[0.08] bg-white/[0.02] backdrop-blur-md flex flex-col gap-3 hover:border-white/[0.16] transition-colors"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full border border-white/[0.08] bg-gradient-to-br from-[#1e2434] to-[#0f1219] flex items-center justify-center font-mono text-[12px] text-[#B6BDC9] shrink-0">
                          {app?.avatar_url ? (
                            <img
                              src={app.avatar_url}
                              alt={appName}
                              className="w-full h-full rounded-full object-cover"
                            />
                          ) : (
                            appInitials
                          )}
                        </div>
                        <div className="flex flex-col gap-0.5 min-w-0">
                          <span className="font-semibold text-[13.5px] text-[#F2F4F8] truncate">
                            {appName}
                          </span>
                          <span className="text-[11px] text-[#8A8F9C] truncate">
                            {appHeadline}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 text-[11px] font-mono text-[#6EE7B7] shrink-0">
                        <ShieldCheck className="w-3.5 h-3.5 text-[#34D399]" />
                        <span>{appRel}% reliable</span>
                      </div>
                    </div>

                    {req.message && (
                      <div className="p-2.5 rounded-lg bg-white/[0.03] border border-white/[0.05] text-[12px] text-[#C6CBD5] leading-relaxed italic flex items-start gap-2">
                        <MessageSquare className="w-3.5 h-3.5 text-[#61666F] shrink-0 mt-0.5" />
                        <span>"{req.message}"</span>
                      </div>
                    )}

                    <div className="flex items-center justify-between gap-2 pt-1 flex-wrap">
                      <div className="flex gap-1 flex-wrap">
                        {appSkills.slice(0, 3).map((s, idx) => (
                          <span
                            key={idx}
                            className="text-[10.5px] px-2 py-0.5 rounded bg-white/[0.04] text-[#9FA6B3] border border-white/[0.06]"
                          >
                            {s}
                          </span>
                        ))}
                      </div>

                      <div className="flex items-center gap-1.5 flex-wrap sm:flex-nowrap w-full sm:w-auto justify-start sm:justify-end mt-1 sm:mt-0">
                        {/* View Profile Button */}
                        <button
                          type="button"
                          onClick={() => {
                            setInspectedApplicant(app || null);
                            setInspectedRequest(req);
                          }}
                          className="flex-1 sm:flex-none h-[30px] px-2.5 rounded-lg border border-white/[0.08] hover:border-[#3e8bff]/40 bg-white/[0.03] hover:bg-[#3e8bff]/10 text-[#C6CBD5] hover:text-[#9cc0ff] text-xs font-medium flex items-center justify-center gap-1.5 transition-colors"
                          title="Inspect candidate full background & experience"
                        >
                          <Eye className="w-3.5 h-3.5 shrink-0" />
                          <span>View Profile</span>
                        </button>

                        {/* Decline Button */}
                        {onRejectApplicant && (
                          <button
                            type="button"
                            onClick={() => handleOpenDecline(req)}
                            className="flex-1 sm:flex-none h-[30px] px-2.5 rounded-lg border border-red-500/25 hover:border-red-500/50 bg-red-500/5 hover:bg-red-500/15 text-red-300 text-xs font-medium flex items-center justify-center gap-1 transition-colors"
                            title="Decline with note"
                          >
                            <XCircle className="w-3.5 h-3.5 text-red-400 shrink-0" />
                            <span>Decline</span>
                          </button>
                        )}

                        {/* Accept Button */}
                        <button
                          type="button"
                          onClick={() => handleAccept(req)}
                          disabled={isProcessing}
                          className="w-full sm:w-auto h-[30px] px-3.5 rounded-lg border border-emerald-500/40 bg-emerald-500/15 hover:bg-emerald-500/25 text-[#6EE7B7] text-xs font-semibold flex items-center justify-center gap-1.5 transition-all active:scale-[0.97] shrink-0 disabled:opacity-50"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5 text-[#34D399] shrink-0" />
                          <span>{isProcessing ? 'Confirming...' : 'Accept Peer'}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="py-12 text-center flex flex-col items-center justify-center gap-2">
                <Users className="w-8 h-8 text-[#61666F] opacity-50" />
                <span className="text-xs text-[#8A8F9C]">
                  No pending requests yet. When peers apply, they will appear here.
                </span>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="shrink-0 flex justify-end pt-3 border-t border-white/[0.08] bg-transparent">
            <button
              onClick={onClose}
              className="w-full sm:w-auto h-[34px] px-5 rounded-lg border border-white/[0.08] hover:border-white/[0.18] bg-transparent text-[#C6CBD5] text-xs font-medium transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>

      {/* Decline with Note Modal */}
      {decliningRequest && (
        <div
          onClick={() => setDecliningRequest(null)}
          className="fixed inset-0 z-[80] grid place-items-center p-4 bg-[#040507]/85 backdrop-blur-md animate-in fade-in duration-150"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-[480px] flex flex-col gap-4 p-5 rounded-[16px] border border-white/[0.12] bg-[#080B12]/92 backdrop-blur-2xl shadow-[0_24px_64px_rgba(0,0,0,0.8),inset_0_1px_0_rgba(255,255,255,0.08)] animate-in zoom-in-95 duration-200"
          >
            <div className="flex items-start justify-between">
              <div className="flex flex-col gap-1">
                <span className="font-bold text-[16px] text-[#F2F4F8]">
                  Decline Candidate Request
                </span>
                <span className="text-[12px] text-[#8A8F9C]">
                  Send a polite notification note to{' '}
                  <strong className="text-[#E8EAF0]">
                    {decliningRequest.applicant?.full_name || 'Applicant'}
                  </strong>
                </span>
              </div>
              <button
                onClick={() => setDecliningRequest(null)}
                className="w-6 h-6 rounded-md hover:bg-white/[0.08] text-[#8A8F9C] hover:text-[#F2F4F8] flex items-center justify-center"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Quick Reason Templates */}
            <div className="flex flex-col gap-1.5">
              <span className="font-mono text-[10px] uppercase tracking-wider text-[#8A8F9C]">
                Quick Reason
              </span>
              <div className="flex flex-col gap-1">
                {DECLINE_TEMPLATES.map((tmpl, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setDeclineNote(tmpl)}
                    className={`text-left px-3 py-1.5 rounded-lg border text-xs transition-colors ${
                      declineNote === tmpl
                        ? 'border-[#3e8bff]/50 bg-[#3e8bff]/15 text-[#cfe0ff]'
                        : 'border-white/[0.06] bg-white/[0.02] text-[#8A8F9C] hover:text-[#E8EAF0]'
                    }`}
                  >
                    {tmpl}
                  </button>
                ))}
              </div>
            </div>

            {/* Custom note textarea */}
            <div className="flex flex-col gap-1.5">
              <span className="font-mono text-[10px] uppercase tracking-wider text-[#8A8F9C]">
                Custom Courteous Message
              </span>
              <textarea
                rows={3}
                value={declineNote}
                onChange={(e) => setDeclineNote(e.target.value)}
                placeholder="Add an optional courteous message..."
                className="w-full p-2.5 rounded-lg border border-white/[0.08] bg-white/[0.03] text-[#E8EAF0] text-xs focus:outline-none focus:border-[#3e8bff]/60 leading-relaxed"
              />
            </div>

            {/* Actions */}
            <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2 pt-2 border-t border-white/[0.06]">
              <button
                type="button"
                onClick={() => setDecliningRequest(null)}
                className="w-full sm:w-auto h-[34px] px-3.5 rounded-lg border border-white/[0.08] hover:border-white/[0.18] bg-transparent text-[#C6CBD5] text-xs font-medium"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeclining}
                onClick={handleConfirmDecline}
                className="w-full sm:w-auto h-[34px] px-4 rounded-lg border border-red-500/40 bg-red-500/15 hover:bg-red-500/25 text-red-300 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all"
              >
                <XCircle className="w-3.5 h-3.5" />
                <span>{isDeclining ? 'Declining...' : 'Decline with Note'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Applicant Profile Inspection Modal */}
      {inspectedApplicant && (
        <ApplicantProfileModal
          isOpen={Boolean(inspectedApplicant)}
          onClose={() => {
            setInspectedApplicant(null);
            setInspectedRequest(null);
          }}
          applicant={inspectedApplicant}
          onAccept={
            inspectedRequest
              ? () => handleAccept(inspectedRequest)
              : undefined
          }
          onDecline={
            inspectedRequest && onRejectApplicant
              ? () => handleOpenDecline(inspectedRequest)
              : undefined
          }
        />
      )}
    </>
  );
};
