create table if not exists public.notifications (
  id uuid not null default gen_random_uuid(),
  user_id uuid not null,
  type text not null default 'order'::text,
  title text not null,
  message text not null,
  order_id uuid null,
  is_read boolean not null default false,
  created_at timestamp with time zone not null default timezone('utc'::text, now()),
  constraint notifications_pkey primary key (id),
  constraint notifications_user_id_fkey foreign key (user_id) references auth.users(id) on delete cascade
);

create index if not exists idx_notifications_user_created on public.notifications using btree (user_id, created_at desc);
create index if not exists idx_notifications_user_unread on public.notifications using btree (user_id, is_read);

alter table public.notifications enable row level security;

drop policy if exists "Users can read their own notifications" on public.notifications;
create policy "Users can read their own notifications" on public.notifications
  for select using (auth.uid() = user_id);

drop policy if exists "Users can update their own notifications" on public.notifications;
create policy "Users can update their own notifications" on public.notifications
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
