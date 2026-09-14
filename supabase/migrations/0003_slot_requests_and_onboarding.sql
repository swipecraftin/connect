-- ==============================================================================
-- PeerMock Migration 0003: Slot Requests, Onboarding Profile Fields & RPCs
-- ==============================================================================

-- 1. Extend Profiles for rich onboarding
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS target_companies text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS bio text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS linkedin_url text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS github_url text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS onboarding_completed boolean DEFAULT false;

-- 2. Slot Requests Table (Bidirectional Match & Selection)
CREATE TABLE IF NOT EXISTS public.slot_requests (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  slot_id uuid REFERENCES public.slots(id) ON DELETE CASCADE NOT NULL,
  applicant_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  message text,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'withdrawn')),
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE (slot_id, applicant_id)
);

CREATE INDEX IF NOT EXISTS idx_slot_requests_slot_id ON public.slot_requests(slot_id);
CREATE INDEX IF NOT EXISTS idx_slot_requests_applicant_id ON public.slot_requests(applicant_id);
CREATE INDEX IF NOT EXISTS idx_slot_requests_status ON public.slot_requests(status);

-- Enable RLS
ALTER TABLE public.slot_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Requests viewable by slot creator and applicant" ON public.slot_requests;
DROP POLICY IF EXISTS "Authenticated users can create requests" ON public.slot_requests;
DROP POLICY IF EXISTS "Users can update their own or received requests" ON public.slot_requests;

CREATE POLICY "Requests viewable by slot creator and applicant"
  ON public.slot_requests FOR SELECT
  USING (
    auth.uid() = applicant_id OR 
    EXISTS (SELECT 1 FROM public.slots WHERE public.slots.id = slot_id AND public.slots.creator_id = auth.uid())
  );

CREATE POLICY "Authenticated users can create requests"
  ON public.slot_requests FOR INSERT
  WITH CHECK (auth.uid() = applicant_id);

CREATE POLICY "Users can update their own or received requests"
  ON public.slot_requests FOR UPDATE
  USING (
    auth.uid() = applicant_id OR 
    EXISTS (SELECT 1 FROM public.slots WHERE public.slots.id = slot_id AND public.slots.creator_id = auth.uid())
  );

-- 3. Stored Procedure: Accept a Slot Request (Atomic Transaction)
CREATE OR REPLACE FUNCTION public.accept_slot_request(
  p_request_id uuid,
  p_slot_id uuid,
  p_creator_id uuid
)
RETURNS json AS $$
DECLARE
  v_applicant_id uuid;
  v_slot record;
BEGIN
  -- Verify slot ownership and open status
  SELECT * INTO v_slot FROM public.slots 
  WHERE id = p_slot_id AND creator_id = p_creator_id AND status = 'open';
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Slot not found or is no longer open for booking.';
  END IF;

  -- Verify request exists and is pending
  SELECT applicant_id INTO v_applicant_id 
  FROM public.slot_requests 
  WHERE id = p_request_id AND slot_id = p_slot_id AND status = 'pending';
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Request not found or has already been resolved.';
  END IF;

  -- 1. Mark accepted request
  UPDATE public.slot_requests 
  SET status = 'accepted' 
  WHERE id = p_request_id;

  -- 2. Decline all other candidate requests for this slot
  UPDATE public.slot_requests 
  SET status = 'declined' 
  WHERE slot_id = p_slot_id AND id <> p_request_id AND status = 'pending';

  -- 3. Lock slot to booked and set participant
  UPDATE public.slots 
  SET status = 'booked', participant_id = v_applicant_id 
  WHERE id = p_slot_id;

  RETURN json_build_object(
    'success', true,
    'slot_id', p_slot_id,
    'participant_id', v_applicant_id,
    'request_id', p_request_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
