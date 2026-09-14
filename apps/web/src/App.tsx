import { useState, useEffect } from 'react';
import Lenis from 'lenis';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Navbar } from './components/Navbar';
import { MarketplaceView } from './components/MarketplaceView';
import { MySessionsView } from './components/MySessionsView';
import { ProfileView } from './components/ProfileView';
import { LoginPage } from './components/LoginPage';
import { CreateSlotModal } from './components/CreateSlotModal';
import { ReviewModal } from './components/ReviewModal';
import { TrustHubModal, TrustTab } from './components/TrustHubModal';
import { TimezoneModal } from './components/TimezoneModal';
import { OnboardingModal } from './components/OnboardingModal';
import { RequestMockModal } from './components/RequestMockModal';
import { SlotApplicantsModal } from './components/SlotApplicantsModal';
import { CancelSessionModal } from './components/CancelSessionModal';
import { PeerCancellationModal, PeerCancellationData } from './components/PeerCancellationModal';
import { TimezoneProvider } from './context/TimezoneContext';
import { NotificationProvider, useNotifications } from './context/NotificationContext';
import { AlertProvider, useAlert } from './context/AlertContext';
import { PresenceProvider } from './context/PresenceContext';
import { useSlots } from './hooks/useSlots';
import { useAuth } from './hooks/useAuth';
import { supabase, isSupabaseConfigured } from './lib/supabase';
import { Slot } from './types/database';
import { KeyboardShortcutBar } from './components/KeyboardShortcutBar';
import { Footer } from './components/Footer';

const queryClient = new QueryClient();

