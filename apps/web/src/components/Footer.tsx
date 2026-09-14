import React from 'react';
import { TrustTab } from './TrustHubModal';
import {
  ArrowUpRight,
} from 'lucide-react';

interface FooterProps {
  onOpenTrustHub: (tab: TrustTab) => void;
  onNavigateTab: (tab: 'marketplace' | 'my-sessions' | 'profile') => void;
  onOpenCreateSlot: () => void;
  onSharePlatform?: () => void;
  copiedLink?: boolean;
}

export const Footer: React.FC<FooterProps> = ({
  onOpenTrustHub,
  onNavigateTab,
  onOpenCreateSlot,
}) => {
  return (
    <footer className="relative w-full border-t border-white/[0.08] bg-[#06070A]/85 backdrop-blur-2xl text-[#8A8F9C] overflow-hidden pt-12 pb-8 sm:pb-12">
      {/* Background radial gradient glow inspired by Antigravity */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[300px] bg-[radial-gradient(ellipse_at_top,rgba(62,139,255,0.08),transparent_70%)] pointer-events-none" />
      <div className="absolute -top-[120px] left-[15%] w-[320px] h-[220px] bg-[radial-gradient(ellipse_at_center,rgba(241,63,3,0.06),transparent_65%)] pointer-events-none" />

      <div className="container mx-auto max-w-[1320px] px-4 sm:px-6 relative z-10">
        {/* Navigation Columns: Antigravity Structured Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 sm:gap-12 py-8 border-b border-white/[0.08]">
          {/* Column 1: Product */}
          <div className="flex flex-col gap-4">
            <span className="font-mono text-[11px] sm:text-xs uppercase tracking-[0.16em] text-white font-bold">
              Platform
            </span>
            <ul className="flex flex-col gap-3 text-[13.5px]">
              <li>
                <button
                  onClick={() => onNavigateTab('marketplace')}
                  className="text-[#C6CBD5] hover:text-white transition-colors text-left font-medium"
                >
                  Peer Marketplace
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigateTab('my-sessions')}
                  className="text-[#C6CBD5] hover:text-white transition-colors text-left font-medium"
                >
                  Scheduled Sessions
                </button>
              </li>
              <li>
                <button
                  onClick={onOpenCreateSlot}
                  className="text-[#C6CBD5] hover:text-white transition-colors text-left font-medium"
                >
                  Host Practice Slot
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigateTab('profile')}
                  className="text-[#C6CBD5] hover:text-white transition-colors text-left font-medium"
                >
                  Karma & Profile
                </button>
              </li>
              <li>
                <button
                  onClick={() => onOpenTrustHub('faq')}
                  className="text-[#C6CBD5] hover:text-white transition-colors text-left font-medium"
                >
                  Google Meet & Cal Sync (.ics)
                </button>
              </li>
            </ul>
          </div>

          {/* Column 2: Governance & Trust */}
          <div className="flex flex-col gap-4">
            <span className="font-mono text-[11px] sm:text-xs uppercase tracking-[0.16em] text-white font-bold">
              Trust & Standards
            </span>
            <ul className="flex flex-col gap-3 text-[13.5px]">
              <li>
                <button
                  onClick={() => onOpenTrustHub('honor-code')}
                  className="text-[#C6CBD5] hover:text-white transition-colors text-left font-medium"
                >
                  Community Honor Code
                </button>
              </li>
              <li>
                <button
                  onClick={() => onOpenTrustHub('privacy')}
                  className="text-[#C6CBD5] hover:text-white transition-colors text-left font-medium"
                >
                  Zero Tracking Privacy
                </button>
              </li>
              <li>
                <button
                  onClick={() => onOpenTrustHub('terms')}
                  className="text-[#C6CBD5] hover:text-white transition-colors text-left font-medium"
                >
                  Terms of Equal Access
                </button>
              </li>
              <li>
                <button
                  onClick={() => onOpenTrustHub('faq')}
                  className="text-[#C6CBD5] hover:text-white transition-colors text-left font-medium"
                >
                  No-Show Penalty Standards
                </button>
              </li>
              <li>
                <button
                  onClick={() => onOpenTrustHub('faq')}
                  className="text-[#C6CBD5] hover:text-white transition-colors text-left font-medium"
                >
                  Reliability Formula
                </button>
              </li>
            </ul>
          </div>

          {/* Column 3: Swipecraft Ecosystem */}
          <div className="flex flex-col gap-4">
            <span className="font-mono text-[11px] sm:text-xs uppercase tracking-[0.16em] text-white font-bold">
              Swipecraft Ecosystem
            </span>
            <ul className="flex flex-col gap-3 text-[13.5px]">
              <li>
                <a
                  href="https://swipecraft.in"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#C6CBD5] hover:text-white transition-colors inline-flex items-center gap-1 font-medium"
                >
                  <span>Swipecraft Foundation</span>
                  <ArrowUpRight className="w-3 h-3 opacity-60" />
                </a>
              </li>
              <li>
                <span className="text-[#7A808C] cursor-default">
                  Carousel Forge (Visual Suite)
                </span>
              </li>
              <li>
                <span className="text-[#7A808C] cursor-default">
                  Developer Rubrics & Standards
                </span>
              </li>
              <li>
                <button
                  onClick={() => onOpenTrustHub('faq')}
                  className="text-[#C6CBD5] hover:text-white transition-colors text-left font-medium"
                >
                  Technical Architecture
                </button>
              </li>
              <li>
                <button
                  onClick={() => onOpenTrustHub('support')}
                  className="text-[#C6CBD5] hover:text-white transition-colors text-left font-medium"
                >
                  Engineering Support
                </button>
              </li>
            </ul>
          </div>

          {/* Column 4: Infrastructure & Philosophy */}
          <div className="flex flex-col gap-4">
            <span className="font-mono text-[11px] sm:text-xs uppercase tracking-[0.16em] text-white font-bold">
              Infrastructure
            </span>
            <div className="flex flex-col gap-3 text-xs text-[#8A8F9C] leading-relaxed">
              <div className="p-3.5 rounded-xl border border-white/[0.08] bg-white/[0.02] backdrop-blur-md flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[11px] text-[#E8EAF0] font-semibold">
                    Global Edge Network
                  </span>
                  <span className="text-[10.5px] font-mono text-emerald-400 font-bold">
                    &lt; 40ms
                  </span>
                </div>
                <p className="text-[11.5px] text-[#8A8F9C] m-0 leading-relaxed">
                  Powered by Cloudflare Workers, Supabase Realtime WebSocket Presence, and distributed PostgreSQL.
                </p>
              </div>

              <div className="flex items-center gap-2 pt-1 font-mono text-[11px]">
                <span className="text-white/40">•</span>
                <span className="text-white font-semibold">Zero Monetization</span>
                <span className="text-white/40">•</span>
                <span className="text-white font-semibold">100% Free</span>
              </div>
            </div>
          </div>
        </div>

        {/* Antigravity Bold Monumental Watermark / Headline — Pure White & High Contrast */}
        <div className="py-12 sm:py-16 text-center select-none overflow-hidden border-t border-white/[0.08] mt-10">
          <span className="font-black text-[36px] sm:text-[64px] md:text-[88px] lg:text-[110px] tracking-[-0.04em] text-white leading-none uppercase block whitespace-nowrap drop-shadow-[0_4px_32px_rgba(255,255,255,0.22)]">
            SWIPECRAFT CONNECT
          </span>
          <p className="mt-3 text-xs sm:text-sm font-mono tracking-[0.2em] text-[#C6CBD5] uppercase">
            Engineering Practice Without Compromise · 100% Free · Zero Ads
          </p>
        </div>

        {/* Bottom Bar: Copyright & Domain */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-white/[0.06] text-xs font-mono">
          <div className="flex items-center gap-2 text-[#7A808C]">
            <span>© 2026 Swipecraft Inc.</span>
            <span className="text-white/20">•</span>
            <span>All rights reserved.</span>
            <span className="hidden md:inline text-white/20">•</span>
            <span className="hidden md:inline text-[#9AA0AF]">
              Crafted with conviction for global engineers.
            </span>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md border border-white/[0.08] bg-white/[0.02] text-[#9AA0AF]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#34D399]" />
              <span className="font-bold text-[#E8EAF0]">connect.swipecraft.in</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};
