export type SlotRole = 'evaluator' | 'candidate';
export type SlotStatus = 'open' | 'booked' | 'completed' | 'cancelled';
export type RequestStatus = 'pending' | 'accepted' | 'declined' | 'withdrawn';

export interface Profile {
  id: string;
  email?: string;
  full_name: string;
  avatar_url?: string;
  headline?: string;
  primary_domain: string;
  skills_tags: string[];
  years_of_experience: string;
  reliability_score: number;
  total_sessions_completed: number;
  no_show_count: number;
  karma_score?: number;
  given_mocks_count?: number;
  taken_mocks_count?: number;
  late_cancel_count?: number;
  suspended_until?: string | null;
  target_companies?: string;
  bio?: string;
  linkedin_url?: string;
  github_url?: string;
  onboarding_completed?: boolean;
  created_at: string;
}

export interface Slot {
  id: string;
  creator_id: string;
  participant_id?: string | null;
  role_type: SlotRole;
  domain: string;
  topic_title: string;
  topic_description?: string;
  target_experience: string;
  skills_tags: string[];
  start_time: string;
  end_time: string;
  meeting_url: string;
  status: SlotStatus;
  created_at: string;
  creator?: Profile;
  participant?: Profile;
  request_count?: number;
}

export interface SlotRequest {
  id: string;
  slot_id: string;
  applicant_id: string;
  message?: string;
  status: RequestStatus;
  created_at: string;
  applicant?: Profile;
  slot?: Slot;
}

export interface SessionReview {
  id: string;
  slot_id: string;
  reviewer_id: string;
  reviewee_id: string;
  attended: boolean;
  rating_communication: number;
  rating_technical: number;
  rating_structure: number;
  constructive_feedback?: string;
  created_at: string;
}
