-- ==============================================================================
-- PeerMock Platform Complete Schema Migration & Stored Procedures
-- Run this in your Supabase Project: SQL Editor -> New query -> Run
-- ==============================================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- 1. Profiles Table
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  full_name text not null,
  avatar_url text,
  headline text,
  primary_domain text not null default 'Fullstack Engineering',
  skills_tags text[] default '{}',
  years_of_experience text default 'Mid (3-5y)',
  reliability_score numeric(5,2) default 100.00,
  total_sessions_completed integer default 0,
  no_show_count integer default 0,
  suspended_until timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Index for searching profiles
create index if not exists idx_profiles_domain on public.profiles(primary_domain);

-- 2. Slots Table
do $$ begin
  create type slot_role as enum ('evaluator', 'candidate');
exception
  when duplicate_object then null;
end $$;

do $$ begin
  create type slot_status as enum ('open', 'booked', 'completed', 'cancelled');
exception
  when duplicate_object then null;
end $$;

create table if not exists public.slots (
  id uuid default uuid_generate_v4() primary key,
  creator_id uuid references public.profiles(id) on delete cascade not null,
  participant_id uuid references public.profiles(id) on delete set null,
  role_type slot_role not null,
  domain text not null,
  topic_title text not null,
  topic_description text,
  target_experience text not null,
  skills_tags text[] default '{}',
  start_time timestamp with time zone not null,
  end_time timestamp with time zone not null,
  meeting_url text not null,
  status slot_status default 'open' not null,
  reminder_24h_sent boolean default false,
  reminder_30m_sent boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Indexes for marketplace discovery and cron sweeps
create index if not exists idx_slots_status_domain on public.slots(status, domain);
create index if not exists idx_slots_start_time on public.slots(start_time);
create index if not exists idx_slots_creator_id on public.slots(creator_id);
create index if not exists idx_slots_participant_id on public.slots(participant_id);

-- 3. Session Reviews Table
create table if not exists public.session_reviews (
  id uuid default uuid_generate_v4() primary key,
  slot_id uuid references public.slots(id) on delete cascade not null,
  reviewer_id uuid references public.profiles(id) on delete cascade not null,
  reviewee_id uuid references public.profiles(id) on delete cascade not null,
  attended boolean not null default true,
  rating_communication integer check (rating_communication between 1 and 5),
  rating_technical integer check (rating_technical between 1 and 5),
  rating_structure integer check (rating_structure between 1 and 5),
  constructive_feedback text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique (slot_id, reviewer_id)
);

-- Enable Row Level Security (RLS)
alter table public.profiles enable row level security;
alter table public.slots enable row level security;
alter table public.session_reviews enable row level security;

-- Drop existing policies if re-running
drop policy if exists "Public profiles are viewable by everyone" on public.profiles;
drop policy if exists "Users can update their own profile" on public.profiles;
drop policy if exists "Users can insert their own profile" on public.profiles;
drop policy if exists "Slots are viewable by everyone" on public.slots;
drop policy if exists "Users can create their own slots" on public.slots;
drop policy if exists "Users can update slots they created or booked" on public.slots;
drop policy if exists "Reviews viewable by session participants" on public.session_reviews;
drop policy if exists "Users can insert their own review" on public.session_reviews;

-- Profiles Policies
create policy "Public profiles are viewable by everyone" 
  on public.profiles for select using (true);

create policy "Users can update their own profile" 
  on public.profiles for update using (auth.uid() = id);

create policy "Users can insert their own profile" 
  on public.profiles for insert with check (auth.uid() = id);

-- Slots Policies
create policy "Slots are viewable by everyone" 
  on public.slots for select using (true);

create policy "Users can create their own slots" 
  on public.slots for insert with check (auth.uid() = creator_id);

create policy "Users can update slots they created or booked" 
  on public.slots for update using (
    auth.uid() = creator_id or auth.uid() = participant_id
  );

-- Reviews Policies
create policy "Reviews viewable by session participants" 
  on public.session_reviews for select using (
    auth.uid() = reviewer_id or auth.uid() = reviewee_id
  );

create policy "Users can insert their own review" 
  on public.session_reviews for insert with check (
    auth.uid() = reviewer_id
  );

-- Enable Realtime for the slots table
alter publication supabase_realtime add table public.slots;

-- ==============================================================================
-- Stored Procedures (Atomic Concurrency & Auth Triggers)
-- ==============================================================================

-- 1. Automatic User Profile Creation on Signup (OAuth)
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, avatar_url, headline, primary_domain)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', 'New Member'),
    coalesce(new.raw_user_meta_data->>'avatar_url', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'),
    'Software Engineer',
    'Fullstack Engineering'
  );
  return new;
end;
$$ language plpgsql security definer;

-- Trigger on auth.users
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 2. Atomic Slot Booking RPC Function (Double-booking race protection)
create or replace function public.book_slot(p_slot_id uuid, p_participant_id uuid)
returns json as $$
declare
  v_slot record;
begin
  update public.slots
  set status = 'booked',
      participant_id = p_participant_id
  where id = p_slot_id
    and status = 'open'
    and creator_id != p_participant_id
  returning * into v_slot;

  if not found then
    raise exception 'Slot is either already booked or cannot be self-booked.';
  end if;

  return row_to_json(v_slot);
end;
$$ language plpgsql security definer;

-- 3. Submit Review & Auto-Recalculate Reliability Score
create or replace function public.submit_review(
  p_slot_id uuid,
  p_reviewer_id uuid,
  p_reviewee_id uuid,
  p_attended boolean,
  p_comm integer,
  p_tech integer,
  p_struct integer,
  p_feedback text
)
returns void as $$
begin
  -- Insert review
  insert into public.session_reviews (
    slot_id, reviewer_id, reviewee_id, attended, 
    rating_communication, rating_technical, rating_structure, constructive_feedback
  ) values (
    p_slot_id, p_reviewer_id, p_reviewee_id, p_attended,
    p_comm, p_tech, p_struct, p_feedback
  );

  if p_attended then
    -- Increment completed sessions and reinforce reliability
    update public.profiles
    set total_sessions_completed = total_sessions_completed + 1,
        reliability_score = least(100.0, reliability_score + 1.0)
    where id = p_reviewee_id;
  else
    -- Penalize reliability for no-show and freeze account for 7 days
    update public.profiles
    set no_show_count = no_show_count + 1,
        reliability_score = greatest(0.0, reliability_score - 25.0),
        suspended_until = now() + interval '7 days'
    where id = p_reviewee_id;
  end if;
end;
$$ language plpgsql security definer;
