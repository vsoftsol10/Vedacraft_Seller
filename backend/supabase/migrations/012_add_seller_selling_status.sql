-- This is distinct from the seller application approval status. It controls
-- whether an approved seller is currently accepting new orders.
alter table public.seller_applications
  add column if not exists is_selling_active boolean not null default true;
