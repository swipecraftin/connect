-- ==============================================================================
-- PeerMock Migration 0002: Enhanced Review Submission, Score Recalculation, and Email Column
-- ==============================================================================

-- 1. Add email column to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email text;

-- 2. Update handle_new_user trigger function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url, headline, primary_domain)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', split_part(new.email, '@', 1), 'New Member'),
    COALESCE(new.raw_user_meta_data->>'avatar_url', new.raw_user_meta_data->>'picture', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'),
    'Software Engineer',
    'Fullstack Engineering'
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = CASE WHEN public.profiles.full_name IS NULL OR public.profiles.full_name = 'New Member' THEN EXCLUDED.full_name ELSE public.profiles.full_name END;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Production-Grade submit_review RPC function
DROP FUNCTION IF EXISTS public.submit_review(uuid, uuid, uuid, boolean, integer, integer, integer, text);

CREATE OR REPLACE FUNCTION public.submit_review(
  p_slot_id uuid,
  p_reviewer_id uuid,
  p_reviewee_id uuid,
  p_attended boolean,
  p_comm integer,
  p_tech integer,
  p_struct integer,
  p_feedback text
)
RETURNS json AS $$
DECLARE
  v_review record;
  v_new_score numeric(5,2);
BEGIN
  -- Insert or update review (allowing edits if needed)
  INSERT INTO public.session_reviews (
    slot_id, reviewer_id, reviewee_id, attended, 
    rating_communication, rating_technical, rating_structure, constructive_feedback
  ) VALUES (
    p_slot_id, p_reviewer_id, p_reviewee_id, p_attended,
    p_comm, p_tech, p_struct, p_feedback
  )
  ON CONFLICT (slot_id, reviewer_id)
  DO UPDATE SET
    attended = EXCLUDED.attended,
    rating_communication = EXCLUDED.rating_communication,
    rating_technical = EXCLUDED.rating_technical,
    rating_structure = EXCLUDED.rating_structure,
    constructive_feedback = EXCLUDED.constructive_feedback
  RETURNING * INTO v_review;

  -- Mark slot as completed
  UPDATE public.slots
  SET status = 'completed'
  WHERE id = p_slot_id;

  IF p_attended THEN
    -- Increment completed sessions and reinforce reliability for reviewee
    UPDATE public.profiles
    SET total_sessions_completed = total_sessions_completed + 1,
        reliability_score = LEAST(100.0, reliability_score + 1.0)
    WHERE id = p_reviewee_id
    RETURNING reliability_score INTO v_new_score;

    -- Increment completed sessions for the reviewer who conducted/attended
    UPDATE public.profiles
    SET total_sessions_completed = total_sessions_completed + 1
    WHERE id = p_reviewer_id;
  ELSE
    -- Penalize flaking peer: -25% reliability and 7-day freeze
    UPDATE public.profiles
    SET no_show_count = no_show_count + 1,
        reliability_score = GREATEST(0.0, reliability_score - 25.0),
        suspended_until = now() + interval '7 days'
    WHERE id = p_reviewee_id
    RETURNING reliability_score INTO v_new_score;
  END IF;

  RETURN json_build_object(
    'success', true,
    'slot_id', p_slot_id,
    'attended', p_attended,
    'reviewee_new_reliability', v_new_score
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
