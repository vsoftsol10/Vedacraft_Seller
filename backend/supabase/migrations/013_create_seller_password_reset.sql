-- Password-reset tokens are stored only as SHA-256 hashes. The raw token exists
-- solely in the reset email and is invalidated as soon as it is used.
create table if not exists public.seller_password_reset_tokens (
  id uuid primary key default gen_random_uuid(),
  seller_id uuid not null references public.seller_applications(id) on delete cascade,
  token_hash text not null unique,
  expires_at timestamptz not null,
  used_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists seller_password_reset_tokens_active_idx
  on public.seller_password_reset_tokens (seller_id, expires_at)
  where used_at is null;

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
  if coalesce(p_token_hash, '') = '' or coalesce(p_new_password, '') = '' or coalesce(p_encryption_key, '') = '' then
    return false;
  end if;

  select seller_id into v_seller_id
  from public.seller_password_reset_tokens
  where token_hash = p_token_hash and used_at is null and expires_at > now()
  for update;

  if v_seller_id is null then return false; end if;

  update public.seller_credentials
  set encrypted_password = pgp_sym_encrypt(p_new_password, p_encryption_key)
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

revoke all on table public.seller_password_reset_tokens from public;
revoke all on function public.reset_seller_password(text, text, text) from public;
grant execute on function public.reset_seller_password(text, text, text) to service_role;

notify pgrst, 'reload schema';
