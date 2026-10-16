alter table public.seller_applications
  add column if not exists sub_category text null;
