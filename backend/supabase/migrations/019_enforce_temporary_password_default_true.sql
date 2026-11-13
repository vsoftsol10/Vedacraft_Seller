-- Migration 019: Enforce default true for must_change_password on seller_credentials
-- Ensures all newly registered sellers and existing sellers with temporary passwords
-- are mandated to change their password on first dashboard access.

alter table public.seller_credentials
  alter column must_change_password set default true;

update public.seller_credentials
set must_change_password = true;

