-- Apply manually in the Supabase SQL editor. This additive migration is safe to rerun.
alter table public.seller_applications
  add column if not exists account_number_encrypted text,
  add column if not exists account_number_last4 text;
