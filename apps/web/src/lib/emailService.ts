import { Slot, Profile } from '../types/database';

export interface SendRequestEmailParams {
  slot: Slot;
  applicant: Profile;
  message?: string;
  creatorEmail?: string;
}

export interface SendAcceptedEmailParams {
  slot: Slot;
  creator: Profile;
  applicant: Profile;
  applicantEmail?: string;
}

const WORKER_URL = 'https://peer-mock-worker.satyasaikiranrocks.workers.dev';

export async function sendMockRequestEmail({
  slot,
  applicant,
  message,
  creatorEmail,
}: SendRequestEmailParams): Promise<{ success: boolean; simulated?: boolean }> {
  try {
    const payload = {
      type: 'mock_request_received',
      to: creatorEmail || slot.creator?.email || 'swipecraft.in@gmail.com',
      slotId: slot.id,
      topicTitle: slot.topic_title,
      scheduledTime: slot.start_time,
      meetingUrl: slot.meeting_url,
      applicantName: applicant.full_name,
      applicantHeadline: applicant.headline || 'Software Engineer',
      applicantExperience: applicant.years_of_experience,
      applicantReliability: applicant.reliability_score,
      applicantMessage: message || 'Looking forward to practicing with you!',
    };

    // Attempt dispatch via Cloudflare Worker
    const res = await fetch(`${WORKER_URL}/api/send-email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }).catch(() => null);

    if (res && res.ok) {
      return { success: true };
    }

    // Fallback / simulated mode when credentials are not yet supplied
    console.log('[Connect Resend Dispatch] New Request Email Simulated:', payload);
    return { success: true, simulated: true };
  } catch (err) {
    console.warn('[Connect Resend Dispatch] Notification logged locally:', err);
    return { success: true, simulated: true };
  }
}

export async function sendMockAcceptedEmail({
  slot,
  creator,
  applicant,
  applicantEmail,
}: SendAcceptedEmailParams): Promise<{ success: boolean; simulated?: boolean }> {
  try {
    const payload = {
      type: 'mock_request_accepted',
      to: applicantEmail || applicant.email || 'swipecraft.in@gmail.com',
      slotId: slot.id,
      topicTitle: slot.topic_title,
      scheduledTime: slot.start_time,
      meetingUrl: slot.meeting_url,
      creatorName: creator.full_name,
      creatorHeadline: creator.headline || 'Peer Evaluator',
      creatorReliability: creator.reliability_score,
    };

    const res = await fetch(`${WORKER_URL}/api/send-email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }).catch(() => null);

    if (res && res.ok) {
      return { success: true };
    }

    console.log('[Connect Resend Dispatch] Accepted Request Email Simulated:', payload);
    return { success: true, simulated: true };
  } catch (err) {
    console.warn('[Connect Resend Dispatch] Notification logged locally:', err);
    return { success: true, simulated: true };
  }
}

export interface SendRejectedEmailParams {
  slot: Slot;
  applicant: Profile;
  creator?: Profile;
  reason?: string;
  applicantEmail?: string;
}

export async function sendMockRejectedEmail({
  slot,
  applicant,
  creator,
  reason,
  applicantEmail,
}: SendRejectedEmailParams): Promise<{ success: boolean; simulated?: boolean }> {
  try {
    const payload = {
      type: 'mock_request_declined',
      to: applicantEmail || applicant.email || 'swipecraft.in@gmail.com',
      slotId: slot.id,
      topicTitle: slot.topic_title,
      scheduledTime: slot.start_time,
      creatorName: creator?.full_name || 'Peer Host',
      reason: reason || 'Slot filled or schedule conflict',
    };

    const res = await fetch(`${WORKER_URL}/api/send-email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }).catch(() => null);

    if (res && res.ok) {
      return { success: true };
    }

    console.log('[Connect Resend Dispatch] Declined Request Email Simulated:', payload);
    return { success: true, simulated: true };
  } catch (err) {
    console.warn('[Connect Resend Dispatch] Notification logged locally:', err);
    return { success: true, simulated: true };
  }
}

export interface SendCancelledEmailParams {
  slot: Slot;
  cancellingUser?: Profile;
  recipientEmail?: string;
  reason?: string;
}

export async function sendMockCancelledEmail({
  slot,
  cancellingUser,
  recipientEmail,
  reason,
}: SendCancelledEmailParams): Promise<{ success: boolean; simulated?: boolean }> {
  try {
    const payload = {
      type: 'mock_session_cancelled',
      to: recipientEmail || 'swipecraft.in@gmail.com',
      slotId: slot.id,
      topicTitle: slot.topic_title,
      scheduledTime: slot.start_time,
      cancellingUserName: cancellingUser?.full_name || 'Peer Partner',
      reason: reason || 'Schedule conflict arose.',
    };

    const res = await fetch(`${WORKER_URL}/api/send-email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }).catch(() => null);

    if (res && res.ok) {
      return { success: true };
    }

    console.log('[Connect Resend Dispatch] Cancelled Session Email Simulated:', payload);
    return { success: true, simulated: true };
  } catch (err) {
    console.warn('[Connect Resend Dispatch] Notification logged locally:', err);
    return { success: true, simulated: true };
  }
}

