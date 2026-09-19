-- application_id from seller_credentials is the authenticated seller identifier.
-- Keep this nullable until any pre-existing products have been assigned an owner.
alter table public.seller_products
  add column if not exists seller_id uuid;

create index if not exists seller_products_seller_id_idx
  on public.seller_products (seller_id);

-- After assigning a seller_id to every older product, enforce ownership with:
-- alter table public.seller_products alter column seller_id set not null;
