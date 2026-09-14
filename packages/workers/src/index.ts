import { createClient, SupabaseClient } from '@supabase/supabase-js';
import ical, { ICalCalendarMethod } from 'ical-generator';
import { Resend } from 'resend';

function toBase64(str: string): string {
  return btoa(unescape(encodeURIComponent(str)));
}

export interface Env {
  SUPABASE_URL: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
  RESEND_API_KEY: string;
  RESEND_FROM_EMAIL: string;
  CRON_SECRET?: string;
}

// Helper to resolve real user emails via Supabase Auth Admin API
async function resolveUserEmail(
  supabase: SupabaseClient,
  userId?: string | null,
  profile?: any
): Promise<string | null> {
  if (profile?.email && typeof profile.email === 'string' && profile.email.includes('@')) {
    return profile.email;
  }
  if (!userId) return null;

  try {
    const { data, error } = await supabase.auth.admin.getUserById(userId);
    if (error || !data?.user?.email) return null;
    return data.user.email;
  } catch {
    return null;
  }
}

// Helper to generate RFC 5545 calendar file
function generateIcs(slot: any): string {
  const calendar = ical({ name: 'Connect Practice Session (by Swipecraft)' });
  calendar.method(ICalCalendarMethod.REQUEST);
  calendar.createEvent({
    id: slot.id,
    start: new Date(slot.start_time),
    end: new Date(slot.end_time || (new Date(slot.start_time).getTime() + 45 * 60 * 1000)),
    summary: `Connect: ${slot.topic_title}`,
    description: `Connect by Swipecraft — Peer Mock Interview Session\nDomain: ${slot.domain}\nSeniority: ${slot.target_experience}\nJoin Google Meet: ${slot.meeting_url}`,
    location: slot.meeting_url,
    url: slot.meeting_url,
  });
  return calendar.toString();
}

// Helper to safely get clean, trimmed Resend API key
function getResendApiKey(env: Env): string {
  const raw = env.RESEND_API_KEY || '';
  const clean = raw.trim();
  return clean && clean !== 'placeholder' ? clean : '';
}

interface EmailShellOptions {
  badgeText: string;
  badgeBg: string;
  badgeColor: string;
  badgeBorder: string;
  title: string;
  subtitle?: string;
  contentHtml: string;
  primaryCtaText?: string;
  primaryCtaUrl?: string;
  secondaryCtaText?: string;
  secondaryCtaUrl?: string;
  noticeHtml?: string;
}

