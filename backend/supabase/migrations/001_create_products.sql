-- Kept separate from the existing storefront public.products table.
create table if not exists public.seller_products (
  id uuid primary key default gen_random_uuid(),
  product_id text not null unique,
  product_name text not null,
  category text not null,
  sub_category text,
  material text not null,
  weight text not null,
  description text,
  benefits text,
  highlights text,
  length numeric(10, 2),
  width numeric(10, 2),
  height numeric(10, 2),
  mrp numeric(12, 2) not null,
  discount_price numeric(12, 2),
  selling_price numeric(12, 2) not null,
  cover_image text,
  additional_images text[] not null default '{}',
  sku text unique,
  stock_quantity integer not null default 0,
  low_stock_alert integer not null default 5,
  stock_status text not null default 'Out of Stock'
    check (stock_status in ('In Stock', 'Out of Stock', 'Low Stock')),
  how_to_use text,
  care_instruction text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists seller_products_category_idx on public.seller_products (category);
create index if not exists seller_products_stock_status_idx on public.seller_products (stock_status);
create index if not exists seller_products_created_at_idx on public.seller_products (created_at desc);

alter table public.seller_products enable row level security;

-- The API uses the server-only service-role key, which bypasses RLS. Add public
-- policies only if browser clients must access this table directly.
