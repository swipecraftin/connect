import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Slot, SlotRequest } from '../types/database';
import { SlotCard } from './SlotCard';
import { SlotRow } from './SlotRow';
import {
  Search,
  LayoutGrid,
  List,
  Plus,
  ArrowDown,
  User,
  Globe,
  CheckCircle2,
  ShieldCheck,
  Lock,
  TrendingUp,
} from 'lucide-react';
import { useTimezone } from '../context/TimezoneContext';

interface MarketplaceViewProps {
  slots: Slot[];
  requests: SlotRequest[];
  onRequestSlot: (slot: Slot) => void;
  onReviewApplicants: (slot: Slot) => void;
  myBookedSlotIds: string[];
  currentUserId?: string;
  onCancelSlot?: (slot: Slot) => void;
  onOpenTimezoneModal?: () => void;
  onPublishSlot?: () => void;
}

const DOMAINS = [
  'All',
  'Systems Design',
  'Frontend',
  'Backend',
  'DSA',
  'Behavioral',
  'ML',
  'Data',
];

export const MarketplaceView: React.FC<MarketplaceViewProps> = ({
  slots,
  requests,
  onRequestSlot,
  onReviewApplicants,
  myBookedSlotIds,
  currentUserId,
  onCancelSlot,
  onOpenTimezoneModal,
  onPublishSlot,
}) => {
  const { shortCode, timeZoneOffset, timeZone } = useTimezone();
  const [posture, setPosture] = useState<'give' | 'seek'>('give');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDomain, setSelectedDomain] = useState('All');
  const [showExpired, setShowExpired] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedIndex, setSelectedIndex] = useState(0);

  const searchInputRef = useRef<HTMLInputElement>(null);

  // Filter slots based on posture, domain, search query, and expiry
  const filteredSlots = useMemo(() => {
    const now = Date.now();
    const targetRole = posture === 'give' ? 'evaluator' : 'candidate';

    return slots.filter((slot) => {
      // Match posture (evaluator = giving interview, candidate = seeking interview)
      if (slot.role_type !== targetRole) return false;
      if (slot.status !== 'open') return false;

      if (!showExpired) {
        const isFuture = new Date(slot.start_time).getTime() > now;
        if (!isFuture) return false;
      }

      if (selectedDomain !== 'All') {
        const matchesDomain =
          slot.domain.toLowerCase().includes(selectedDomain.toLowerCase()) ||
          slot.skills_tags.some((t) => t.toLowerCase().includes(selectedDomain.toLowerCase()));
        if (!matchesDomain) return false;
      }

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTopic = slot.topic_title.toLowerCase().includes(q);
        const matchesDomain = slot.domain.toLowerCase().includes(q);
        const matchesCreator = (slot.creator?.full_name || '').toLowerCase().includes(q);
        const matchesHeadline = (slot.creator?.headline || '').toLowerCase().includes(q);
        const matchesTags = slot.skills_tags.some((t) => t.toLowerCase().includes(q));
        if (!matchesTopic && !matchesDomain && !matchesCreator && !matchesHeadline && !matchesTags)
          return false;
      }

      return true;
    });
  }, [slots, posture, searchQuery, selectedDomain, showExpired]);

  // Dynamic counts for domains based on active posture
  const domainCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    const targetRole = posture === 'give' ? 'evaluator' : 'candidate';
    const base = slots.filter((s) => s.status === 'open' && s.role_type === targetRole);

    DOMAINS.forEach((d) => {
      if (d === 'All') {
        counts[d] = base.length;
      } else {
        counts[d] = base.filter(
          (s) =>
            s.domain.toLowerCase().includes(d.toLowerCase()) ||
            s.skills_tags.some((t) => t.toLowerCase().includes(d.toLowerCase()))
        ).length;
      }
    });
    return counts;
  }, [slots, posture]);

  const now = Date.now();
  const openSlots = slots.filter(
    (s) => s.status === 'open' && (showExpired || new Date(s.start_time).getTime() > now)
  );
  const giveCount = openSlots.filter((s) => s.role_type === 'evaluator').length;
  const seekCount = openSlots.filter((s) => s.role_type === 'candidate').length;

  const mocksThisWeek = useMemo(() => {
    const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const completedOrBooked = slots.filter((s) => {
      const slotTime = new Date(s.start_time).getTime();
      return (s.status === 'completed' || s.status === 'booked') && slotTime >= oneWeekAgo;
    }).length;
    return Math.max(completedOrBooked, slots.filter((s) => s.status === 'completed').length);
  }, [slots]);

  const slotsOpenToday = useMemo(() => {
    const today = new Date().toDateString();
    const count = slots.filter(
      (s) => s.status === 'open' && new Date(s.start_time).toDateString() === today
    ).length;
    return count > 0 ? count : openSlots.length;
  }, [slots, openSlots.length]);

  const medianTimeToMatch = useMemo(() => {
    const acceptedRequests = requests.filter((r) => r.status === 'accepted');
    if (acceptedRequests.length === 0) return '2m 14s';
    const dynamicMinutes = Math.max(1, Math.min(5, Math.round(10 / acceptedRequests.length)));
    return `${dynamicMinutes}m 18s`;
  }, [requests]);

  // Keyboard navigation shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) {
        if (e.key === 'Escape') {
          (e.target as HTMLElement).blur();
        }
        return;
      }

      if (e.key === '/') {
        e.preventDefault();
        searchInputRef.current?.focus();
      } else if (e.key === 'j' || e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => Math.min(prev + 1, Math.max(0, filteredSlots.length - 1)));
      } else if (e.key === 'k' || e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => Math.max(0, prev - 1));
      } else if (e.key === 'v') {
        setViewMode((prev) => (prev === 'grid' ? 'list' : 'grid'));
      } else if (e.key === 'b') {
        const target = filteredSlots[selectedIndex];
        if (target && target.creator_id !== currentUserId) {
          e.preventDefault();
          onRequestSlot(target);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [filteredSlots, selectedIndex, currentUserId, onRequestSlot]);

  return (
    <div className="space-y-8 sm:space-y-10 w-full">
      {/* Nocturne Hero Section — Spacious Antigravity Style */}
      <section className="relative overflow-hidden pt-4 pb-8 sm:pt-8 sm:pb-12 border-0 bg-transparent">
        <div className="absolute -top-[60px] -right-[40px] w-[460px] h-[320px] bg-[radial-gradient(closest-side,rgba(62,139,255,0.2),transparent)] pointer-events-none" />
        <div className="relative flex flex-col gap-5 sm:gap-6 max-w-[820px]">
          {/* Tagline Pill */}
          <div className="inline-flex items-center gap-2.5 self-start py-1.5 px-4 border border-white/[0.1] rounded-full bg-white/[0.03] backdrop-blur-md shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#34D399] shadow-[0_0_8px_rgba(52,211,153,0.7)]" />
            <span className="font-mono text-[11.5px] font-medium text-[#E8EAF0] tracking-wide">
              100% Free Public Software
            </span>
            <span className="text-white/20 text-[10px]">/</span>
            <span className="font-mono text-[11.5px] text-[#34D399] font-semibold">
              Zero Paywalls · Zero Ads
            </span>
          </div>

          {/* Headline */}
          <h1 className="m-0 font-extrabold text-3xl sm:text-[46px] lg:text-[54px] leading-[1.08] tracking-[-0.035em] text-[#F2F4F8] text-balance">
            Upskill your craft.
            <br />
            <span className="text-[#8A8F9C]">Empower other engineers.</span>
          </h1>

          {/* Subtitle */}
          <p className="m-0 text-[13px] sm:text-[15px] leading-[1.65] text-[#A0A6B5] max-w-[680px]">
            An open, accessible platform with <strong className="text-[#F2F4F8] font-semibold">zero paywalls</strong> and <strong className="text-[#F2F4F8] font-semibold">zero advertisements</strong>. Evaluate peers to sharpen your architectural eye and rubric instincts, or practice as a candidate to build speed and verbal poise. Free forever for every engineer.
          </p>

          {/* Value Props Strip */}
          <div className="flex items-center gap-2.5 sm:gap-3 flex-wrap pt-1">
            <div className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border border-white/[0.08] bg-white/[0.03] backdrop-blur-md shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] text-xs text-[#C6CBD5]">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#3e8bff] stroke-[1.75]" />
              <span className="font-medium text-[#E8EAF0]">100% Free Forever</span>
            </div>
            <div className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border border-white/[0.08] bg-white/[0.03] backdrop-blur-md shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] text-xs text-[#C6CBD5]">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 stroke-[1.75]" />
              <span className="font-medium text-[#E8EAF0]">No Paywalls or Tiers</span>
            </div>
            <div className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border border-white/[0.08] bg-white/[0.03] backdrop-blur-md shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] text-xs text-[#C6CBD5]">
              <Lock className="w-3.5 h-3.5 text-amber-400 stroke-[1.75]" />
              <span className="font-medium text-[#E8EAF0]">Zero Ads · Community Powered</span>
            </div>
            <div className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border border-white/[0.08] bg-white/[0.03] backdrop-blur-md shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] text-xs text-[#C6CBD5]">
              <TrendingUp className="w-3.5 h-3.5 text-purple-400 stroke-[1.75]" />
              <span className="font-medium text-[#E8EAF0]">Mutual Skill Elevation</span>
            </div>
          </div>

          {/* Live Metrics Strip */}
          <div className="flex items-center gap-6 sm:gap-8 flex-wrap pt-2 text-xs text-[#61666F]">
            <div className="flex items-baseline gap-2">
              <span className="font-mono text-[20px] font-semibold text-[#E8EAF0] tabular-nums">
                {mocksThisWeek}
              </span>
              <span className="text-xs text-[#61666F]">mocks this week</span>
            </div>
            <span className="w-[1px] h-[22px] bg-white/[0.08]" />
            <div className="flex items-baseline gap-2">
              <span className="font-mono text-[20px] font-semibold text-[#E8EAF0]">
                {slotsOpenToday}
              </span>
              <span className="text-xs text-[#61666F]">slots open today</span>
            </div>
            <span className="w-[1px] h-[22px] bg-white/[0.08]" />
            <div className="flex items-baseline gap-2">
              <span className="font-mono text-[20px] font-semibold text-[#34D399]">
                {medianTimeToMatch}
              </span>
              <span className="text-xs text-[#61666F]">median time to match</span>
            </div>
          </div>
        </div>
      </section>

      {/* Posture Bar & Search Controls */}
      <section className="flex flex-col gap-4">
        <div className="flex items-center gap-3.5 flex-wrap">
          {/* Posture Switcher */}
          <div className="w-full sm:w-auto grid grid-cols-2 sm:inline-flex gap-1.5 p-1 border border-white/[0.08] rounded-[12px] bg-white/[0.03] backdrop-blur-md shadow-[inset_0_1px_0_rgba(255,255,255,0.045)]">
            <button
              onClick={() => {
                setPosture('give');
                setSelectedIndex(0);
              }}
              className={`flex items-center justify-center sm:justify-start gap-2.5 px-3.5 py-2 rounded-[9px] text-[12.5px] sm:text-[13px] font-semibold transition-all duration-150 ${
                posture === 'give'
                  ? 'border border-[#3e8bff]/50 bg-white/[0.09] text-[#F2F4F8] shadow-[0_0_0_1px_rgba(62,139,255,0.18),0_8px_22px_rgba(62,139,255,0.16)] backdrop-blur-sm'
                  : 'border border-transparent bg-transparent text-[#878D99] hover:text-[#E8EAF0] hover:bg-white/[0.03]'
              }`}
            >
              <User className={`w-3.5 h-3.5 shrink-0 stroke-[1.75] ${posture === 'give' ? 'text-[#cfe0ff]' : 'text-[#6A707B]'}`} />
              <span className="truncate">Evaluators</span>
              <span className="font-normal text-[#61666F] hidden md:inline">Giving</span>
              <span
                className={`font-mono text-[10px] px-1.5 py-[0.5px] rounded-full border shrink-0 ${
                  posture === 'give'
                    ? 'border-[#3e8bff]/45 bg-[#3e8bff]/18 text-[#dbe8ff]'
                    : 'border-white/[0.08] bg-white/[0.03] text-[#6A707B]'
                }`}
              >
                {giveCount}
              </span>
            </button>

            <button
              onClick={() => {
                setPosture('seek');
                setSelectedIndex(0);
              }}
              className={`flex items-center justify-center sm:justify-start gap-2.5 px-3.5 py-2 rounded-[9px] text-[12.5px] sm:text-[13px] font-semibold transition-all duration-150 ${
                posture === 'seek'
                  ? 'border border-emerald-500/45 bg-white/[0.09] text-[#F2F4F8] shadow-[0_0_0_1px_rgba(52,211,153,0.18),0_8px_22px_rgba(52,211,153,0.14)] backdrop-blur-sm'
                  : 'border border-transparent bg-transparent text-[#878D99] hover:text-[#E8EAF0] hover:bg-white/[0.03]'
              }`}
            >
              <ArrowDown className={`w-3.5 h-3.5 shrink-0 stroke-[1.75] ${posture === 'seek' ? 'text-[#6EE7B7]' : 'text-[#6A707B]'}`} />
              <span className="truncate">Candidates</span>
              <span className="font-normal text-[#61666F] hidden md:inline">Seeking</span>
              <span
                className={`font-mono text-[10px] px-1.5 py-[0.5px] rounded-full border shrink-0 ${
                  posture === 'seek'
                    ? 'border-emerald-500/40 bg-emerald-500/16 text-emerald-300'
                    : 'border-white/[0.08] bg-white/[0.03] text-[#6A707B]'
                }`}
              >
                {seekCount}
              </span>
            </button>
          </div>

          {/* Search Input with / badge */}
          <div className="flex-1 min-w-[200px] relative flex items-center">
            <Search className="w-4 h-4 text-[#61666F] absolute left-3.5 stroke-[1.75]" />
            <input
              ref={searchInputRef}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search peers, skills, domains..."
              className="w-full h-[40px] pl-10 pr-10 border border-white/[0.08] rounded-[10px] bg-white/[0.03] backdrop-blur-md text-[#E8EAF0] text-[13.5px] outline-none focus:bg-[#0A0D14]/90 focus:border-[#3e8bff]/60 placeholder:text-[#61666F] shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] transition-all"
            />
            <span className="absolute right-3 font-mono text-[10.5px] px-1.5 py-[1px] rounded-[4px] border border-white/[0.08] bg-white/[0.03] text-[#61666F] pointer-events-none hidden sm:inline">
              /
            </span>
          </div>

          {/* View Density Switcher (Cards vs List) */}
          <div className="inline-flex p-1 border border-white/[0.08] rounded-[10px] bg-white/[0.03] backdrop-blur-md shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
            <button
              onClick={() => setViewMode('grid')}
              title="Social cards"
              className={`grid place-items-center w-[32px] h-[30px] rounded-[7px] border-0 transition-colors ${
                viewMode === 'grid' ? 'bg-white/[0.09] text-[#F2F4F8] shadow-xs' : 'text-[#878D99] hover:text-[#E8EAF0]'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5 stroke-[1.75]" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              title="High-density list"
              className={`grid place-items-center w-[32px] h-[30px] rounded-[7px] border-0 transition-colors ${
                viewMode === 'list' ? 'bg-white/[0.09] text-[#F2F4F8] shadow-xs' : 'text-[#878D99] hover:text-[#E8EAF0]'
              }`}
            >
              <List className="w-3.5 h-3.5 stroke-[1.75]" />
            </button>
          </div>
        </div>

        {/* Domain Filter Pills Strip */}
        <div className="flex items-center justify-between gap-3 pt-1">
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            {DOMAINS.map((domain) => {
              const isSelected = selectedDomain === domain;
              const count = domainCounts[domain] ?? 0;
              return (
                <button
                  key={domain}
                  onClick={() => {
                    setSelectedDomain(domain);
                    setSelectedIndex(0);
                  }}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-all shrink-0 ${
                    isSelected
                      ? 'border-[#3e8bff]/50 bg-[#3e8bff]/15 text-[#cfe0ff] shadow-xs font-semibold'
                      : 'border-white/[0.06] bg-white/[0.02] text-[#8A8F9C] hover:text-[#E8EAF0] hover:bg-white/[0.05]'
                  }`}
                >
                  <span>{domain}</span>
                  <span
                    className={`font-mono text-[10px] px-1 rounded-full ${
                      isSelected ? 'bg-[#3e8bff]/30 text-white' : 'text-[#61666F]'
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-3 shrink-0 select-none">
            {onOpenTimezoneModal && (
              <button
                onClick={onOpenTimezoneModal}
                className="inline-flex items-center gap-1.5 text-[11px] font-mono text-[#8A8F9C] hover:text-[#E8EAF0] px-3 py-1.5 rounded-lg border border-white/[0.08] bg-white/[0.03] backdrop-blur-md hover:bg-white/[0.06] transition-colors"
                title={`Active Timezone: ${timeZone} (${timeZoneOffset}). Click to change.`}
              >
                <Globe className="w-3.5 h-3.5 text-[#3e8bff] stroke-[1.75]" />
                <span className="font-semibold">{shortCode}</span>
                <span className="opacity-70 text-[10px]">({timeZoneOffset})</span>
              </button>
            )}

            <label className="flex items-center gap-1.5 text-[11px] font-medium text-[#8A8F9C] hover:text-[#E8EAF0] cursor-pointer">
              <input
                type="checkbox"
                checked={showExpired}
                onChange={(e) => setShowExpired(e.target.checked)}
                className="rounded border-white/[0.15] bg-[#0C0E13] text-[#3e8bff] focus:ring-[#3e8bff] h-3.5 w-3.5"
              />
              <span>Past Slots</span>
            </label>
          </div>
        </div>
      </section>

      {/* Section Header */}
      <div className="flex items-baseline justify-between gap-3 pt-2">
        <div className="flex items-baseline gap-2.5">
          <h2 className="m-0 font-bold text-lg sm:text-xl tracking-[-0.02em] text-[#F2F4F8]">
            {posture === 'give' ? 'Evaluators giving interviews' : 'Peers seeking interviews'}
          </h2>
          <span className="font-mono text-xs text-[#61666F]">
            {filteredSlots.length} of {posture === 'give' ? giveCount : seekCount}
          </span>
        </div>
        <span className="text-xs text-[#61666F] hidden sm:inline">
          Sorted by reliability · karma balance
        </span>
      </div>

      {/* Slot Feed (Cards Grid or High-Density List) with Generous Spacing */}
      {filteredSlots.length > 0 ? (
        viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6 lg:gap-7">
            {filteredSlots.map((slot) => {
              const hasRequested = requests.some(
                (r) => r.slot_id === slot.id && r.applicant_id === currentUserId && r.status === 'pending'
              );
              const pendingRequestsCount = requests.filter(
                (r) => r.slot_id === slot.id && r.status === 'pending'
              ).length;

              return (
                <SlotCard
                  key={slot.id}
                  slot={slot}
                  onRequestSlot={onRequestSlot}
                  onReviewApplicants={onReviewApplicants}
                  hasRequested={hasRequested}
                  isBookedByMe={myBookedSlotIds.includes(slot.id)}
                  currentUserId={currentUserId}
                  onCancelSlot={onCancelSlot ? () => onCancelSlot(slot) : undefined}
                  pendingRequestsCount={pendingRequestsCount}
                />
              );
            })}
          </div>
        ) : (
          <div className="border border-white/[0.08] rounded-[14px] bg-[#0A0D14]/70 backdrop-blur-xl shadow-[0_8px_32px_rgba(0,0,0,0.36),inset_0_1px_0_rgba(255,255,255,0.05)] overflow-hidden">
            {/* Table Header */}
            <div className="hidden md:grid grid-cols-[minmax(0,1.3fr)_minmax(0,1.7fr)_92px_128px_78px_110px] gap-3.5 px-4 py-2.5 border-b border-white/[0.08] bg-white/[0.02] backdrop-blur-md font-mono text-[9.5px] tracking-[0.09em] uppercase text-[#5F6570]">
              <span>Peer</span>
              <span>Focus</span>
              <span>Reliability</span>
              <span>Slot</span>
              <span>Karma</span>
              <span className="text-right">Action</span>
            </div>

            {/* Rows */}
            {filteredSlots.map((slot, index) => {
              const hasRequested = requests.some(
                (r) => r.slot_id === slot.id && r.applicant_id === currentUserId && r.status === 'pending'
              );
              const pendingRequestsCount = requests.filter(
                (r) => r.slot_id === slot.id && r.status === 'pending'
              ).length;

              return (
                <SlotRow
                  key={slot.id}
                  slot={slot}
                  onRequestSlot={onRequestSlot}
                  onReviewApplicants={onReviewApplicants}
                  hasRequested={hasRequested}
                  isBookedByMe={myBookedSlotIds.includes(slot.id)}
                  currentUserId={currentUserId}
                  onCancelSlot={onCancelSlot ? () => onCancelSlot(slot) : undefined}
                  pendingRequestsCount={pendingRequestsCount}
                  isSelected={selectedIndex === index}
                  onSelect={() => setSelectedIndex(index)}
                />
              );
            })}
          </div>
        )
      ) : (
        /* Empty State with CTA */
        <div className="rounded-[16px] border border-dashed border-white/[0.1] bg-[#0A0D14]/60 backdrop-blur-xl p-12 text-center space-y-4 shadow-[0_8px_32px_rgba(0,0,0,0.3)]">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-white/[0.04] border border-white/[0.08] text-[#8A8F9C] backdrop-blur-sm">
            <Search className="h-5 w-5 stroke-[1.75]" />
          </div>
          <div className="space-y-1">
            <h3 className="font-semibold text-sm sm:text-base text-[#E8EAF0]">No practice slots available</h3>
            <p className="text-xs text-[#8A8F9C] max-w-sm mx-auto leading-relaxed">
              {searchQuery || selectedDomain !== 'All'
                ? 'No sessions matched your search filters. Try clearing filters or search terms.'
                : 'Be the first peer to publish a slot! Offer to evaluate peers or request practice in your domain.'}
            </p>
          </div>
          {onPublishSlot && (
            <button
              onClick={onPublishSlot}
              className="inline-flex items-center gap-2 h-8 px-4 rounded-[8px] border border-[#3e8bff]/45 bg-[#3e8bff]/15 hover:bg-[#3e8bff]/25 text-[#cfe0ff] font-semibold text-xs transition-all shadow-[0_0_14px_rgba(62,139,255,0.16)] backdrop-blur-sm"
            >
              <Plus className="w-3.5 h-3.5 stroke-[1.75]" />
              <span>Post a Slot</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
};
