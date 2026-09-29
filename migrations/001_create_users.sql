create table if not exists public.users(
    id              uuid primary key default gen_random_uuid(),
    google_id      text not null unique,
    email           text not null unique,
    name            text,
    avatar_url      text,
    created_at      timestamptz not null default now()
);

alter table public.users enable row level security 