import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { Slot, SlotRequest, Profile } from '../types/database';
import {
  sendMockAcceptedEmail,
  sendMockRejectedEmail,
  sendMockCancelledEmail,
} from '../lib/emailService';

// Clear legacy cached mock slots & requests from browser localStorage
if (typeof window !== 'undefined') {
  try {
    const legacySlots = localStorage.getItem('peermock_slots');
    if (legacySlots && (legacySlots.includes('b0000000') || legacySlots.includes('mock-1') || legacySlots.includes('Alex Rivera'))) {
      localStorage.removeItem('peermock_slots');
    }
    const legacyReqs = localStorage.getItem('peermock_slot_requests');
    if (legacyReqs && (legacyReqs.includes('req-mock') || legacyReqs.includes('user-alex'))) {
      localStorage.removeItem('peermock_slot_requests');
    }
  } catch {
    // Ignore storage access errors
  }
}

export function useSlots() {
  const queryClient = useQueryClient();

  // Realtime subscription for slots and requests
  useEffect(() => {
    if (!isSupabaseConfigured) return;

    let channel: any = null;
    try {
      const channelName = `slots-sync-${Math.random().toString(36).substring(2, 9)}`;
      channel = supabase
        .channel(channelName)
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'slots' },
          () => {
            queryClient.invalidateQueries({ queryKey: ['slots'] });
          }
        )
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'slot_requests' },
          () => {
            queryClient.invalidateQueries({ queryKey: ['slot_requests'] });
            queryClient.invalidateQueries({ queryKey: ['slots'] });
          }
        )
        .subscribe();
    } catch (err) {
      console.warn('Realtime slots sync registration warning:', err);
    }

    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [queryClient]);

  // Query all slots
  const slotsQuery = useQuery({
    queryKey: ['slots'],
    queryFn: async (): Promise<Slot[]> => {
      if (!isSupabaseConfigured) {
        const saved = localStorage.getItem('peermock_slots');
        return saved ? JSON.parse(saved) : [];
      }

      const { data, error } = await supabase
        .from('slots')
        .select('*, creator:profiles!creator_id(*), participant:profiles!participant_id(*)')
        .neq('status', 'cancelled')
        .order('start_time', { ascending: true });

      if (error) {
        console.error('Error fetching slots from Supabase:', error);
        return [];
      }

      return (data as Slot[]) || [];
    },
  });

  // Query all slot requests
  const requestsQuery = useQuery({
    queryKey: ['slot_requests'],
    queryFn: async (): Promise<SlotRequest[]> => {
      if (!isSupabaseConfigured) {
        const saved = localStorage.getItem('peermock_slot_requests');
        return saved ? JSON.parse(saved) : [];
      }

      const { data, error } = await supabase
        .from('slot_requests')
        .select('*, applicant:profiles!applicant_id(*), slot:slots!slot_id(*)')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching slot requests from Supabase:', error);
        return [];
      }

      return (data as SlotRequest[]) || [];
    },
  });

  // Create slot mutation
  const createSlotMutation = useMutation({
    mutationFn: async (newSlot: Partial<Slot>) => {
      if (!newSlot.creator_id) {
        throw new Error('You must be signed in to create a practice slot.');
      }

      if (!isSupabaseConfigured) {
        const current = slotsQuery.data || [];
        const mockSlot: Slot = {
          id: `slot-${Date.now()}`,
          created_at: new Date().toISOString(),
          ...newSlot,
        } as Slot;
        const updated = [mockSlot, ...current];
        localStorage.setItem('peermock_slots', JSON.stringify(updated));
        return mockSlot;
      }

      const { creator, participant, id, created_at, ...dbPayload } = newSlot as any;
      const cleanInsertData = {
        ...dbPayload,
        status: dbPayload.status || 'open',
      };

      const { data, error } = await supabase
        .from('slots')
        .insert(cleanInsertData)
        .select('*, creator:profiles!creator_id(*), participant:profiles!participant_id(*)')
        .single();

      if (error) {
        console.error('Supabase slot creation error:', error);
        throw error;
      }
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['slots'] });
    },
  });

  // Submit Request for Slot mutation (Candidate -> Host)
  const sendRequestMutation = useMutation({
    mutationFn: async ({
      slotId,
      applicantId,
      message,
      applicant,
      slot: _slot,
    }: {
      slotId: string;
      applicantId: string;
      message: string;
      applicant?: Profile;
      slot?: Slot;
    }) => {
      if (!applicantId) {
        throw new Error('You must be signed in to request a practice session.');
      }

      if (!isSupabaseConfigured) {
        const currentRequests = requestsQuery.data || [];
        const newReq: SlotRequest = {
          id: `req-${Date.now()}`,
          slot_id: slotId,
          applicant_id: applicantId,
          message,
          status: 'pending',
          created_at: new Date().toISOString(),
          applicant: applicant,
        };
        const updated = [newReq, ...currentRequests];
        localStorage.setItem('peermock_slot_requests', JSON.stringify(updated));

        // In-app notifications handle new requests; Gmail is reserved for high-priority accept/reject events
        return newReq;
      }

      const { data, error } = await supabase
        .from('slot_requests')
        .upsert(
          {
            slot_id: slotId,
            applicant_id: applicantId,
            message,
            status: 'pending',
            created_at: new Date().toISOString(),
          },
          { onConflict: 'slot_id,applicant_id' }
        )
        .select('*, applicant:profiles!applicant_id(*)')
        .single();

      if (error) throw error;

      // In-app notifications handle incoming requests; Gmail is reserved for high-priority accept/reject events
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['slot_requests'] });
      queryClient.invalidateQueries({ queryKey: ['slots'] });
    },
  });

  // Accept Candidate Request mutation (Host -> Selects Candidate)
  const acceptRequestMutation = useMutation({
    mutationFn: async ({
      requestId,
      slotId,
      creatorId,
      candidateId,
      creator,
      applicant,
      slot,
    }: {
      requestId: string;
      slotId: string;
      creatorId: string;
      candidateId: string;
      creator?: Profile;
      applicant?: Profile;
      slot?: Slot;
    }) => {
      if (!isSupabaseConfigured) {
        const currentSlots = slotsQuery.data || [];
        const updatedSlots = currentSlots.map((s) =>
          s.id === slotId
            ? {
                ...s,
                status: 'booked' as const,
                participant_id: candidateId,
                participant: applicant || s.participant,
              }
            : s
        );
        localStorage.setItem('peermock_slots', JSON.stringify(updatedSlots));

        const currentRequests = requestsQuery.data || [];
        const updatedRequests = currentRequests.map((r) => {
          if (r.id === requestId) return { ...r, status: 'accepted' as const };
          if (r.slot_id === slotId && r.status === 'pending')
            return { ...r, status: 'declined' as const };
          return r;
        });
        localStorage.setItem('peermock_slot_requests', JSON.stringify(updatedRequests));

        if (slot && creator && applicant) {
          await sendMockAcceptedEmail({
            slot,
            creator,
            applicant,
          });
        }

        return { success: true, slotId, candidateId };
      }

      // Supabase RPC execution
      const { data, error } = await supabase.rpc('accept_slot_request', {
        p_request_id: requestId,
        p_slot_id: slotId,
        p_creator_id: creatorId,
      });

      if (error) throw error;

      // Dispatch Resend email
      if (slot && creator && applicant) {
        await sendMockAcceptedEmail({
          slot,
          creator,
          applicant,
          applicantEmail: applicant.email,
        });
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['slot_requests'] });
      queryClient.invalidateQueries({ queryKey: ['slots'] });
    },
  });

  // Reject slot request mutation
  const rejectRequestMutation = useMutation({
    mutationFn: async ({
      requestId,
      slotId,
      creatorId: _creatorId,
      applicantId: _applicantId,
      reason,
      creator,
      applicant,
      slot,
    }: {
      requestId: string;
      slotId: string;
      creatorId?: string;
      applicantId?: string;
      reason?: string;
      creator?: Profile;
      applicant?: Profile;
      slot?: Slot;
    }) => {
      const targetSlot = slot || (slotsQuery.data || []).find((s) => s.id === slotId);
      const requests = requestsQuery.data || [];
      const targetReq = requests.find((r) => r.id === requestId);
      const resolvedApplicant = applicant || targetReq?.applicant;
      const resolvedCreator = creator || targetSlot?.creator;

      if (!isSupabaseConfigured) {
        const updated = requests.map((r) =>
          r.id === requestId ? { ...r, status: 'declined' as const } : r
        );
        localStorage.setItem('peermock_slot_requests', JSON.stringify(updated));
        queryClient.setQueryData(['slot_requests'], updated);

        if (targetSlot && resolvedApplicant) {
          await sendMockRejectedEmail({
            slot: targetSlot,
            applicant: resolvedApplicant,
            creator: resolvedCreator,
            reason,
            applicantEmail: resolvedApplicant.email,
          });
        }
        return { success: true };
      }

      const { data, error } = await supabase
        .from('slot_requests')
        .update({ status: 'declined' })
        .eq('id', requestId)
        .select()
        .single();

      if (error) throw error;

      // Dispatch Resend email notification
      if (targetSlot && resolvedApplicant) {
        await sendMockRejectedEmail({
          slot: targetSlot,
          applicant: resolvedApplicant,
          creator: resolvedCreator,
          reason,
          applicantEmail: resolvedApplicant.email,
        });
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['slot_requests'] });
      queryClient.invalidateQueries({ queryKey: ['slots'] });
    },
  });

  // Withdraw Candidate Request mutation (Candidate changes mind before review)
  const withdrawRequestMutation = useMutation({
    mutationFn: async ({ requestId }: { requestId: string }) => {
      if (!isSupabaseConfigured) {
        const current = requestsQuery.data || [];
        const updated = current.filter((r) => r.id !== requestId);
        localStorage.setItem('peermock_slot_requests', JSON.stringify(updated));
        return { success: true, requestId };
      }

      const { data, error } = await supabase
        .from('slot_requests')
        .delete()
        .eq('id', requestId);

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['slot_requests'] });
      queryClient.invalidateQueries({ queryKey: ['slots'] });
    },
  });

  // Cancel slot / session mutation with pre-session edge cases & return-to-feed
  const cancelSlotMutation = useMutation({
    mutationFn: async (
      args:
        | string
        | {
            slotId: string;
            cancellingUserId?: string;
            cancellingUser?: Profile;
            reason?: string;
            returnToFeed?: boolean;
          }
    ) => {
      const slotId = typeof args === 'string' ? args : args.slotId;
      const cancellingUserId = typeof args === 'string' ? undefined : args.cancellingUserId;
      const cancellingUser = typeof args === 'string' ? undefined : args.cancellingUser;
      const reason = typeof args === 'string' ? undefined : args.reason;
      const returnToFeed = typeof args === 'string' ? true : (args.returnToFeed ?? true);

      const slot = (slotsQuery.data || []).find((s) => s.id === slotId);
      const isLateCancel = Boolean(
        slot && new Date(slot.start_time).getTime() - Date.now() < 2 * 60 * 60 * 1000
      );

      // Determine recipient for cancellation notification
      const isHost = cancellingUserId && slot ? slot.creator_id === cancellingUserId : true;
      const otherUser = isHost ? slot?.participant : slot?.creator;
      const otherUserId = isHost ? slot?.participant_id : slot?.creator_id;
      const recipientEmail = otherUser?.email || 'swipecraft.in@gmail.com';

      // Optimistically update TanStack Query cache so UI updates instantly
      queryClient.setQueryData(['slots'], (old: Slot[] | undefined) => {
        if (!old) return [];
        if (returnToFeed) {
          return old.map((s) =>
            s.id === slotId ? { ...s, status: 'open' as const, participant_id: null, participant: undefined } : s
          );
        }
        return old.filter((s) => s.id !== slotId);
      });

      if (!isSupabaseConfigured) {
        const current = slotsQuery.data || [];
        const updated = current.map((s) => {
          if (s.id !== slotId) return s;
          if (returnToFeed) {
            return {
              ...s,
              status: 'open' as const,
              participant_id: null,
              participant: undefined,
            };
          }
          return { ...s, status: 'cancelled' as const };
        });
        localStorage.setItem('peermock_slots', JSON.stringify(updated));

        // Also clean up any requests for this slot
        const currentReqs = requestsQuery.data || [];
        const updatedReqs = currentReqs.map((r) =>
          r.slot_id === slotId && (r.status === 'accepted' || !returnToFeed)
            ? { ...r, status: 'declined' as const }
            : r
        );
        localStorage.setItem('peermock_slot_requests', JSON.stringify(updatedReqs));

        return { success: true, slotId, isLateCancel, reOpened: returnToFeed };
      }

      // 1. Try dedicated Worker endpoint first (service-role authority bypasses RLS and dispatches email after DB success)
      let handledByWorker = false;
      try {
        const workerRes = await fetch('https://peer-mock-worker.satyasaikiranrocks.workers.dev/api/cancel-slot', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            slot_id: slotId,
            user_id: cancellingUserId,
            reason,
            return_to_feed: returnToFeed,
          }),
        });

        if (workerRes.ok) {
          const resJson = await workerRes.json();
          if (resJson.success) {
            handledByWorker = true;
          }
        }
      } catch (workerErr) {
        console.warn('[useSlots] Worker /api/cancel-slot unavailable, falling back to direct client Supabase:', workerErr);
      }

      // 2. Direct Supabase Client fallback if worker was unreachable
      if (!handledByWorker) {
        if (returnToFeed) {
          const { error } = await supabase
            .from('slots')
            .update({ status: 'open', participant_id: null })
            .eq('id', slotId);

          if (error) throw error;

          await supabase
            .from('slot_requests')
            .update({ status: 'declined' })
            .eq('slot_id', slotId)
            .eq('status', 'accepted');
        } else {
          const { error } = await supabase
            .from('slots')
            .update({ status: 'cancelled', participant_id: null })
            .eq('id', slotId);

          if (error) throw error;

          await supabase
            .from('slot_requests')
            .update({ status: 'declined' })
            .eq('slot_id', slotId);
        }

        if (isLateCancel && cancellingUserId) {
          try {
            const { data: userProf } = await supabase
              .from('profiles')
              .select('late_cancel_count, karma_score')
              .eq('id', cancellingUserId)
              .maybeSingle();
            if (userProf) {
              const nextLate = (userProf.late_cancel_count || 0) + 1;
              const nextKarma = Math.max(50, (userProf.karma_score || 300) - 25);
              await supabase
                .from('profiles')
                .update({
                  late_cancel_count: nextLate,
                  karma_score: nextKarma,
                })
                .eq('id', cancellingUserId);
            }
          } catch (lateErr) {
            console.warn('[useSlots] Error persisting late cancel penalty:', lateErr);
          }
        }

        // Only dispatch email if handled by client fallback
        if (slot) {
          sendMockCancelledEmail({
            slot,
            cancellingUser,
            recipientEmail,
            reason,
          }).catch(console.error);
        }
      }

      // 3. Broadcast realtime event to the other peer if booked
      if (otherUserId) {
        try {
          const sessionEventsChannel = supabase.channel('room:session-events');
          sessionEventsChannel.send({
            type: 'broadcast',
            event: 'session_cancelled',
            payload: {
              slotId,
              targetUserId: otherUserId,
              cancellingUserName: cancellingUser?.full_name || (isHost ? 'Session Host' : 'Peer Partner'),
              topicTitle: slot?.topic_title || 'Mock Practice Session',
              startTime: slot?.start_time,
              reason,
              reOpened: returnToFeed,
            },
          });
        } catch (broadcastErr) {
          console.warn('[PeerMock Realtime Broadcast] Warning:', broadcastErr);
        }
      }

      return { success: true, slotId, isLateCancel, reOpened: returnToFeed };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['slots'] });
      queryClient.invalidateQueries({ queryKey: ['slot_requests'] });
    },
  });

  // Direct Delete Slot Mutation for open slots
  const deleteSlotMutation = useMutation({
    mutationFn: async (slotId: string) => {
      // Optimistically remove from TanStack Query cache so slot vanishes from the UI immediately
      queryClient.setQueryData(['slots'], (old: Slot[] | undefined) => {
        if (!old) return [];
        return old.filter((s) => s.id !== slotId);
      });

      // Clean up localStorage cache if any
      try {
        const saved = localStorage.getItem('peermock_slots');
        if (saved) {
          const current = JSON.parse(saved);
          localStorage.setItem(
            'peermock_slots',
            JSON.stringify(current.filter((s: any) => s.id !== slotId))
          );
        }
      } catch {}

      if (!isSupabaseConfigured) {
        return { success: true, slotId };
      }

      // 1. Try dedicated Worker delete endpoint first (service role bypasses RLS cleanly)
      try {
        const workerRes = await fetch('https://peer-mock-worker.satyasaikiranrocks.workers.dev/api/delete-slot', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ slot_id: slotId }),
        });
        if (workerRes.ok) {
          const resJson = await workerRes.json();
          if (resJson.success) {
            return { success: true, slotId };
          }
        }
      } catch (workerErr) {
        console.warn('[useSlots] Worker /api/delete-slot unavailable, trying direct client:', workerErr);
      }

      // 2. Direct Supabase client fallback (permitted by Migration 0004)
      await supabase.from('slot_requests').delete().eq('slot_id', slotId);
      const { error: delErr } = await supabase.from('slots').delete().eq('id', slotId);
      if (delErr) {
        // Soft-delete fallback
        await supabase.from('slots').update({ status: 'cancelled', participant_id: null }).eq('id', slotId);
      }

      return { success: true, slotId };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['slots'] });
      queryClient.invalidateQueries({ queryKey: ['slot_requests'] });
    },
  });

  // Submit Review RPC mutation
  const submitReviewMutation = useMutation({
    mutationFn: async ({
      slotId,
      reviewerId,
      revieweeId,
      attended,
      communication,
      technical,
      structure,
      feedback,
    }: {
      slotId: string;
      reviewerId: string;
      revieweeId: string;
      attended: boolean;
      communication: number;
      technical: number;
      structure: number;
      feedback: string;
    }) => {
      if (!isSupabaseConfigured) {
        const current = slotsQuery.data || [];
        const updated = current.map((s) =>
          s.id === slotId ? { ...s, status: 'completed' as const } : s
        );
        localStorage.setItem('peermock_slots', JSON.stringify(updated));
        return { success: true, slotId, attended };
      }

      const { data, error } = await supabase.rpc('submit_review', {
        p_slot_id: slotId,
        p_reviewer_id: reviewerId,
        p_reviewee_id: revieweeId,
        p_attended: attended,
        p_comm: communication,
        p_tech: technical,
        p_struct: structure,
        p_feedback: feedback || '',
      });

      if (error) {
        console.error('Error in submit_review RPC:', error);
        throw error;
      }
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['slots'] });
    },
  });

  return {
    slots: slotsQuery.data || [],
    requests: requestsQuery.data || [],
    isLoading: slotsQuery.isLoading,
    createSlot: createSlotMutation.mutateAsync,
    sendRequest: sendRequestMutation.mutateAsync,
    withdrawRequest: withdrawRequestMutation.mutateAsync,
    acceptRequest: acceptRequestMutation.mutateAsync,
    rejectRequest: rejectRequestMutation.mutateAsync,
    cancelSlot: cancelSlotMutation.mutateAsync,
    deleteSlot: deleteSlotMutation.mutateAsync,
    submitReview: submitReviewMutation.mutateAsync,
  };
}
