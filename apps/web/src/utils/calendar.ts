import { Slot } from '../types/database';

function formatGoogleDate(date: Date): string {
  return date
    .toISOString()
    .replace(/-|:|\.\d+/g, '');
}

/**
 * Generates a direct Google Calendar event creation URL
 */
export function getGoogleCalendarUrl(slot: Slot): string {
  const startDate = new Date(slot.start_time);
  const endDate = slot.end_time
    ? new Date(slot.end_time)
    : new Date(startDate.getTime() + 45 * 60 * 1000);

  const startUtc = formatGoogleDate(startDate);
  const endUtc = formatGoogleDate(endDate);

  const title = `Connect: ${slot.topic_title}`;
  const details = [
    `Connect by Swipecraft — Peer Mock Practice Session`,
    `Focus: ${slot.domain} · ${slot.target_experience}`,
    slot.topic_description ? `Description: ${slot.topic_description}` : '',
    ``,
    `🔗 Join Google Meet: ${slot.meeting_url}`,
    ``,
    `Connect Session Guidelines:`,
    `- Join 2 minutes early to test audio & screen share.`,
    `- Dedicate 45 minutes for problem solving & high-signal mutual feedback.`,
  ]
    .filter(Boolean)
    .join('\n');

  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: title,
    dates: `${startUtc}/${endUtc}`,
    details,
    location: slot.meeting_url || 'Google Meet',
  });

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}
