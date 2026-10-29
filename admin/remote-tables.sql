-- Phone Remote relay (Studio plan). Run once in the Supabase SQL editor.
create table if not exists remote_sessions (
  id text primary key,
  church_id text not null,
  state jsonb not null default '{}',
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table if not exists remote_commands (
  id bigserial primary key,
  session text not null references remote_sessions(id) on delete cascade,
  cmd text not null,
  ref text,
  done boolean not null default false,
  result jsonb,
  created_at timestamptz not null default now()
);

create index if not exists remote_commands_pending on remote_commands (session, done);

-- Only the admin server (service role) touches these; no public policies on purpose.
alter table remote_sessions enable row level security;
alter table remote_commands enable row level security;