function MainApp() {
  const [activeTab, setActiveTab] = useState<'marketplace' | 'my-sessions' | 'profile'>('marketplace');
  const { showAlert, showConfirm } = useAlert();
  const {
    slots,
    requests,
    createSlot,
    sendRequest,
    acceptRequest,
    rejectRequest,
    withdrawRequest,
    cancelSlot,
    deleteSlot,
    submitReview,
  } = useSlots();
  const { user, profile, signInWithGoogle, signOut, updateProfile, refetchProfile } = useAuth();
  const { addNotification } = useNotifications();
  const [bookedSlotIds, setBookedSlotIds] = useState<string[]>([]);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [reviewModalSlot, setReviewModalSlot] = useState<Slot | null>(null);
  const [trustModalTab, setTrustModalTab] = useState<TrustTab | null>(null);
  const [isTimezoneModalOpen, setIsTimezoneModalOpen] = useState(false);
  const [requestingSlot, setRequestingSlot] = useState<Slot | null>(null);
  const [reviewingApplicantsSlot, setReviewingApplicantsSlot] = useState<Slot | null>(null);
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);
  const [cancellingModalSlot, setCancellingModalSlot] = useState<Slot | null>(null);
  const [peerCancellationAlert, setPeerCancellationAlert] = useState<PeerCancellationData | null>(null);
  const [syncedCalendarSlotIds, setSyncedCalendarSlotIds] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem('peermock_cal_synced');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const handleConfirmCalendarSync = (slotId: string) => {
    setSyncedCalendarSlotIds((prev) => {
      if (prev.includes(slotId)) return prev;
      const next = [...prev, slotId];
      try {
        localStorage.setItem('peermock_cal_synced', JSON.stringify(next));
      } catch {}
      return next;
    });
  };

  const currentUserId = profile?.id || user?.id;

  // Supabase Realtime broadcast listener for instant session cancellations by partner
  useEffect(() => {
    if (!isSupabaseConfigured) return;

    let channel: any = null;
    let reqChannel: any = null;

    try {
      channel = supabase.channel('room:session-events');
      channel
        .on(
          'broadcast',
          { event: 'session_cancelled' },
          (response: { payload: PeerCancellationData & { targetUserId: string; slotId: string } }) => {
            const { targetUserId, slotId, ...data } = response.payload;
            if (targetUserId && currentUserId && targetUserId === currentUserId) {
              setPeerCancellationAlert(data);
              queryClient.invalidateQueries({ queryKey: ['slots'] });
              queryClient.invalidateQueries({ queryKey: ['slot_requests'] });
              setBookedSlotIds((prev) => prev.filter((id) => id !== slotId));
              addNotification({
                title: 'Session Cancelled by Partner',
                message: `${data.cancellingUserName} was unable to attend and cancelled "${data.topicTitle}".`,
                type: 'cancellation',
                actionTab: 'marketplace',
              });
            }
          }
        )
        .subscribe();
    } catch (err) {
      console.warn('Realtime session-events warning:', err);
    }

    try {
      const reqChannelName = `slot-req-alerts-${Math.random().toString(36).substring(2, 9)}`;
      reqChannel = supabase
        .channel(reqChannelName)
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'slot_requests' },
          (payload) => {
            const newReq = payload.new as any;
            if (newReq && currentUserId) {
              const targetSlot = slots.find((s) => s.id === newReq.slot_id);
              if (targetSlot && targetSlot.creator_id === currentUserId && newReq.applicant_id !== currentUserId) {
                addNotification({
                  title: 'New Candidate Applied!',
                  message: `A peer applied to join "${targetSlot.topic_title}". Click to review their profile and accept.`,
                  type: 'booking',
                  actionTab: 'my-sessions',
                  slotId: targetSlot.id,
                });
              }
            }
          }
        )
        .on(
          'postgres_changes',
          { event: 'UPDATE', schema: 'public', table: 'slot_requests' },
          (payload) => {
            const updatedReq = payload.new as any;
            if (updatedReq && currentUserId && updatedReq.applicant_id === currentUserId) {
              const targetSlot = slots.find((s) => s.id === updatedReq.slot_id);
              const topic = targetSlot?.topic_title || 'session';
              if (updatedReq.status === 'accepted') {
                addNotification({
                  title: 'Application Accepted!',
                  message: `Your request for "${topic}" was accepted! Google Meet room & calendar scheduled.`,
                  type: 'booking',
                  actionTab: 'my-sessions',
                  slotId: updatedReq.slot_id,
                });
              } else if (updatedReq.status === 'rejected' || updatedReq.status === 'declined') {
                addNotification({
                  title: 'Application Update',
                  message: `Host was unable to accommodate your application for "${topic}". Explore other open slots!`,
                  type: 'cancellation',
                  actionTab: 'marketplace',
                });
              }
            }
          }
        )
        .subscribe();
    } catch (err) {
      console.warn('Realtime slot_requests_alerts warning:', err);
    }

    return () => {
      if (channel) supabase.removeChannel(channel);
      if (reqChannel) supabase.removeChannel(reqChannel);
    };
  }, [currentUserId, slots]);

  // Auto trigger onboarding wizard if user profile is missing initial setup
  useEffect(() => {
    if (user && profile && profile.onboarding_completed === false) {
      setIsOnboardingOpen(true);
    }
  }, [user, profile]);

  // Lenis smooth scroll engine
  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.05,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: 'vertical',
      smoothWheel: true,
    });

    let animationFrameId: number;
    function raf(time: number) {
      lenis.raf(time);
      animationFrameId = requestAnimationFrame(raf);
    }
    animationFrameId = requestAnimationFrame(raf);

    return () => {
      cancelAnimationFrame(animationFrameId);
      lenis.destroy();
    };
  }, []);

  // Global Keyboard Shortcuts (1: Market, 2: Sessions, 3: Profile, N: Post slot, Esc: Close)
  useEffect(() => {
    const handleGlobalKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName || '';
      const isInput = tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT';
      if (e.key === 'Escape') {
        setIsCreateModalOpen(false);
        setReviewModalSlot(null);
        setTrustModalTab(null);
        setIsTimezoneModalOpen(false);
        setRequestingSlot(null);
        setReviewingApplicantsSlot(null);
        setIsOnboardingOpen(false);
        setCancellingModalSlot(null);
        return;
      }
      if (isInput) return;
      if (e.key === '1') setActiveTab('marketplace');
      if (e.key === '2') setActiveTab('my-sessions');
      if (e.key === '3') setActiveTab('profile');
      if (e.key.toLowerCase() === 'n') {
        e.preventDefault();
        setIsCreateModalOpen(true);
      }
    };
    window.addEventListener('keydown', handleGlobalKey);
    return () => window.removeEventListener('keydown', handleGlobalKey);
  }, []);

  const handleSendRequest = async (slotId: string, message: string) => {
    if (!currentUserId) {
      await showAlert({
        title: 'Sign In Required',
        message: 'Please sign in with Google to request a practice session.',
        type: 'info',
      });
      signInWithGoogle();
      return;
    }
    try {
      const applicantId = currentUserId;
      const targetSlot = slots.find((s) => s.id === slotId);
      await sendRequest({
        slotId,
        applicantId,
        message,
        applicant: profile || undefined,
        slot: targetSlot,
      });

      addNotification({
        title: 'Mock Request Submitted',
        message: `Your request to practice "${targetSlot?.topic_title || 'session'}" was sent. The host will review and accept.`,
        type: 'booking',
        actionTab: 'marketplace',
        slotId,
      });

      await showAlert({
        title: 'Practice Request Dispatched',
        message: 'Request sent to host! When the creator accepts your application, your Google Meet room and calendar invite will be confirmed.',
        type: 'success',
      });
    } catch (err: any) {
      await showAlert({
        title: 'Request Failed',
        message: err.message || 'Error submitting request',
        type: 'danger',
      });
    }
  };

  const handleAcceptApplicant = async (requestId: string, slotId: string, applicantId: string) => {
    if (!currentUserId) {
      await showAlert({
        title: 'Sign In Required',
        message: 'Please sign in to manage sessions.',
        type: 'info',
      });
      return;
    }
    try {
      const targetSlot = slots.find((s) => s.id === slotId);
      const applicantReq = requests.find((r) => r.id === requestId);
      await acceptRequest({
        requestId,
        slotId,
        creatorId: currentUserId,
        candidateId: applicantId,
        creator: profile || undefined,
        applicant: applicantReq?.applicant,
        slot: targetSlot,
      });

      setBookedSlotIds((prev) => [...prev, slotId]);

      addNotification({
        title: 'Candidate Accepted!',
        message: `You accepted ${applicantReq?.applicant?.full_name || 'candidate'} for "${targetSlot?.topic_title}". Google Meet room confirmed.`,
        type: 'booking',
        actionTab: 'my-sessions',
        slotId,
      });

      // Automatically schedule Google Calendar sync status
      handleConfirmCalendarSync(slotId);

      await showAlert({
        title: 'Candidate Confirmed!',
        message: 'Candidate accepted! Session is now confirmed and Google Calendar sync is ready.',
        type: 'success',
      });
    } catch (err: any) {
      await showAlert({
        title: 'Error',
        message: err.message || 'Error accepting candidate',
        type: 'danger',
      });
    }
  };

  const handleWithdrawRequest = async (requestId: string) => {
    try {
      await withdrawRequest({ requestId });
      addNotification({
        title: 'Application Withdrawn',
        message: 'Your application for this practice session has been withdrawn.',
        type: 'cancellation',
        actionTab: 'marketplace',
      });
      await showAlert({
        title: 'Application Withdrawn',
        message: 'Your application for this practice session has been withdrawn.',
        type: 'info',
      });
    } catch (err: any) {
      await showAlert({
        title: 'Withdrawal Error',
        message: err.message || 'Error withdrawing request',
        type: 'danger',
      });
    }
  };

  const handleRejectApplicant = async (
    requestId: string,
    slotId: string,
    applicantId: string,
    note?: string
  ) => {
    if (!currentUserId) {
      await showAlert({
        title: 'Sign In Required',
        message: 'Please sign in to manage sessions.',
        type: 'info',
      });
      return;
    }
    try {
      const targetSlot = slots.find((s) => s.id === slotId);
      const applicantReq = requests.find((r) => r.id === requestId);
      await rejectRequest({
        requestId,
        slotId,
        creatorId: currentUserId,
        applicantId,
        reason: note,
        creator: profile || undefined,
        applicant: applicantReq?.applicant,
        slot: targetSlot,
      });

      addNotification({
        title: 'Applicant Request Declined',
        message: `You declined the request from ${applicantReq?.applicant?.full_name || 'candidate'}.`,
        type: 'cancellation',
        actionTab: 'marketplace',
      });

      await showAlert({
        title: 'Request Declined',
        message: 'Applicant request was declined and a polite notification sent.',
        type: 'info',
      });
    } catch (err: any) {
      await showAlert({
        title: 'Error',
        message: err.message || 'Error declining candidate request',
        type: 'danger',
      });
    }
  };

  const handleNavigateTab = (tab: 'marketplace' | 'my-sessions' | 'profile', slotId?: string) => {
    setActiveTab(tab);
    if (slotId) {
      setTimeout(() => {
        const el = document.getElementById(`slot-${slotId}`);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 100);
    }
  };

  const handleConfirmCancelSession = async (
    slotId: string,
    reason: string,
    returnToFeed: boolean,
    isLate: boolean
  ) => {
    try {
      const targetSlot = slots.find((s) => s.id === slotId);
      const isOpenListing = targetSlot?.status === 'open';

      if (isOpenListing && !returnToFeed) {
        // Direct permanent deletion of unbooked open listing
        await deleteSlot(slotId);
        setBookedSlotIds((prev) => prev.filter((id) => id !== slotId));
        addNotification({
          title: 'Practice Slot Removed',
          message: `Your mock session "${targetSlot?.topic_title || 'session'}" was deleted from the marketplace.`,
          type: 'cancellation',
          actionTab: 'marketplace',
        });
        await showAlert({
          title: 'Listing Deleted',
          message: 'Your mock practice slot has been deleted from the marketplace.',
          type: 'info',
        });
        return;
      }

      await cancelSlot({
        slotId,
        cancellingUserId: currentUserId,
        cancellingUser: profile || undefined,
        reason,
        returnToFeed,
      });

      setBookedSlotIds((prev) => prev.filter((id) => id !== slotId));

      addNotification({
        title: returnToFeed ? 'Session Restored to Feed' : 'Session Cancelled',
        message: returnToFeed
          ? `Your session has been restored to the live Marketplace feed. Cancellation note sent to your peer.`
          : `Session has been cancelled. Cancellation note sent to your peer.`,
        type: isLate ? 'strike' : 'cancellation',
        actionTab: 'marketplace',
      });

      if (isLate) {
        // Persist the late cancellation penalty to the profile
        if (profile) {
          const nextLate = (profile.late_cancel_count ?? 0) + 1;
          const nextKarma = Math.max(50, (profile.karma_score ?? 300) - 25);
          await updateProfile({
            late_cancel_count: nextLate,
            karma_score: nextKarma,
          });
        }
        await showAlert({
          title: 'Late Cancellation Logged',
          message:
            'Session cancelled with less than 2 hours notice. A 25 Karma deduction was recorded on your profile.',
          type: 'warning',
        });
      } else {
        await showAlert({
          title: returnToFeed ? 'Slot Reopened to Feed' : 'Session Cancelled',
          message: returnToFeed
            ? 'Session cancelled and slot restored to the Marketplace feed! Other peers can now request this slot.'
            : 'Session has been cancelled and your partner was notified.',
          type: 'info',
        });
      }
    } catch (err: any) {
      await showAlert({
        title: 'Cancellation Error',
        message: err.message || 'Error cancelling session',
        type: 'danger',
      });
    }
  };

  const handleSlotCreated = async (newSlotData: Partial<Slot>) => {
    try {
      const created = await createSlot(newSlotData);
      if (created?.id) {
        handleConfirmCalendarSync(created.id);
      }
      addNotification({
        title: 'Practice Slot Published',
        message: `Your session "${newSlotData.topic_title || 'session'}" is live on the marketplace! Google Calendar reminder scheduled.`,
        type: 'booking',
        actionTab: 'marketplace',
        slotId: created?.id,
      });
      await showAlert({
        title: 'Slot Published Live',
        message: 'Your mock session is published to the marketplace! Google Calendar reminder is automatically scheduled.',
        type: 'success',
      });
    } catch (err: any) {
      await showAlert({
        title: 'Publish Error',
        message: err.message || 'Error creating slot',
        type: 'danger',
      });
    }
  };

  const handleSubmitReview = async (reviewData: {
    attended: boolean;
    communication: number;
    technical: number;
    structure: number;
    feedback: string;
  }) => {
    if (!reviewModalSlot || !currentUserId) return;

    try {
      const reviewerId = currentUserId;
      const revieweeId =
        reviewModalSlot.creator_id === reviewerId
          ? reviewModalSlot.participant_id
          : reviewModalSlot.creator_id;

      if (!revieweeId) {
        await showAlert({
          title: 'Participant Missing',
          message: 'Cannot submit review: Other session participant was not found.',
          type: 'danger',
        });
        return;
      }

      await submitReview({
        slotId: reviewModalSlot.id,
        reviewerId,
        revieweeId,
        attended: reviewData.attended,
        communication: reviewData.communication,
        technical: reviewData.technical,
        structure: reviewData.structure,
        feedback: reviewData.feedback,
      });

      await refetchProfile();

      await showAlert({
        title: reviewData.attended ? 'Session Review Logged!' : 'No-Show Recorded',
        message: reviewData.attended
          ? 'Session Review Submitted! Ratings logged, constructive notes saved, and peer reputation updated in real time.'
          : 'No-show report logged. 25% strike applied to no-show account per Community Honor Code.',
        type: reviewData.attended ? 'success' : 'warning',
      });

      addNotification({
        title: reviewData.attended ? 'Session Review Submitted' : 'No-Show Report Logged',
        message: reviewData.attended
          ? 'Your feedback has been logged! Reputation standing and upskilling metrics updated in real time.'
          : '25% strike applied to no-show account per Community Honor Code.',
        type: reviewData.attended ? 'credit' : 'strike',
        actionTab: 'my-sessions',
      });
    } catch (err: any) {
      await showAlert({
        title: 'Review Submission Error',
        message: err.message || 'Error submitting review',
        type: 'danger',
      });
    }
  };

  const confirmedSessionsCount = slots.filter(
    (s) =>
      s.status === 'booked' &&
      (bookedSlotIds.includes(s.id) ||
        (currentUserId && (s.participant_id === currentUserId || s.creator_id === currentUserId)))
  ).length;

  const [copiedLink, setCopiedLink] = useState(false);

  const handleSharePlatform = async () => {
    const shareData = {
      title: 'Connect by Swipecraft — 100% Free Peer Mock Practice · Zero Paywalls · Zero Ads',
      text: 'Upskill your craft while empowering other engineers. Practice live technical mocks with zero fees or ads on Connect!',
      url: 'https://connect.swipecraft.in',
    };

    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share(shareData);
        return;
      } catch {
        // User cancelled or share unavailable, fallback to clipboard
      }
    }

    try {
      await navigator.clipboard.writeText('https://connect.swipecraft.in');
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 3000);
      await showAlert({
        title: 'Platform Link Copied!',
        message: 'Share https://connect.swipecraft.in with fellow engineers, classmates, and study groups — 100% free, zero ads!',
        type: 'success',
      });
    } catch {
      await showAlert({
        title: 'Link',
        message: 'Platform URL: https://connect.swipecraft.in',
        type: 'info',
      });
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#08090C] text-[#E8EAF0] selection:bg-[#3e8bff]/25 font-sans">
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onNavigateTab={handleNavigateTab}
        onOpenCreateSlot={() => {
          if (!currentUserId) {
            setActiveTab('profile');
            return;
          }
          setIsCreateModalOpen(true);
        }}
        mySessionsCount={confirmedSessionsCount}
        profile={profile}
        user={user}
        onSignInGoogle={signInWithGoogle}
        onSignOut={signOut}
        isConfigured={isSupabaseConfigured}
        onOpenTrustHub={(tab) => setTrustModalTab(tab)}
        onOpenTimezoneModal={() => setIsTimezoneModalOpen(true)}
      />

      <main className="flex-1 container mx-auto max-w-[1360px] px-4 sm:px-8 lg:px-12 py-8 sm:py-12 pb-32 md:pb-24">
        {activeTab === 'marketplace' ? (
          <MarketplaceView
            slots={slots}
            requests={requests}
            onRequestSlot={(slot) => setRequestingSlot(slot)}
            onReviewApplicants={(slot) => setReviewingApplicantsSlot(slot)}
            myBookedSlotIds={bookedSlotIds}
            currentUserId={currentUserId}
            onCancelSlot={async (slot) => {
              try {
                await deleteSlot(slot.id);
                addNotification({
                  title: 'Practice Slot Removed',
                  message: `Your mock session "${slot.topic_title}" was deleted from the marketplace.`,
                  type: 'cancellation',
                  actionTab: 'marketplace',
                });
                await showAlert({
                  title: 'Listing Deleted',
                  message: 'Your mock practice slot has been deleted from the marketplace.',
                  type: 'info',
                });
              } catch (err: any) {
                await showAlert({
                  title: 'Error Deleting Slot',
                  message: err.message || 'Error deleting slot',
                  type: 'danger',
                });
              }
            }}
            onOpenTimezoneModal={() => setIsTimezoneModalOpen(true)}
            onPublishSlot={async () => {
              if (!currentUserId) {
                setActiveTab('profile');
                return;
              }
              setIsCreateModalOpen(true);
            }}
          />
        ) : activeTab === 'my-sessions' ? (
          !user ? (
            <LoginPage
              onSignInGoogle={signInWithGoogle}
              onExploreMarketplace={() => setActiveTab('marketplace')}
            />
          ) : (
            <MySessionsView
              allSlots={slots}
              requests={requests}
              bookedSlotIds={bookedSlotIds}
              syncedCalendarSlotIds={syncedCalendarSlotIds}
              currentUserId={currentUserId}
              onOpenReview={(slot) => setReviewModalSlot(slot)}
              onReviewApplicants={(slot) => setReviewingApplicantsSlot(slot)}
              onCancelSlot={async (slot) => {
                if (slot.status === 'open') {
                  const confirmed = await showConfirm({
                    title: 'Delete Practice Slot',
                    message: `Permanently remove "${slot.topic_title}" from the marketplace?`,
                    confirmText: 'Delete Listing',
                    type: 'warning',
                  });
                  if (confirmed) {
                    try {
                      await deleteSlot(slot.id);
                      addNotification({
                        title: 'Practice Slot Removed',
                        message: `Your mock session "${slot.topic_title}" was deleted from the marketplace.`,
                        type: 'cancellation',
                        actionTab: 'marketplace',
                      });
                      await showAlert({
                        title: 'Listing Deleted',
                        message: 'Your mock practice slot has been deleted from the marketplace.',
                        type: 'info',
                      });
                    } catch (err: any) {
                      await showAlert({
                        title: 'Error Deleting Slot',
                        message: err.message || 'Error deleting slot',
                        type: 'danger',
                      });
                    }
                  }
                  return;
                }
                setCancellingModalSlot(slot);
              }}
              onWithdrawRequest={handleWithdrawRequest}
            />
          )
        ) : (
          !user ? (
            <LoginPage
              onSignInGoogle={signInWithGoogle}
              onExploreMarketplace={() => setActiveTab('marketplace')}
            />
          ) : (
            <ProfileView
              profile={profile}
              slots={slots}
              onUpdateProfile={async (updates) => {
                await updateProfile(updates);
                addNotification({
                  title: 'Profile Updated',
                  message: 'Your technical profile calibration has been saved.',
                  type: 'system',
                  actionTab: 'profile',
                });
              }}
              onNavigateToMarketplace={() => setActiveTab('marketplace')}
            />
          )
        )}
      </main>

      {/* Antigravity-Style Clean Footer with Swipecraft Branding — Home Page Only */}
      {activeTab === 'marketplace' && (
        <Footer
          onOpenTrustHub={(tab) => setTrustModalTab(tab)}
          onNavigateTab={(tab) => setActiveTab(tab)}
          onOpenCreateSlot={() => setIsCreateModalOpen(true)}
          onSharePlatform={handleSharePlatform}
          copiedLink={copiedLink}
        />
      )}

      {/* Modals */}
      <CreateSlotModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSlotCreated={handleSlotCreated}
        creatorId={profile?.id}
      />

      {reviewModalSlot && (
        <ReviewModal
          slot={reviewModalSlot}
          isOpen={Boolean(reviewModalSlot)}
          onClose={() => setReviewModalSlot(null)}
          onSubmitReview={handleSubmitReview}
        />
      )}

      <TrustHubModal
        isOpen={Boolean(trustModalTab)}
        onClose={() => setTrustModalTab(null)}
        initialTab={trustModalTab || 'faq'}
      />

      <TimezoneModal
        isOpen={isTimezoneModalOpen}
        onClose={() => setIsTimezoneModalOpen(false)}
      />

      <OnboardingModal
        isOpen={isOnboardingOpen}
        onClose={() => setIsOnboardingOpen(false)}
        profile={profile}
        onSaveProfile={updateProfile}
      />

      <RequestMockModal
        isOpen={Boolean(requestingSlot)}
        onClose={() => setRequestingSlot(null)}
        slot={requestingSlot}
        applicant={profile}
        onSubmitRequest={handleSendRequest}
      />

      <SlotApplicantsModal
        isOpen={Boolean(reviewingApplicantsSlot)}
        onClose={() => setReviewingApplicantsSlot(null)}
        slot={reviewingApplicantsSlot}
        requests={requests}
        onAcceptApplicant={handleAcceptApplicant}
        onRejectApplicant={handleRejectApplicant}
      />

      <CancelSessionModal
        isOpen={Boolean(cancellingModalSlot)}
        onClose={() => setCancellingModalSlot(null)}
        slot={cancellingModalSlot}
        currentUserId={currentUserId}
        onConfirmCancel={handleConfirmCancelSession}
      />

      <PeerCancellationModal
        isOpen={Boolean(peerCancellationAlert)}
        onClose={() => setPeerCancellationAlert(null)}
        onBrowseMarketplace={() => {
          setPeerCancellationAlert(null);
          setActiveTab('marketplace');
        }}
        data={peerCancellationAlert}
      />

      {/* Floating Keyboard Shortcut Bar */}
      <KeyboardShortcutBar
        selectionLabel={activeTab === 'marketplace' ? `${slots.length} open slots` : undefined}
      />
    </div>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TimezoneProvider>
        <NotificationProvider>
          <AlertProvider>
            <PresenceProvider>
              <MainApp />
            </PresenceProvider>
          </AlertProvider>
        </NotificationProvider>
      </TimezoneProvider>
    </QueryClientProvider>
  );
}
