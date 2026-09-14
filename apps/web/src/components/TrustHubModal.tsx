import React, { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import {
  X,
  FileText,
  HelpCircle,
  Send,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Lock,
  HeartHandshake,
  MessageSquare,
} from 'lucide-react';
import { LogoMark } from './LogoMark';

export type TrustTab = 'privacy' | 'terms' | 'honor-code' | 'faq' | 'support';

interface TrustHubModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: TrustTab;
}

interface FaqItem {
  q: string;
  a: string;
  tag: string;
}

const FAQ_ITEMS: FaqItem[] = [
  {
    q: 'How does Connect work? Is it truly 100% free with no paywalls or ads?',
    a: 'Yes! Connect is 100% free for everyone, developed as an open public product by Swipecraft. There are zero platform fees, zero paywalls, zero ads, and zero monetization. You upskill yourself while upskilling other engineers—evaluating peers sharpens your architectural intuition and rubric critique, while practicing as a candidate builds your problem-solving speed and verbal composure.',
    tag: 'Platform & Philosophy',
  },
  {
    q: 'Why are there no ads, payments, or subscription tiers?',
    a: 'At Swipecraft, we believe high-signal interview preparation and technical feedback should be open and accessible to all engineers regardless of financial background. We made a permanent commitment never to display advertisements, never sell user data, and never gate software behind paywalls.',
    tag: 'Zero Ads & Free Access',
  },
  {
    q: 'What happens if my peer does not show up (No-Show / Flake)?',
    a: 'If a peer fails to join within 10 minutes of the scheduled time, mark "No, Peer Flaked" in the session review. The platform automatically applies a strike to their account. Three strikes result in a permanent platform ban to protect community trust.',
    tag: 'Anti-Flake',
  },
  {
    q: 'Can I cancel or reschedule a booked mock interview?',
    a: 'Yes, but as a courtesy to fellow engineers, you should cancel at least 2 hours before the start time so the slot can reopen for other peers on the marketplace. You can include a cancellation note to explain the reason.',
    tag: 'Scheduling',
  },
  {
    q: 'Can I use Zoom, Microsoft Teams, or Tuple instead of Google Meet?',
    a: 'Yes! While Google Meet is recommended for 1-click browser access without app downloads, you can paste any valid video call link (Google Meet, Zoom, MS Teams, or Jitsi) when creating your slot.',
    tag: 'Tooling',
  },
  {
    q: 'Are mock interview calls recorded?',
    a: 'Never by Connect or Swipecraft. Connect does not record, tap, or intercept your audio or video streams. Recording a session using personal software without explicit, mutual written consent of both participants is strictly prohibited under our Terms of Service.',
    tag: 'Privacy',
  },
  {
    q: 'How are Reliability Scores calculated?',
    a: 'Every user begins with a 100% Reliability Score. Completing sessions on time maintains your score at 100%. Unexcused no-shows reduce your score by 25%. Users below 80% lose access to priority senior evaluator listings.',
    tag: 'Reputation',
  },
  {
    q: 'Can I recruit or pitch candidates for jobs on Connect?',
    a: 'Connect is strictly a collaborative peer upskilling and practice sanctuary. Unsolicited commercial solicitation, recruiter spam, or pitching paid coaching will result in immediate permanent account termination.',
    tag: 'Community Charter',
  },
  {
    q: 'What should I do if I received an unfair review or false no-show report?',
    a: 'You can dispute an unfair review by submitting an appeal under the "Support & Report" tab in this hub. Our moderation team reviews meeting logs and calendar invites to resolve disputes fairly within 24 hours.',
    tag: 'Support',
  },
];

