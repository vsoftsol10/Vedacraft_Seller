# Vedacraft Seller Portal — Database Migrations Guide

**Target Environment:** Supabase Cloud PostgreSQL  
**Directory Path:** `backend/supabase/migrations/`  
**Total Migrations:** 22 Files  

---

## 1. Migration Execution Overview

All migrations are idempotent (`IF NOT EXISTS`, `DROP CONSTRAINT IF EXISTS`) and must be executed in sequential alphabetical order inside the Supabase SQL Editor or through the Supabase CLI:

```bash
# Recommended order execution:
000 -> 001 -> 002 -> 003 -> ... -> 021
```

---

## 2. Complete Migration Catalog

| Seq | Migration File | Target Table / Object | Purpose & Description |
|---|---|---|---|
| **000** | `000_base_schema.sql` | `seller_applications`, `seller_credentials`, `orders`, `seller_documents` | Creates initial baseline schema and core tables with IF NOT EXISTS guards for fresh environments. |
| **001** | `001_create_products.sql` | `seller_products` | Creates base seller products table with SKU, category, prices, stock, dimensions, and initial check constraints. |
| **002** | `002_create_product_images_storage.sql` | Storage Bucket: `product-images` | Creates public storage bucket for product cover and additional images with public read policies. |
| **003** | `003_create_seller_login_function.sql` | Function: `authenticate_seller` | Creates PostgreSQL function for verifying seller credentials and password hashes securely inside DB. |
| **004** | `004_add_seller_to_products.sql` | `seller_products` | Adds `seller_id` foreign key referencing `seller_applications(id)` to isolate products by seller. |
| **005** | `005_add_seller_profile_columns.sql` | `seller_applications` | Adds profile-specific columns: alternate phone, profile picture storage path, updated timestamps. |
| **006** | `006_create_seller_selling_locations.sql` | `seller_selling_locations` | Creates table mapping states and cities where a seller offers delivery/shipping services. |
| **007** | `007_add_seller_bank_account_encryption.sql` | `seller_bank_details` | Adds `encrypted_account_number` column for AES-256-GCM encrypted bank details. |
| **008** | `008_null_plaintext_seller_bank_account_numbers.sql` | `seller_bank_details` | Nullifies legacy plaintext account numbers after encryption backfill. |
| **009** | `009_create_seller_offers.sql` | `offers`, `offer_products` | Creates offers tables supporting percentage and fixed discounts, start/end dates, and product associations. |
| **010** | `010_create_notifications.sql` | `notifications` | Creates notifications queue table for seller alerts (order received, low stock alert, payment). |
| **011** | `011_add_seller_return_address.sql` | `seller_applications` | Adds return address, pin code, state, and city columns for return shipments. |
| **012** | `012_add_seller_selling_status.sql` | `seller_applications` | Adds `is_selling_active` boolean column enabling sellers to toggle store open/close for vacation. |
| **013** | `013_add_notification_audience.sql` | `notifications` | Adds target audience filtering (`all`, `seller`, `admin`) to system notifications. |
| **013.1** | `013_1_create_seller_password_reset.sql` | `seller_password_resets` | Creates reset token table with expiry timestamps for self-service forgot password flow. |
| **014** | `014_add_seller_business_sub_category.sql` | `seller_applications` | Adds `business_sub_category` text column for finer artisan classification. |
| **015** | `015_add_seller_document_statuses.sql` | `seller_documents` | Creates document verification tracking table for PAN, GST, Bank Proof with status tracking. |
| **016** | `016_add_product_translations.sql` | `product_translations` | Creates translation storage table linking to products with language check (`en`, `ta`, `hi`). |
| **017** | `017_add_product_translation_status.sql` | `product_translations` | Adds `status` column (`ok`, `failed`) to track translation completion. |
| **018** | `018_seller_password_security_and_temporary_flow.sql` | `seller_credentials` | Implements temporary password workflow, forced password change on first login, and lockout protection. |
| **019** | `019_enforce_temporary_password_default_true.sql` | `seller_credentials` | Enforces `must_change_password` default as `true` for all newly registered seller accounts. |
| **020** | `020_add_languages_telugu_malayalam.sql` | `seller_products`, `product_translations` | Expands primary and translated language constraints to allow all 5 languages (`en`, `ta`, `hi`, `te`, `ml`) and allows `auto`/`automatic` sources. |
| **021** | `021_bulk_stock_update_transaction.sql` | Function: `bulk_update_seller_stock` | Creates atomic PostgreSQL RPC transaction for bulk CSV/Excel inventory adjustments with per-item rollback safety. |

---

## 3. Schema Reload Notification Command

Whenever modifications to table constraints or new columns are applied, PostgREST requires an explicit notification to refresh its schema cache:

```sql
NOTIFY pgrst, 'reload schema';
```

Executing this command ensures instantaneous availability of modified endpoints without requiring a Supabase project restart.
