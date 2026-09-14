-- Migration 0004: Fix RLS for slot cancellation, participant release, and creator deletion

-- 1. Ensure Creators can hard DELETE their own slots
DROP POLICY IF EXISTS "Users can delete their own slots" ON public.slots;
CREATE POLICY "Users can delete their own slots"
  ON public.slots FOR DELETE
  USING (auth.uid() = creator_id);

-- 2. Ensure slot creators AND booked participants can UPDATE slots
-- Crucial: Explicit WITH CHECK clause so when participant cancels and participant_id is set to NULL,
-- PostgreSQL does not fail the new row with "new row violates row-level security policy for table slots"
DROP POLICY IF EXISTS "Users can update slots they created or booked" ON public.slots;
CREATE POLICY "Users can update slots they created or booked"
  ON public.slots FOR UPDATE
  USING (
    auth.uid() = creator_id or auth.uid() = participant_id
  )
  WITH CHECK (
    auth.uid() = creator_id 
    or auth.uid() = participant_id 
    or participant_id is null
  );

-- 3. Allow slot creators or applicants to delete requests when a slot is deleted/cancelled
DROP POLICY IF EXISTS "Users can delete requests for their slots or applied" ON public.slot_requests;
CREATE POLICY "Users can delete requests for their slots or applied"
  ON public.slot_requests FOR DELETE
  USING (
    auth.uid() = applicant_id 
    or exists (
      select 1 from public.slots 
      where slots.id = slot_requests.slot_id 
      and slots.creator_id = auth.uid()
    )
  );
