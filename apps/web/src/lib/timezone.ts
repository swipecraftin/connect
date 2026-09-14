export interface TimezoneOption {
  id: string; // e.g., 'Asia/Kolkata'
  label: string; // e.g., 'India Standard Time (IST)'
  city: string; // e.g., 'Bengaluru, Mumbai, Delhi'
  region: string; // e.g., 'Asia'
  popular?: boolean;
}

export const POPULAR_TIMEZONES: TimezoneOption[] = [
  { id: 'Asia/Kolkata', label: 'India Standard Time (IST)', city: 'Bengaluru, Delhi, Mumbai', region: 'Asia', popular: true },
  { id: 'America/New_York', label: 'Eastern Time (US & Canada)', city: 'New York, Toronto, Miami', region: 'Americas', popular: true },
  { id: 'America/Los_Angeles', label: 'Pacific Time (US & Canada)', city: 'San Francisco, Seattle, LA', region: 'Americas', popular: true },
  { id: 'America/Chicago', label: 'Central Time (US & Canada)', city: 'Chicago, Austin, Dallas', region: 'Americas', popular: true },
  { id: 'America/Denver', label: 'Mountain Time (US & Canada)', city: 'Denver, Salt Lake City', region: 'Americas' },
  { id: 'Europe/London', label: 'Greenwich Mean Time / BST', city: 'London, Dublin, Lisbon', region: 'Europe', popular: true },
  { id: 'Europe/Berlin', label: 'Central European Time (CET)', city: 'Berlin, Paris, Amsterdam', region: 'Europe', popular: true },
  { id: 'Asia/Singapore', label: 'Singapore Time (SGT)', city: 'Singapore, Kuala Lumpur', region: 'Asia', popular: true },
  { id: 'Asia/Dubai', label: 'Gulf Standard Time (GST)', city: 'Dubai, Abu Dhabi, Muscat', region: 'Middle East', popular: true },
  { id: 'Asia/Tokyo', label: 'Japan Standard Time (JST)', city: 'Tokyo, Osaka, Seoul', region: 'Asia', popular: true },
  { id: 'Australia/Sydney', label: 'Australian Eastern Time (AEST)', city: 'Sydney, Melbourne, Brisbane', region: 'Oceania', popular: true },
  { id: 'UTC', label: 'Coordinated Universal Time', city: 'Universal Reference', region: 'Global', popular: true },
];

export function detectUserTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  } catch {
    return 'UTC';
  }
}

/**
 * Returns formatted offset string like "UTC+05:30" or "UTC-04:00"
 */
export function getTimezoneOffsetString(timeZone: string, date: Date = new Date()): string {
  try {
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone,
      timeZoneName: 'shortOffset',
    });
    const parts = formatter.formatToParts(date);
    const tzPart = parts.find((p) => p.type === 'timeZoneName');
    return tzPart ? tzPart.value : 'UTC';
  } catch {
    return 'UTC';
  }
}

/**
 * Returns short code like "IST", "PDT", "EST", "GMT"
 */
export function getTimezoneShortCode(timeZone: string, date: Date = new Date()): string {
  try {
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone,
      timeZoneName: 'short',
    });
    const parts = formatter.formatToParts(date);
    const tzPart = parts.find((p) => p.type === 'timeZoneName');
    return tzPart ? tzPart.value : timeZone;
  } catch {
    return timeZone;
  }
}

/**
 * Formats a slot timestamp in the targeted timezone.
 * Example: "Tue, Sep 15 • 6:00 PM IST"
 */
export function formatSlotDateTime(isoString: string, timeZone: string): string {
  try {
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return isoString;

    const weekdayMonthDay = new Intl.DateTimeFormat('en-US', {
      timeZone,
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    }).format(date);

    const time = new Intl.DateTimeFormat('en-US', {
      timeZone,
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    }).format(date);

    const code = getTimezoneShortCode(timeZone, date);

    return `${weekdayMonthDay} • ${time} ${code}`;
  } catch {
    return isoString;
  }
}

/**
 * Relative countdown helper:
 * - "Starts in 45m" (within 1 hour - urgent)
 * - "Starts in 3h 15m" (within 24 hours)
 * - "Tomorrow at 4:00 PM"
 * - "In 3 days"
 * - "Completed" (if in past)
 */
export interface TimeUntilResult {
  label: string;
  isUrgent: boolean; // under 1 hour
  isToday: boolean;
  isPast: boolean;
}

export function getTimeUntilSlot(isoString: string, timeZone: string): TimeUntilResult {
  try {
    const targetDate = new Date(isoString);
    const now = new Date();
    const diffMs = targetDate.getTime() - now.getTime();

    if (diffMs <= 0) {
      return {
        label: 'Session Ended',
        isUrgent: false,
        isToday: false,
        isPast: true,
      };
    }

    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMinutes < 60) {
      return {
        label: `Starts in ${diffMinutes}m`,
        isUrgent: true,
        isToday: true,
        isPast: false,
      };
    }

    if (diffHours < 24) {
      const remainingMinutes = diffMinutes % 60;
      const hourStr = remainingMinutes > 0 ? `${diffHours}h ${remainingMinutes}m` : `${diffHours}h`;
      return {
        label: `Starts in ${hourStr}`,
        isUrgent: diffHours <= 2,
        isToday: true,
        isPast: false,
      };
    }

    if (diffDays === 1) {
      const timeOnly = new Intl.DateTimeFormat('en-US', {
        timeZone,
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      }).format(targetDate);
      return {
        label: `Tomorrow at ${timeOnly}`,
        isUrgent: false,
        isToday: false,
        isPast: false,
      };
    }

    return {
      label: `In ${diffDays} days`,
      isUrgent: false,
      isToday: false,
      isPast: false,
    };
  } catch {
    return {
      label: 'Scheduled',
      isUrgent: false,
      isToday: false,
      isPast: false,
    };
  }
}
