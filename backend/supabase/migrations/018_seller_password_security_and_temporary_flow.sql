-- Migration 018: Password Security Migration (bcrypt) & Temporary Password Flow
-- 
-- 1. Adds must_change_password flag to seller_credentials
-- 2. Upgrades authenticate_seller to support bcrypt hashes with lazy auto-migration from legacy pgp_sym_encrypt bytea
-- 3. Creates change_seller_password RPC for authenticated sellers to set their permanent password
-- 4. Updates reset_seller_password RPC to store new passwords as secure bcrypt hashes

create extension if not exists pgcrypto;

-- 1. Add must_change_password column
alter table public.seller_credentials
  add column if not exists must_change_password boolean not null default false;

-- 2. Re-create authenticate_seller with bytea-safe bcrypt support and must_change_password return
drop function if exists public.authenticate_seller(text, text, text);

create or replace function public.authenticate_seller(
  p_seller_code text,
  p_password text,
  p_encryption_key text
)
returns table (
  seller_code text,
  username text,
  application_id uuid,
  must_change_password boolean
)
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_rec record;
  v_matched boolean := false;
  v_is_legacy boolean := false;
  v_as_text text;
begin
  if coalesce(p_seller_code, '') = '' or coalesce(p_password, '') = '' then
    return;
  end if;

  select sc.seller_code, sc.username, sc.application_id, sc.encrypted_password, coalesce(sc.must_change_password, false) as must_change
  into v_rec
  from public.seller_credentials sc
  where sc.seller_code = p_seller_code
  limit 1;

  if v_rec is null then return; end if;

  -- 1. First attempt: check legacy pgp_sym_decrypt (bytea native)
  if coalesce(p_encryption_key, '') != '' then
    begin
      if pgp_sym_decrypt(v_rec.encrypted_password, p_encryption_key) = p_password then
        v_matched := true;
        v_is_legacy := true;
      end if;
    exception when others then
      v_matched := false;
    end;
  end if;

  -- 2. Second attempt: if legacy decryption did not match, check if it is a bcrypt hash
  if not v_matched then
    begin
      v_as_text := convert_from(v_rec.encrypted_password, 'UTF8');
      if v_as_text ~ '^\$2[aby]\$' then
        v_matched := (crypt(p_password, v_as_text) = v_as_text);
      end if;
    exception when others then
      v_matched := false;
    end;
  end if;

  -- 3. Progressive lazy migration: if legacy password matched, auto-upgrade to bcrypt!
  if v_matched and v_is_legacy then
    begin
      update public.seller_credentials
      set encrypted_password = convert_to(crypt(p_password, gen_salt('bf', 10)), 'UTF8')
      where application_id = v_rec.application_id;
    exception when others then
      null;
    end;
  end if;

  if v_matched then
    return query
    select v_rec.seller_code, v_rec.username, v_rec.application_id, v_rec.must_change;
  end if;

  return;
end;
$$;

revoke all on function public.authenticate_seller(text, text, text) from public;
grant execute on function public.authenticate_seller(text, text, text) to service_role;

-- 3. Create change_seller_password RPC for authenticated sellers
create or replace function public.change_seller_password(
  p_application_id uuid,
  p_current_password text,
  p_new_password text,
  p_encryption_key text
)
returns boolean
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_rec record;
  v_matched boolean := false;
  v_as_text text;
begin
  if p_application_id is null or coalesce(p_current_password, '') = '' or coalesce(p_new_password, '') = '' then
    return false;
  end if;

  select sc.encrypted_password
  into v_rec
  from public.seller_credentials sc
  where sc.application_id = p_application_id
  limit 1;

  if v_rec is null then return false; end if;

  -- Try legacy decrypt
  if coalesce(p_encryption_key, '') != '' then
    begin
      if pgp_sym_decrypt(v_rec.encrypted_password, p_encryption_key) = p_current_password then
        v_matched := true;
      end if;
    exception when others then
      v_matched := false;
    end;
  end if;

  -- Try bcrypt
  if not v_matched then
    begin
      v_as_text := convert_from(v_rec.encrypted_password, 'UTF8');
      if v_as_text ~ '^\$2[aby]\$' then
        v_matched := (crypt(p_current_password, v_as_text) = v_as_text);
      end if;
    exception when others then
      v_matched := false;
    end;
  end if;

  if not v_matched then return false; end if;

  -- Save new password as bcrypt and clear must_change_password
  update public.seller_credentials
  set encrypted_password = convert_to(crypt(p_new_password, gen_salt('bf', 10)), 'UTF8'),
      must_change_password = false
  where application_id = p_application_id;

  return true;
exception when others then
  return false;
end;
$$;

revoke all on function public.change_seller_password(uuid, text, text, text) from public;
grant execute on function public.change_seller_password(uuid, text, text, text) to service_role;

-- 4. Update reset_seller_password RPC to store bcrypt hash
create or replace function public.reset_seller_password(
  p_token_hash text,
  p_new_password text,
  p_encryption_key text
)
returns boolean
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_seller_id uuid;
begin
  if coalesce(p_token_hash, '') = '' or coalesce(p_new_password, '') = '' then
    return false;
  end if;

  select seller_id into v_seller_id
  from public.seller_password_reset_tokens
  where token_hash = p_token_hash and used_at is null and expires_at > now()
  for update;

  if v_seller_id is null then return false; end if;

  -- Store as bcrypt hash and clear must_change_password
  update public.seller_credentials
  set encrypted_password = convert_to(crypt(p_new_password, gen_salt('bf', 10)), 'UTF8'),
      must_change_password = false
  where application_id = v_seller_id;
  if not found then return false; end if;

  update public.seller_password_reset_tokens
  set used_at = now()
  where seller_id = v_seller_id and used_at is null;

  return true;
exception when others then
  return false;
end;
$$;

revoke all on function public.reset_seller_password(text, text, text) from public;
grant execute on function public.reset_seller_password(text, text, text) to service_role;

notify pgrst, 'reload schema';
