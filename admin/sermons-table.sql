-- Sermon library (Studio plan). Run once in the Supabase SQL editor.
create table if not exists sermons (
  id uuid primary key default gen_random_uuid(),
  church_id text not null,
  title text not null,
  series text,
  preached_on date,
  scriptures text,
  notes jsonb,
  recap jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists sermons_church_date on sermons (church_id, preached_on desc);

-- Only the admin server (service role) touches this; no public policies on purpose.
-- It checks the caller's church and Studio plan before reading or writing anything.
alter table sermons enable row level security;
