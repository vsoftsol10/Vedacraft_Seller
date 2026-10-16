alter table public.seller_documents
  add column if not exists status text not null default 'pending';

alter table public.seller_documents
  drop constraint if exists seller_documents_status_check;

alter table public.seller_documents
  add constraint seller_documents_status_check check (status in ('pending', 'approved', 'rejected'));

alter table public.seller_documents
  drop constraint if exists seller_documents_seller_application_id_document_type_key;

drop index if exists public.seller_documents_seller_application_id_document_type_key;

create unique index if not exists seller_documents_active_type_unique
  on public.seller_documents (seller_application_id, document_type)
  where document_type <> 'supporting_document' and status in ('pending', 'approved');
