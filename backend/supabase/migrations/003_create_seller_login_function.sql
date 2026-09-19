-- Existing seller_credentials values are PGP symmetric-encrypted bytea values
-- created with pgp_sym_encrypt(). The encryption key is supplied by the backend
-- at sign-in and must be the same key used when each credential was created.
create extension if not exists pgcrypto;

-- PostgreSQL does not allow CREATE OR REPLACE to rename input parameters.
-- This RPC has no database dependencies, so recreate its three-argument signature.
drop function if exists public.authenticate_seller(text, text, text);

create or replace function public.authenticate_seller(
  p_seller_code text,
  p_password text,
  p_encryption_key text
)
returns table (seller_code text, username text, application_id uuid)
language plpgsql
security definer
set search_path = public, extensions
as $$
begin
  if coalesce(p_encryption_key, '') = '' then
    return;
  end if;

  return query
    select sc.seller_code, sc.username, sc.application_id
    from public.seller_credentials sc
    where sc.seller_code = p_seller_code
      and pgp_sym_decrypt(sc.encrypted_password, p_encryption_key) = p_password
    limit 1;
exception
  -- A wrong decryption key and an invalid password must have the same response.
  when others then return;
end;
$$;

revoke all on function public.authenticate_seller(text, text, text) from public;
grant execute on function public.authenticate_seller(text, text, text) to service_role;

-- Make the renamed RPC parameters available to Supabase/PostgREST immediately.
notify pgrst, 'reload schema';

-- Create a compatible password value with:
-- pgp_sym_encrypt('your-password', 'your-server-only-encryption-key')
