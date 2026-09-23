-- Seller profile fields belong to the existing seller application. All are nullable
-- so existing applications remain unchanged until the seller saves their profile.
alter table public.seller_applications
  add column if not exists mobile_number text,
  add column if not exists alternate_number text,
  add column if not exists profile_image text;
