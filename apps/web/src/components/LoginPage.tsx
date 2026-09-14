import React, { useState } from 'react';
import { ShieldCheck, Sparkles, Video, Award, ArrowRight, Lock, CheckCircle2 } from 'lucide-react';
import { LogoMark } from './LogoMark';

interface LoginPageProps {
  onSignInGoogle: () => void;
  onExploreMarketplace?: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({
  onSignInGoogle,
  onExploreMarketplace,
}) => {
  const [isSigningIn, setIsSigningIn] = useState(false);

  const handleGoogleClick = async () => {
    try {
      setIsSigningIn(true);
      await onSignInGoogle();
    } catch (err) {
      console.error('Google sign in error:', err);
      setIsSigningIn(false);
    }
  };

  return (
    <div className="relative w-full min-h-[78vh] flex items-center justify-center px-4 py-8 sm:py-12 overflow-hidden animate-in fade-in zoom-in-95 duration-300">
      {/* Ambient background glows */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[520px] h-[520px] bg-gradient-to-tr from-[#3e8bff]/15 via-[#6366f1]/10 to-transparent rounded-full blur-3xl pointer-events-none -z-10" />
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[340px] h-[340px] bg-[#f13f03]/08 rounded-full blur-2xl pointer-events-none -z-10" />

      {/* Main Glassmorphic Card */}
      <div className="w-full max-w-[490px] rounded-[24px] border border-white/[0.1] bg-[#0A0D15]/85 backdrop-blur-2xl shadow-[0_24px_80px_rgba(0,0,0,0.75),inset_0_1px_0_rgba(255,255,255,0.08)] p-6 sm:p-8 flex flex-col items-center text-center relative">
        
        {/* Top Logo & Branding Badge */}
        <div className="flex flex-col items-center gap-3 mb-6">
          <div className="relative p-3 rounded-2xl bg-gradient-to-b from-white/[0.08] to-white/[0.02] border border-white/[0.1] shadow-[0_8px_24px_rgba(241,63,3,0.25)] group">
            <LogoMark size={38} />
            <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#34D399] opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#34D399]" />
            </span>
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/[0.04] border border-white/[0.08] text-[11px] font-mono font-medium text-[#A2A8B4]">
            <Sparkles className="w-3 h-3 text-[#3e8bff]" />
            <span>Open Engineering Calibration</span>
          </div>

          <h1 className="text-2xl sm:text-[28px] font-bold tracking-[-0.03em] text-[#F2F4F8] leading-tight mt-1">
            Connect by Swipecraft
          </h1>

          <p className="text-[13.5px] leading-relaxed text-[#8A8F9C] max-w-[380px]">
            100% free peer mock interviews with verified software engineers. Practice systems design, coding, and behavioral rounds with zero paywalls and zero ads.
          </p>
        </div>

        {/* BOLD AESTHETIC GOOGLE LOGIN BUTTON (Hero Action) */}
        <div className="w-full flex flex-col gap-3 my-2">
          <button
            onClick={handleGoogleClick}
            disabled={isSigningIn}
            className="group relative w-full h-[54px] rounded-[14px] bg-white hover:bg-[#F3F4F6] active:scale-[0.98] transition-all duration-150 flex items-center justify-center gap-3.5 px-6 shadow-[0_4px_24px_rgba(255,255,255,0.14),0_1px_2px_rgba(0,0,0,0.25)] cursor-pointer select-none disabled:opacity-75 disabled:cursor-not-allowed"
          >
            {isSigningIn ? (
              <div className="flex items-center gap-2.5 text-[#111827] font-semibold text-[15px]">
                <div className="w-4 h-4 border-2 border-[#111827] border-t-transparent rounded-full animate-spin" />
                <span>Connecting to Google...</span>
              </div>
            ) : (
              <>
                {/* Official Google 4-Color SVG Icon */}
                <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>

                <span className="font-bold text-[15px] tracking-[-0.015em] text-[#111827]">
                  Continue with Google
                </span>

                <ArrowRight className="w-4 h-4 text-[#4B5563] ml-auto transition-transform group-hover:translate-x-0.5" />
              </>
            )}
          </button>

          <p className="text-[11px] font-mono text-[#61666F]">
            Instant login · No password required · One-click OAuth 2.0
          </p>
        </div>

        {/* Feature Highlights Grid */}
        <div className="w-full grid grid-cols-1 gap-2.5 mt-5 pt-5 border-t border-white/[0.08] text-left">
          <div className="flex items-start gap-3 p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.04]">
            <div className="p-1.5 rounded-lg bg-[#3e8bff]/10 border border-[#3e8bff]/20 text-[#3e8bff] shrink-0 mt-0.5">
              <Award className="w-3.5 h-3.5" />
            </div>
            <div>
              <div className="text-[12.5px] font-semibold text-[#E8EAF0]">
                Authentic Engineering Karma
              </div>
              <div className="text-[11.5px] text-[#7A808C] leading-snug">
                Earn reputation for mentoring and interviewing peers. Zero paywalled tiers or coin packs.
              </div>
            </div>
          </div>

          <div className="flex items-start gap-3 p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.04]">
            <div className="p-1.5 rounded-lg bg-[#34D399]/10 border border-[#34D399]/20 text-[#34D399] shrink-0 mt-0.5">
              <Video className="w-3.5 h-3.5" />
            </div>
            <div>
              <div className="text-[12.5px] font-semibold text-[#E8EAF0]">
                Automated Google Meet Rooms
              </div>
              <div className="text-[11.5px] text-[#7A808C] leading-snug">
                One-click calendar scheduling, Google Meet room creation, and email confirmations.
              </div>
            </div>
          </div>

          <div className="flex items-start gap-3 p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.04]">
            <div className="p-1.5 rounded-lg bg-[#A78BFA]/10 border border-[#A78BFA]/20 text-[#A78BFA] shrink-0 mt-0.5">
              <ShieldCheck className="w-3.5 h-3.5" />
            </div>
            <div>
              <div className="text-[12.5px] font-semibold text-[#E8EAF0]">
                Anti-Flake Honor Code
              </div>
              <div className="text-[11.5px] text-[#7A808C] leading-snug">
                Equal reciprocal standing ensures high-commitment peers who show up on time.
              </div>
            </div>
          </div>
        </div>

        {/* Security & Open Source Badges */}
        <div className="flex items-center justify-center gap-3 flex-wrap mt-6 pt-4 border-t border-white/[0.06] text-[10.5px] font-mono text-[#61666F]">
          <span className="inline-flex items-center gap-1">
            <Lock className="w-3 h-3 text-[#34D399]" /> End-to-End Secure
          </span>
          <span>·</span>
          <span className="inline-flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3 text-[#3e8bff]" /> Zero Ads & Zero Fees
          </span>
          <span>·</span>
          <span>Open Source</span>
        </div>

        {/* Guest Browse Fallback */}
        {onExploreMarketplace && (
          <button
            onClick={onExploreMarketplace}
            className="mt-4 text-xs text-[#8A8F9C] hover:text-[#E8EAF0] transition-colors underline-offset-4 hover:underline"
          >
            ← Browse open mock slots without signing in
          </button>
        )}
      </div>
    </div>
  );
};