function renderConnectEmailShell(options: EmailShellOptions): string {
  const {
    badgeText,
    badgeBg,
    badgeColor,
    badgeBorder,
    title,
    subtitle,
    contentHtml,
    primaryCtaText,
    primaryCtaUrl,
    secondaryCtaText,
    secondaryCtaUrl,
    noticeHtml,
  } = options;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #060709; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #F1F5F9; -webkit-font-smoothing: antialiased;">
  <table role="presentation" cellpadding="0" cellspacing="0" width="100%" border="0" style="background-color: #060709; min-height: 100vh; padding: 32px 12px;">
    <tr>
      <td align="center" style="vertical-align: top;">
        <!-- Email Card (Max 580px) -->
        <table role="presentation" cellpadding="0" cellspacing="0" width="100%" border="0" style="max-width: 580px; margin: 0 auto; background-color: #0D0F14; border: 1px solid #1E2330; border-radius: 16px; overflow: hidden; box-shadow: 0 20px 40px rgba(0,0,0,0.6);">
          
          <!-- Top Header Bar with Swipecraft Logo & Brand -->
          <tr>
            <td style="padding: 24px 28px 20px 28px; border-bottom: 1px solid #181C26; background: linear-gradient(180deg, #11141C 0%, #0D0F14 100%);">
              <table role="presentation" cellpadding="0" cellspacing="0" width="100%" border="0">
                <tr>
                  <td style="vertical-align: middle;">
                    <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td style="vertical-align: middle; padding-right: 12px;">
                          <img src="https://connect.swipecraft.in/swipecraft-brand-logo.png?v=3" width="32" height="32" alt="Connect by Swipecraft" style="display: block; border-radius: 8px; border: 0;" />
                        </td>
                        <td style="vertical-align: middle;">
                          <div style="font-size: 17px; font-weight: 800; color: #FFFFFF; letter-spacing: -0.02em; line-height: 1.2;">
                            Connect
                          </div>
                          <div style="font-size: 11px; font-weight: 600; color: #71717A; letter-spacing: 0.04em; text-transform: uppercase;">
                            by Swipecraft
                          </div>
                        </td>
                      </tr>
                    </table>
                  </td>
                  <td align="right" style="vertical-align: middle;">
                    <span style="display: inline-block; background-color: ${badgeBg}; color: ${badgeColor}; border: 1px solid ${badgeBorder}; font-size: 10.5px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; padding: 4px 10px; border-radius: 9999px;">
                      ${badgeText}
                    </span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Main Content -->
          <tr>
            <td style="padding: 32px 28px 24px 28px;">
              <h1 style="margin: 0 0 8px 0; font-size: 21px; font-weight: 700; color: #FFFFFF; letter-spacing: -0.02em; line-height: 1.3;">
                ${title}
              </h1>
              
              ${subtitle ? `<p style="margin: 0 0 24px 0; font-size: 14px; line-height: 1.6; color: #94A3B8;">${subtitle}</p>` : ''}

              <!-- Dynamic Content -->
              ${contentHtml}

              <!-- Notice Box (Optional) -->
              ${noticeHtml ? `
              <div style="margin: 20px 0 0 0; background-color: #12151E; border: 1px solid #1E2738; border-radius: 8px; padding: 12px 16px;">
                ${noticeHtml}
              </div>
              ` : ''}

              <!-- Action Buttons -->
              ${(primaryCtaText || secondaryCtaText) ? `
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin-top: 28px; width: 100%;">
                <tr>
                  <td>
                    ${primaryCtaText && primaryCtaUrl ? `
                      <a href="${primaryCtaUrl}" target="_blank" style="display: inline-block; background-color: #2563EB; color: #FFFFFF; text-decoration: none; font-size: 13.5px; font-weight: 600; padding: 12px 22px; border-radius: 8px; margin-right: 10px; margin-bottom: 8px; letter-spacing: -0.01em; box-shadow: 0 4px 12px rgba(37,99,235,0.25);">
                        ${primaryCtaText}
                      </a>
                    ` : ''}
                    ${secondaryCtaText && secondaryCtaUrl ? `
                      <a href="${secondaryCtaUrl}" target="_blank" style="display: inline-block; background-color: #059669; color: #FFFFFF; text-decoration: none; font-size: 13.5px; font-weight: 600; padding: 12px 20px; border-radius: 8px; margin-bottom: 8px; letter-spacing: -0.01em; box-shadow: 0 4px 12px rgba(5,150,105,0.25);">
                        ${secondaryCtaText}
                      </a>
                    ` : ''}
                  </td>
                </tr>
              </table>
              ` : ''}

            </td>
          </tr>

          <!-- Footer: Brand Mission & Public Good Commitment -->
          <tr>
            <td style="padding: 22px 28px 24px 28px; background-color: #090B0E; border-top: 1px solid #181C26;">
              <table role="presentation" cellpadding="0" cellspacing="0" width="100%" border="0">
                <tr>
                  <td style="vertical-align: top;">
                    <div style="font-size: 11px; font-weight: 700; color: #F13F03; letter-spacing: 0.05em; text-transform: uppercase; margin-bottom: 6px;">
                      SWIPECRAFT COMMUNITY COMMITMENT
                    </div>
                    <div style="font-size: 12px; line-height: 1.55; color: #64748B; margin-bottom: 12px;">
                      Connect is an entirely free, ad-free peer practice platform by Swipecraft. Upskill yourself while empowering other engineers — zero paywalls, zero credits, zero recruiter spam.
                    </div>
                    <div style="font-size: 11.5px; color: #475569; line-height: 1.4;">
                      <a href="https://connect.swipecraft.in" style="color: #3E8BFF; text-decoration: none; font-weight: 500;">connect.swipecraft.in</a> &nbsp;•&nbsp;
                      <a href="https://swipecraft.in" style="color: #64748B; text-decoration: none;">swipecraft.in</a>
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

// Core Cron Sweeper execution logic (shared by Scheduled and HTTP test endpoint)
async function executeCronSweeper(env: Env) {
  const logs: string[] = [];
  logs.push(`[${new Date().toISOString()}] Starting Connect cron sweep...`);

  if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
    logs.push('Skipping: Supabase environment credentials not configured.');
    return { success: false, logs };
  }

  const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
  const resendApiKey = getResendApiKey(env);
  const resend = resendApiKey ? new Resend(resendApiKey) : null;
  const fromEmail = env.RESEND_FROM_EMAIL || 'Connect by Swipecraft <notifications@connect.swipecraft.in>';

  const now = new Date();

  // =========================================================================
  // 1. Auto-expire unbooked slots in the past
  // =========================================================================
  const { data: expiredSlots, error: expireErr } = await supabase
    .from('slots')
    .update({ status: 'cancelled' })
    .eq('status', 'open')
    .lt('start_time', now.toISOString())
    .select('id, topic_title');

  if (expireErr) {
    logs.push(`Error expiring stale slots: ${expireErr.message}`);
  } else if (expiredSlots && expiredSlots.length > 0) {
    logs.push(`Auto-expired ${expiredSlots.length} past unbooked slots.`);
  }

  // =========================================================================
  // 2. Process 24-Hour Reminders (Sessions between 23h and 25h away)
  // =========================================================================
  const in23h = new Date(now.getTime() + 23 * 60 * 60 * 1000).toISOString();
  const in25h = new Date(now.getTime() + 25 * 60 * 60 * 1000).toISOString();

  const { data: slots24h, error: err24h } = await supabase
    .from('slots')
    .select('*, creator:profiles!creator_id(*), participant:profiles!participant_id(*)')
    .eq('status', 'booked')
    .eq('reminder_24h_sent', false)
    .gte('start_time', in23h)
    .lte('start_time', in25h);

  if (err24h) {
    logs.push(`Error querying 24h reminders: ${err24h.message}`);
  } else if (slots24h && slots24h.length > 0) {
    logs.push(`Found ${slots24h.length} sessions requiring 24h reminders.`);

    for (const slot of slots24h) {
      const creatorEmail = await resolveUserEmail(supabase, slot.creator_id, slot.creator);
      const participantEmail = await resolveUserEmail(supabase, slot.participant_id, slot.participant);
      const recipientEmails = [creatorEmail, participantEmail].filter(Boolean) as string[];

      if (recipientEmails.length > 0 && resend) {
        const icsData = generateIcs(slot);
        const formattedSlotTime = new Date(slot.start_time).toLocaleString('en-US', {
          dateStyle: 'full',
          timeStyle: 'short',
        });
        const reminder24Html = renderConnectEmailShell({
          badgeText: '24-HOUR REMINDER',
          badgeBg: 'rgba(59, 130, 246, 0.15)',
          badgeColor: '#60A5FA',
          badgeBorder: 'rgba(59, 130, 246, 0.3)',
          title: 'Practice Session in 24 Hours',
          subtitle: `Your peer practice session for "${slot.topic_title}" is scheduled for tomorrow.`,
          contentHtml: `
            <div style="background-color: #141722; border: 1px solid #22283A; border-radius: 10px; padding: 18px; margin-bottom: 16px;">
              <div style="font-size: 11px; font-weight: 700; color: #3E8BFF; text-transform: uppercase; letter-spacing: 0.06em; margin-bottom: 6px;">SESSION DETAILS</div>
              <div style="font-size: 16px; font-weight: 600; color: #FFFFFF; margin-bottom: 4px;">${slot.topic_title}</div>
              <div style="font-size: 13px; color: #94A3B8; margin-bottom: 8px;">📅 ${formattedSlotTime}</div>
              <div style="font-size: 12.5px; color: #CBD5E1;">Track: <strong style="color: #FFFFFF;">${slot.domain || 'Mock Interview'}</strong> (${slot.target_experience || 'Peer Level'})</div>
            </div>
            ${slot.meeting_url ? `
            <div style="background-color: #0F1C18; border: 1px solid rgba(16, 185, 129, 0.25); border-radius: 10px; padding: 16px; margin-bottom: 16px;">
              <div style="font-size: 11px; font-weight: 700; color: #34D399; text-transform: uppercase; letter-spacing: 0.06em; margin-bottom: 4px;">GOOGLE MEET ROOM</div>
              <div style="font-size: 13px; color: #A7F3D0; margin-bottom: 12px;">Your video room link is ready. Feel free to bookmark it:</div>
              <a href="${slot.meeting_url}" target="_blank" style="display: inline-block; background-color: #059669; color: #FFFFFF; text-decoration: none; font-size: 13.5px; font-weight: 600; padding: 10px 18px; border-radius: 6px;">Join Google Meet ↗</a>
            </div>
            ` : ''}
          `,
          primaryCtaText: 'Open Dashboard →',
          primaryCtaUrl: 'https://connect.swipecraft.in',
          noticeHtml: `📎 A calendar invitation (.ics) is attached to this email. Add it to your calendar to stay on track.`,
        });

        try {
          await resend.emails.send({
            from: fromEmail,
            to: recipientEmails,
            subject: `Reminder: Peer Mock in 24 Hours — ${slot.topic_title}`,
            text: `Hi there!\n\nYour peer mock interview is scheduled for tomorrow at ${slot.start_time}.\n\nTopic: ${slot.topic_title}\nDomain: ${slot.domain}\nMeeting URL: ${slot.meeting_url}\n\nPlease add the attached .ics invite to your calendar and prepare your notes in advance.\n\nConnect by Swipecraft: https://connect.swipecraft.in`,
            html: reminder24Html,
            attachments: [
              {
                filename: 'interview-invite.ics',
                content: toBase64(icsData),
              },
            ],
          });
          logs.push(`Sent 24h reminder for slot ${slot.id} to ${recipientEmails.join(', ')}`);
        } catch (e: any) {
          logs.push(`Failed to send 24h email for slot ${slot.id}: ${e.message}`);
        }
      }

      // Mark reminder as sent
      await supabase
        .from('slots')
        .update({ reminder_24h_sent: true })
        .eq('id', slot.id);
    }
  }

  // =========================================================================
  // 3. Process 30-Minute Reminders (Sessions between 0 and 45 mins away)
  // =========================================================================
  const in45m = new Date(now.getTime() + 45 * 60 * 1000).toISOString();

  const { data: slots30m, error: err30m } = await supabase
    .from('slots')
    .select('*, creator:profiles!creator_id(*), participant:profiles!participant_id(*)')
    .eq('status', 'booked')
    .eq('reminder_30m_sent', false)
    .gte('start_time', now.toISOString())
    .lte('start_time', in45m);

  if (err30m) {
    logs.push(`Error querying 30m reminders: ${err30m.message}`);
  } else if (slots30m && slots30m.length > 0) {
    logs.push(`Found ${slots30m.length} sessions requiring 30m reminders.`);

    for (const slot of slots30m) {
      const creatorEmail = await resolveUserEmail(supabase, slot.creator_id, slot.creator);
      const participantEmail = await resolveUserEmail(supabase, slot.participant_id, slot.participant);
      const recipientEmails = [creatorEmail, participantEmail].filter(Boolean) as string[];

      if (recipientEmails.length > 0 && resend) {
        const formattedSlotTime = new Date(slot.start_time).toLocaleString('en-US', {
          dateStyle: 'full',
          timeStyle: 'short',
        });
        const reminder30Html = renderConnectEmailShell({
          badgeText: 'STARTING IN 30 MIN',
          badgeBg: 'rgba(239, 68, 68, 0.15)',
          badgeColor: '#F87171',
          badgeBorder: 'rgba(239, 68, 68, 0.3)',
          title: `⚡ Starting in 30 Minutes: ${slot.topic_title}`,
          subtitle: `Your peer practice session begins in 30 minutes! Please join promptly to protect your reliability score.`,
          contentHtml: `
            <div style="background-color: #141722; border: 1px solid #22283A; border-radius: 10px; padding: 18px; margin-bottom: 16px;">
              <div style="font-size: 11px; font-weight: 700; color: #F87171; text-transform: uppercase; letter-spacing: 0.06em; margin-bottom: 6px;">STARTING SOON</div>
              <div style="font-size: 16px; font-weight: 600; color: #FFFFFF; margin-bottom: 4px;">${slot.topic_title}</div>
              <div style="font-size: 13px; color: #94A3B8;">📅 ${formattedSlotTime}</div>
            </div>
            ${slot.meeting_url ? `
            <div style="background-color: #0F1C18; border: 1px solid rgba(16, 185, 129, 0.25); border-radius: 10px; padding: 16px; margin-bottom: 16px;">
              <div style="font-size: 11px; font-weight: 700; color: #34D399; text-transform: uppercase; letter-spacing: 0.06em; margin-bottom: 4px;">JOIN MEETING</div>
              <div style="font-size: 13px; color: #A7F3D0; margin-bottom: 12px;">Click below to launch Google Meet now:</div>
              <a href="${slot.meeting_url}" target="_blank" style="display: inline-block; background-color: #059669; color: #FFFFFF; text-decoration: none; font-size: 14px; font-weight: 700; padding: 12px 22px; border-radius: 6px;">Join Google Meet Now ↗</a>
            </div>
            ` : ''}
          `,
          primaryCtaText: 'Open Dashboard →',
          primaryCtaUrl: 'https://connect.swipecraft.in',
        });

        try {
          await resend.emails.send({
            from: fromEmail,
            to: recipientEmails,
            subject: `⚡ Starting in 30 Minutes: ${slot.topic_title}`,
            text: `Your peer practice session starts in 30 minutes!\n\nTopic: ${slot.topic_title}\nJoin Google Meet: ${slot.meeting_url}\n\nPlease join on time to protect your peer reliability score.\n\nConnect by Swipecraft: https://connect.swipecraft.in`,
            html: reminder30Html,
          });
          logs.push(`Sent 30m reminder for slot ${slot.id} to ${recipientEmails.join(', ')}`);
        } catch (e: any) {
          logs.push(`Failed to send 30m email for slot ${slot.id}: ${e.message}`);
        }
      }

      // Mark reminder as sent
      await supabase
        .from('slots')
        .update({ reminder_30m_sent: true })
        .eq('id', slot.id);
    }
  }

  logs.push('Cron sweep completed successfully.');
  return { success: true, logs };
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    // CORS Headers
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Cron-Secret',
    };

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    // Health check
    if (url.pathname === '/api/health') {
      return new Response(
        JSON.stringify({
          status: 'ok',
          service: 'peer-mock-worker',
          timestamp: new Date().toISOString(),
          supabaseConfigured: Boolean(env.SUPABASE_URL && env.SUPABASE_SERVICE_ROLE_KEY),
          resendConfigured: Boolean(env.RESEND_API_KEY && env.RESEND_API_KEY !== 'placeholder'),
        }),
        { headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    // Manual on-demand Cron Trigger endpoint for testing & monitoring
    if (url.pathname === '/api/trigger-cron') {
      const result = await executeCronSweeper(env);
      return new Response(JSON.stringify(result, null, 2), {
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    // Atomic Slot Booking Endpoint
    if (url.pathname === '/api/book-slot' && request.method === 'POST') {
      try {
        const body = (await request.json()) as { slot_id: string; participant_id: string };
        const { slot_id, participant_id } = body;

        if (!slot_id || !participant_id) {
          return new Response(
            JSON.stringify({ error: 'Missing slot_id or participant_id' }),
            { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
          );
        }

        const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

        // Atomic update protecting against double-booking and self-booking
        const { data: updatedSlot, error: updateError } = await supabase
          .from('slots')
          .update({
            status: 'booked',
            participant_id,
          })
          .eq('id', slot_id)
          .eq('status', 'open')
          .neq('creator_id', participant_id)
          .select('*, creator:profiles!creator_id(*), participant:profiles!participant_id(*)')
          .single();

        if (updateError || !updatedSlot) {
          return new Response(
            JSON.stringify({ error: 'Slot is no longer available, already booked, or cannot be self-booked.' }),
            { status: 409, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
          );
        }

        // Generate RFC 5545 calendar invite
        const icsContent = generateIcs(updatedSlot);

        // Dispatch confirmation emails via Resend
        const bookingResendKey = getResendApiKey(env);
        if (bookingResendKey) {
          const resend = new Resend(bookingResendKey);
          const creatorEmail = await resolveUserEmail(supabase, updatedSlot.creator_id, updatedSlot.creator);
          const participantEmail = await resolveUserEmail(supabase, updatedSlot.participant_id, updatedSlot.participant);
          const recipientEmails = [creatorEmail, participantEmail].filter(Boolean) as string[];

          if (recipientEmails.length > 0) {
            const formattedBookingDate = new Date(updatedSlot.start_time).toLocaleString('en-US', {
              dateStyle: 'full',
              timeStyle: 'short',
            });
            const startDt = new Date(updatedSlot.start_time);
            const endDt = updatedSlot.end_time ? new Date(updatedSlot.end_time) : new Date(startDt.getTime() + 45 * 60 * 1000);
            const startIso = startDt.toISOString().replace(/-|:|\.\d\d\d/g, '');
            const endIso = endDt.toISOString().replace(/-|:|\.\d\d\d/g, '');
            const gcalUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent('Connect: ' + updatedSlot.topic_title)}&dates=${startIso}/${endIso}&details=${encodeURIComponent('Peer Mock Session on Google Meet: ' + (updatedSlot.meeting_url || ''))}&location=${encodeURIComponent(updatedSlot.meeting_url || '')}`;

            const bookingHtml = renderConnectEmailShell({
              badgeText: 'CONFIRMED PRACTICE',
              badgeBg: 'rgba(16, 185, 129, 0.15)',
              badgeColor: '#34D399',
              badgeBorder: 'rgba(16, 185, 129, 0.3)',
              title: 'Your Practice Session is Confirmed!',
              subtitle: `You are confirmed for "${updatedSlot.topic_title}".`,
              contentHtml: `
                <div style="background-color: #141722; border: 1px solid #22283A; border-radius: 10px; padding: 18px; margin-bottom: 16px;">
                  <div style="font-size: 11px; font-weight: 700; color: #34D399; text-transform: uppercase; letter-spacing: 0.06em; margin-bottom: 6px;">SESSION DETAILS</div>
                  <div style="font-size: 16px; font-weight: 600; color: #FFFFFF; margin-bottom: 4px;">${updatedSlot.topic_title}</div>
                  <div style="font-size: 13px; color: #94A3B8; margin-bottom: 10px;">📅 ${formattedBookingDate}</div>
                  <div style="font-size: 12.5px; color: #CBD5E1;">Track: <strong style="color: #FFFFFF;">${updatedSlot.domain || 'Peer Practice'}</strong></div>
                </div>
                ${updatedSlot.meeting_url ? `
                <div style="background-color: #0F1C18; border: 1px solid rgba(16, 185, 129, 0.25); border-radius: 10px; padding: 16px; margin-bottom: 16px;">
                  <div style="font-size: 11px; font-weight: 700; color: #34D399; text-transform: uppercase; letter-spacing: 0.06em; margin-bottom: 4px;">VIDEO CALL ROOM</div>
                  <div style="font-size: 13px; color: #A7F3D0; margin-bottom: 12px;">This session takes place on Google Meet:</div>
                  <a href="${updatedSlot.meeting_url}" target="_blank" style="display: inline-block; background-color: #059669; color: #FFFFFF; text-decoration: none; font-size: 13.5px; font-weight: 600; padding: 10px 18px; border-radius: 6px;">Join Google Meet ↗</a>
                </div>
                ` : ''}
                <div style="background-color: #10141D; border: 1px solid rgba(62,139,255,0.25); border-radius: 10px; padding: 16px; margin-bottom: 16px;">
                  <div style="font-size: 11px; font-weight: 700; color: #60A5FA; text-transform: uppercase; letter-spacing: 0.06em; margin-bottom: 4px;">GOOGLE CALENDAR REMINDER</div>
                  <div style="font-size: 13px; color: #94A3B8; margin-bottom: 12px;">Pre-configured calendar event with your Google Meet room link:</div>
                  <a href="${gcalUrl}" target="_blank" style="display: inline-block; background-color: #2563EB; color: #FFFFFF; text-decoration: none; font-size: 13px; font-weight: 600; padding: 9px 16px; border-radius: 6px;">📅 Save to Google Calendar ↗</a>
                </div>
              `,
              primaryCtaText: 'Open Dashboard →',
              primaryCtaUrl: 'https://connect.swipecraft.in',
              secondaryCtaText: updatedSlot.meeting_url ? 'Join Google Meet ↗' : undefined,
              secondaryCtaUrl: updatedSlot.meeting_url || undefined,
              noticeHtml: '📎 A calendar invitation (.ics) is attached to this email. Add it to your calendar to stay on track.',
            });

            await resend.emails.send({
              from: env.RESEND_FROM_EMAIL || 'Connect by Swipecraft <notifications@connect.swipecraft.in>',
              to: recipientEmails,
              subject: `Confirmed: ${updatedSlot.topic_title} (Connect Session)`,
              text: `Your Connect peer practice session is confirmed!\n\nTopic: ${updatedSlot.topic_title}\nTime: ${updatedSlot.start_time}\nJoin Google Meet: ${updatedSlot.meeting_url}\n\nAdd the attached calendar invitation to your schedule.\n\nConnect by Swipecraft: https://connect.swipecraft.in`,
              html: bookingHtml,
              attachments: [
                {
                  filename: 'interview-invite.ics',
                  content: toBase64(icsContent),
                },
              ],
            });
          }
        }

        return new Response(JSON.stringify({ success: true, slot: updatedSlot }), {
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        });
      } catch (err: any) {
        return new Response(JSON.stringify({ error: err.message || 'Internal Server Error' }), {
          status: 500,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        });
      }
    }

    // Resilient Cancel Slot Endpoint (Service-role authority, bypasses RLS and manages email dispatch cleanly)
    if (url.pathname === '/api/cancel-slot' && request.method === 'POST') {
      try {
        const body = (await request.json()) as {
          slot_id: string;
          user_id?: string;
          reason?: string;
          return_to_feed?: boolean;
        };
        const { slot_id, user_id, reason, return_to_feed = true } = body;

        if (!slot_id) {
          return new Response(
            JSON.stringify({ error: 'Missing slot_id' }),
            { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
          );
        }

        const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

        // Fetch existing slot
        const { data: slot, error: fetchErr } = await supabase
          .from('slots')
          .select('*, creator:profiles!creator_id(*), participant:profiles!participant_id(*)')
          .eq('id', slot_id)
          .single();

        if (fetchErr || !slot) {
          return new Response(
            JSON.stringify({ error: 'Slot not found' }),
            { status: 404, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
          );
        }

        const isHost = user_id ? slot.creator_id === user_id : true;
        const otherUser = isHost ? slot.participant : slot.creator;
        const otherUserId = isHost ? slot.participant_id : slot.creator_id;

        // Perform Database Update
        let updatedSlot = null;
        if (return_to_feed) {
          const { data, error: updateErr } = await supabase
            .from('slots')
            .update({ status: 'open', participant_id: null })
            .eq('id', slot_id)
            .select('*, creator:profiles!creator_id(*)')
            .single();

          if (updateErr) throw updateErr;
          updatedSlot = data;

          // Decline accepted requests so applicant is freed
          await supabase
            .from('slot_requests')
            .update({ status: 'declined' })
            .eq('slot_id', slot_id)
            .eq('status', 'accepted');
        } else {
          const { data, error: updateErr } = await supabase
            .from('slots')
            .update({ status: 'cancelled', participant_id: null })
            .eq('id', slot_id)
            .select()
            .single();

          if (updateErr) throw updateErr;
          updatedSlot = data;

          // Decline all requests
          await supabase
            .from('slot_requests')
            .update({ status: 'declined' })
            .eq('slot_id', slot_id);
        }

        // ONLY dispatch cancellation email AFTER database update has succeeded
        if (otherUserId) {
          const otherEmail = await resolveUserEmail(supabase, otherUserId, otherUser);
          const targetEmail = otherEmail || 'swipecraft.in@gmail.com';
          const resendKey = getResendApiKey(env);
          if (resendKey) {
            const resend = new Resend(resendKey);
            const cancellingProfile = isHost ? slot.creator : slot.participant;
            const cancellingName = cancellingProfile?.full_name || (isHost ? 'Your host' : 'Your partner');
            const formattedDate = new Date(slot.start_time).toLocaleString('en-US', {
              dateStyle: 'full',
              timeStyle: 'short',
            });

            const emailHtml = renderConnectEmailShell({
              badgeText: 'SESSION CANCELLED',
              badgeBg: 'rgba(245, 158, 11, 0.15)',
              badgeColor: '#FBBF24',
              badgeBorder: 'rgba(245, 158, 11, 0.3)',
              title: 'Practice Session Cancelled',
              subtitle: `${cancellingName} cancelled the scheduled session for "${slot.topic_title}".`,
              contentHtml: `
                <div style="background-color: #141722; border: 1px solid #22283A; border-radius: 10px; padding: 18px; margin-bottom: 16px;">
                  <div style="font-size: 11px; font-weight: 700; color: #FBBF24; text-transform: uppercase; letter-spacing: 0.06em; margin-bottom: 6px;">CANCELLATION DETAILS</div>
                  <div style="font-size: 16px; font-weight: 600; color: #FFFFFF; margin-bottom: 4px;">${slot.topic_title}</div>
                  <div style="font-size: 13px; color: #94A3B8; margin-bottom: 12px;">📅 ${formattedDate}</div>
                  <div style="background-color: #0A0C11; border-left: 3px solid #F59E0B; border-radius: 0 6px 6px 0; padding: 12px 14px;">
                    <div style="font-size: 10.5px; font-weight: 700; color: #64748B; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 4px;">NOTE / REASON</div>
                    <div style="font-size: 13.5px; font-style: italic; color: #FEF3C7; line-height: 1.5;">"${reason || 'Schedule conflict arose.'}"</div>
                  </div>
                </div>

                <div style="background-color: #10141D; border: 1px solid rgba(62,139,255,0.2); border-radius: 8px; padding: 14px 16px;">
                  <p style="margin: 0; font-size: 12.5px; color: #9CC0FF; line-height: 1.5;">
                    ℹ️ ${return_to_feed ? 'This slot has automatically been restored to the live Marketplace feed so new peer matches can be scheduled.' : 'This session has been removed from your active schedule.'}
                  </p>
                </div>
              `,
              primaryCtaText: 'Browse Open Sessions →',
              primaryCtaUrl: 'https://connect.swipecraft.in',
            });

            try {
              await resend.emails.send({
                from: env.RESEND_FROM_EMAIL || 'Connect by Swipecraft <notifications@connect.swipecraft.in>',
                to: [targetEmail],
                subject: `Session Update: Practice for "${slot.topic_title}" was cancelled`,
                text: `Hi!\n\nYour scheduled mock session "${slot.topic_title}" (${formattedDate}) has been cancelled by ${cancellingName}.\n\nReason: "${reason || 'Schedule conflict arose.'}"\n\nConnect by Swipecraft: https://connect.swipecraft.in`,
                html: emailHtml,
              });
            } catch (emailErr) {
              console.warn('[Cancel Slot Email Dispatch Warning]:', emailErr);
            }
          }
        }

        return new Response(JSON.stringify({ success: true, slot: updatedSlot, reOpened: return_to_feed }), {
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        });
      } catch (err: any) {
        return new Response(JSON.stringify({ error: err.message || 'Internal Server Error' }), {
          status: 500,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        });
      }
    }

    // Direct Delete Slot Endpoint (Service-role authority, deletes from slot_requests and slots cleanly)
    if (url.pathname === '/api/delete-slot' && request.method === 'POST') {
      try {
        const body = (await request.json()) as { slot_id: string; user_id?: string };
        const { slot_id } = body;

        if (!slot_id) {
          return new Response(
            JSON.stringify({ error: 'Missing slot_id' }),
            { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
          );
        }

        const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

        // Delete related requests first
        await supabase.from('slot_requests').delete().eq('slot_id', slot_id);

        // Delete the slot
        const { error: deleteErr } = await supabase.from('slots').delete().eq('id', slot_id);

        if (deleteErr) {
          // If foreign key prevents hard delete, soft-delete to 'cancelled'
          await supabase.from('slots').update({ status: 'cancelled', participant_id: null }).eq('id', slot_id);
        }

        return new Response(JSON.stringify({ success: true, slot_id }), {
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        });
      } catch (err: any) {
        return new Response(JSON.stringify({ error: err.message || 'Internal Server Error' }), {
          status: 500,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        });
      }
    }

    // Dedicated Resend Email Dispatch Endpoint for Request and Accept events
    if (url.pathname === '/api/send-email' && request.method === 'POST') {
      try {
        const body = (await request.json()) as any;
        const {
          type,
          to,
          slotId,
          topicTitle,
          scheduledTime,
          meetingUrl,
          applicantName,
          applicantHeadline,
          applicantExperience,
          applicantReliability,
          applicantMessage,
          creatorName,
          cancellingUserName,
          reason,
        } = body;

        const resendApiKey = getResendApiKey(env);
        const fromEmail = env.RESEND_FROM_EMAIL || 'Connect by Swipecraft <notifications@connect.swipecraft.in>';

        if (!resendApiKey) {
          return new Response(
            JSON.stringify({
              success: true,
              simulated: true,
              message: 'Resend API key not configured yet on Worker. Email logged/simulated.',
            }),
            { headers: { 'Content-Type': 'application/json', ...corsHeaders } }
          );
        }

        const resend = new Resend(resendApiKey);

        // Resilient Resend Dispatch: Try sending to recipient; fallback silently without any fallback tag
        const dispatchResend = async (emailPayload: any) => {
          try {
            const res = await resend.emails.send(emailPayload);
            if (res.error) {
              console.warn('[Resend Initial Dispatch Warning]:', res.error);
              console.log('[Resend Sandbox Fallback] Routing copy to swipecraft.in@gmail.com');
              const fallback = await resend.emails.send({
                ...emailPayload,
                to: ['swipecraft.in@gmail.com'],
                subject: emailPayload.subject,
              });
              return fallback;
            }
            return res;
          } catch (e) {
            console.error('[Resend Dispatch Fatal]:', e);
            throw e;
          }
        };

        const targetEmail = to || 'swipecraft.in@gmail.com';

        const formattedDate = new Date(scheduledTime || Date.now()).toLocaleString('en-US', {
          dateStyle: 'full',
          timeStyle: 'short',
        });

        if (type === 'mock_request_received') {
          const emailHtml = renderConnectEmailShell({
            badgeText: 'PRACTICE REQUEST',
            badgeBg: 'rgba(99, 102, 241, 0.15)',
            badgeColor: '#818CF8',
            badgeBorder: 'rgba(99, 102, 241, 0.3)',
            title: `${applicantName || 'A peer'} requested to practice with you`,
            subtitle: `A candidate has sent a pairing request for your scheduled mock interview session.`,
            contentHtml: `
              <div style="background-color: #141722; border: 1px solid #22283A; border-radius: 10px; padding: 18px; margin-bottom: 16px;">
                <div style="font-size: 11px; font-weight: 700; color: #3E8BFF; text-transform: uppercase; letter-spacing: 0.06em; margin-bottom: 6px;">SESSION TOPIC</div>
                <div style="font-size: 16px; font-weight: 600; color: #FFFFFF; margin-bottom: 4px;">${topicTitle}</div>
                <div style="font-size: 13px; color: #94A3B8;">📅 ${formattedDate}</div>
              </div>

              <div style="background-color: #141722; border: 1px solid #22283A; border-radius: 10px; padding: 18px; margin-bottom: 16px;">
                <div style="font-size: 11px; font-weight: 700; color: #A78BFA; text-transform: uppercase; letter-spacing: 0.06em; margin-bottom: 8px;">APPLICANT PROFILE</div>
                <div style="font-size: 15px; font-weight: 600; color: #FFFFFF; margin-bottom: 6px;">
                  ${applicantName || 'Candidate'} <span style="font-size: 13px; font-weight: 400; color: #94A3B8;">• ${applicantHeadline || 'Software Engineer'}</span>
                </div>
                <div style="margin-bottom: 14px; font-size: 12px; color: #94A3B8;">
                  <span style="display: inline-block; background-color: #1E2332; border: 1px solid #2B3346; padding: 3px 8px; border-radius: 6px; margin-right: 6px;">💼 ${applicantExperience || 0} yrs experience</span>
                  <span style="display: inline-block; background-color: #1E2332; border: 1px solid #2B3346; padding: 3px 8px; border-radius: 6px;">⭐ ${applicantReliability || 100}% reliability score</span>
                </div>
                <div style="background-color: #0A0C11; border-left: 3px solid #3E8BFF; border-radius: 0 6px 6px 0; padding: 12px 14px;">
                  <div style="font-size: 10.5px; font-weight: 700; color: #64748B; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 4px;">CANDIDATE PITCH</div>
                  <div style="font-size: 13.5px; font-style: italic; color: #E2E8F0; line-height: 1.5;">"${applicantMessage || 'Looking forward to practicing and exchanging structured feedback!'}"</div>
                </div>
              </div>
            `,
            primaryCtaText: 'Review Applicants on Dashboard →',
            primaryCtaUrl: 'https://connect.swipecraft.in',
          });

          const res = await dispatchResend({
            from: fromEmail,
            to: [targetEmail],
            subject: `📨 Practice Request: ${applicantName || 'A peer'} wants to practice ${topicTitle}`,
            text: `Hi!\n\n${applicantName || 'A peer'} (${applicantHeadline || 'Software Engineer'}, ${applicantExperience || 0} yrs exp, ${applicantReliability || 100}% reliability) sent a request to practice "${topicTitle}" scheduled for ${formattedDate}.\n\nCandidate Pitch:\n"${applicantMessage || 'Looking forward to practicing!'}"\n\nLog in to review applicants and confirm your session:\nhttps://connect.swipecraft.in\n\nConnect by Swipecraft`,
            html: emailHtml,
          });

          return new Response(JSON.stringify({ success: !res?.error, resendResult: res }), {
            headers: { 'Content-Type': 'application/json', ...corsHeaders },
          });
        }

        if (type === 'mock_request_accepted') {
          const fakeSlot = {
            id: slotId,
            start_time: scheduledTime,
            topic_title: topicTitle,
            domain: 'Mock Interview',
            target_experience: 'Peer Level',
            meeting_url: meetingUrl || 'https://meet.google.com/new',
          };
          const icsData = generateIcs(fakeSlot);

          const emailHtml = renderConnectEmailShell({
            badgeText: 'SESSION CONFIRMED',
            badgeBg: 'rgba(16, 185, 129, 0.15)',
            badgeColor: '#34D399',
            badgeBorder: 'rgba(16, 185, 129, 0.3)',
            title: 'Your Practice Request was Accepted!',
            subtitle: `${creatorName || 'Your peer host'} confirmed your practice session. You're all set to pair!`,
            contentHtml: `
              <div style="background-color: #141722; border: 1px solid #22283A; border-radius: 10px; padding: 18px; margin-bottom: 16px;">
                <div style="font-size: 11px; font-weight: 700; color: #34D399; text-transform: uppercase; letter-spacing: 0.06em; margin-bottom: 6px;">CONFIRMED SESSION</div>
                <div style="font-size: 16px; font-weight: 600; color: #FFFFFF; margin-bottom: 4px;">${topicTitle}</div>
                <div style="font-size: 13px; color: #94A3B8; margin-bottom: 10px;">📅 ${formattedDate}</div>
                <div style="font-size: 13px; color: #CBD5E1;">👤 Host: <strong style="color: #FFFFFF;">${creatorName || 'Peer Host'}</strong></div>
              </div>

              ${meetingUrl ? `
              <div style="background-color: #0F1C18; border: 1px solid rgba(16, 185, 129, 0.25); border-radius: 10px; padding: 16px; margin-bottom: 16px;">
                <div style="font-size: 11px; font-weight: 700; color: #34D399; text-transform: uppercase; letter-spacing: 0.06em; margin-bottom: 4px;">VIDEO CALL ROOM</div>
                <div style="font-size: 13px; color: #A7F3D0; margin-bottom: 12px;">This session takes place on Google Meet. Test your microphone and camera before joining.</div>
                <a href="${meetingUrl}" target="_blank" style="display: inline-block; background-color: #059669; color: #FFFFFF; text-decoration: none; font-size: 13.5px; font-weight: 600; padding: 10px 18px; border-radius: 6px;">Join Google Meet ↗</a>
              </div>
              ` : ''}
            `,
            primaryCtaText: 'Open Dashboard →',
            primaryCtaUrl: 'https://connect.swipecraft.in',
            secondaryCtaText: meetingUrl ? 'Join Google Meet ↗' : undefined,
            secondaryCtaUrl: meetingUrl || undefined,
            noticeHtml: '📎 A calendar invitation (.ics) is attached to this email. Please be on time to maintain your reliability score.',
          });

          const res = await dispatchResend({
            from: fromEmail,
            to: [targetEmail],
            subject: `🎉 Request Accepted: ${topicTitle} with ${creatorName || 'Peer Host'}`,
            text: `Congratulations!\n\nYour request to practice "${topicTitle}" was accepted by ${creatorName || 'your peer host'}.\n\nTime: ${formattedDate}\nJoin Google Meet: ${meetingUrl || 'https://meet.google.com/new'}\n\nPlease add the attached .ics invite to your calendar and be on time.\n\nConnect by Swipecraft: https://connect.swipecraft.in`,
            html: emailHtml,
            attachments: [
              {
                filename: 'interview-invite.ics',
                content: toBase64(icsData),
              },
            ],
          });

          return new Response(JSON.stringify({ success: !res?.error, resendResult: res }), {
            headers: { 'Content-Type': 'application/json', ...corsHeaders },
          });
        }

        if (type === 'mock_request_declined') {
          const emailHtml = renderConnectEmailShell({
            badgeText: 'REQUEST UPDATE',
            badgeBg: 'rgba(244, 63, 94, 0.15)',
            badgeColor: '#FB7185',
            badgeBorder: 'rgba(244, 63, 94, 0.3)',
            title: 'Host Unable to Accept Request',
            subtitle: `${creatorName || 'The host'} was unable to accept your practice request for "${topicTitle}".`,
            contentHtml: `
              <div style="background-color: #141722; border: 1px solid #22283A; border-radius: 10px; padding: 18px; margin-bottom: 16px;">
                <div style="font-size: 11px; font-weight: 700; color: #FB7185; text-transform: uppercase; letter-spacing: 0.06em; margin-bottom: 6px;">NOTE FROM HOST</div>
                <div style="font-size: 14px; font-style: italic; color: #FEE2E2; line-height: 1.5; margin-bottom: 8px;">"${reason || 'Slot filled or schedule conflict'}"</div>
                <div style="font-size: 12px; color: #94A3B8;">Host: ${creatorName || 'Peer Host'}</div>
              </div>

              <div style="background-color: #12151E; border: 1px solid #1E2738; border-radius: 8px; padding: 14px 16px;">
                <div style="font-size: 13px; color: #94A3B8; line-height: 1.5;">
                  💡 <strong style="color: #FFFFFF;">Keep practicing:</strong> New slots open regularly in the marketplace across System Design, Coding, and Behavioral tracks. Find another peer to practice with!
                </div>
              </div>
            `,
            primaryCtaText: 'Find Another Practice Partner →',
            primaryCtaUrl: 'https://connect.swipecraft.in',
          });

          const res = await dispatchResend({
            from: fromEmail,
            to: [targetEmail],
            subject: `Update on your practice request for ${topicTitle}`,
            text: `Hi!\n\n${creatorName || 'The host'} was unable to accept your practice request for "${topicTitle}" (${formattedDate}).\n\nNote from host:\n"${reason || 'Slot filled or schedule conflict'}"\n\nDon't worry — there are many open slots in the marketplace!\n\nConnect by Swipecraft: https://connect.swipecraft.in`,
            html: emailHtml,
          });

          return new Response(JSON.stringify({ success: !res?.error, resendResult: res }), {
            headers: { 'Content-Type': 'application/json', ...corsHeaders },
          });
        }

        if (type === 'mock_session_cancelled') {
          const emailHtml = renderConnectEmailShell({
            badgeText: 'SESSION CANCELLED',
            badgeBg: 'rgba(245, 158, 11, 0.15)',
            badgeColor: '#FBBF24',
            badgeBorder: 'rgba(245, 158, 11, 0.3)',
            title: 'Practice Session Cancelled',
            subtitle: `${cancellingUserName || 'Your peer partner'} cancelled the scheduled session for "${topicTitle}".`,
            contentHtml: `
              <div style="background-color: #141722; border: 1px solid #22283A; border-radius: 10px; padding: 18px; margin-bottom: 16px;">
                <div style="font-size: 11px; font-weight: 700; color: #FBBF24; text-transform: uppercase; letter-spacing: 0.06em; margin-bottom: 6px;">CANCELLATION DETAILS</div>
                <div style="font-size: 16px; font-weight: 600; color: #FFFFFF; margin-bottom: 4px;">${topicTitle}</div>
                <div style="font-size: 13px; color: #94A3B8; margin-bottom: 12px;">📅 ${formattedDate}</div>
                <div style="background-color: #0A0C11; border-left: 3px solid #F59E0B; border-radius: 0 6px 6px 0; padding: 12px 14px;">
                  <div style="font-size: 10.5px; font-weight: 700; color: #64748B; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 4px;">NOTE / REASON</div>
                  <div style="font-size: 13.5px; font-style: italic; color: #FEF3C7; line-height: 1.5;">"${reason || 'Schedule conflict arose.'}"</div>
                </div>
              </div>

              <div style="background-color: #10141D; border: 1px solid rgba(62,139,255,0.2); border-radius: 8px; padding: 14px 16px;">
                <p style="margin: 0; font-size: 12.5px; color: #9CC0FF; line-height: 1.5;">
                  ℹ️ This slot has automatically been restored to the live Marketplace feed so new peer matches can be scheduled.
                </p>
              </div>
            `,
            primaryCtaText: 'Browse Open Sessions →',
            primaryCtaUrl: 'https://connect.swipecraft.in',
          });

          const res = await dispatchResend({
            from: fromEmail,
            to: [targetEmail],
            subject: `Session Update: Practice for "${topicTitle}" was cancelled`,
            text: `Hi!\n\nYour scheduled mock session "${topicTitle}" (${formattedDate}) has been cancelled by ${cancellingUserName || 'your peer partner'}.\n\nCancellation Reason / Note:\n"${reason || 'Schedule conflict arose.'}"\n\nNotice: This slot has been returned to the marketplace feed so peers can practice.\n\nConnect by Swipecraft: https://connect.swipecraft.in`,
            html: emailHtml,
          });

          return new Response(JSON.stringify({ success: !res?.error, resendResult: res }), {
            headers: { 'Content-Type': 'application/json', ...corsHeaders },
          });
        }

        return new Response(
          JSON.stringify({ error: `Unknown email event type: ${type}` }),
          { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
        );
      } catch (err: any) {
        return new Response(JSON.stringify({ error: err.message || 'Internal Server Error' }), {
          status: 500,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        });
      }
    }

    // Dedicated Slot Cancellation API
    if (url.pathname === '/api/cancel-slot' && request.method === 'POST') {
      try {
        const body = (await request.json()) as any;
        const { slot_id, user_id, reason, return_to_feed } = body;

        if (!slot_id) {
          return new Response(JSON.stringify({ error: 'Missing slot_id' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json', ...corsHeaders },
          });
        }

        const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

        // Fetch slot
        const { data: slot, error: slotErr } = await supabase
          .from('slots')
          .select('*, creator:profiles!creator_id(*), participant:profiles!participant_id(*)')
          .eq('id', slot_id)
          .maybeSingle();

        if (slotErr || !slot) {
          return new Response(JSON.stringify({ error: 'Slot not found' }), {
            status: 404,
            headers: { 'Content-Type': 'application/json', ...corsHeaders },
          });
        }

        const isLate = Boolean(
          slot.start_time && new Date(slot.start_time).getTime() - Date.now() < 2 * 60 * 60 * 1000
        );

        if (return_to_feed) {
          await supabase
            .from('slots')
            .update({ status: 'open', participant_id: null })
            .eq('id', slot_id);

          await supabase
            .from('slot_requests')
            .update({ status: 'declined' })
            .eq('slot_id', slot_id)
            .eq('status', 'accepted');
        } else {
          await supabase
            .from('slots')
            .update({ status: 'cancelled', participant_id: null })
            .eq('id', slot_id);

          await supabase
            .from('slot_requests')
            .update({ status: 'declined' })
            .eq('slot_id', slot_id);
        }

        // If late cancel, persist penalty
        if (isLate && user_id) {
          const { data: userProf } = await supabase
            .from('profiles')
            .select('late_cancel_count, karma_score')
            .eq('id', user_id)
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
              .eq('id', user_id);
          }
        }

        return new Response(JSON.stringify({ success: true, slot_id, isLate }), {
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        });
      } catch (err: any) {
        return new Response(JSON.stringify({ error: err.message || 'Internal Server Error' }), {
          status: 500,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        });
      }
    }

    return new Response('Not Found', { status: 404, headers: corsHeaders });
  },

  // Cloudflare Cron Trigger (Runs every 15 minutes)
  async scheduled(_event: ScheduledEvent, env: Env, _ctx: ExecutionContext): Promise<void> {
    await executeCronSweeper(env);
  },
};
