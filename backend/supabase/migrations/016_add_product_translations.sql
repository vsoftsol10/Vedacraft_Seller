alter table public.seller_products
  add column if not exists primary_language text not null default 'en'
  check (primary_language in ('en', 'ta', 'hi'));

create table if not exists public.product_translations (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.seller_products(id) on delete cascade,
  language text not null check (language in ('en', 'ta', 'hi')),
  product_name text, material text, description text, benefits text, highlights text,
  how_to_use text, care_instruction text,
  source text not null default 'manual' check (source in ('manual', 'automatic')),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  unique (product_id, language)
);
create index if not exists product_translations_product_id_idx on public.product_translations(product_id);
alter table public.product_translations enable row level security;
create or replace function public.set_product_translation_updated_at() returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end; $$;
drop trigger if exists product_translations_updated_at on public.product_translations;
create trigger product_translations_updated_at before update on public.product_translations for each row execute function public.set_product_translation_updated_at();
