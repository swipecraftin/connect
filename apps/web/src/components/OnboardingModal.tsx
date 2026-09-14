import React, { useState } from 'react';
import { Profile } from '../types/database';
import { useAlert } from '../context/AlertContext';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import {
  Sparkles,
  User,
  Briefcase,
  Layers,
  Award,
  Globe,
  Plus,
  CheckCircle2,
  ShieldCheck,
} from 'lucide-react';
import { LogoMark } from './LogoMark';

interface OnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: Profile | null;
  onSaveProfile: (updated: Partial<Profile>) => Promise<void>;
}

const DOMAINS = [
  'System Design & Architecture',
  'Backend Engineering',
  'Frontend Engineering',
  'Fullstack Engineering',
  'AI / Machine Learning',
  'Product & SaaS',
];

const SENIORITY_LEVELS = [
  'Entry (0-2y)',
  'Mid (3-5y)',
  'Senior (6-9y)',
  'Staff+ (10y+)',
];

const SUGGESTED_SKILLS = [
  'System Design',
  'Distributed Systems',
  'Microservices',
  'Scalability & Latency',
  'PostgreSQL',
  'Go',
  'React',
  'TypeScript',
  'Python',
  'Kubernetes',
  'AWS',
  'Data Structures',
  'Behavioral (STAR)',
];

