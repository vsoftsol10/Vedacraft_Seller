# Vedacrafts Sellers — Project Overview

## 1. Purpose

Vedacrafts Sellers is a seller-facing commerce dashboard for the VedaCrafts marketplace. Its implemented business capability is product catalogue management: a seller can create products with inventory, price, descriptive data, and images; search/filter them; view details; edit them; and delete them. The surrounding dashboard and order-management screens establish the intended wider seller-operations product, but currently use static demonstration data rather than backend data.

The repository README describes it as a React/Vite frontend paired with a Node.js/Express backend. The UI targets Indian sellers (rupee amounts and product examples such as Bamboo Bottle and Jute Storage Basket).

## 2. Architecture

This is one Git-untracked directory containing a two-package JavaScript workspace, rather than a formal npm-workspaces monorepo:

```
repository root
├── frontend/  React single-page application (Vite)
└── backend/   Express HTTP API
                └── Supabase PostgreSQL + Supabase Storage
```

The root `package.json` orchestrates both applications with `concurrently`. `npm run dev` starts the backend on port 5000 and Vite on port 5173. In development, Vite proxies `/api` to the backend; alternatively, the client reads `VITE_API_URL` to address a deployed API.

The React client calls the product API through Axios. The Express server uses a Supabase service-role client to read/write PostgreSQL and to upload/delete product images in Supabase Storage. The browser does not connect to Supabase directly.

## 3. Tech stack actually present

| Area | Technology | Evidence / role |
| --- | --- | --- |
| Frontend framework | React 19, React DOM | SPA rendering and components |
| Build/dev | Vite 8, `@vitejs/plugin-react` | frontend build server and production bundling |
| Client routing | `react-router-dom` 7 | dashboard, products, add/edit product, and orders routes |
| HTTP client | Axios | product API client in `src/api/productapi.js` |
| UI/icons | Lucide React | navigation and UI icons |
| Charts | Recharts | dashboard revenue bar chart and category pie chart |
| Styling | Tailwind CSS 4 with `@tailwindcss/vite`; plain CSS | dashboard/layout utility classes and page-specific CSS files |
| Frontend quality | ESLint 10 with React Hooks and React Refresh plugins | lint configuration |
| Backend runtime/framework | Node.js ESM, Express 4 | HTTP API and middleware pipeline |
| Database/storage SDK | `@supabase/supabase-js` | PostgreSQL table operations and object storage |
| Upload parsing | Multer | in-memory multipart image handling |
| Configuration | dotenv | backend environment loading |
| Schema tooling | Prisma 5 / `@prisma/client` | Prisma schema exists, but application code does not instantiate Prisma |
| Process orchestration | concurrently | root dev command |
| Installed but not wired in source | BullMQ, `express-rate-limit` | present in backend dependencies; no imports/configuration found |

## 4. Folder and module breakdown

### Root

- `README.md` — local setup/run instructions and Supabase image-storage notes.
- `package.json` — commands to install, run, build, and start the two packages.
- `.gitignore` — excludes dependencies, build output, environment files, and logs.

### `frontend/`

- `src/main.jsx` — React entry point; renders the application under `StrictMode`.
- `src/App.jsx` — current active application shell: router, sidebar/top bar markup, and route definitions. It does **not** use the alternative `components/layout` shell.
- `src/pages/`
  - `Dashboard.jsx` — static dashboard composition.
  - `Products.jsx` — route wrapper for the product listing.
  - `Order.jsx` — order page that filters in-memory mock orders.
- `src/components/products/`
  - `Productlist.jsx` — live product list, stats, search/category/status filters, view modal, edit navigation, and deletion.
  - `Addproduct.jsx` — create/edit form, validation, image previews, multipart submission, and product loading for edit mode.
  - `ProductDetails.jsx` — read-only product-detail modal.
