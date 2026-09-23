-- Run manually in the Supabase SQL editor after encrypted bank-account values
-- have been backfilled. Keep the legacy column for now, but remove all plaintext.
update public.seller_applications
set account_number = null
where account_number is not null
  and account_number <> '';
