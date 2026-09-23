create table if not exists public.seller_selling_locations (
  id uuid primary key default gen_random_uuid(),
  seller_id uuid not null references public.seller_applications(id) on delete cascade,
  state text not null,
  city text not null,
  created_at timestamptz not null default now()
);

create unique index if not exists seller_selling_locations_seller_state_city_unique
  on public.seller_selling_locations (seller_id, lower(state), lower(city));

create index if not exists seller_selling_locations_seller_id_idx
  on public.seller_selling_locations (seller_id);

alter table public.seller_selling_locations enable row level security;

-- This function replaces one seller's state cities atomically. It is only callable
-- through the backend's service-role client; no browser role has execute permission.
create or replace function public.replace_seller_state_locations(
  p_seller_id uuid,
  p_state text,
  p_cities text[]
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_other_city_count integer;
  v_new_cities text[];
begin
  select array_agg(city order by lower(city))
    into v_new_cities
  from (
    select distinct on (lower(btrim(city))) btrim(city) as city
    from unnest(p_cities) as input(city)
    where btrim(city) <> ''
    order by lower(btrim(city)), btrim(city)
  ) as unique_cities;

  select count(*)
    into v_other_city_count
  from public.seller_selling_locations
  where seller_id = p_seller_id
    and lower(state) <> lower(p_state);

  if v_other_city_count + coalesce(cardinality(v_new_cities), 0) > 2000 then
    raise exception 'SELLING_LOCATION_CAP_EXCEEDED' using errcode = 'P0001';
  end if;

  delete from public.seller_selling_locations
  where seller_id = p_seller_id
    and lower(state) = lower(p_state);

  insert into public.seller_selling_locations (seller_id, state, city)
  select p_seller_id, p_state, city
  from unnest(v_new_cities) as input(city);
end;
$$;

revoke all on function public.replace_seller_state_locations(uuid, text, text[]) from public, anon, authenticated;
grant execute on function public.replace_seller_state_locations(uuid, text, text[]) to service_role;