export const TrustHubModal: React.FC<TrustHubModalProps> = ({
  isOpen,
  onClose,
  initialTab = 'faq',
}) => {
  const [activeTab, setActiveTab] = useState<TrustTab>(initialTab);
  const [expandedFaqIndex, setExpandedFaqIndex] = useState<number | null>(0);
  const [searchQuery, setSearchQuery] = useState('');

  // Support Form State
  const [reportType, setReportType] = useState('no-show');
  const [sessionSubject, setSessionSubject] = useState('');
  const [reportDetails, setReportDetails] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [isSubmittingReport, setIsSubmittingReport] = useState(false);
  const [reportSubmitted, setReportSubmitted] = useState(false);

  if (!isOpen) return null;

  const handleSupportSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingReport(true);
    setTimeout(() => {
      setIsSubmittingReport(false);
      setReportSubmitted(true);
      setTimeout(() => {
        setReportSubmitted(false);
        setSessionSubject('');
        setReportDetails('');
        setUserEmail('');
      }, 5000);
    }, 600);
  };

  const filteredFaqs = FAQ_ITEMS.filter(
    (item) =>
      item.q.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.a.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.tag.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-3 sm:p-6 overflow-y-auto">
      <div className="relative w-full max-w-3xl rounded-[16px] border border-white/[0.12] bg-[#080B12]/92 backdrop-blur-2xl shadow-[0_30px_80px_rgba(0,0,0,0.85),inset_0_1px_0_rgba(255,255,255,0.08)] overflow-hidden animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
        {/* Modal Top Header */}
        <div className="p-5 pb-3 border-b border-white/[0.08] flex items-center justify-between gap-4 bg-white/[0.02] backdrop-blur-md shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-white/[0.04] border border-white/[0.1] flex items-center justify-center shrink-0 backdrop-blur-sm">
              <LogoMark size={20} />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-[#F2F4F8] leading-tight font-sans">
                Connect Trust & Support Hub
              </h2>
              <p className="text-xs text-[#8A8F9C]">
                Official policies, community honor code, transparent FAQ, and user assistance · A product of Swipecraft.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-md hover:bg-white/[0.08] text-[#8A8F9C] hover:text-[#F2F4F8] flex items-center justify-center transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Tab Navigation Pill Bar */}
        <div className="px-5 pt-3 border-b border-white/[0.08] bg-white/[0.01] backdrop-blur-md shrink-0 flex items-center gap-1.5 overflow-x-auto pb-2 text-xs">
          <button
            onClick={() => setActiveTab('faq')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-all ${
              activeTab === 'faq'
                ? 'bg-[#3e8bff]/15 text-[#9cc0ff] border border-[#3e8bff]/40 shadow-xs'
                : 'text-[#8A8F9C] hover:text-[#E8EAF0] border border-transparent'
            }`}
          >
            <HelpCircle className="h-3.5 w-3.5" />
            <span>FAQ & Guides</span>
          </button>

          <button
            onClick={() => setActiveTab('honor-code')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-all ${
              activeTab === 'honor-code'
                ? 'bg-[#3e8bff]/15 text-[#9cc0ff] border border-[#3e8bff]/40 shadow-xs'
                : 'text-[#8A8F9C] hover:text-[#E8EAF0] border border-transparent'
            }`}
          >
            <HeartHandshake className="h-3.5 w-3.5" />
            <span>Community Honor Code</span>
          </button>

          <button
            onClick={() => setActiveTab('terms')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-all ${
              activeTab === 'terms'
                ? 'bg-[#3e8bff]/15 text-[#9cc0ff] border border-[#3e8bff]/40 shadow-xs'
                : 'text-[#8A8F9C] hover:text-[#E8EAF0] border border-transparent'
            }`}
          >
            <FileText className="h-3.5 w-3.5" />
            <span>Terms of Service</span>
          </button>

          <button
            onClick={() => setActiveTab('privacy')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-all ${
              activeTab === 'privacy'
                ? 'bg-[#3e8bff]/15 text-[#9cc0ff] border border-[#3e8bff]/40 shadow-xs'
                : 'text-[#8A8F9C] hover:text-[#E8EAF0] border border-transparent'
            }`}
          >
            <Lock className="h-3.5 w-3.5" />
            <span>Privacy Policy</span>
          </button>

          <button
            onClick={() => setActiveTab('support')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-all ${
              activeTab === 'support'
                ? 'bg-amber-500/15 text-amber-300 border border-amber-500/40 shadow-xs'
                : 'text-[#8A8F9C] hover:text-[#E8EAF0] border border-transparent'
            }`}
          >
            <MessageSquare className="h-3.5 w-3.5" />
            <span>Support & Report</span>
          </button>
        </div>

        {/* Tab Content Body (Scrollable) */}
        <div className="p-5 sm:p-6 overflow-y-auto text-xs leading-relaxed space-y-4 text-muted-foreground flex-1">
          {/* TAB 1: FAQ & KNOWLEDGE BASE */}
          {activeTab === 'faq' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-3">
                <div className="relative flex-1">
                  <Input
                    placeholder="Search FAQ questions or topics (e.g. credits, flakes, zoom)..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="h-8.5 text-xs rounded-xl"
                  />
                </div>
              </div>

              <div className="space-y-2 pt-1">
                {filteredFaqs.map((item, index) => {
                  const isExpanded = expandedFaqIndex === index;
                  return (
                    <div
                      key={index}
                      className="rounded-xl border border-border/70 bg-secondary/30 overflow-hidden transition-all"
                    >
                      <button
                        onClick={() => setExpandedFaqIndex(isExpanded ? null : index)}
                        className="w-full p-3.5 text-left flex items-center justify-between gap-3 hover:bg-secondary/60 transition-colors"
                      >
                        <span className="font-bold text-foreground text-xs sm:text-sm">
                          {item.q}
                        </span>
                        <div className="flex items-center gap-2 shrink-0">
                          <Badge variant="outline" className="text-[10px] font-mono py-0 px-1.5">
                            {item.tag}
                          </Badge>
                          {isExpanded ? (
                            <ChevronUp className="h-4 w-4 text-muted-foreground" />
                          ) : (
                            <ChevronDown className="h-4 w-4 text-muted-foreground" />
                          )}
                        </div>
                      </button>
                      {isExpanded && (
                        <div className="p-3.5 pt-1 text-muted-foreground border-t border-border/40 text-xs leading-relaxed bg-card/40">
                          {item.a}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 2: COMMUNITY HONOR CODE */}
          {activeTab === 'honor-code' && (
            <div className="space-y-4 text-foreground">
              <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/20 p-4 space-y-1.5">
                <h3 className="font-bold text-sm text-emerald-700 dark:text-emerald-300 flex items-center gap-2">
                  <HeartHandshake className="h-4 w-4" />
                  The Connect Community Charter: Upskill Together
                </h3>
                <p className="text-xs text-emerald-800 dark:text-emerald-200/90 leading-relaxed">
                  Connect by Swipecraft exists to create an accessible, 100% free engineering community where engineers at all levels elevate their craft by elevating others. Evaluating peers teaches you rubric mastery and what great communication looks like, while practicing as a candidate hones your verbal problem solving and poise under pressure.
                </p>
              </div>

              <div className="space-y-3 text-xs text-muted-foreground">
                <div className="space-y-1">
                  <h4 className="font-bold text-foreground text-xs uppercase tracking-wider">1. The 3-Strike Anti-Flake Standard</h4>
                  <p>
                    Every unexcused no-show (failing to join within 10 minutes of start time) logs 1 strike and docks 25% reliability. Three strikes result in permanent expulsion from Connect.
                  </p>
                </div>

                <div className="space-y-1">
                  <h4 className="font-bold text-foreground text-xs uppercase tracking-wider">2. 2-Hour Cancellation Courtesy</h4>
                  <p>
                    If an emergency arises, cancel your booked session at least 2 hours in advance to allow another peer to claim the time slot.
                  </p>
                </div>

                <div className="space-y-1">
                  <h4 className="font-bold text-foreground text-xs uppercase tracking-wider">3. Actionable, Psychological Safety Feedback</h4>
                  <p>
                    Evaluators must provide balanced, specific, and actionable critique. Destructive hostility, arrogance, or disparaging remarks are strictly prohibited.
                  </p>
                </div>

                <div className="space-y-1">
                  <h4 className="font-bold text-foreground text-xs uppercase tracking-wider">4. 100% Free Non-Commercial Sanctuary</h4>
                  <p>
                    Connect is completely free and un-monetized. It cannot be used to solicit paid coaching, course sales, or recruiter spam. Violators will be banned immediately without recourse.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: TERMS OF SERVICE */}
          {activeTab === 'terms' && (
            <div className="space-y-4 text-xs">
              <h3 className="font-bold text-sm text-foreground">Connect Terms of Service & Accessibility Commitment</h3>
              <p className="text-[11px] text-muted-foreground font-mono">Last Updated: September 14, 2026 · A product of Swipecraft</p>

              <div className="space-y-3">
                <div>
                  <h4 className="font-bold text-foreground mb-1">1. Acceptance of Terms</h4>
                  <p>
                    By authenticating with Connect, publishing slots, or booking mock interviews, you agree to these Terms of Service and our Community Honor Code.
                  </p>
                </div>

                <div>
                  <h4 className="font-bold text-foreground mb-1">2. Zero Platform Fees, Zero Paywalls & Open Access</h4>
                  <p>
                    Connect is provided 100% free of charge as a public community resource by Swipecraft. There are no fees, paywalls, or token pay gates. Users agree not to charge peers for mock interview slots or solicit off-platform financial compensation.
                  </p>
                </div>

                <div>
                  <h4 className="font-bold text-foreground mb-1">3. Non-Recording Policy</h4>
                  <p>
                    Recording audio, video, or chat from mock interview calls without mutual, explicit written consent of both participants is strictly prohibited.
                  </p>
                </div>

                <div>
                  <h4 className="font-bold text-foreground mb-1">4. Platform Role & Limitation of Liability</h4>
                  <p>
                    Connect acts solely as a collaborative matching coordinator. We are not responsible for advice, feedback, job offer outcomes, or conduct during third-party video calls (Google Meet, Zoom).
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: PRIVACY POLICY */}
          {activeTab === 'privacy' && (
            <div className="space-y-4 text-xs">
              <h3 className="font-bold text-sm text-foreground">Connect Privacy Policy & Zero-Ad Commitment</h3>
              <p className="text-[11px] text-muted-foreground font-mono">Last Updated: September 14, 2026 · A product of Swipecraft</p>

              <div className="space-y-3">
                <div className="rounded-lg bg-blue-500/10 border border-blue-500/20 p-3 text-blue-300">
                  <h4 className="font-bold text-white mb-0.5">1. Our Commitment: Free Software Without Advertisements</h4>
                  <p className="text-[11.5px] leading-relaxed">
                    Connect is strictly and permanently ad-free. We do not display third-party advertisements, banner ads, tracking beacons, or marketing cookies. Our platform remains clean, fast, and respectful of your focus.
                  </p>
                </div>

                <div>
                  <h4 className="font-bold text-foreground mb-1">2. What Information We Collect</h4>
                  <p>
                    We collect minimal personal data: your name, email address, and avatar provided via Google OAuth, plus the technical skills, headline, and domain you choose to publish on your public profile.
                  </p>
                </div>

                <div>
                  <h4 className="font-bold text-foreground mb-1">3. Zero Sale of Data</h4>
                  <p>
                    We never sell, rent, monetize, or broker your personal information, interview history, notes, or calibrations to recruiters, advertising networks, or third parties.
                  </p>
                </div>

                <div>
                  <h4 className="font-bold text-foreground mb-1">4. Community Sharing Commitment</h4>
                  <p>
                    Because this software operates without advertising revenue or monetization paywalls, it grows through community word-of-mouth. We encourage everyone to share Connect freely with fellow engineers, classmates, and study groups to help everyone grow.
                  </p>
                </div>

                <div>
                  <h4 className="font-bold text-foreground mb-1">5. Video Call Privacy</h4>
                  <p>
                    Video calls occur directly over Google Meet or your chosen video provider. Connect servers do not route, proxy, record, or store any call audio or video.
                  </p>
                </div>

                <div>
                  <h4 className="font-bold text-foreground mb-1">6. Right to Erasure (GDPR / CCPA)</h4>
                  <p>
                    You can request complete deletion of your profile, slot history, and evaluations at any time by contacting support.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: SUPPORT & REPORT BAD ACTOR */}
          {activeTab === 'support' && (
            <div className="space-y-4">
              <div>
                <h3 className="font-bold text-sm text-foreground">Support & Bad Actor Reporting</h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Report a no-show, appeal an unfair strike, report unprofessional behavior, or suggest a feature.
                </p>
              </div>

              {reportSubmitted ? (
                <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-300 space-y-2 animate-in fade-in">
                  <div className="font-bold flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                    <span>Report Received & Logged</span>
                  </div>
                  <p className="text-xs leading-relaxed">
                    Thank you for helping keep Connect high-trust and flake-free. Our moderation team reviews all reports within 24 hours.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSupportSubmit} className="space-y-3 text-xs">
                  <div>
                    <label className="block font-bold mb-1 text-foreground">Report Category</label>
                    <select
                      value={reportType}
                      onChange={(e) => setReportType(e.target.value)}
                      className="w-full rounded-xl border border-border/80 bg-card/60 px-3 py-2 text-xs shadow-xs focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 text-foreground"
                    >
                      <option value="no-show">Report Unexcused No-Show / Flake</option>
                      <option value="strike-appeal">Appeal an Unfair Attendance Strike</option>
                      <option value="harassment">Report Inappropriate / Toxic Behavior</option>
                      <option value="commercial">Report Paid Coaching / Recruiter Solicitation</option>
                      <option value="bug">Platform Bug or Technical Error</option>
                      <option value="feature">Feature Request or Feedback</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold mb-1 text-foreground">Your Contact Email</label>
                      <Input
                        type="email"
                        required
                        placeholder="you@example.com"
                        value={userEmail}
                        onChange={(e) => setUserEmail(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block font-bold mb-1 text-foreground">Related Session Topic / Slot ID</label>
                      <Input
                        placeholder="e.g. Distributed Caching (or leave blank)"
                        value={sessionSubject}
                        onChange={(e) => setSessionSubject(e.target.value)}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold mb-1 text-foreground">Detailed Description & Evidence</label>
                    <textarea
                      rows={4}
                      required
                      className="w-full rounded-xl border border-border/80 bg-card/60 px-3.5 py-2 text-xs shadow-xs focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 text-foreground"
                      placeholder="Please provide details of what occurred (e.g. peer waited 15 minutes with no reply, meeting link screenshot, or explanation for appeal)..."
                      value={reportDetails}
                      onChange={(e) => setReportDetails(e.target.value)}
                    />
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-border/40">
                    <span className="text-[11px] text-muted-foreground">
                      Reports are confidential and reviewed by community moderators.
                    </span>
                    <Button type="submit" size="sm" disabled={isSubmittingReport} className="gap-1.5 font-bold rounded-xl shadow-xs">
                      <Send className="h-3.5 w-3.5" />
                      {isSubmittingReport ? 'Submitting...' : 'Send Report'}
                    </Button>
                  </div>
                </form>
              )}
            </div>
          )}
        </div>

        {/* Modal Bottom Close Bar */}
        <div className="p-4 border-t border-border/60 bg-muted/20 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2 text-[11px] text-muted-foreground font-mono">
            <span>🛡️ Protected by Community Honor Code</span>
          </div>
          <Button variant="outline" size="sm" onClick={onClose} className="rounded-xl font-semibold">
            Close
          </Button>
        </div>
      </div>
    </div>
  );
};
