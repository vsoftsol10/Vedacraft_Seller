-- Migration 000: Baseline Schema
-- Creates initial core tables required prior to incremental migrations:
-- 1. seller_applications
-- 2. seller_credentials
-- 3. orders
-- 4. seller_documents
-- 
-- Note: Safe to execute on existing databases via IF NOT EXISTS guards.

-- Enable UUID extension if not already present
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- 1. Seller Applications Baseline Table
create table if not exists public.seller_applications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  seller_code text unique,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  full_name text not null,
  business_name text not null,
  business_email text not null,
  mobile_number text,
  alternate_number text,
  profile_image text,
  store_name text,
  store_type text,
  sub_category text,
  business_sub_category text,
  store_description text,
  pan_number text,
  gst_number text,
  address_line1 text,
  city text,
  state text,
  pin_code text,
  country text default 'India',
  return_address_line1 text,
  return_city text,
  return_state text,
  return_pin_code text,
  is_selling_active boolean default true,
  account_holder_name text,
  account_number text,
  account_number_encrypted text,
  account_number_last4 text,
  bank_name text,
  branch_name text,
  account_type text,
  ifsc_code text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_seller_applications_email on public.seller_applications (business_email);
create index if not exists idx_seller_applications_code on public.seller_applications (seller_code);

-- 2. Seller Credentials Baseline Table
create table if not exists public.seller_credentials (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references public.seller_applications(id) on delete cascade,
  seller_code text not null unique,
  username text not null,
  encrypted_password bytea,
  password_hash text,
  must_change_password boolean not null default true,
  temporary_password_hash text,
  failed_attempts integer default 0,
  locked_until timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_seller_credentials_app_id on public.seller_credentials (application_id);
create index if not exists idx_seller_credentials_code on public.seller_credentials (seller_code);

-- 3. Orders Baseline Table
create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  order_number text not null unique,
  customer_id uuid,
  customer_first_name text,
  customer_last_name text,
  customer_phone text,
  customer_email text,
  customer_notes text,
  items jsonb not null default '[]'::jsonb,
  item_count integer default 0,
  product text,
  total numeric(12,2) not null default 0.00,
  status text not null default 'Placed' check (status in ('Placed', 'Processing', 'Shipped', 'Delivered', 'Cancelled', 'Returned')),
  payment_method text default 'COD',
  payment_status text default 'Pending',
  address text,
  delivery_slot text,
  tracking_id text,
  courier_partner text,
  delivered_at timestamptz,
  estimated_delivery timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_orders_status on public.orders (status);
create index if not exists idx_orders_created_at on public.orders (created_at desc);

-- 4. Seller Documents Baseline Table
create table if not exists public.seller_documents (
  id uuid primary key default gen_random_uuid(),
  seller_application_id uuid not null references public.seller_applications(id) on delete cascade,
  user_id uuid,
  document_type text not null,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  storage_path text not null,
  original_filename text not null,
  mime_type text not null,
  size_bytes bigint not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_seller_documents_app_id on public.seller_documents (seller_application_id);