- `src/components/orders/` — order table, toolbar, status badge, stat card, and mock constants. No API integration.
- `src/components/dashboard/` — reusable cards, charts, static tables, and low-stock list used by the dashboard.
- `src/components/layout/` — alternate Tailwind-based `Sidebar`, `Header`, and `MainLayout`; currently unused by `App.jsx`.
- `src/api/productapi.js` — all live product REST calls.
- `src/services/api.js` — separate generic Axios client and `getApiHealth`; currently unused and its `/health` request does not match a backend route.
- `src/constants/Ordersconstants.js` — duplicate, unused copy of order fixture data; active order page imports the version under `components/orders`.
- `src/styles/` — CSS for app, products, add/edit, product modal, and orders.
- `src/assets/images/logo.png` — logo used only by the unused layout sidebar.
- `vite.config.js` — React/Tailwind plugins and development API proxy.
- `.env.example` / `frontend-env.example` — frontend API URL guidance; the latter is redundant.

### `backend/`

- `src/server.js` — Express bootstrap, CORS, body parsers, product route mounting, root status text, and centralized JSON error response.
- `src/routes/productroutes.js` — product endpoint declarations and upload middleware attachment.
- `src/controllers/productController.js` — product validation/mapping and CRUD/statistics/category handlers.
- `src/config/supabase.js` — creates a server-only Supabase client and fails fast if service credentials are absent.
- `src/middlewares/upload.js` — Multer memory storage; accepts one `coverImage` and up to four `additionalImages`, PNG/JPEG only, 2 MB per file.
- `src/services/productImageStorage.js` — creates unique storage paths, uploads images, returns public URLs, and removes images on replacement/deletion/failure.
- `prisma/schema.prisma` — PostgreSQL `Product` model mapping to `seller_products`; a schema reference rather than the active query mechanism.
- `supabase/migrations/` — SQL creating the product table and the public product-image bucket.
- `.env.example` / `backend-env.example` — backend port, CORS origin, Supabase URL/service key, and an unused commented Redis URL; the two files are not identical.

## 5. Data layer, schema, and access control

### Active data access

The API directly uses Supabase's PostgREST client against PostgreSQL table `public.seller_products`. Product records include a generated public product ID, descriptive fields, numeric dimensions/pricing, SKU, inventory thresholds/status, image URLs, and timestamps. Stock status is derived server-side:

- `Out of Stock` when quantity is zero or lower;
- `Low Stock` when quantity is positive and at/below the alert threshold;
- `In Stock` otherwise.

`backend/prisma/schema.prisma` mirrors this schema as model `Product`, with PostgreSQL decimal/UUID mappings. It is not used by controllers and there is no Prisma migration history or generated-client invocation in source.

### Supabase Storage

Images are kept in the `product-images` bucket, under `seller-products/<sanitized-product-id>/<uuid>.<extension>`. The bucket migration makes it public, limits files to 2 MB, and permits JPEG/JPG/PNG. The API stores resulting public URLs in `cover_image` and `additional_images`.

### RLS and auth

The product-table migration enables Row Level Security. It intentionally creates no browser policies: backend requests use `SUPABASE_SERVICE_ROLE_KEY`, which bypasses RLS. There is no application authentication, authorization, seller identity, or tenant scoping in either package. The migration also does not create the `categories` table queried by `GET /api/products/categories`; that table is an external prerequisite.

## 6. API surface

All product routes are mounted under `/api/products`.

| Method and path | Purpose |
| --- | --- |
| `GET /` | Plain-text API status: `Veda Crafts API is running`. |
| `GET /api/products` | Paginated product listing. Supports `page`, `limit` (1–100), `search` (name/product ID), `category`, and `stockStatus`. |
| `GET /api/products/stats` | Counts total, in-stock, out-of-stock, and low-stock products. |
| `GET /api/products/categories` | Reads distinct non-empty names from the external `categories` table. |
| `GET /api/products/:id` | Returns one product by internal UUID. |
| `POST /api/products` | Creates a product; multipart image fields are optional at API level. Generates an ID such as `#VC12345`, uploads supplied images, and inserts the row. |
| `PUT /api/products/:id` | Updates an existing product and uploads any supplied replacement images. |
| `DELETE /api/products/:id` | Deletes a product and then attempts to remove its associated storage objects. |

There is no `/api/health` endpoint despite the unused frontend helper requesting it, and there are no order, dashboard, inventory, payment, user, authentication, or category-management endpoints.

## 7. Current build and implementation state

### Implemented and connected

