create table if not exists public.tasks(
    id                  uuid primary key default gen_random_uuid(),
    title               text not null check(char_length(title) > 0),
    description         text,
    status              text not null default 'pending'
                        check (status in ('pending', 'completed')),
    due_date            date,
    created_by          uuid not null references public.users(id) on delete cascade,
    assigned_to         uuid references public.users(id) on delete set null,
    created_at          timestamptz not null default now(),
    updated_at          timestamptz not null default now(),
    completed_at        timestamptz
);


create index if not exists idx_tasks_created_by on public.tasks(created_by);
create index if not exists idx_tasks_assigned_to on public.tasks(assigned_to);

alter table public.tasks enable row level security;