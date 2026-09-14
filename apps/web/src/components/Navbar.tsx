import React, { useEffect } from 'react';
import { Button } from './ui/button';
import {
  ShieldCheck,
  LogIn,
  LogOut,
  HelpCircle,
  Globe,
  LayoutGrid,
  Calendar,
  User as UserIcon,
  Plus,
} from 'lucide-react';
import { Profile } from '../types/database';
import { TrustTab } from './TrustHubModal';
import { NotificationPopover } from './NotificationPopover';
import { useTimezone } from '../context/TimezoneContext';
import { usePresence } from '../context/PresenceContext';
import { LogoMark } from './LogoMark';

interface NavbarProps {
  activeTab: 'marketplace' | 'my-sessions' | 'profile';
  setActiveTab: (tab: 'marketplace' | 'my-sessions' | 'profile') => void;
  onNavigateTab?: (tab: 'marketplace' | 'my-sessions' | 'profile', slotId?: string) => void;
  onOpenCreateSlot: () => void;
  mySessionsCount: number;
  profile: Profile | null;
  user: any;
  onSignInGoogle?: () => void;
  onSignOut?: () => void;
  isConfigured: boolean;
  onOpenTrustHub?: (tab: TrustTab) => void;
  onOpenTimezoneModal?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  onNavigateTab,
  onOpenCreateSlot,
  mySessionsCount,
  profile,
  user,
  onSignInGoogle: _onSignInGoogle,
  onSignOut,
  isConfigured,
  onOpenTrustHub,
  onOpenTimezoneModal,
}) => {
  const { shortCode, timeZoneOffset, timeZone } = useTimezone();
  const { onlineCount } = usePresence();

  useEffect(() => {
    document.documentElement.classList.add('dark');
  }, []);

  // Global keyboard shortcuts: 1, 2, 3, N
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) return;

      if (e.key === '1') {
        setActiveTab('marketplace');
      } else if (e.key === '2') {
        setActiveTab('my-sessions');
      } else if (e.key === '3') {
        setActiveTab('profile');
      } else if (e.key === 'n' || e.key === 'N') {
        e.preventDefault();
        onOpenCreateSlot();
      }
    };

    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [setActiveTab, onOpenCreateSlot]);

  return (
    <>
      <header className="sticky top-0 z-40 w-full border-b border-white/[0.08] bg-[#07090E]/80 backdrop-blur-2xl backdrop-saturate-150 shadow-[0_4px_30px_rgba(0,0,0,0.5),inset_0_-1px_0_rgba(255,255,255,0.04)]">
        <div className="container mx-auto flex h-16 max-w-[1360px] items-center justify-between px-4 sm:px-8 gap-3 sm:gap-4">
          {/* Brand & Left Navigation */}
          <div className="flex items-center gap-4 sm:gap-8 min-w-0">
            <div
              className="flex items-center gap-2 cursor-pointer select-none group shrink-0"
              onClick={() => setActiveTab('marketplace')}
            >
              <div className="flex items-center justify-center drop-shadow-[0_0_10px_rgba(241,63,3,0.45)] transition-transform group-hover:scale-105">
                <LogoMark size={24} />
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-1.5">
                  <span className="font-extrabold text-[15.5px] sm:text-[16.5px] tracking-[-0.03em] text-[#E8EAF0]">
                    Connect
                  </span>
                </div>
                <span className="text-[9px] font-medium text-[#7A808C] -mt-0.5 tracking-tight hidden xs:inline">
                  by Swipecraft
                </span>
              </div>
            </div>

            {/* Segmented Nav Pill Container (Desktop) */}
            <nav className="hidden md:flex items-center gap-1 p-[3px] border border-white/[0.08] rounded-[10px] bg-white/[0.03] backdrop-blur-md shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
              <button
                onClick={() => setActiveTab('marketplace')}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-[7px] text-[13px] font-medium transition-all duration-150 ${
                  activeTab === 'marketplace'
                    ? 'bg-white/[0.09] text-[#F2F4F8] shadow-[0_2px_8px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.08)] border border-white/[0.12]'
                    : 'text-[#878D99] hover:text-[#E8EAF0] hover:bg-white/[0.04] border border-transparent'
                }`}
              >
                <span>Marketplace</span>
              </button>

              <button
                onClick={() => setActiveTab('my-sessions')}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-[7px] text-[13px] font-medium transition-all duration-150 relative ${
                  activeTab === 'my-sessions'
                    ? 'bg-white/[0.09] text-[#F2F4F8] shadow-[0_2px_8px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.08)] border border-white/[0.12]'
                    : 'text-[#878D99] hover:text-[#E8EAF0] hover:bg-white/[0.04] border border-transparent'
                }`}
              >
                <span>My Sessions</span>
                {mySessionsCount > 0 && (
                  <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-[#3e8bff] px-1 text-[9px] font-mono font-bold text-white shadow-[0_0_8px_rgba(62,139,255,0.5)]">
                    {mySessionsCount}
                  </span>
                )}
              </button>

              <button
                onClick={() => setActiveTab('profile')}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-[7px] text-[13px] font-medium transition-all duration-150 ${
                  activeTab === 'profile'
                    ? 'bg-white/[0.09] text-[#F2F4F8] shadow-[0_2px_8px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.08)] border border-white/[0.12]'
                    : 'text-[#878D99] hover:text-[#E8EAF0] hover:bg-white/[0.04] border border-transparent'
                }`}
              >
                <span>{user ? 'Profile' : 'Sign In'}</span>
              </button>
            </nav>
          </div>

          {/* Right Section: Peers Online, Post Slot, Timezone, User */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {/* Live Online Peers Pill */}
            <div className="flex items-center gap-1.5 py-1 px-2.5 border border-white/[0.08] rounded-full bg-white/[0.03] backdrop-blur-md shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] select-none text-xs">
              <span className="h-1.5 w-1.5 rounded-full bg-[#34D399] shadow-[0_0_8px_rgba(52,211,153,0.7)] animate-pm-pulse" />
              <span className="font-mono text-[11px] text-[#CDD2DC]">{onlineCount}</span>
              <span className="text-[11px] text-[#8A8F9C] hidden sm:inline">online</span>
            </div>

            {/* Timezone Switcher Pill */}
            {onOpenTimezoneModal && (
              <button
                onClick={onOpenTimezoneModal}
                className="hidden sm:flex items-center gap-1.5 h-8 px-2.5 rounded-[8px] bg-white/[0.03] hover:bg-white/[0.06] text-[#8A8F9C] hover:text-[#E8EAF0] text-xs font-mono font-medium transition-colors border border-white/[0.08] backdrop-blur-md shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]"
                title={`Active Timezone: ${timeZone} (${timeZoneOffset}). Click to change.`}
              >
                <Globe className="h-3.5 w-3.5 text-[#3e8bff]" />
                <span>{shortCode}</span>
                <span className="text-[10px] text-[#61666F] hidden xl:inline">({timeZoneOffset})</span>
              </button>
            )}

            {/* In-App Notification Center Popover — only rendered when logged in */}
            {user && (
              <NotificationPopover onNavigateTab={onNavigateTab || setActiveTab} />
            )}

            {/* Help & Trust Hub Button */}
            {onOpenTrustHub && (
              <button
                onClick={() => onOpenTrustHub('faq')}
                className="h-8 w-8 rounded-[8px] bg-white/[0.03] hover:bg-white/[0.06] flex items-center justify-center text-[#8A8F9C] hover:text-[#E8EAF0] transition-colors border border-white/[0.08] backdrop-blur-md shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]"
                title="Help Center, FAQ, Community Honor Code & Support"
              >
                <HelpCircle className="h-3.5 w-3.5 text-[#3e8bff]" />
              </button>
            )}

            {/* Desktop Post a Slot Button */}
            <button
              onClick={onOpenCreateSlot}
              className="hidden sm:flex items-center gap-2 h-9 px-3.5 rounded-[9px] border border-[#3e8bff]/45 bg-[#3e8bff]/15 hover:bg-[#3e8bff]/25 text-[#cfe0ff] text-[13px] font-semibold transition-all shadow-[0_0_16px_rgba(62,139,255,0.18)] active:scale-[0.97] backdrop-blur-md"
            >
              <span>Post a slot</span>
              <span className="font-mono text-[9.5px] px-1 py-[0.5px] rounded-[3px] border border-[#3e8bff]/40 text-[#9cc0ff]">
                N
              </span>
            </button>

            {/* User Profile or Sign In */}
            {user || !isConfigured ? (
              <div className="flex items-center gap-2 pl-1.5 sm:pl-2 border-l border-white/[0.08]">
                <div
                  className="flex items-center gap-2 cursor-pointer hover:opacity-85 transition-opacity select-none"
                  onClick={() => setActiveTab('profile')}
                  title="View & Edit Profile"
                >
                  <div className="relative shrink-0">
                    {profile?.avatar_url ? (
                      <img
                        src={profile.avatar_url}
                        alt="Avatar"
                        className={`w-8 h-8 rounded-full object-cover shrink-0 ring-1 ${
                          activeTab === 'profile' ? 'ring-2 ring-[#3e8bff]' : 'ring-white/[0.12]'
                        }`}
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full border border-white/[0.08] bg-gradient-to-br from-[#1e2434] to-[#0f1219] flex items-center justify-center font-mono text-[10.5px] text-[#B6BDC9] shrink-0">
                        {profile?.full_name ? profile.full_name.slice(0, 2).toUpperCase() : 'ME'}
                      </div>
                    )}
                    <span className="absolute bottom-0 right-0 h-2 w-2 rounded-full bg-[#34D399] ring-1 ring-[#08090C]" />
                  </div>
                  <div className="hidden lg:block text-left text-xs leading-tight">
                    <div className="font-bold text-[#E8EAF0] truncate max-w-[120px]">{profile?.full_name || 'Peer Member'}</div>
                    <div className="flex items-center gap-1 text-[#34D399] font-mono text-[10px]">
                      <ShieldCheck className="h-2.5 w-2.5" />
                      <span>{profile?.reliability_score || 100}%</span>
                    </div>
                  </div>
                </div>
                {user && (
                  <button
                    onClick={onSignOut}
                    title="Sign Out"
                    className="h-7 w-7 rounded-[6px] hover:bg-destructive/10 text-[#8A8F9C] hover:text-destructive flex items-center justify-center transition-colors ml-0.5"
                  >
                    <LogOut className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            ) : (
              <div className="pl-1.5 sm:pl-2 border-l border-white/[0.08] flex items-center gap-1.5">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setActiveTab('profile')}
                  className="gap-1.5 text-xs font-bold h-8 rounded-[8px] border-white/[0.12] bg-white/[0.03] backdrop-blur-md text-[#E8EAF0] hover:bg-white/[0.07] px-2.5"
                >
                  <LogIn className="h-3.5 w-3.5" />
                  <span>Sign In</span>
                </Button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Mobile Bottom Navigation Bar (Fixed docked with safe areas) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#07090E]/85 backdrop-blur-2xl border-t border-white/[0.08] px-3 py-1.5 flex items-center justify-around shadow-[0_-10px_40px_rgba(0,0,0,0.85)]">
        <button
          onClick={() => setActiveTab('marketplace')}
          className={`flex flex-col items-center gap-1 py-1 px-3 rounded-lg transition-colors ${
            activeTab === 'marketplace'
              ? 'text-[#3e8bff]'
              : 'text-[#878D99] hover:text-[#E8EAF0]'
          }`}
        >
          <LayoutGrid className="w-4 h-4" />
          <span className="text-[10px] font-medium tracking-tight">Marketplace</span>
        </button>

        <button
          onClick={() => setActiveTab('my-sessions')}
          className={`flex flex-col items-center gap-1 py-1 px-3 rounded-lg transition-colors relative ${
            activeTab === 'my-sessions'
              ? 'text-[#3e8bff]'
              : 'text-[#878D99] hover:text-[#E8EAF0]'
          }`}
        >
          <div className="relative">
            <Calendar className="w-4 h-4" />
            {mySessionsCount > 0 && (
              <span className="absolute -top-1 -right-2 flex h-3.5 min-w-3.5 items-center justify-center rounded-full bg-[#3e8bff] px-1 text-[8.5px] font-mono font-bold text-white shadow-[0_0_6px_rgba(62,139,255,0.7)]">
                {mySessionsCount}
              </span>
            )}
          </div>
          <span className="text-[10px] font-medium tracking-tight">Sessions</span>
        </button>

        {/* Center Highlighted Post Button */}
        <button
          onClick={onOpenCreateSlot}
          className="flex items-center gap-1 py-1.5 px-3.5 rounded-full bg-[#3e8bff] hover:bg-[#3577db] text-white font-semibold text-[11.5px] shadow-[0_0_16px_rgba(62,139,255,0.5)] active:scale-95 transition-all"
        >
          <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
          <span>Post</span>
        </button>

        <button
          onClick={() => setActiveTab('profile')}
          className={`flex flex-col items-center gap-1 py-1 px-3 rounded-lg transition-colors ${
            activeTab === 'profile'
              ? 'text-[#3e8bff]'
              : 'text-[#878D99] hover:text-[#E8EAF0]'
          }`}
        >
          {user ? <UserIcon className="w-4 h-4" /> : <LogIn className="w-4 h-4" />}
          <span className="text-[10px] font-medium tracking-tight">{user ? 'Profile' : 'Sign In'}</span>
        </button>
      </nav>
    </>
  );
};
