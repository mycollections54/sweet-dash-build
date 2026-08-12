ALTER TABLE public.meetings
  ADD COLUMN IF NOT EXISTS meeting_date date,
  ADD COLUMN IF NOT EXISTS is_recurring boolean NOT NULL DEFAULT true;