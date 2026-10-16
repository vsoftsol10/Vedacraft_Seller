alter table public.product_translations
  add column if not exists status text not null default 'ok'
  check (status in ('ok', 'failed'));
