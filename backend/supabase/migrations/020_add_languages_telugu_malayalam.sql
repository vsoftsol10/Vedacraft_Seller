-- Migration 020: Add Telugu (te) and Malayalam (ml) support for translations
alter table public.seller_products
  drop constraint if exists seller_products_primary_language_check;

alter table public.seller_products
  add constraint seller_products_primary_language_check 
  check (primary_language in ('en', 'ta', 'hi', 'te', 'ml'));

alter table public.product_translations
  drop constraint if exists product_translations_language_check;

alter table public.product_translations
  add constraint product_translations_language_check 
  check (language in ('en', 'ta', 'hi', 'te', 'ml'));

alter table public.product_translations
  drop constraint if exists product_translations_source_check;

alter table public.product_translations
  add constraint product_translations_source_check 
  check (source in ('manual', 'auto', 'automatic'));
