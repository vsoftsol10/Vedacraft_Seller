-- Migration 020: Atomic Bulk Stock Update RPC Function
-- Supports VED-04: Validates all items, rejects duplicates/invalid inputs, locks rows,
-- executes in a single atomic transaction block. If any error occurs, nothing commits.

create or replace function public.bulk_update_seller_stock(
  p_seller_id uuid,
  p_updates jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_item jsonb;
  v_id_text text;
  v_id uuid;
  v_qty_num numeric;
  v_qty int;
  v_seen_ids uuid[] := array[]::uuid[];
  v_requested_ids uuid[] := array[]::uuid[];
  v_quantities int[] := array[]::int[];
  v_failures jsonb := '[]'::jsonb;
  v_succeeded jsonb := '[]'::jsonb;
  v_db_prods jsonb;
  v_prod record;
  v_idx int;
  v_new_qty int;
  v_new_status text;
  v_threshold int;
  v_updated_rows jsonb := '[]'::jsonb;
begin
  -- 1. Check seller ID
  if p_seller_id is null then
    return jsonb_build_object(
      'success', false,
      'code', 'UNAUTHORIZED',
      'message', 'Seller authentication is required.',
      'summary', jsonb_build_object('total', 0, 'succeeded', 0, 'failed', 0),
      'succeeded', '[]'::jsonb,
      'failed', '[]'::jsonb
    );
  end if;

  -- 2. Check input array
  if p_updates is null or jsonb_typeof(p_updates) != 'array' or jsonb_array_length(p_updates) = 0 then
    return jsonb_build_object(
      'success', false,
      'code', 'EMPTY_UPDATES',
      'message', 'Select at least one product and enter a quantity.',
      'summary', jsonb_build_object('total', 0, 'succeeded', 0, 'failed', 0),
      'succeeded', '[]'::jsonb,
      'failed', '[]'::jsonb
    );
  end if;

  -- 3. Parse and validate each update item upfront
  for v_item in select * from jsonb_array_elements(p_updates)
  loop
    v_id_text := coalesce(v_item->>'id', v_item->>'productId', '');
    
    -- Validate UUID format
    begin
      v_id := v_id_text::uuid;
    exception when others then
      v_failures := v_failures || jsonb_build_object(
        'id', v_id_text,
        'reason', 'Invalid product ID format.'
      );
      continue;
    end;

    -- Validate quantity
    v_qty_num := null;
    begin
      v_qty_num := (v_item->>'quantity')::numeric;
    exception when others then
      v_failures := v_failures || jsonb_build_object(
        'id', v_id_text,
        'reason', 'Quantity must be a valid whole number.'
      );
      continue;
    end;

    if v_qty_num is null or v_qty_num <= 0 or trunc(v_qty_num) != v_qty_num then
      v_failures := v_failures || jsonb_build_object(
        'id', v_id_text,
        'reason', 'Quantity to add must be a whole integer greater than zero.'
      );
      continue;
    end if;

    if v_qty_num > 1000000 then
      v_failures := v_failures || jsonb_build_object(
        'id', v_id_text,
        'reason', 'Quantity exceeds maximum allowable single update limit (1,000,000).'
      );
      continue;
    end if;

    v_qty := v_qty_num::int;

    -- Check duplicate product IDs in the same batch
    if v_id = any(v_seen_ids) then
      v_failures := v_failures || jsonb_build_object(
        'id', v_id_text,
        'reason', 'Duplicate product ID in batch. Each product can only appear once per update.'
      );
      continue;
    end if;

    v_seen_ids := array_append(v_seen_ids, v_id);
    v_requested_ids := array_append(v_requested_ids, v_id);
    v_quantities := array_append(v_quantities, v_qty);
  end loop;

  -- If any structural/validation errors exist, abort transaction immediately without modifying DB
  if jsonb_array_length(v_failures) > 0 then
    return jsonb_build_object(
      'success', false,
      'code', 'VALIDATION_FAILED',
      'message', 'Validation failed for one or more products. No stock was updated.',
      'summary', jsonb_build_object(
        'total', jsonb_array_length(p_updates),
        'succeeded', 0,
        'failed', jsonb_array_length(v_failures)
      ),
      'succeeded', '[]'::jsonb,
      'failed', v_failures
    );
  end if;

  -- 4. Lock and verify all requested product rows owned by this seller
  -- Using FOR UPDATE to lock relevant product rows and prevent concurrent update race conditions
  create temporary table temp_locked_products on commit drop as
  select sp.*
  from public.seller_products sp
  where sp.id = any(v_requested_ids)
    and sp.seller_id = p_seller_id
  for update;

  -- 5. Check if any requested product is missing or belongs to another seller
  for v_idx in 1 .. array_length(v_requested_ids, 1)
  loop
    v_id := v_requested_ids[v_idx];
    if not exists (select 1 from temp_locked_products where id = v_id) then
      v_failures := v_failures || jsonb_build_object(
        'id', v_id::text,
        'reason', 'Product not found or you do not have permission to modify its stock.'
      );
    end if;
  end loop;

  -- If any product ownership or existence check failed, rollback/abort completely
  if jsonb_array_length(v_failures) > 0 then
    return jsonb_build_object(
      'success', false,
      'code', 'OWNERSHIP_OR_NOT_FOUND',
      'message', 'One or more products could not be updated. No stock was modified.',
      'summary', jsonb_build_object(
        'total', jsonb_array_length(p_updates),
        'succeeded', 0,
        'failed', jsonb_array_length(v_failures)
      ),
      'succeeded', '[]'::jsonb,
      'failed', v_failures
    );
  end if;

  -- 6. All checks passed: perform atomic stock updates on locked rows
  for v_idx in 1 .. array_length(v_requested_ids, 1)
  loop
    v_id := v_requested_ids[v_idx];
    v_qty := v_quantities[v_idx];

    select * into v_prod from temp_locked_products where id = v_id;

    -- Check integer overflow
    if (coalesce(v_prod.stock_quantity, 0)::bigint + v_qty::bigint) > 2147483647 then
      return jsonb_build_object(
        'success', false,
        'code', 'STOCK_OVERFLOW',
        'message', 'Stock quantity exceeds integer limit for product ' || v_prod.product_name || '. No stock was modified.',
        'summary', jsonb_build_object(
          'total', jsonb_array_length(p_updates),
          'succeeded', 0,
          'failed', 1
        ),
        'succeeded', '[]'::jsonb,
        'failed', jsonb_build_array(jsonb_build_object(
          'id', v_id::text,
          'productName', v_prod.product_name,
          'reason', 'Stock quantity would exceed maximum database limit.'
        ))
      );
    end if;

    v_new_qty := coalesce(v_prod.stock_quantity, 0) + v_qty;
    v_threshold := coalesce(v_prod.low_stock_alert, 0);

    if v_new_qty <= 0 then
      v_new_status := 'Out of Stock';
    elsif v_new_qty <= v_threshold then
      v_new_status := 'Low Stock';
    else
      v_new_status := 'In Stock';
    end if;

    update public.seller_products
    set stock_quantity = v_new_qty,
        stock_status = v_new_status,
        updated_at = now()
    where id = v_id
    returning to_jsonb(seller_products.*) into v_db_prods;

    v_updated_rows := v_updated_rows || v_db_prods;

    v_succeeded := v_succeeded || jsonb_build_object(
      'id', v_id::text,
      'productId', v_prod.product_id,
      'productName', v_prod.product_name,
      'addedQuantity', v_qty,
      'previousStock', coalesce(v_prod.stock_quantity, 0),
      'currentStock', v_new_qty,
      'stockStatus', v_new_status
    );
  end loop;

  return jsonb_build_object(
    'success', true,
    'code', 'SUCCESS',
    'message', 'All ' || array_length(v_requested_ids, 1)::text || ' products updated successfully.',
    'summary', jsonb_build_object(
      'total', array_length(v_requested_ids, 1),
      'succeeded', array_length(v_requested_ids, 1),
      'failed', 0
    ),
    'succeeded', v_succeeded,
    'failed', '[]'::jsonb,
    'updatedProducts', v_updated_rows
  );
exception when others then
  return jsonb_build_object(
    'success', false,
    'code', 'DATABASE_ERROR',
    'message', 'Database error during stock update: ' || SQLERRM || '. Transaction rolled back.',
    'summary', jsonb_build_object(
      'total', coalesce(jsonb_array_length(p_updates), 0),
      'succeeded', 0,
      'failed', coalesce(jsonb_array_length(p_updates), 0)
    ),
    'succeeded', '[]'::jsonb,
    'failed', jsonb_build_array(jsonb_build_object(
      'reason', SQLERRM
    ))
  );
end;
$$;

revoke all on function public.bulk_update_seller_stock(uuid, jsonb) from public;
grant execute on function public.bulk_update_seller_stock(uuid, jsonb) to service_role;

