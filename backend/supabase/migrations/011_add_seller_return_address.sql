-- The return address is printed on each seller's shipping label. Keeping it on
-- the seller application ensures an order always uses the address belonging to
-- the seller who owns its product.
alter table public.seller_applications
  add column if not exists address_line1 text,
  add column if not exists city text,
  add column if not exists state text,
  add column if not exists pin_code text,
  add column if not exists country text;
