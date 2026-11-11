-- Personalised demo links for church outreach. Run once in the Supabase SQL editor.
create table if not exists demo_links (
  slug text primary key,
  church_name text not null,
  contact_name text,
  email text,
  phone text,
  denomination text,
  views int not null default 0,
  clicks int not null default 0,
  first_viewed_at timestamptz,
  last_viewed_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists demo_events (
  id bigserial primary key,
  slug text not null references demo_links(slug) on delete cascade,
  kind text not null,            -- 'view' | 'click'
  detail text,                   -- which button, for clicks
  created_at timestamptz not null default now()
);

create index if not exists demo_events_slug on demo_events (slug, created_at desc);

-- Only the admin server (service role) touches these; no public policies on purpose.
alter table demo_links enable row level security;
alter table demo_events enable row level security;
