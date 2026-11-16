# Vedacraft Seller Portal — API Contracts & Reference

**Base URL (Local):** `http://localhost:5000/api`  
**Base URL (Production):** `https://vedacraft-seller.onrender.com/api`  
**Authentication Header:** `Authorization: Bearer <SELLER_TOKEN>`  

---

## 1. Authentication & Session (`/api/auth`)

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `POST` | `/api/auth/register` | Public | Submit prospective seller application. Generates seller credentials. |
| `POST` | `/api/auth/login` | Public | Authenticates seller with `sellerCode` & `password`. Returns JWT token. |
| `POST` | `/api/auth/change-password` | Seller | Changes password. Clears `must_change_password` temporary flag. |
| `POST` | `/api/auth/forgot-password` | Public | Sends password reset email link with secure verification token. |
| `POST` | `/api/auth/reset-password` | Public | Resets forgotten password using received token. |

---

## 2. Products & Inventory (`/api/products`)

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/api/products` | Seller | Paginated product listing with filters (`search`, `category`, `stockStatus`, `isActive`). |
| `GET` | `/api/products/:id` | Seller | Fetch single product by UUID with its current translations. Supports `?lang=ta`. |
| `GET` | `/api/products/public/:id` | Public | Read-only storefront endpoint for active products. Sanitizes seller private fields. |
| `GET` | `/api/products/stats` | Seller | Returns counts: `totalProducts`, `inStock`, `outOfStock`, `lowStock`. |
| `GET` | `/api/products/categories` | Seller | Returns list of approved system product categories. |
| `GET` | `/api/products/next-sku` | Seller | Previews next auto-generated SKU for a given product name (e.g. `BRA-0001`). |
| `POST` | `/api/products` | Seller | Multipart product creation. Uploads cover image + up to 4 additional images. Automatically triggers 5-language translation. |
| `PUT` | `/api/products/:id` | Seller | Updates existing product. Triggers translation updates for modified fields. |
| `DELETE` | `/api/products/:id` | Seller | Deletes product (Restricted if product is active in an offer). |
| `PATCH` | `/api/products/:id/status` | Seller | Toggles product active/inactive visibility (`{ isActive: boolean }`). |
| `PATCH` | `/api/products/bulk-stock` | Seller | Updates stock quantities across multiple items in a single atomic transaction. |
| `GET` | `/api/products/bulk-template` | Seller | Downloads Excel bulk import template (.xlsx). |
| `POST` | `/api/products/bulk-preview` | Seller | Step 1 of bulk import: parses uploaded spreadsheet and matches images. |
| `POST` | `/api/products/bulk-confirm` | Seller | Step 2 of bulk import: saves validated products in batch. |

---

## 3. Product Translations (`/api/products/:id/translations`)

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/api/products/:id/translations` | Seller | Retrieves all translated versions (`en`, `ta`, `hi`, `te`, `ml`) for a product. |
| `PUT` | `/api/products/:id/translations/:language` | Seller | Manually edits translated fields for a specific language (`source` set to `manual`). |
| `POST` | `/api/products/:id/translations/retry` | Seller | Triggers translation re-generation for all uncompleted or failed languages (`?force=true` forces replacement). |
| `POST` | `/api/products/translations/translate-missing` | Seller | Background sweep to translate any historical products missing translations. |

---

## 4. Verification Documents (`/api/documents`)

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/api/documents` | Seller | Lists uploaded documents with 1-hour signed URLs and status (`pending`, `approved`, `rejected`). |
| `POST` | `/api/documents` | Seller | Uploads or replaces verification document (PAN, GST, Bank Proof, Business Reg, Supporting Doc). Maximum 5MB PDF/PNG/JPG. |

---

## 5. Offers & Promotions (`/api/offers`)

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/api/offers` | Seller | Lists all active and scheduled offers. |
| `GET` | `/api/offers/:id` | Seller | Get details of a single offer including associated product IDs. |
| `POST` | `/api/offers` | Seller | Create offer. Validates discount `<= 100%`, future dates, and ensures no dual-active conflict per product. |
| `PUT` | `/api/offers/:id` | Seller | Update offer parameters or product associations. |
| `DELETE` | `/api/offers/:id` | Seller | Delete offer and unbind promotional prices from products. |

---

## 6. Orders, Earnings & Dashboard

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/api/dashboard` | Seller | Aggregated metrics: total revenue, order count, rating, low-stock alerts, monthly chart data. |
| `GET` | `/api/insights` | Seller | Analytics on top-performing products, sales velocity, category breakdown. |
| `GET` | `/api/orders` | Seller | Seller order listing with status filters (`pending`, `shipped`, `delivered`, `cancelled`). |
| `PATCH` | `/api/orders/:id/status` | Seller | Updates fulfillment status (`shipped`, `delivered`). |
| `GET` | `/api/earnings` | Seller | Financial earnings summary: net payout, platform fee deductions, pending payouts. |

---

## 7. Profile, Bank Details & Selling Locations

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/api/profile` | Seller | Returns seller contact information, store name, and active selling status. |
| `PUT` | `/api/profile` | Seller | Updates profile details, email, normalized Indian mobile number. |
| `PUT` | `/api/profile/selling-status` | Seller | Toggles store open/closed for receiving new orders (`{ isSellingActive: boolean }`). |
| `PUT` | `/api/profile/return-address` | Seller | Sets physical address for return shipments. |
| `GET` | `/api/bank-details` | Seller | Returns decrypted bank account details (masked for security). |
| `PUT` | `/api/bank-details` | Seller | Updates bank details with automatic AES-256-GCM encryption. |
| `GET` | `/api/selling-locations` | Seller | Returns approved delivery states and designated cities. |
| `PUT` | `/api/selling-locations/:state` | Seller | Replaces allowed cities for a specific state. |
| `DELETE` | `/api/selling-locations/:state` | Seller | Removes an entire state from seller delivery coverage. |
