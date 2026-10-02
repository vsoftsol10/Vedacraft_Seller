-- Keep seller and customer notification feeds separate, even if test accounts
-- accidentally share the same auth user ID.
alter table public.notifications
  add column if not exists audience text not null default 'seller';

-- Older rows predate the audience column and were created by this seller app.
update public.notifications
set audience = 'seller'
where audience is null or btrim(audience) = '';

alter table public.notifications
  drop constraint if exists notifications_audience_check;

alter table public.notifications
  add constraint notifications_audience_check
  check (audience in ('seller', 'customer'));

create index if not exists idx_notifications_user_audience_created
  on public.notifications (user_id, audience, created_at desc);