export const OnboardingModal: React.FC<OnboardingModalProps> = ({
  isOpen,
  onClose,
  profile,
  onSaveProfile,
}) => {
  const { showAlert } = useAlert();
  const [fullName, setFullName] = useState(profile?.full_name || '');
  const [headline, setHeadline] = useState(
    profile?.headline || 'Senior Software Engineer'
  );
  const [primaryDomain, setPrimaryDomain] = useState(
    profile?.primary_domain || DOMAINS[0]
  );
  const [yearsOfExperience, setYearsOfExperience] = useState(
    profile?.years_of_experience || SENIORITY_LEVELS[2]
  );
  const [skillsTags, setSkillsTags] = useState<string[]>(
    profile?.skills_tags?.length ? profile.skills_tags : ['System Design', 'Distributed Systems', 'Scalability & Latency']
  );
  const [customTag, setCustomTag] = useState('');
  const [targetCompanies, setTargetCompanies] = useState(
    profile?.target_companies || 'Tier-1 Tech / FAANG'
  );
  const [bio, setBio] = useState(
    profile?.bio || 'Preparing for Senior/Staff rounds. Looking for rigorous feedback on system architecture and behavioral trade-offs.'
  );
  const [linkedinUrl, setLinkedinUrl] = useState(profile?.linkedin_url || '');
  const [githubUrl, setGithubUrl] = useState(profile?.github_url || '');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const toggleSkill = (skill: string) => {
    if (skillsTags.includes(skill)) {
      setSkillsTags(skillsTags.filter((s) => s !== skill));
    } else {
      setSkillsTags([...skillsTags, skill]);
    }
  };

  const handleAddCustomTag = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = customTag.trim().replace(/^#/, '');
    if (clean && !skillsTags.includes(clean)) {
      setSkillsTags([...skillsTags, clean]);
      setCustomTag('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) {
      await showAlert({
        title: 'Full Name Required',
        message: 'Please enter your full name to complete profile calibration.',
        type: 'warning',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await onSaveProfile({
        full_name: fullName.trim(),
        headline: headline.trim(),
        primary_domain: primaryDomain,
        years_of_experience: yearsOfExperience,
        skills_tags: skillsTags,
        target_companies: targetCompanies.trim(),
        bio: bio.trim(),
        linkedin_url: linkedinUrl.trim(),
        github_url: githubUrl.trim(),
        onboarding_completed: true,
      });
      onClose();
    } catch (err: any) {
      await showAlert({
        title: 'Save Failed',
        message: err.message || 'Error saving onboarding profile',
        type: 'danger',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="w-full max-w-2xl bg-[#080B12]/92 backdrop-blur-2xl border border-white/[0.12] rounded-2xl shadow-[0_24px_64px_rgba(0,0,0,0.8),inset_0_1px_0_rgba(255,255,255,0.08)] overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Strip */}
        <div className="p-6 pb-4 border-b border-white/[0.08] bg-white/[0.02] relative">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-white/[0.03] border border-white/[0.12] flex items-center justify-center shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] shrink-0">
              <LogoMark size={24} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-black tracking-tight text-[#F2F4F8]">
                  Welcome to Connect
                </h2>
                <Badge variant="success" className="text-[10px] font-mono border-emerald-500/30 bg-emerald-500/10 text-[#6EE7B7]">
                  by Swipecraft · 100% Free
                </Badge>
              </div>
              <p className="text-xs text-[#8A8F9C] mt-0.5 leading-relaxed">
                Everyone is an equal peer. No rigid "student" or "interviewer" labels — you can both conduct mock interviews and request practice sessions anytime!
              </p>
            </div>
          </div>
        </div>

        {/* Scrollable Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto flex-1 text-xs">
          {/* Section 1: Basic Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="font-semibold text-[#F2F4F8] flex items-center gap-1.5">
                <User className="h-3.5 w-3.5 text-[#3e8bff]" />
                Full Name *
              </label>
              <Input
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="e.g. Alex Chen"
                className="h-9 text-xs bg-white/[0.03] border-white/[0.08] text-[#F2F4F8]"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-semibold text-[#F2F4F8] flex items-center gap-1.5">
                <Briefcase className="h-3.5 w-3.5 text-[#3e8bff]" />
                Professional Headline *
              </label>
              <Input
                value={headline}
                onChange={(e) => setHeadline(e.target.value)}
                placeholder="e.g. Staff Systems Engineer @ FinTech"
                className="h-9 text-xs bg-white/[0.03] border-white/[0.08] text-[#F2F4F8]"
                required
              />
            </div>
          </div>

          {/* Section 2: Domain & Seniority */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="font-semibold text-[#F2F4F8] flex items-center gap-1.5">
                <Layers className="h-3.5 w-3.5 text-[#3e8bff]" />
                Primary Engineering Domain
              </label>
              <select
                value={primaryDomain}
                onChange={(e) => setPrimaryDomain(e.target.value)}
                className="w-full h-9 rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 text-xs text-[#F2F4F8] focus:outline-none focus:ring-1 focus:ring-[#3e8bff]"
              >
                {DOMAINS.map((d) => (
                  <option key={d} value={d} className="bg-[#0B0E17] text-[#F2F4F8]">
                    {d}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="font-semibold text-[#F2F4F8] flex items-center gap-1.5">
                <Award className="h-3.5 w-3.5 text-[#3e8bff]" />
                Experience Caliber
              </label>
              <select
                value={yearsOfExperience}
                onChange={(e) => setYearsOfExperience(e.target.value)}
                className="w-full h-9 rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 text-xs text-[#F2F4F8] focus:outline-none focus:ring-1 focus:ring-[#3e8bff]"
              >
                {SENIORITY_LEVELS.map((s) => (
                  <option key={s} value={s} className="bg-[#0B0E17] text-[#F2F4F8]">
                    {s}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Section 3: Skills & Focus Chips */}
          <div className="space-y-2">
            <label className="font-semibold text-[#F2F4F8] flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-amber-400" />
                Target Skills & Topics
              </span>
              <span className="text-[10px] text-[#8A8F9C] font-mono">
                {skillsTags.length} selected
              </span>
            </label>

            <div className="flex flex-wrap gap-1.5 p-3 rounded-xl bg-white/[0.02] border border-white/[0.08] backdrop-blur-md max-h-36 overflow-y-auto">
              {SUGGESTED_SKILLS.map((skill) => {
                const isSelected = skillsTags.includes(skill);
                return (
                  <button
                    key={skill}
                    type="button"
                    onClick={() => toggleSkill(skill)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all ${
                      isSelected
                        ? 'bg-[#3e8bff] text-white font-bold shadow-[0_0_12px_rgba(62,139,255,0.3)]'
                        : 'bg-white/[0.03] border border-white/[0.08] text-[#8A8F9C] hover:text-[#F2F4F8]'
                    }`}
                  >
                    {isSelected && <CheckCircle2 className="inline h-3 w-3 mr-1" />}
                    {skill}
                  </button>
                );
              })}
            </div>

            {/* Custom Tag input */}
            <div className="flex items-center gap-2 pt-1">
              <Input
                value={customTag}
                onChange={(e) => setCustomTag(e.target.value)}
                placeholder="Add custom skill (e.g. Apache Kafka, Rust)..."
                className="h-8 text-xs flex-1 bg-white/[0.03] border-white/[0.08] text-[#F2F4F8]"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddCustomTag(e);
                  }
                }}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddCustomTag}
                className="h-8 text-xs gap-1 border-white/[0.1] bg-white/[0.03] text-[#C6CBD5] hover:text-white"
              >
                <Plus className="h-3 w-3" />
                Add
              </Button>
            </div>
          </div>

          {/* Section 4: Target Companies & Bio Pitch */}
          <div className="space-y-3">
            <div className="space-y-1.5">
              <label className="font-semibold text-[#F2F4F8] flex items-center gap-1.5">
                <Globe className="h-3.5 w-3.5 text-[#34D399]" />
                Target Companies / Objectives
              </label>
              <Input
                value={targetCompanies}
                onChange={(e) => setTargetCompanies(e.target.value)}
                placeholder="e.g. Google L5, Meta E5, Uber, Stripe, High-Growth Series B"
                className="h-9 text-xs bg-white/[0.03] border-white/[0.08] text-[#F2F4F8]"
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-semibold text-[#F2F4F8]">
                Practice Bio & Interview Goals
              </label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                rows={3}
                placeholder="Share what topics you are practicing, what feedback you need, or what you can offer peers..."
                className="w-full rounded-lg border border-white/[0.08] bg-white/[0.03] backdrop-blur-md p-2.5 text-xs text-[#F2F4F8] focus:outline-none focus:ring-1 focus:ring-[#3e8bff] leading-relaxed"
              />
            </div>
          </div>

          {/* Section 5: Profiles URLs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[#8A8F9C] text-[11px]">
                LinkedIn Profile URL (Optional)
              </label>
              <Input
                value={linkedinUrl}
                onChange={(e) => setLinkedinUrl(e.target.value)}
                placeholder="https://linkedin.com/in/username"
                className="h-8 text-xs bg-white/[0.03] border-white/[0.08] text-[#F2F4F8]"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[#8A8F9C] text-[11px]">
                GitHub Profile URL (Optional)
              </label>
              <Input
                value={githubUrl}
                onChange={(e) => setGithubUrl(e.target.value)}
                placeholder="https://github.com/username"
                className="h-8 text-xs bg-white/[0.03] border-white/[0.08] text-[#F2F4F8]"
              />
            </div>
          </div>

          {/* Footer Strip */}
          <div className="pt-4 border-t border-white/[0.08] flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-1.5 text-[#6EE7B7] font-semibold text-[11px]">
              <ShieldCheck className="h-4 w-4 text-[#34D399]" />
              <span>Initial 100% Reliability Score Calibrated</span>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Button
                type="button"
                variant="ghost"
                onClick={onClose}
                className="text-xs h-9 flex-1 sm:flex-initial text-[#8A8F9C] hover:text-[#F2F4F8] hover:bg-white/[0.06]"
              >
                Skip for Now
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="gap-2 text-xs font-bold h-9 px-5 flex-1 sm:flex-initial shadow-md bg-[#3e8bff] hover:bg-[#3e8bff]/90 text-white"
              >
                <CheckCircle2 className="h-4 w-4" />
                <span>{isSubmitting ? 'Saving Profile...' : 'Complete & Start Practicing'}</span>
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
