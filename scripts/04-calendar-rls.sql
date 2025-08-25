-- Enable Row Level Security for calendar_events and add policies

-- Extensions (for gen_random_uuid)
create extension if not exists pgcrypto;

-- Table: calendar_events
create table if not exists public.calendar_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  title text not null,
  description text,
  start_time timestamptz not null,
  end_time timestamptz not null,
  location text,
  attendees jsonb not null default '[]',
  external_calendar_id text,
  external_event_id text,
  status text not null default 'scheduled' check (status in ('scheduled','confirmed','cancelled','completed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Useful indexes
create index if not exists idx_calendar_events_user on public.calendar_events(user_id);
create index if not exists idx_calendar_events_time on public.calendar_events(start_time, end_time);

-- Updated_at trigger
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_calendar_events_updated_at on public.calendar_events;
create trigger trg_calendar_events_updated_at
before update on public.calendar_events
for each row execute function public.set_updated_at();

-- Enable RLS
alter table public.calendar_events enable row level security;

-- Policies
drop policy if exists "Users can view their own events" on public.calendar_events;
create policy "Users can view their own events"
on public.calendar_events for select
using (auth.uid() = user_id);

drop policy if exists "Users can insert their own events" on public.calendar_events;
create policy "Users can insert their own events"
on public.calendar_events for insert
with check (auth.uid() = user_id);

drop policy if exists "Users can update their own events" on public.calendar_events;
create policy "Users can update their own events"
on public.calendar_events for update
using (auth.uid() = user_id);

drop policy if exists "Users can delete their own events" on public.calendar_events;
create policy "Users can delete their own events"
on public.calendar_events for delete
using (auth.uid() = user_id);

-- Note: Guests (no Supabase auth) should use local/in-memory storage; these policies apply to authenticated users only.

-- Enable Row Level Security for calendar_events and add policies
ALTER TABLE calendar_events ENABLE ROW LEVEL SECURITY;

-- Users can view their own events
CREATE POLICY IF NOT EXISTS "Users can view own calendar events" ON calendar_events
  FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own events
CREATE POLICY IF NOT EXISTS "Users can insert own calendar events" ON calendar_events
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own events
CREATE POLICY IF NOT EXISTS "Users can update own calendar events" ON calendar_events
  FOR UPDATE USING (auth.uid() = user_id);

-- Users can delete their own events
CREATE POLICY IF NOT EXISTS "Users can delete own calendar events" ON calendar_events
  FOR DELETE USING (auth.uid() = user_id);


