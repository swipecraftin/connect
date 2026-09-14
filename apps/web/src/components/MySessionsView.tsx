import React, { useState } from 'react';
import { Slot, SlotRequest } from '../types/database';
import { useTimezone } from '../context/TimezoneContext';
import { useAlert } from '../context/AlertContext';
import {
  Calendar,
  CalendarCheck,
  Video,
  Star,
  Users,
  ArrowUpRight,
  Clock,
  XCircle,
} from 'lucide-react';

interface MySessionsViewProps {
  allSlots: Slot[];
  requests?: SlotRequest[];
  bookedSlotIds: string[];
  syncedCalendarSlotIds?: string[];
  currentUserId?: string;
  onOpenReview: (slot: Slot) => void;
  onReviewApplicants?: (slot: Slot) => void;
  onCancelSlot?: (slot: Slot) => void;
  onWithdrawRequest?: (requestId: string) => Promise<void>;
}

export const MySessionsView: React.FC<MySessionsViewProps> = ({
  allSlots,
  requests = [],
  bookedSlotIds,
  syncedCalendarSlotIds: _syncedCalendarSlotIds = [],
  currentUserId,
  onOpenReview,
  onReviewApplicants,
  onCancelSlot,
  onWithdrawRequest,
}) => {
  const { formatSlot, getCountdown } = useTimezone();
  const { showConfirm } = useAlert();
  const [filter, setFilter] = useState<'all' | 'confirmed' | 'published' | 'completed' | 'pending'>('all');

  const now = Date.now();

  const upcomingSessions = allSlots.filter((slot) => {
    const isBooked = slot.status === 'booked';
    const isMyBooking =
      bookedSlotIds.includes(slot.id) ||
      (currentUserId && (slot.participant_id === currentUserId || (slot.creator_id === currentUserId && isBooked)));
    const isFutureOrActive = new Date(slot.start_time).getTime() + 60 * 60 * 1000 > now;
    return isBooked && isMyBooking && isFutureOrActive;
  });

  const myPublishedSlots = allSlots.filter((slot) => {
    const isMine = currentUserId ? slot.creator_id === currentUserId : false;
    return isMine && slot.status === 'open';
  });

  const completedSessions = allSlots.filter((slot) => {
    const isMySession =
      bookedSlotIds.includes(slot.id) ||
      (currentUserId && (slot.participant_id === currentUserId || slot.creator_id === currentUserId));
    const isPast = new Date(slot.start_time).getTime() + 60 * 60 * 1000 <= now;
    return (slot.status === 'completed' || (slot.status === 'booked' && isPast)) && isMySession;
  });

  // Calculate feedback due count
  const awaitingFeedbackCount = completedSessions.filter((s) => s.status !== 'completed').length;

  const filteredSessions = () => {
    if (filter === 'confirmed') return upcomingSessions;
    if (filter === 'published') return myPublishedSlots;
    if (filter === 'completed') return completedSessions;
    // 'all' returns all relevant sessions sorted by date
    const all = [
      ...upcomingSessions,
      ...myPublishedSlots,
      ...completedSessions,
    ];
    // deduplicate by id
    const seen = new Set<string>();
    return all.filter((s) => {
      if (seen.has(s.id)) return false;
      seen.add(s.id);
      return true;
    });
  };

  const getGoogleCalendarUrl = (slot: Slot) => {
    const startTime = new Date(slot.start_time);
    const endTime = slot.end_time ? new Date(slot.end_time) : new Date(startTime.getTime() + 45 * 60 * 1000);
    const startIso = startTime.toISOString().replace(/-|:|\.\d\d\d/g, '');
    const endIso = endTime.toISOString().replace(/-|:|\.\d\d\d/g, '');
    const title = encodeURIComponent(`Connect: ${slot.topic_title}`);
    const details = encodeURIComponent(
      `Connect by Swipecraft — Peer Mock Practice Session\nDomain: ${slot.domain}\nSeniority: ${slot.target_experience}\nMeeting URL: ${slot.meeting_url}`
    );
    const location = encodeURIComponent(slot.meeting_url);
    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${startIso}/${endIso}&details=${details}&location=${location}`;
  };

  const getInitials = (name: string) => {
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return (name.slice(0, 2) || 'PM').toUpperCase();
  };

  const myPendingRequests = requests.filter(
    (r) => currentUserId && r.applicant_id === currentUserId && r.status === 'pending'
  );

  const sessions = filteredSessions();

  return (
    <div className="flex flex-col gap-5 w-full animate-in fade-in duration-200">
      {/* Header matching Nocturne Screen 2 */}
      <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-3">
        <div className="flex items-baseline gap-3">
          <h2 className="m-0 font-sans font-bold text-[22px] tracking-[-0.025em] text-[#F2F4F8]">
            My Sessions
          </h2>
          <span className="font-mono text-[11px] text-[#61666F]">
            {upcomingSessions.length} scheduled · {awaitingFeedbackCount} awaiting feedback
          </span>
        </div>

        {/* Segmented Filter Pills */}
        <div className="inline-flex items-center gap-1 p-1 rounded-xl bg-white/[0.03] backdrop-blur-md border border-white/[0.08] shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] text-xs self-start sm:self-auto flex-wrap">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1.5 rounded-lg font-medium text-xs transition-all ${
              filter === 'all'
                ? 'bg-white/[0.09] text-[#F2F4F8] shadow-[0_2px_8px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.08)] border border-white/[0.12]'
                : 'text-[#8A8F9C] hover:text-[#E8EAF0] hover:bg-white/[0.04]'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setFilter('confirmed')}
            className={`px-3 py-1.5 rounded-lg font-medium text-xs transition-all ${
              filter === 'confirmed'
                ? 'bg-white/[0.09] text-[#F2F4F8] shadow-[0_2px_8px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.08)] border border-white/[0.12]'
                : 'text-[#8A8F9C] hover:text-[#E8EAF0] hover:bg-white/[0.04]'
            }`}
          >
            Confirmed ({upcomingSessions.length})
          </button>
          <button
            onClick={() => setFilter('published')}
            className={`px-3 py-1.5 rounded-lg font-medium text-xs transition-all ${
              filter === 'published'
                ? 'bg-white/[0.09] text-[#F2F4F8] shadow-[0_2px_8px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.08)] border border-white/[0.12]'
                : 'text-[#8A8F9C] hover:text-[#E8EAF0] hover:bg-white/[0.04]'
            }`}
          >
            My Listings ({myPublishedSlots.length})
          </button>
          <button
            onClick={() => setFilter('completed')}
            className={`px-3 py-1.5 rounded-lg font-medium text-xs transition-all ${
              filter === 'completed'
                ? 'bg-white/[0.09] text-[#F2F4F8] shadow-[0_2px_8px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.08)] border border-white/[0.12]'
                : 'text-[#8A8F9C] hover:text-[#E8EAF0] hover:bg-white/[0.04]'
            }`}
          >
            Past & Reviews ({completedSessions.length})
          </button>

          {myPendingRequests.length > 0 && (
            <button
              onClick={() => setFilter('pending')}
              className={`px-3 py-1.5 rounded-lg font-medium text-xs transition-all flex items-center gap-1.5 ${
                filter === 'pending'
                  ? 'bg-white/[0.09] text-[#F2F4F8] shadow-[0_2px_8px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.08)] border border-white/[0.12]'
                  : 'text-[#8A8F9C] hover:text-[#E8EAF0] hover:bg-white/[0.04]'
              }`}
            >
              <span>Applied / Pending</span>
              <span className="font-mono text-[10px] px-1.5 py-0.2 rounded-full bg-[#3e8bff]/20 text-[#9cc0ff]">
                {myPendingRequests.length}
              </span>
            </button>
          )}
        </div>
      </div>

      {/* Main Table Container */}
      <div className="border border-white/[0.08] rounded-[14px] bg-[#0A0D14]/70 backdrop-blur-xl shadow-[0_8px_32px_rgba(0,0,0,0.36),inset_0_1px_0_rgba(255,255,255,0.05)] overflow-hidden">
        {/* Table Header (Desktop) */}
        <div className="hidden lg:grid lg:grid-cols-[160px_minmax(180px,1.2fr)_120px_minmax(200px,1.6fr)_120px_minmax(140px,auto)] gap-3.5 px-4 py-2.5 border-b border-white/[0.08] bg-white/[0.02] backdrop-blur-md font-mono text-[9.5px] uppercase tracking-[0.09em] text-[#5F6570]">
          <span>When</span>
          <span>Peer</span>
          <span>My Role</span>
          <span>Focus</span>
          <span>Status</span>
          <span className="text-right">Actions</span>
        </div>

        {filter === 'pending' ? (
          myPendingRequests.length > 0 ? (
            <div className="divide-y divide-white/[0.045]">
              {myPendingRequests.map((req) => {
                const targetSlot = req.slot || allSlots.find((s) => s.id === req.slot_id);
                const host = targetSlot?.creator;
                const hostName = host?.full_name || 'Peer Host';
                const hostInitials = getInitials(hostName);
                const hostRole = host?.headline || targetSlot?.target_experience || 'Host';

                return (
                  <div
                    key={req.id}
                    className="group hover:bg-white/[0.025] transition-colors duration-150 p-4 lg:py-3.5 lg:px-5"
                  >
                    {/* Desktop Grid Row */}
                    <div className="hidden lg:grid lg:grid-cols-[160px_minmax(180px,1.2fr)_120px_minmax(200px,1.6fr)_120px_minmax(140px,auto)] gap-4 items-center">
                      {/* When */}
                      <div className="flex flex-col gap-0.5">
                        <span className="font-mono text-[11.5px] text-[#C6CBD5]">
                          {targetSlot ? formatSlot(targetSlot.start_time) : 'Pending Slot'}
                        </span>
                        {targetSlot && (
                          <span className="text-[10px] text-[#61666F]">
                            {getCountdown(targetSlot.start_time).label}
                          </span>
                        )}
                      </div>

                      {/* Peer (Host) */}
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="relative flex-none w-6 h-6 rounded-full border border-white/[0.08] bg-gradient-to-br from-[#1e2434] to-[#0f1219] flex items-center justify-center font-mono text-[9px] text-[#B6BDC9]">
                          {hostInitials}
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="text-[12.5px] font-semibold text-[#E8EAF0] truncate">
                            {hostName}
                          </span>
                          <span className="text-[10.5px] text-[#61666F] truncate">
                            {hostRole}
                          </span>
                        </div>
                      </div>

                      {/* My Role */}
                      <span className="text-[12px] font-medium text-[#9FA6B3]">
                        {targetSlot?.role_type === 'evaluator' ? 'Candidate' : 'Interviewer'}
                      </span>

                      {/* Focus & Note */}
                      <div className="flex flex-col min-w-0">
                        <span className="text-[12.5px] text-[#C6CBD5] truncate font-medium">
                          {targetSlot?.topic_title || 'Mock Practice Session'}
                        </span>
                        <span className="text-[10px] text-[#61666F] truncate">
                          {targetSlot?.domain} · {targetSlot?.target_experience}
                          {req.message ? ` · "${req.message}"` : ''}
                        </span>
                      </div>

                      {/* Status */}
                      <div>
                        <span className="font-mono text-[10px] px-2 py-1 rounded-[5px] border inline-flex items-center gap-1.5 bg-[#3e8bff]/10 border-[#3e8bff]/30 text-[#9cc0ff]">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#3e8bff] animate-pulse" />
                          Host Reviewing
                        </span>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center justify-end gap-2">
                        {onWithdrawRequest && (
                          <button
                            type="button"
                            onClick={async () => {
                              const confirmed = await showConfirm({
                                title: 'Withdraw Application?',
                                message: `Withdraw your application for "${targetSlot?.topic_title || 'session'}"? You can apply again if the slot remains open.`,
                                confirmText: 'Withdraw Application',
                                type: 'warning',
                              });
                              if (confirmed) {
                                await onWithdrawRequest(req.id);
                              }
                            }}
                            className="h-[32px] px-3 rounded-lg border border-white/[0.08] hover:border-red-500/30 hover:bg-red-500/10 text-[#8A8F9C] hover:text-red-400 text-xs font-semibold flex items-center gap-1.5 transition-all"
                          >
                            <XCircle className="w-3 h-3" />
                            <span>Withdraw</span>
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Mobile Card */}
                    <div className="lg:hidden flex flex-col gap-2.5">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex flex-col gap-0.5">
                          <span className="font-mono text-[11.5px] text-[#C6CBD5]">
                            {targetSlot ? formatSlot(targetSlot.start_time) : 'Pending Slot'}
                          </span>
                          {targetSlot && (
                            <span className="text-[10px] text-[#61666F]">
                              {getCountdown(targetSlot.start_time).label}
                            </span>
                          )}
                        </div>
                        <span className="font-mono text-[10px] px-2 py-0.5 rounded-[5px] border inline-flex items-center gap-1.5 bg-[#3e8bff]/10 border-[#3e8bff]/30 text-[#9cc0ff]">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#3e8bff] animate-pulse" />
                          Host Reviewing
                        </span>
                      </div>

                      <div className="p-2.5 rounded-lg bg-white/[0.03] backdrop-blur-sm border border-white/[0.06] flex flex-col gap-1">
                        <span className="text-[12.5px] font-medium text-[#E8EAF0]">
                          {targetSlot?.topic_title || 'Mock Practice Session'}
                        </span>
                        <span className="text-[10.5px] text-[#61666F]">
                          Host: {hostName} · {targetSlot?.domain} · {targetSlot?.target_experience}
                        </span>
                        {req.message && (
                          <span className="text-[11px] text-[#8A8F9C] italic mt-0.5">
                            Note: "{req.message}"
                          </span>
                        )}
                      </div>

                      <div className="flex items-center justify-end pt-1">
                        {onWithdrawRequest && (
                          <button
                            type="button"
                            onClick={async () => {
                              const confirmed = await showConfirm({
                                title: 'Withdraw Application?',
                                message: `Withdraw your application for "${targetSlot?.topic_title || 'session'}"?`,
                                confirmText: 'Withdraw Application',
                                type: 'warning',
                              });
                              if (confirmed) {
                                await onWithdrawRequest(req.id);
                              }
                            }}
                            className="h-[30px] px-3 rounded-md border border-white/[0.08] hover:border-red-500/30 hover:bg-red-500/10 text-[#8A8F9C] hover:text-red-400 text-xs font-medium flex items-center gap-1.5 transition-all backdrop-blur-sm"
                          >
                            <XCircle className="w-3.5 h-3.5 stroke-[1.75]" />
                            <span>Withdraw Application</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="py-16 px-6 text-center flex flex-col items-center justify-center gap-3">
              <div className="w-12 h-12 rounded-full border border-white/[0.08] bg-white/[0.03] backdrop-blur-sm flex items-center justify-center text-[#61666F]">
                <Clock className="w-6 h-6 opacity-60 stroke-[1.75]" />
              </div>
              <div className="flex flex-col gap-1 max-w-sm">
                <span className="font-semibold text-sm text-[#E8EAF0]">
                  No pending applications
                </span>
                <span className="text-xs text-[#8A8F9C] leading-relaxed">
                  You haven't applied to any practice slots yet, or all your requests have been resolved.
                </span>
              </div>
            </div>
          )
        ) : sessions.length > 0 ? (
          <div className="divide-y divide-white/[0.045]">
            {sessions.map((slot) => {
              const sessionStartTime = new Date(slot.start_time).getTime();
              const isPast = sessionStartTime + 45 * 60 * 1000 <= now;
              const isTimeReached = now >= sessionStartTime;
              const isHost = currentUserId ? slot.creator_id === currentUserId : false;
              const isConfirmed = slot.status === 'booked';
              const isOpen = slot.status === 'open';
              const isCompleted = slot.status === 'completed';

              // Determine peer info
              const peer = isHost ? slot.participant : slot.creator;
              const peerName = peer?.full_name || (isOpen ? 'Awaiting peer' : 'Peer Match');
              const peerInitials = peer?.full_name ? getInitials(peer.full_name) : 'PM';
              const peerRole = peer?.headline || (isOpen ? 'Open listing' : slot.target_experience);

              // Determine user's role: Interviewer vs Candidate
              const myRole =
                slot.role_type === 'evaluator'
                  ? isHost
                    ? 'Interviewer'
                    : 'Candidate'
                  : isHost
                  ? 'Candidate'
                  : 'Interviewer';

              // Determine status badge
              let statusLabel = 'Confirmed';
              let statusBg = 'rgba(52,211,153,.1)';
              let statusBc = 'rgba(52,211,153,.28)';
              let statusFg = '#6EE7B7';

              if (isOpen) {
                statusLabel = 'Awaiting peer';
                statusBg = 'transparent';
                statusBc = 'rgba(255,255,255,0.08)';
                statusFg = '#878D99';
              } else if (isCompleted) {
                statusLabel = 'Completed';
                statusBg = 'rgba(52,211,153,.08)';
                statusBc = 'rgba(52,211,153,.2)';
                statusFg = '#34D399';
              } else if (isPast) {
                statusLabel = 'Feedback due';
                statusBg = 'rgba(62,139,255,.12)';
                statusBc = 'rgba(62,139,255,.4)';
                statusFg = '#cfe0ff';
              }

              const pendingApplicantsCount = requests.filter(
                (r) => r.slot_id === slot.id && r.status === 'pending'
              ).length;

              return (
                <div
                  key={slot.id}
                  className="group hover:bg-white/[0.025] transition-colors duration-150 p-4 lg:py-3.5 lg:px-5"
                >
                  {/* Desktop Grid Row */}
                  <div className="hidden lg:grid lg:grid-cols-[160px_minmax(180px,1.2fr)_120px_minmax(200px,1.6fr)_120px_minmax(140px,auto)] gap-4 items-center">
                    {/* When */}
                    <div className="flex flex-col gap-0.5">
                      <span className="font-mono text-[11.5px] text-[#C6CBD5]">
                        {formatSlot(slot.start_time)}
                      </span>
                      <span className="text-[10px] text-[#61666F]">
                        {getCountdown(slot.start_time).label}
                      </span>
                    </div>

                    {/* Peer */}
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="relative flex-none w-6 h-6 rounded-full border border-white/[0.08] bg-gradient-to-br from-[#1e2434] to-[#0f1219] flex items-center justify-center font-mono text-[9px] text-[#B6BDC9]">
                        {peerInitials}
                        {isConfirmed && (
                          <span className="absolute -right-0.5 -bottom-0.5 w-2 h-2 rounded-full bg-[#34D399] border border-[#0E1015]" />
                        )}
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="text-[12.5px] font-semibold text-[#E8EAF0] truncate">
                          {peerName}
                        </span>
                        <span className="text-[10.5px] text-[#61666F] truncate">
                          {peerRole}
                        </span>
                      </div>
                    </div>

                    {/* My Role */}
                    <span
                      className="text-[12px] font-medium"
                      style={{
                        color: myRole === 'Interviewer' ? '#cfe0ff' : '#9FA6B3',
                      }}
                    >
                      {myRole}
                    </span>

                    {/* Focus */}
                    <div className="flex flex-col min-w-0">
                      <span className="text-[12.5px] text-[#C6CBD5] truncate font-medium">
                        {slot.topic_title}
                      </span>
                      <span className="text-[10px] text-[#61666F]">
                        {slot.domain} · {slot.target_experience}
                      </span>
                    </div>

                    {/* Status */}
                    <div>
                      <span
                        className="font-mono text-[10px] px-2 py-1 rounded-[5px] border inline-flex items-center gap-1.5"
                        style={{
                          backgroundColor: statusBg,
                          borderColor: statusBc,
                          color: statusFg,
                        }}
                      >
                        <span
                          className="w-1.5 h-1.5 rounded-full"
                          style={{ backgroundColor: statusFg }}
                        />
                        {statusLabel}
                      </span>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-end gap-2.5">
                      {/* Host: Review Applicants */}
                      {isOpen && isHost && onReviewApplicants && (
                        <button
                          onClick={() => onReviewApplicants(slot)}
                          className="h-[32px] px-3 rounded-lg border border-[#3e8bff]/40 bg-[#3e8bff]/10 hover:bg-[#3e8bff]/20 text-[#cfe0ff] text-xs font-semibold flex items-center gap-1.5 transition-all"
                        >
                          <Users className="w-3.5 h-3.5 text-[#3e8bff]" />
                          <span>Applicants</span>
                          {pendingApplicantsCount > 0 && (
                            <span className="font-mono text-[9px] px-1 rounded-full bg-[#3e8bff] text-white">
                              {pendingApplicantsCount}
                            </span>
                          )}
                        </button>
                      )}

                      {/* Confirmed: Join Meet Button */}
                      {isConfirmed && (
                        <a
                          href={slot.meeting_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="h-[32px] px-3.5 rounded-lg border border-emerald-500/40 bg-emerald-500/10 hover:bg-emerald-500/20 text-[#6EE7B7] text-xs font-semibold flex items-center gap-1.5 transition-all"
                        >
                          <Video className="w-3.5 h-3.5 text-[#34D399]" />
                          <span>Join Meet</span>
                          <ArrowUpRight className="w-2.5 h-2.5 opacity-60" />
                        </a>
                      )}

                      {/* Feedback button */}
                      {(isPast || isTimeReached) && isConfirmed && (
                        <button
                          onClick={() => onOpenReview(slot)}
                          className="h-[32px] px-3 rounded-lg border border-amber-500/40 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 text-xs font-semibold flex items-center gap-1.5 transition-all"
                        >
                          <Star className="w-3.5 h-3.5 text-amber-400" />
                          <span>Review</span>
                        </button>
                      )}

                      {/* Google Calendar Automatic Sync Pill */}
                      {isConfirmed && !isPast && (
                        <button
                          type="button"
                          onClick={() => window.open(getGoogleCalendarUrl(slot), '_blank')}
                          title="Google Calendar reminder scheduled. Click to open in Google Calendar."
                          className="h-[32px] px-3 rounded-lg border border-emerald-500/35 bg-emerald-500/10 hover:bg-emerald-500/20 text-[#6EE7B7] text-xs font-semibold flex items-center gap-1.5 transition-all shadow-[0_0_12px_rgba(16,185,129,0.12)] cursor-pointer"
                        >
                          <CalendarCheck className="w-3.5 h-3.5 text-[#34D399]" />
                          <span>Calendar Saved</span>
                        </button>
                      )}

                      {/* Cancel / Delete button */}
                      {!isPast && !isCompleted && onCancelSlot && (
                        <button
                          onClick={() => onCancelSlot(slot)}
                          className="text-xs text-[#61666F] hover:text-red-400 transition-colors px-2 py-1 rounded-md hover:bg-red-500/10 font-medium"
                          title={isOpen ? 'Delete open listing from marketplace' : 'Cancel booked session'}
                        >
                          {isOpen ? 'Delete' : 'Cancel'}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Mobile & Tablet Card View */}
                  <div className="lg:hidden flex flex-col gap-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex flex-col gap-0.5">
                        <span className="font-mono text-[11.5px] text-[#C6CBD5]">
                          {formatSlot(slot.start_time)}
                        </span>
                        <span className="text-[10px] text-[#61666F]">
                          {getCountdown(slot.start_time).label}
                        </span>
                      </div>
                      <span
                        className="font-mono text-[10px] px-2 py-0.5 rounded-[5px] border inline-flex items-center gap-1.5"
                        style={{
                          backgroundColor: statusBg,
                          borderColor: statusBc,
                          color: statusFg,
                        }}
                      >
                        <span
                          className="w-1.5 h-1.5 rounded-full"
                          style={{ backgroundColor: statusFg }}
                        />
                        {statusLabel}
                      </span>
                    </div>

                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-full border border-white/[0.08] bg-gradient-to-br from-[#1e2434] to-[#0f1219] flex items-center justify-center font-mono text-[10px] text-[#B6BDC9]">
                        {peerInitials}
                      </div>
                      <div className="flex flex-col min-w-0 flex-1">
                        <span className="text-[13px] font-semibold text-[#E8EAF0] truncate">
                          {peerName}
                        </span>
                        <span className="text-[11px] text-[#8A8F9C] truncate">
                          Role: <span style={{ color: myRole === 'Interviewer' ? '#cfe0ff' : '#9FA6B3' }}>{myRole}</span> · {peerRole}
                        </span>
                      </div>
                    </div>

                    <div className="p-2.5 rounded-lg bg-white/[0.03] backdrop-blur-sm border border-white/[0.06] flex flex-col gap-1">
                      <span className="text-[12.5px] font-medium text-[#E8EAF0]">
                        {slot.topic_title}
                      </span>
                      <span className="text-[10.5px] text-[#61666F]">
                        {slot.domain} · {slot.target_experience} · 45 min
                      </span>
                    </div>

                    <div className="flex items-center gap-2 pt-1 flex-wrap">
                      {isConfirmed && (
                        <a
                          href={slot.meeting_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-1 min-w-[130px] h-[34px] px-3 rounded-lg border border-emerald-500/40 bg-emerald-500/15 hover:bg-emerald-500/25 text-[#6EE7B7] text-xs font-semibold flex items-center justify-center gap-2"
                        >
                          <Video className="w-3.5 h-3.5 text-[#34D399]" />
                          Join Google Meet
                        </a>
                      )}

                      {isOpen && isHost && onReviewApplicants && (
                        <button
                          onClick={() => onReviewApplicants(slot)}
                          className="flex-1 min-w-[140px] h-[34px] px-3 rounded-lg border border-[#3e8bff]/40 bg-[#3e8bff]/15 hover:bg-[#3e8bff]/25 text-[#cfe0ff] text-xs font-semibold flex items-center justify-center gap-2"
                        >
                          <Users className="w-3.5 h-3.5 text-[#3e8bff]" />
                          Review Applicants ({pendingApplicantsCount})
                        </button>
                      )}

                      {(isPast || isTimeReached) && isConfirmed && (
                        <button
                          onClick={() => onOpenReview(slot)}
                          className="h-[34px] px-3 rounded-lg border border-amber-500/40 bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 text-xs font-semibold flex items-center justify-center gap-1.5"
                        >
                          <Star className="w-3.5 h-3.5 text-amber-400" />
                          Review
                        </button>
                      )}

                      {/* Mobile Google Calendar Button */}
                      {isConfirmed && !isPast && (
                        <button
                          type="button"
                          onClick={() => window.open(getGoogleCalendarUrl(slot), '_blank')}
                          title="Google Calendar reminder scheduled. Click to open in Google Calendar."
                          className="h-[34px] px-3 rounded-lg border border-emerald-500/35 bg-emerald-500/10 hover:bg-emerald-500/20 text-[#6EE7B7] text-xs font-semibold flex items-center justify-center gap-1.5 transition-all shadow-[0_0_12px_rgba(16,185,129,0.12)] cursor-pointer"
                        >
                          <CalendarCheck className="w-3.5 h-3.5 text-[#34D399]" />
                          <span>Calendar Saved</span>
                        </button>
                      )}

                      {!isPast && !isCompleted && onCancelSlot && (
                        <button
                          onClick={() => onCancelSlot(slot)}
                          className="text-xs text-[#61666F] hover:text-red-400 px-2.5 py-1.5 ml-auto font-medium rounded-md border border-transparent hover:border-red-500/20 transition-colors"
                        >
                          {isOpen ? 'Delete Listing' : 'Cancel'}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="py-16 px-6 text-center flex flex-col items-center justify-center gap-3">
            <div className="w-12 h-12 rounded-full border border-white/[0.08] bg-[#0C0E13] flex items-center justify-center text-[#61666F]">
              <Calendar className="w-6 h-6 opacity-60" />
            </div>
            <div className="flex flex-col gap-1 max-w-sm">
              <span className="font-semibold text-sm text-[#E8EAF0]">
                No sessions found in this view
              </span>
              <span className="text-xs text-[#8A8F9C] leading-relaxed">
                Explore open practice slots in the Marketplace or publish your own slot to be matched with a peer.
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
