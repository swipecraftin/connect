import React from 'react';
import { Profile } from '../types/database';
import {
  X,
  ShieldCheck,
  Briefcase,
  Layers,
  Building2,
  ExternalLink,
  Github,
  Linkedin,
  CheckCircle2,
  XCircle,
} from 'lucide-react';

interface ApplicantProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  applicant: Profile | null;
  onAccept?: () => void;
  onDecline?: () => void;
}

export const ApplicantProfileModal: React.FC<ApplicantProfileModalProps> = ({
  isOpen,
  onClose,
  applicant,
  onAccept,
  onDecline,
}) => {
  React.useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen || !applicant) return null;

  const getInitials = (name: string) => {
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return (name.slice(0, 2) || 'PM').toUpperCase();
  };

  const reliability = applicant.reliability_score ?? 100;
  const sessions = applicant.total_sessions_completed ?? 0;
  const noShows = applicant.no_show_count ?? 0;
  const skills = applicant.skills_tags || [];
  const targetCompanies = applicant.target_companies
    ? applicant.target_companies.split(',').map((s) => s.trim()).filter(Boolean)
    : [];

  return (
    <div
      onClick={onClose}
      data-lenis-prevent="true"
      className="fixed inset-0 z-[70] grid place-items-center p-4 bg-[#040507]/85 backdrop-blur-md animate-in fade-in duration-150 overscroll-contain"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        data-lenis-prevent="true"
        className="w-full max-w-[540px] flex flex-col gap-3.5 p-4 sm:p-6 rounded-[16px] border border-white/[0.12] bg-[#080B12]/92 backdrop-blur-2xl shadow-[0_24px_64px_rgba(0,0,0,0.8),inset_0_1px_0_rgba(255,255,255,0.08)] max-h-[92vh] overflow-hidden overscroll-contain animate-in zoom-in-95 duration-200"
      >
        {/* Header Strip */}
        <div className="shrink-0 flex items-start justify-between">
          <div className="flex flex-col gap-0.5">
            <span className="font-sans font-bold text-[16px] sm:text-[17px] tracking-[-0.02em] text-[#F2F4F8]">
              Applicant Profile Details
            </span>
            <span className="text-[11.5px] sm:text-[12px] text-[#8A8F9C]">
              Review peer credentials, reliability history, and target areas
            </span>
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
          {/* Profile Card Header */}
          <div className="p-4 rounded-xl border border-white/[0.08] bg-white/[0.025] backdrop-blur-md flex items-start gap-3.5">
          <div className="relative shrink-0">
            {applicant.avatar_url ? (
              <img
                src={applicant.avatar_url}
                alt={applicant.full_name}
                className="w-14 h-14 rounded-full object-cover border-2 border-white/[0.12]"
              />
            ) : (
              <div className="w-14 h-14 rounded-full border border-white/[0.12] bg-gradient-to-br from-[#1e2434] to-[#0f1219] flex items-center justify-center font-mono text-[16px] font-bold text-[#B6BDC9]">
                {getInitials(applicant.full_name)}
              </div>
            )}
            <span className="absolute -right-0.5 -bottom-0.5 w-3.5 h-3.5 rounded-full bg-[#34D399] border-2 border-[#080B12]" />
          </div>

          <div className="flex-1 min-w-0 flex flex-col gap-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-bold text-[16px] text-[#F2F4F8] truncate">
                {applicant.full_name}
              </span>
              <span className="font-mono text-[10.5px] px-2 py-0.5 rounded-[4px] border border-emerald-500/40 bg-emerald-500/10 text-[#6EE7B7] flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" />
                {reliability}% Reliable
              </span>
            </div>

            <span className="text-[12.5px] text-[#A6ACB8] font-medium">
              {applicant.headline || 'Software Engineer'}
            </span>

            <div className="flex items-center gap-3 text-[11.5px] text-[#787E8C] pt-0.5 flex-wrap">
              <span className="flex items-center gap-1">
                <Briefcase className="w-3 h-3 text-[#3e8bff]" />
                {applicant.primary_domain}
              </span>
              <span>·</span>
              <span className="flex items-center gap-1">
                <Layers className="w-3 h-3 text-[#AEB5C2]" />
                {applicant.years_of_experience || 'Mid (3-5y)'}
              </span>
            </div>
          </div>
        </div>

        {/* Reliability & History Metrics */}
        <div className="grid grid-cols-3 gap-2 p-3 rounded-xl border border-white/[0.08] bg-white/[0.02] backdrop-blur-md text-center">
          <div className="flex flex-col gap-0.5">
            <span className="font-mono text-[15px] font-bold text-[#6EE7B7]">
              {reliability}%
            </span>
            <span className="text-[10.5px] text-[#7C8391] uppercase tracking-wider font-mono">
              Reliability
            </span>
          </div>
          <div className="flex flex-col gap-0.5 border-x border-white/[0.08]">
            <span className="font-mono text-[15px] font-bold text-[#E8EAF0]">
              {sessions}
            </span>
            <span className="text-[10.5px] text-[#7C8391] uppercase tracking-wider font-mono">
              Sessions Done
            </span>
          </div>
          <div className="flex flex-col gap-0.5">
            <span
              className={`font-mono text-[15px] font-bold ${
                noShows > 0 ? 'text-red-400' : 'text-[#A0A6B2]'
              }`}
            >
              {noShows}
            </span>
            <span className="text-[10.5px] text-[#7C8391] uppercase tracking-wider font-mono">
              No-Shows
            </span>
          </div>
        </div>

        {/* Bio Section */}
        {applicant.bio && (
          <div className="flex flex-col gap-1.5 p-3 rounded-xl border border-white/[0.08] bg-white/[0.02] backdrop-blur-md">
            <span className="text-[11px] font-mono uppercase tracking-wider text-[#8A8F9C]">
              About / Background
            </span>
            <p className="text-[12.5px] text-[#C6CBD5] leading-relaxed whitespace-pre-wrap">
              {applicant.bio}
            </p>
          </div>
        )}

        {/* Target Companies */}
        {targetCompanies.length > 0 && (
          <div className="flex flex-col gap-1.5 p-3 rounded-xl border border-white/[0.08] bg-white/[0.02] backdrop-blur-md">
            <div className="flex items-center gap-1.5 text-[11px] font-mono uppercase tracking-wider text-[#8A8F9C]">
              <Building2 className="w-3 h-3 text-[#3e8bff]" />
              <span>Target Companies</span>
            </div>
            <div className="flex items-center gap-1.5 flex-wrap">
              {targetCompanies.map((c, i) => (
                <span
                  key={i}
                  className="px-2.5 py-0.5 rounded-md text-[11px] font-medium bg-white/[0.04] text-[#B8C0D0] border border-white/[0.08]"
                >
                  {c}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Core Skills */}
        {skills.length > 0 && (
          <div className="flex flex-col gap-1.5 p-3 rounded-xl border border-white/[0.08] bg-white/[0.02] backdrop-blur-md">
            <span className="text-[11px] font-mono uppercase tracking-wider text-[#8A8F9C]">
              Technical Skills & Specializations
            </span>
            <div className="flex items-center gap-1.5 flex-wrap">
              {skills.map((s, i) => (
                <span
                  key={i}
                  className="px-2 py-0.5 rounded text-[11px] bg-[#3e8bff]/10 text-[#9cc0ff] border border-[#3e8bff]/20"
                >
                  {s}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Social / External Links */}
          {(applicant.linkedin_url || applicant.github_url) && (
            <div className="flex items-center gap-2 pt-1 flex-wrap">
              {applicant.linkedin_url && (
                <a
                  href={
                    applicant.linkedin_url.startsWith('http')
                      ? applicant.linkedin_url
                      : `https://${applicant.linkedin_url}`
                  }
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/[0.08] hover:border-[#3e8bff]/50 bg-white/[0.03] text-xs text-[#C6CBD5] hover:text-[#9cc0ff] transition-colors"
                >
                  <Linkedin className="w-3.5 h-3.5 text-[#0A66C2]" />
                  <span>LinkedIn Profile</span>
                  <ExternalLink className="w-3 h-3 opacity-60" />
                </a>
              )}

              {applicant.github_url && (
                <a
                  href={
                    applicant.github_url.startsWith('http')
                      ? applicant.github_url
                      : `https://${applicant.github_url}`
                  }
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/[0.08] hover:border-white/[0.2] bg-white/[0.03] text-xs text-[#C6CBD5] hover:text-white transition-colors"
                >
                  <Github className="w-3.5 h-3.5" />
                  <span>GitHub Profile</span>
                  <ExternalLink className="w-3 h-3 opacity-60" />
                </a>
              )}
            </div>
          )}
        </div>

        {/* Modal Action Buttons (Pinned Footer) */}
        <div className="shrink-0 flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-2.5 pt-3 border-t border-white/[0.08] bg-transparent">
          <button
            onClick={onClose}
            className="w-full sm:w-auto h-[36px] px-4 rounded-lg border border-white/[0.08] hover:border-white/[0.18] bg-transparent text-[#C6CBD5] text-xs font-medium transition-colors"
          >
            Close
          </button>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
            {onDecline && (
              <button
                onClick={() => {
                  onClose();
                  onDecline();
                }}
                className="w-full sm:w-auto h-[36px] px-3.5 rounded-lg border border-red-500/40 bg-red-500/10 hover:bg-red-500/20 text-red-300 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all"
              >
                <XCircle className="w-3.5 h-3.5" />
                <span>Decline Candidate</span>
              </button>
            )}

            {onAccept && (
              <button
                onClick={() => {
                  onClose();
                  onAccept();
                }}
                className="w-full sm:w-auto h-[36px] px-4 rounded-lg border border-emerald-500/40 bg-emerald-500/15 hover:bg-emerald-500/25 text-[#6EE7B7] text-xs font-semibold flex items-center justify-center gap-1.5 transition-all active:scale-[0.97]"
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-[#34D399]" />
                <span>Accept Candidate</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
