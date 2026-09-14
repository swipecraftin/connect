import React, { useState, useEffect } from 'react';
import { Profile, Slot } from '../types/database';
import { calculateUserKarma } from '../utils/karma';
import {
  Sparkles,
  CheckCircle2,
  Save,
  X,
  TrendingUp,
  ArrowRight,
} from 'lucide-react';
import { CustomSelect } from './ui/CustomSelect';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

interface ProfileViewProps {
  profile: Profile | null;
  slots?: Slot[];
  onUpdateProfile: (updated: Partial<Profile>) => Promise<void>;
  onNavigateToMarketplace?: () => void;
}

interface ReceivedReview {
  id: string;
  reviewer_id: string;
  reviewer_name: string;
  reviewer_avatar?: string;
  reviewer_headline?: string;
  attended: boolean;
  rating_communication: number;
  rating_technical: number;
  rating_structure: number;
  constructive_feedback?: string;
  created_at: string;
  slot_topic?: string;
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
  'Staff / Principal (10y+)',
];

export const ProfileView: React.FC<ProfileViewProps> = ({
  profile,
  slots,
  onUpdateProfile,
  onNavigateToMarketplace,
}) => {
  const [fullName, setFullName] = useState(profile?.full_name || '');
  const [avatarUrl, setAvatarUrl] = useState(profile?.avatar_url || '');
  const [headline, setHeadline] = useState(profile?.headline || '');
  const [primaryDomain, setPrimaryDomain] = useState(profile?.primary_domain || DOMAINS[0]);
  const [yearsOfExperience, setYearsOfExperience] = useState(profile?.years_of_experience || SENIORITY_LEVELS[1]);
  const [skillsTags, setSkillsTags] = useState<string[]>(
    profile?.skills_tags?.length ? profile.skills_tags : ['Systems Design', 'Backend', 'Distributed Systems', 'DSA']
  );
  const [newTagInput, setNewTagInput] = useState('');
  const [targetCompanies, setTargetCompanies] = useState(profile?.target_companies || '');
  const [bio, setBio] = useState(profile?.bio || '');
  const [linkedinUrl, setLinkedinUrl] = useState(profile?.linkedin_url || '');
  const [githubUrl, setGithubUrl] = useState(profile?.github_url || '');
  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Dynamic Peer Reviews State
  const [receivedReviews, setReceivedReviews] = useState<ReceivedReview[]>([]);
  const [loadingReviews, setLoadingReviews] = useState(false);

  useEffect(() => {
    const currentProfileId = profile?.id;
    if (!currentProfileId) return;
    let isMounted = true;

    async function loadReviews() {
      setLoadingReviews(true);
      const loaded: ReceivedReview[] = [];

      try {
        if (isSupabaseConfigured) {
          const { data, error } = await supabase
            .from('session_reviews')
            .select(`
              id,
              reviewer_id,
              attended,
              rating_communication,
              rating_technical,
              rating_structure,
              constructive_feedback,
              created_at,
              slot:slots(topic_title)
            `)
            .eq('reviewee_id', currentProfileId)
            .order('created_at', { ascending: false });

          if (!error && data && data.length > 0) {
            const reviewerIds = Array.from(new Set(data.map((r: any) => r.reviewer_id)));
            const { data: revProfiles } = await supabase
              .from('profiles')
              .select('id, full_name, avatar_url, headline')
              .in('id', reviewerIds);

            const profileMap = new Map((revProfiles || []).map((p: any) => [p.id, p]));

            data.forEach((r: any) => {
              const revProfile = profileMap.get(r.reviewer_id);
              loaded.push({
                id: r.id,
                reviewer_id: r.reviewer_id,
                reviewer_name: revProfile?.full_name || 'Verified Peer',
                reviewer_avatar: revProfile?.avatar_url,
                reviewer_headline: revProfile?.headline || 'Software Engineer',
                attended: r.attended,
                rating_communication: r.rating_communication,
                rating_technical: r.rating_technical,
                rating_structure: r.rating_structure,
                constructive_feedback: r.constructive_feedback,
                created_at: r.created_at,
                slot_topic: r.slot?.topic_title,
              });
            });
          }
        }

        // Local storage cache fallback
        try {
          const localRevJson = localStorage.getItem('peermock_reviews');
          if (localRevJson) {
            const parsed = JSON.parse(localRevJson);
            if (Array.isArray(parsed)) {
              parsed
                .filter((r: any) => r.reviewee_id === currentProfileId && !loaded.some((l) => l.id === r.id))
                .forEach((r: any) => {
                  loaded.push({
                    id: r.id || `local-${Math.random()}`,
                    reviewer_id: r.reviewer_id,
                    reviewer_name: 'Peer Evaluator',
                    reviewer_headline: 'Software Engineer',
                    attended: r.attended,
                    rating_communication: r.rating_communication || 5,
                    rating_technical: r.rating_technical || 5,
                    rating_structure: r.rating_structure || 5,
                    constructive_feedback: r.constructive_feedback || r.feedback,
                    created_at: r.created_at || new Date().toISOString(),
                  });
                });
            }
          }
        } catch {
          // ignore storage error
        }

        if (isMounted) {
          setReceivedReviews(loaded);
        }
      } catch (err) {
        console.warn('Error loading reviews:', err);
      } finally {
        if (isMounted) setLoadingReviews(false);
      }
    }

    loadReviews();

    return () => {
      isMounted = false;
    };
  }, [profile?.id]);

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || '');
      setAvatarUrl(profile.avatar_url || '');
      setHeadline(profile.headline || '');
      setPrimaryDomain(profile.primary_domain || DOMAINS[0]);
      setYearsOfExperience(profile.years_of_experience || SENIORITY_LEVELS[1]);
      if (profile.skills_tags && profile.skills_tags.length > 0) {
        setSkillsTags(profile.skills_tags);
      }
      setTargetCompanies(profile.target_companies || '');
      setBio(profile.bio || '');
      setLinkedinUrl(profile.linkedin_url || '');
      setGithubUrl(profile.github_url || '');
    }
  }, [profile]);

  const handleAddTag = () => {
    const trimmed = newTagInput.trim().replace(/^#/, '');
    if (!trimmed) return;
    if (skillsTags.includes(trimmed)) {
      setNewTagInput('');
      return;
    }
    setSkillsTags([...skillsTags, trimmed]);
    setNewTagInput('');
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setSkillsTags(skillsTags.filter((t) => t !== tagToRemove));
  };

  const handleKeyDownTag = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      handleAddTag();
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setErrorMessage(null);
    setSavedSuccess(false);

    try {
      await onUpdateProfile({
        full_name: fullName,
        avatar_url: avatarUrl,
        headline,
        primary_domain: primaryDomain,
        years_of_experience: yearsOfExperience,
        skills_tags: skillsTags,
        target_companies: targetCompanies,
        bio,
        linkedin_url: linkedinUrl,
        github_url: githubUrl,
      });
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 4000);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to update profile.');
    } finally {
      setIsSaving(false);
    }
  };

  const getInitials = (name: string) => {
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return (name.slice(0, 2) || 'PM').toUpperCase();
  };

  const nameDisplay = fullName || profile?.full_name || 'Anonymous Peer';
  const initials = getInitials(nameDisplay);
  const headlineDisplay = headline || profile?.headline || 'Software Engineer · Seeking and Giving Mocks';
  const reliability = Number(profile?.reliability_score ?? 100);

  // Dynamic Karma Calculation
  const karmaData = calculateUserKarma(profile, slots || [], profile?.id);
  const karmaValue = karmaData.karmaScore.toLocaleString('en-US');
  const givenMocks = karmaData.givenMocks;
  const takenMocks = karmaData.takenMocks;
  const totalMocks = givenMocks + takenMocks || (profile?.total_sessions_completed ?? 0);
  const balancePercentage = karmaData.reciprocityRatio;
  const tier = karmaData.tier;
  const tierColor = karmaData.tierColor;
  const actionsHistory = karmaData.actionsHistory;

  return (
    <div className="flex flex-col gap-6 w-full animate-in fade-in duration-200">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-3">
        <div className="flex items-baseline gap-3">
          <h2 className="m-0 font-sans font-semibold text-[22px] tracking-[-0.025em] text-[#F2F4F8]">
            Profile & Reputation
          </h2>
          <span className="font-mono text-[11px] text-[#61666F]">
            Equal peer standing · 100% verified
          </span>
        </div>

        {savedSuccess && (
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-[#6EE7B7] font-mono text-xs animate-in fade-in">
            <CheckCircle2 className="w-3.5 h-3.5 text-[#34D399]" />
            <span>Profile saved</span>
          </div>
        )}
      </div>

      {/* Screen 3: Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-start">
        {/* Left Column: Identity, Metric Cards & Reciprocity Bar */}
        <section className="flex flex-col gap-4 p-5 rounded-[16px] border border-white/[0.08] bg-[#0A0D14]/70 backdrop-blur-xl shadow-[0_8px_32px_rgba(0,0,0,0.36),inset_0_1px_0_rgba(255,255,255,0.06)]">
          <div className="flex items-center gap-3.5">
            <div className="relative">
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt={nameDisplay}
                  className="w-[52px] h-[52px] rounded-full object-cover border border-white/[0.08]"
                />
              ) : (
                <div className="w-[52px] h-[52px] rounded-full border border-white/[0.08] bg-gradient-to-br from-[#1e2434] to-[#0f1219] flex items-center justify-center font-mono text-[15px] text-[#B6BDC9]">
                  {initials}
                </div>
              )}
              <span className="absolute -right-0.5 -bottom-0.5 w-3 h-3 rounded-full bg-[#34D399] border-2 border-[#0A0D14]" />
            </div>
            <div className="flex flex-col gap-0.5 min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-[16px] tracking-[-0.02em] text-[#F2F4F8] truncate">
                  {nameDisplay}
                </span>
                {/* Meta-grade Verified Geometric Badge */}
                <span title="Verified Peer Member" className="inline-flex items-center text-[#3e8bff] shrink-0">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="shrink-0">
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
              </div>
              <span className="text-[12px] text-[#8A8F9C] truncate">
                {headlineDisplay}
              </span>
            </div>
          </div>

          {/* 3 Metric Cards Grid */}
          <div className="grid grid-cols-3 gap-2.5">
            <div className="flex flex-col gap-1 p-3 rounded-[10px] border border-white/[0.08] bg-white/[0.03] backdrop-blur-md shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
              <div className="flex items-center justify-between gap-1">
                <span className="font-mono text-[17px] text-[#E8EAF0] font-semibold">
                  {karmaValue}
                </span>
                <span
                  className="font-mono text-[9px] px-1.5 py-[0.5px] rounded border font-semibold"
                  style={{
                    borderColor: `${tierColor}45`,
                    backgroundColor: `${tierColor}15`,
                    color: tierColor,
                  }}
                >
                  {tier}
                </span>
              </div>
              <span className="text-[10.5px] text-[#61666F]">karma</span>
            </div>

            <div className="flex flex-col gap-0.5 p-3 rounded-[10px] border border-white/[0.08] bg-white/[0.03] backdrop-blur-md shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
              <span className="font-mono text-[17px] text-[#6EE7B7] font-semibold">
                {reliability}%
              </span>
              <span className="text-[10.5px] text-[#61666F]">reliability</span>
            </div>

            <div className="flex flex-col gap-0.5 p-3 rounded-[10px] border border-white/[0.08] bg-white/[0.03] backdrop-blur-md shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
              <span className="font-mono text-[17px] text-[#E8EAF0] font-semibold">
                {totalMocks}
              </span>
              <span className="text-[10.5px] text-[#61666F]">completed mocks</span>
            </div>
          </div>

          {/* Mutual Upskilling Balance Section */}
          <div className="flex flex-col gap-2 pt-1 border-t border-white/[0.06]">
            <div className="flex justify-between items-baseline text-[11.5px] text-[#8A8F9C]">
              <span className="flex items-center gap-1.5 font-medium text-[#D1D5DB]">
                <TrendingUp className="w-3.5 h-3.5 text-[#3e8bff] stroke-[1.75]" />
                Mutual Upskilling Balance
              </span>
              <span className="font-mono text-[#C6CBD5]">
                {givenMocks} evaluated · {takenMocks} practiced
              </span>
            </div>

            {/* Gradient Bar */}
            <div className="h-[6px] rounded-[3px] bg-white/[0.06] overflow-hidden">
              <div
                className="h-full transition-all duration-500 rounded-[3px]"
                style={{
                  width: `${balancePercentage}%`,
                  background: 'linear-gradient(90deg, #3e8bff, #34D399)',
                }}
              />
            </div>

            <span className="text-[11px] text-[#8A8F9C] leading-relaxed">
              Evaluating peers sharpens your ability to critique architecture and evaluate rubrics, while practicing as candidate refines your execution under pressure.
            </span>
          </div>

          {/* Karma Ledger Activity Feed */}
          {actionsHistory.length > 0 && (
            <div className="flex flex-col gap-1.5 pt-2 border-t border-white/[0.06]">
              <div className="flex items-center justify-between text-[11px] font-mono text-[#8A8F9C]">
                <span className="flex items-center gap-1.5">
                  <TrendingUp className="w-3.5 h-3.5 text-[#3e8bff] stroke-[1.75]" />
                  <span>Karma Action Ledger</span>
                </span>
                <span className="text-[10px] text-[#61666F]">Base 100 + actions</span>
              </div>
              <div className="flex flex-col gap-1 max-h-[110px] overflow-y-auto pr-1">
                {actionsHistory.slice(0, 4).map((a) => (
                  <div
                    key={a.id}
                    className="flex items-center justify-between py-1 px-2.5 rounded bg-white/[0.03] text-[11px] border border-white/[0.05] backdrop-blur-sm"
                  >
                    <span className="text-[#C6CBD5] truncate max-w-[220px]">
                      {a.label}
                    </span>
                    <span
                      className={`font-mono font-bold ${
                        a.delta > 0 ? 'text-[#6EE7B7]' : 'text-red-400'
                      }`}
                    >
                      {a.delta > 0 ? `+${a.delta}` : a.delta}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>

        {/* Right Column: Evaluates Domains & Dynamic Peer Feedback */}
        <section className="flex flex-col gap-3.5 p-5 rounded-[16px] border border-white/[0.08] bg-[#0A0D14]/70 backdrop-blur-xl shadow-[0_8px_32px_rgba(0,0,0,0.36),inset_0_1px_0_rgba(255,255,255,0.06)]">
          <span className="font-mono text-[9.5px] uppercase tracking-[0.09em] text-[#5F6570]">
            Evaluates & Specialties
          </span>

          <div className="flex gap-1.5 flex-wrap">
            {skillsTags.map((t, idx) => (
              <span
                key={idx}
                className="text-[11.5px] px-2.5 py-1 rounded-md bg-white/[0.04] backdrop-blur-sm text-[#AEB5C2] border border-white/[0.06]"
              >
                {t}
              </span>
            ))}
          </div>

          <div className="flex items-center justify-between mt-1.5">
            <span className="font-mono text-[9.5px] uppercase tracking-[0.09em] text-[#5F6570]">
              Recent peer feedback & calibrations
            </span>
            {receivedReviews.length > 0 && (
              <span className="font-mono text-[10px] text-[#6EE7B7]">
                {receivedReviews.length} verified review{receivedReviews.length > 1 ? 's' : ''}
              </span>
            )}
          </div>

          {loadingReviews ? (
            <div className="p-6 text-center font-mono text-xs text-[#61666F] animate-pulse">
              Loading peer calibrations...
            </div>
          ) : receivedReviews.length === 0 ? (
            /* Super Note Empty State */
            <div className="flex flex-col items-center justify-center text-center p-6 sm:p-7 rounded-[14px] border border-dashed border-[#3e8bff]/30 bg-gradient-to-b from-[#3e8bff]/[0.06] via-white/[0.02] to-transparent backdrop-blur-md gap-3 my-1">
              <div className="w-11 h-11 rounded-full bg-[#3e8bff]/15 border border-[#3e8bff]/30 flex items-center justify-center text-[#3e8bff] shadow-[0_0_16px_rgba(62,139,255,0.2)]">
                <Sparkles className="w-5 h-5 stroke-[1.75]" />
              </div>
              <div className="flex flex-col gap-1 max-w-sm">
                <h4 className="font-bold text-sm text-[#F2F4F8]">
                  Ready to get your first feedback?
                </h4>
                <p className="text-xs text-[#8A8F9C] leading-relaxed">
                  Give your first interview or take a practice session to unlock calibrated peer ratings, constructive critique, and detailed rubric insights!
                </p>
              </div>
              {onNavigateToMarketplace && (
                <button
                  type="button"
                  onClick={onNavigateToMarketplace}
                  className="mt-1 inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-[#3e8bff] hover:bg-[#3277e6] text-white text-xs font-semibold shadow-[0_4px_14px_rgba(62,139,255,0.35)] transition-all cursor-pointer"
                >
                  <span>Explore Open Slots</span>
                  <ArrowRight className="w-3.5 h-3.5 stroke-[1.75]" />
                </button>
              )}
            </div>
          ) : (
            /* Dynamic Reviews List */
            <div className="flex flex-col gap-3">
              {receivedReviews.map((rev) => (
                <div
                  key={rev.id}
                  className="flex flex-col gap-2 p-3 rounded-lg bg-white/[0.03] backdrop-blur-sm border border-white/[0.06]"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {rev.reviewer_avatar ? (
                        <img
                          src={rev.reviewer_avatar}
                          alt={rev.reviewer_name}
                          className="w-5 h-5 rounded-full object-cover border border-white/[0.08]"
                        />
                      ) : (
                        <div className="w-5 h-5 rounded-full bg-white/[0.06] flex items-center justify-center font-mono text-[9px] text-[#A0A8B8]">
                          {rev.reviewer_name.slice(0, 2).toUpperCase()}
                        </div>
                      )}
                      <span className="text-xs font-semibold text-[#E8EAF0]">
                        {rev.reviewer_name}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 font-mono text-[10px]">
                      <span className="text-[#6EE7B7]">Comm {rev.rating_communication}/5</span>
                      <span className="text-white/20">·</span>
                      <span className="text-[#38BDF8]">Tech {rev.rating_technical}/5</span>
                      <span className="text-white/20">·</span>
                      <span className="text-[#A78BFA]">Struct {rev.rating_structure}/5</span>
                    </div>
                  </div>

                  {rev.constructive_feedback ? (
                    <p className="m-0 text-[12.5px] leading-[1.5] text-[#C6CBD5] border-l-2 border-[#3e8bff]/60 pl-2.5 italic">
                      "{rev.constructive_feedback}"
                    </p>
                  ) : (
                    <p className="m-0 text-[12px] text-[#8A8F9C] italic pl-2.5">
                      Completed session successfully with high-signal rubric calibration.
                    </p>
                  )}

                  {rev.slot_topic && (
                    <span className="text-[10px] font-mono text-[#61666F]">
                      Topic: {rev.slot_topic}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      {/* Edit Profile & Technical Settings Form */}
      <section className="p-5 sm:p-6 rounded-[16px] border border-white/[0.08] bg-[#0A0D14]/70 backdrop-blur-xl shadow-[0_8px_32px_rgba(0,0,0,0.36),inset_0_1px_0_rgba(255,255,255,0.06)] flex flex-col gap-5">
        <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2 border-b border-white/[0.06] pb-4">
          <div>
            <h3 className="font-sans font-semibold text-base text-[#F2F4F8]">
              Edit Profile & Technical Calibration
            </h3>
            <p className="text-xs text-[#8A8F9C] mt-0.5">
              Keep your profile updated so peers can match your technical level accurately.
            </p>
          </div>

          {errorMessage && (
            <span className="text-xs text-red-400 font-mono">
              {errorMessage}
            </span>
          )}
        </div>

        <form onSubmit={handleSave} className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          {/* Full Name */}
          <div className="flex flex-col gap-1.5">
            <label className="font-mono text-[10px] uppercase tracking-wider text-[#8A8F9C]">
              Full Name
            </label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="e.g. Rohit Kulkarni"
              className="h-[36px] px-3 rounded-lg border border-white/[0.08] bg-white/[0.03] backdrop-blur-md shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] text-[#E8EAF0] text-xs focus:outline-none focus:bg-[#0A0D14]/90 focus:border-[#3e8bff]/60 transition-colors"
              required
            />
          </div>

          {/* Headline */}
          <div className="flex flex-col gap-1.5">
            <label className="font-mono text-[10px] uppercase tracking-wider text-[#8A8F9C]">
              Headline & Current Focus
            </label>
            <input
              type="text"
              value={headline}
              onChange={(e) => setHeadline(e.target.value)}
              placeholder="e.g. SDE-2 @ Stripe · Distributed Systems"
              className="h-[36px] px-3 rounded-lg border border-white/[0.08] bg-white/[0.03] backdrop-blur-md shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] text-[#E8EAF0] text-xs focus:outline-none focus:bg-[#0A0D14]/90 focus:border-[#3e8bff]/60 transition-colors"
            />
          </div>

          {/* Primary Domain */}
          <CustomSelect
            label="Primary Domain"
            value={primaryDomain}
            onChange={setPrimaryDomain}
            options={DOMAINS}
            placeholder="Select domain"
          />

          {/* Seniority Level */}
          <CustomSelect
            label="Seniority / Experience"
            value={yearsOfExperience}
            onChange={setYearsOfExperience}
            options={SENIORITY_LEVELS}
            placeholder="Select experience level"
          />

          {/* Skills Tags Input */}
          <div className="md:col-span-2 flex flex-col gap-1.5">
            <label className="font-mono text-[10px] uppercase tracking-wider text-[#8A8F9C]">
              Evaluates Skills Tags (press Enter or comma to add)
            </label>
            <div className="flex gap-1.5 flex-wrap items-center p-2 rounded-lg border border-white/[0.08] bg-white/[0.03] backdrop-blur-md shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] min-h-[38px]">
              {skillsTags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-white/[0.06] text-[#cfe0ff] text-[11px] border border-white/[0.08]"
                >
                  {tag}
                  <button
                    type="button"
                    onClick={() => handleRemoveTag(tag)}
                    className="hover:text-red-400"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
              <input
                type="text"
                value={newTagInput}
                onChange={(e) => setNewTagInput(e.target.value)}
                onKeyDown={handleKeyDownTag}
                placeholder="Add tag (e.g. Distributed, React)..."
                className="bg-transparent text-xs text-[#E8EAF0] focus:outline-none flex-1 min-w-[140px] px-1"
              />
            </div>
          </div>

          {/* Target Companies */}
          <div className="flex flex-col gap-1.5">
            <label className="font-mono text-[10px] uppercase tracking-wider text-[#8A8F9C]">
              Target Companies
            </label>
            <input
              type="text"
              value={targetCompanies}
              onChange={(e) => setTargetCompanies(e.target.value)}
              placeholder="e.g. Google, Meta, Stripe, Uber"
              className="h-[36px] px-3 rounded-lg border border-white/[0.08] bg-white/[0.03] backdrop-blur-md shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] text-[#E8EAF0] text-xs focus:outline-none focus:bg-[#0A0D14]/90 focus:border-[#3e8bff]/60 transition-colors"
            />
          </div>

          {/* Avatar URL */}
          <div className="flex flex-col gap-1.5">
            <label className="font-mono text-[10px] uppercase tracking-wider text-[#8A8F9C]">
              Avatar Image URL
            </label>
            <input
              type="url"
              value={avatarUrl}
              onChange={(e) => setAvatarUrl(e.target.value)}
              placeholder="https://images.unsplash.com/..."
              className="h-[36px] px-3 rounded-lg border border-white/[0.08] bg-white/[0.03] backdrop-blur-md shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] text-[#E8EAF0] text-xs focus:outline-none focus:bg-[#0A0D14]/90 focus:border-[#3e8bff]/60 transition-colors"
            />
          </div>

          {/* LinkedIn URL */}
          <div className="flex flex-col gap-1.5">
            <label className="font-mono text-[10px] uppercase tracking-wider text-[#8A8F9C]">
              LinkedIn Profile
            </label>
            <input
              type="url"
              value={linkedinUrl}
              onChange={(e) => setLinkedinUrl(e.target.value)}
              placeholder="https://linkedin.com/in/username"
              className="h-[36px] px-3 rounded-lg border border-white/[0.08] bg-white/[0.03] backdrop-blur-md shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] text-[#E8EAF0] text-xs focus:outline-none focus:bg-[#0A0D14]/90 focus:border-[#3e8bff]/60 transition-colors"
            />
          </div>

          {/* GitHub URL */}
          <div className="flex flex-col gap-1.5">
            <label className="font-mono text-[10px] uppercase tracking-wider text-[#8A8F9C]">
              GitHub Profile
            </label>
            <input
              type="url"
              value={githubUrl}
              onChange={(e) => setGithubUrl(e.target.value)}
              placeholder="https://github.com/username"
              className="h-[36px] px-3 rounded-lg border border-white/[0.08] bg-white/[0.03] backdrop-blur-md shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] text-[#E8EAF0] text-xs focus:outline-none focus:bg-[#0A0D14]/90 focus:border-[#3e8bff]/60 transition-colors"
            />
          </div>

          {/* Bio */}
          <div className="md:col-span-2 flex flex-col gap-1.5">
            <label className="font-mono text-[10px] uppercase tracking-wider text-[#8A8F9C]">
              Bio & Interview Preferences
            </label>
            <textarea
              rows={3}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Give a short overview of your background, areas of focus, and what types of mock interview challenges you give or seek."
              className="p-3 rounded-lg border border-white/[0.08] bg-white/[0.03] backdrop-blur-md shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] text-[#E8EAF0] text-xs focus:outline-none focus:bg-[#0A0D14]/90 focus:border-[#3e8bff]/60 transition-colors leading-relaxed"
            />
          </div>

          {/* Save Button */}
          <div className="md:col-span-2 flex justify-end pt-2">
            <button
              type="submit"
              disabled={isSaving}
              className="w-full sm:w-auto h-[38px] px-6 rounded-lg border border-[#3e8bff]/50 bg-[#3e8bff]/15 hover:bg-[#3e8bff]/25 text-[#cfe0ff] text-xs font-semibold flex items-center justify-center gap-2 transition-all disabled:opacity-50 active:scale-[0.98] backdrop-blur-md shadow-[0_0_16px_rgba(62,139,255,0.18)]"
            >
              <Save className="w-3.5 h-3.5 text-[#3e8bff] stroke-[1.75]" />
              <span>{isSaving ? 'Saving...' : 'Save Profile Changes'}</span>
            </button>
          </div>
        </form>
      </section>
    </div>
  );
};
