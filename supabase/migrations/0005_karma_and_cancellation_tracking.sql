-- ==============================================================================
-- Migration 0005: Karma System Columns & Stored Procedures
-- ==============================================================================

-- 1. Add missing karma & cancellation tracking columns to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS late_cancel_count integer DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS given_mocks_count integer DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS taken_mocks_count integer DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS karma_score integer DEFAULT 300;

-- 2. Backfill nulls with safe defaults
UPDATE public.profiles SET late_cancel_count = 0 WHERE late_cancel_count IS NULL;
UPDATE public.profiles SET given_mocks_count = 0 WHERE given_mocks_count IS NULL;
UPDATE public.profiles SET taken_mocks_count = 0 WHERE taken_mocks_count IS NULL;
UPDATE public.profiles 
SET karma_score = GREATEST(50, ROUND(100 + (COALESCE(reliability_score, 100) * 2) + (COALESCE(total_sessions_completed, 0) * 10) - (COALESCE(no_show_count, 0) * 50) - (COALESCE(late_cancel_count, 0) * 25)))
WHERE karma_score IS NULL OR karma_score = 1000;

-- 3. Enhance submit_review to update mock counts & karma automatically
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
  v_slot record;
  v_creator_is_evaluator boolean;
BEGIN
  -- Fetch slot details
  SELECT * INTO v_slot FROM public.slots WHERE id = p_slot_id;

  -- Insert or update review
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
    -- Check role breakdown:
    -- role_type 'evaluator' means creator was evaluator, participant was candidate
    -- role_type 'candidate' means creator was candidate, participant was evaluator
    v_creator_is_evaluator := (v_slot.role_type = 'evaluator');

    IF v_creator_is_evaluator THEN
      -- Creator gave mock, Participant took mock
      UPDATE public.profiles
      SET total_sessions_completed = COALESCE(total_sessions_completed, 0) + 1,
          given_mocks_count = COALESCE(given_mocks_count, 0) + 1,
          reliability_score = LEAST(100.0, COALESCE(reliability_score, 100.0) + 1.0)
      WHERE id = v_slot.creator_id;

      UPDATE public.profiles
      SET total_sessions_completed = COALESCE(total_sessions_completed, 0) + 1,
          taken_mocks_count = COALESCE(taken_mocks_count, 0) + 1,
          reliability_score = LEAST(100.0, COALESCE(reliability_score, 100.0) + 1.0)
      WHERE id = v_slot.participant_id;
    ELSE
      -- Creator took mock, Participant gave mock
      UPDATE public.profiles
      SET total_sessions_completed = COALESCE(total_sessions_completed, 0) + 1,
          taken_mocks_count = COALESCE(taken_mocks_count, 0) + 1,
          reliability_score = LEAST(100.0, COALESCE(reliability_score, 100.0) + 1.0)
      WHERE id = v_slot.creator_id;

      UPDATE public.profiles
      SET total_sessions_completed = COALESCE(total_sessions_completed, 0) + 1,
          given_mocks_count = COALESCE(given_mocks_count, 0) + 1,
          reliability_score = LEAST(100.0, COALESCE(reliability_score, 100.0) + 1.0)
      WHERE id = v_slot.participant_id;
    END IF;

    -- Recalculate karma_score for both participants
    UPDATE public.profiles
    SET karma_score = GREATEST(50, ROUND(
      100 + 
      (COALESCE(reliability_score, 100.0) * 2) + 
      (COALESCE(given_mocks_count, 0) * 35) + 
      (COALESCE(taken_mocks_count, 0) * 15) + 
      (COALESCE(total_sessions_completed, 0) * 10) - 
      (COALESCE(no_show_count, 0) * 50) - 
      (COALESCE(late_cancel_count, 0) * 25)
    ))
    WHERE id IN (v_slot.creator_id, v_slot.participant_id);

    SELECT reliability_score INTO v_new_score FROM public.profiles WHERE id = p_reviewee_id;
  ELSE
    -- Penalize flaking peer: -25% reliability, +1 no_show_count, and 7-day freeze
    UPDATE public.profiles
    SET no_show_count = COALESCE(no_show_count, 0) + 1,
        reliability_score = GREATEST(0.0, COALESCE(reliability_score, 100.0) - 25.0),
        suspended_until = now() + interval '7 days'
    WHERE id = p_reviewee_id
    RETURNING reliability_score INTO v_new_score;

    -- Recalculate penalized user's karma_score
    UPDATE public.profiles
    SET karma_score = GREATEST(50, ROUND(
      100 + 
      (COALESCE(reliability_score, 100.0) * 2) + 
      (COALESCE(given_mocks_count, 0) * 35) + 
      (COALESCE(taken_mocks_count, 0) * 15) + 
      (COALESCE(total_sessions_completed, 0) * 10) - 
      (COALESCE(no_show_count, 0) * 50) - 
      (COALESCE(late_cancel_count, 0) * 25)
    ))
    WHERE id = p_reviewee_id;
  END IF;

  RETURN json_build_object(
    'success', true,
    'slot_id', p_slot_id,
    'attended', p_attended,
    'reviewee_new_reliability', v_new_score
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
