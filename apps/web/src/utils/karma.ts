import { Profile, Slot } from '../types/database';

export interface KarmaAction {
  id: string;
  type: 'give_mock' | 'take_mock' | 'leave_review' | 'no_show_strike' | 'late_cancel';
  label: string;
  delta: number;
  date: string;
}

export interface KarmaResult {
  karmaScore: number;
  givenMocks: number;
  takenMocks: number;
  reciprocityRatio: number; // Kept for backwards compatibility
  upskillingBalance: number; // Balance of evaluating vs practicing
  reliabilityScore: number;
  tier: 'Apprentice' | 'Practitioner' | 'Evaluator' | 'Senior Fellow' | 'Grandmaster';
  tierColor: string;
  actionsHistory: KarmaAction[];
}

/**
 * PeerMock Mutual Upskilling & Reputation Engine
 *
 * Base Karma: 100 points
 * +35 points: Evaluating a peer (sharpens architecture critique & rubric evaluation)
 * +15 points: Practicing as candidate (sharpens live problem solving & verbal delivery)
 * +10 points: Providing high-signal rubric feedback
 * +2x points: Reliability standing (e.g. 100% -> +200 points)
 * -25 points: Late cancellation (< 2 hours before session)
 * -50 points: Unexcused No-Show / flaking
 */
export function calculateUserKarma(
  profile: Profile | null,
  slots: Slot[],
  currentUserId?: string
): KarmaResult {
  const targetId = currentUserId || profile?.id;
  const reliability = profile?.reliability_score ?? 100;
  const noShows = profile?.no_show_count ?? 0;
  const lateCancels = profile?.late_cancel_count ?? 0;

  // Filter completed sessions involving this user
  const userCompletedSlots = slots.filter(
    (s) =>
      s.status === 'completed' &&
      targetId &&
      (s.creator_id === targetId || s.participant_id === targetId)
  );

  let dynamicGivenMocks = 0;
  let dynamicTakenMocks = 0;
  const actionsHistory: KarmaAction[] = [];

  userCompletedSlots.forEach((s) => {
    // Was user evaluator or candidate?
    const wasHost = s.creator_id === targetId;
    const isEvaluator = (wasHost && s.role_type === 'evaluator') || (!wasHost && s.role_type === 'candidate');

    if (isEvaluator) {
      dynamicGivenMocks += 1;
      actionsHistory.push({
        id: `action-give-${s.id}`,
        type: 'give_mock',
        label: `Evaluated Peer: ${s.topic_title}`,
        delta: +35,
        date: s.start_time,
      });
    } else {
      dynamicTakenMocks += 1;
      actionsHistory.push({
        id: `action-take-${s.id}`,
        type: 'take_mock',
        label: `Practiced as Candidate: ${s.topic_title}`,
        delta: +15,
        date: s.start_time,
      });
    }
  });

  // If user has stored totals that exceed slot count (e.g. legacy or seed sessions), preserve them
  const givenMocks = Math.max(dynamicGivenMocks, profile?.given_mocks_count ?? 0);
  const takenMocks = Math.max(dynamicTakenMocks, profile?.taken_mocks_count ?? 0);

  // If no sessions yet, use baseline minimum
  const totalSessions = givenMocks + takenMocks || (profile?.total_sessions_completed ?? 0);

  // Penalties
  for (let i = 0; i < noShows; i++) {
    actionsHistory.unshift({
      id: `strike-${i}`,
      type: 'no_show_strike',
      label: 'Anti-Flake Strike: Unexcused No-Show',
      delta: -50,
      date: new Date().toISOString(),
    });
  }

  for (let i = 0; i < lateCancels; i++) {
    actionsHistory.unshift({
      id: `late-cancel-${i}`,
      type: 'late_cancel',
      label: 'Late Cancellation (< 2h notice)',
      delta: -25,
      date: new Date().toISOString(),
    });
  }

  // Calculate total karma
  const BASE_KARMA = 100;
  const reliabilityBonus = Math.round(reliability * 2);
  const sessionPoints = givenMocks * 35 + takenMocks * 15;
  const reviewPoints = totalSessions * 10;
  const penaltyPoints = noShows * 50 + lateCancels * 25;

  const rawKarma = BASE_KARMA + reliabilityBonus + sessionPoints + reviewPoints - penaltyPoints;
  const karmaScore = Math.max(50, rawKarma);

  // Upskilling balance: balance of sessions evaluated vs practiced
  const upskillingBalance =
    totalSessions > 0
      ? Math.round((givenMocks / Math.max(1, totalSessions)) * 100)
      : 50;

  // Determine reputation tier
  let tier: KarmaResult['tier'] = 'Apprentice';
  let tierColor = '#9FA6B3';

  if (karmaScore >= 1200) {
    tier = 'Grandmaster';
    tierColor = '#FBBF24'; // Amber
  } else if (karmaScore >= 750) {
    tier = 'Senior Fellow';
    tierColor = '#A78BFA'; // Purple
  } else if (karmaScore >= 450) {
    tier = 'Evaluator';
    tierColor = '#38BDF8'; // Blue
  } else if (karmaScore >= 250) {
    tier = 'Practitioner';
    tierColor = '#34D399'; // Emerald
  }

  return {
    karmaScore,
    givenMocks,
    takenMocks,
    reciprocityRatio: upskillingBalance,
    upskillingBalance,
    reliabilityScore: reliability,
    tier,
    tierColor,
    actionsHistory,
  };
}