- Product CRUD flows are wired from UI to API and Supabase.
- Product listing has server-backed search, category/status filters, loading/empty states, and live counts.
- Create/edit form validates user input, uploads files using `FormData`, and displays backend errors.
- Product detail view and destructive-delete confirmation are implemented.
- Backend input mapping, conflict handling for duplicate SKU/product ID, pagination, and cleanup on failed image upload are present.

### Static, partial, or placeholder functionality

- Dashboard KPIs, charts, recent orders, top products, and low-stock alerts use hardcoded fixtures.
- Orders use three `MOCK_ORDERS`; search is local. Filter/sort buttons accept optional callbacks but no callbacks are passed, and per-order action buttons do nothing.
- Sidebar links for Inventory, Insights, Earnings, Reviews, Coupons, Settings, and Help & Support have no corresponding routes, so they render no route content.
- Header search, notification bell, and avatar are cosmetic/nonfunctional.
- Seller name is fixed as `Priya`; no user/session model exists.
- The main dashboard's second low-stock card is titled `Store` but repeats the same low-stock fixture.
- The separate layout components, generic API service, root-level order constants, and logo asset are unused by the active shell.

### Verification performed

On 18 September 2026, `npm.cmd run build` completed successfully. Vite reported a production JavaScript chunk of 728.61 kB (220.31 kB gzip), exceeding its 500 kB advisory threshold.

`npm.cmd run lint` currently fails with two errors and one warning in `Productlist.jsx`: unused `ChevronDown`; a React Hooks rule against synchronously setting state via `loadData()` from an effect; and a missing `loadData` effect dependency warning. No automated test scripts or test files were found.

## 8. External integrations and configuration

| Integration | Wiring |
| --- | --- |
| Supabase PostgreSQL | Backend `createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)` queries `seller_products` and `categories`. |
| Supabase Storage | The same privileged backend client uploads/removes `product-images` objects and derives public URLs. |
| Browser/API connectivity | `VITE_API_URL` selects an explicit API base URL; otherwise Axios uses `/api` and Vite proxies during local development. |
| CORS | `CLIENT_ORIGIN` (or `CLIENT_URL`) is comma-separated and defaults to Vite's local origin. |

No payment gateway, messaging service, email, shipping provider, analytics system, or identity provider is referenced in executable source. BullMQ and a commented `REDIS_URL` suggest intended background-job capability, but no queue/Redis connection is implemented.

## 9. Gaps and risks

- **No authentication/authorization:** the API exposes product CRUD to any caller allowed by CORS; the service-role key bypasses RLS. Production deployment needs authenticated server-side identity and seller-level data isolation before public exposure.
- **Schema dependency missing from migrations:** category reads require `public.categories`, yet the supplied migrations do not create or seed it. A fresh Supabase project will fail category dropdown/list requests unless another project migration supplies it.
- **Frontend/backend image-rule mismatch:** the form requires at least three images including a cover, while the API accepts zero images. Conversely, the form uses old preview URLs during edit validation, but newly uploaded additional images replace all existing additional-image URLs, potentially dropping images not reselected.
- **Unvalidated/weak server inputs:** server validation checks presence but does not fully enforce positive numeric values, integer stock fields, image count, or a complete schema. `Number(...)` can yield invalid numeric values before database insertion.
- **No rate limiting despite dependency:** `express-rate-limit` is installed but absent from the middleware chain. There are no request logging, security headers, payload-size limits beyond Multer, or explicit unknown-route JSON handling.
- **Error handling is uneven:** product-list failures are only logged to the browser console with no user-facing error; storage deletion failures are logged but the database operation remains successful, risking orphaned images.
- **Feature breadth exceeds implementation:** dashboard/orders and most navigation represent planned surfaces, not live operations. The API has no data model/endpoints to support them.
- **Code duplication/inconsistency:** two application layouts and two order constants files coexist; active `App.jsx` duplicates nav/header markup rather than using `components/layout`. `services/api.js` targets a missing health endpoint.
- **Quality and delivery:** lint is failing and no test suite exists. The single large Vite chunk may affect first-load performance. Several rupee literals display mojibake (`â‚¹`) in source/output, suggesting an encoding issue to correct.

