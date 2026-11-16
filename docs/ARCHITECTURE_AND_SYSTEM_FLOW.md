# Vedacraft Seller Portal — System Architecture & Data Flow

**Document Version:** 1.0.0  
**Project:** Vedacrafts Seller Portal  
**Target Audience:** Engineering Team, System Architects, Onboarding Developers  

---

## 1. High-Level System Architecture

The Vedacraft Seller Portal is built on a modern decoupled architecture consisting of a React client, an Express ESM REST API server, and a managed Supabase PostgreSQL cloud database with object storage.

```
┌─────────────────────────────────────────────────────────────┐
│                       Client Tier                           │
│   React 19 / Vite / Tailwind CSS / Lucide React Icons       │
│               (Port 5173 / Production CDN)                  │
└──────────────────────────────┬──────────────────────────────┘
                               │ HTTP / JSON / Multipart
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                     Application Tier                        │
│          Node.js (v20+) / Express ESM REST API              │
│               (Port 5000 / Render / Cloud)                  │
│                                                             │
│   ├── Authentication & Session Middleware (HMAC-SHA256)     │
│   ├── Business Logic & Validation Controllers               │
│   ├── Dual-Mode Google Translation Service (Free/API)       │
│   ├── AES-256-GCM Bank Encryption Service                   │
│   └── Multi-format File Upload & Mime Validation            │
└──────────────┬──────────────────────────────┬───────────────┘
               │                              │
               ▼                              ▼
┌──────────────────────────────┐ ┌────────────────────────────┐
│      Data & Storage Tier     │ │       External Tier        │
│   Supabase Cloud PostgreSQL  │ │  Google Translate Engine   │
│   - seller_applications      │ │  Brevo Email Notifications │
│   - seller_products          │ └────────────────────────────┘
│   - product_translations     │
│   - offers & offer_products  │
│   - orders & reviews         │
│   - Supabase Storage Buckets │
│     * product-images         │
│     * seller-verification-   │
│       documents              │
└──────────────────────────────┘
```

---

## 2. Core Architectural Principles

1. **Service Role Security Isolation:**  
   The backend communicates with Supabase using the server-only `SUPABASE_SERVICE_ROLE_KEY`. This key bypasses PostgreSQL Row Level Security (RLS) safely from the backend while ensuring browser clients never receive administrative keys.
2. **Stateless HMAC-SHA256 Token Sessions:**  
   Authentication tokens contain seller application claims signed by `SELLER_SESSION_SECRET`. Tokens are verified on every privileged request without requiring redundant database session lookups.
3. **Dual-Mode Zero-Cost Translation Architecture (VED-12):**  
   The translation service automatically detects whether official Google Cloud credentials (`GOOGLE_TRANSLATE_API_KEY` or `GOOGLE_APPLICATION_CREDENTIALS`) are present. If absent, it transparently falls back to Google's public translation engine, guaranteeing 100% uptime with zero API subscription cost across all 5 languages (`en`, `ta`, `hi`, `te`, `ml`).
4. **AES-256-GCM Sensitive Data Encryption (VED-05):**  
   Seller bank account numbers are encrypted at rest using AES-256-GCM with authenticated tags before storing in PostgreSQL. Plaintext values are never written to disk or logs.
5. **Database Constraint Driven Data Integrity:**  
   Business boundaries (such as allowed primary languages, document types, discount percentages `<= 100%`, and order statuses) are enforced at the database level using PostgreSQL `CHECK` constraints, providing an immutable second line of defense behind controller validation.

---

## 3. End-to-End System Workflows

### 3.1. Seller Registration & Onboarding Flow (VED-07, VED-08)
```
Seller Browser              Backend Server (Express)            Supabase DB / Storage
      │                                │                                   │
      ├─── 1. Register Form ──────────>│                                   │
      │    (Business info, contact)    ├─── 2. Generate Seller Code ──────>│
      │                                │       (VSELL-XXXX)                │
      │                                │<── 3. Return Credential Id ───────┤
      │<── 4. Code & Temp Password ────┤                                   │
      │                                │                                   │
      ├─── 5. Upload 5 Documents ─────>│                                   │
      │    (PAN, GST, Bank Proof)      ├─── 6. Validate MIME & Size ──────>│ Upload to
      │                                │       Store Path & Status         │ seller-verification
      │<── 7. Verification Pending ────┤<── 8. Upload Acknowledged ────────┤ documents bucket
```

### 3.2. Product Creation & 5-Language Translation Flow (VED-12)
```
Seller Browser              Backend Server                      Translation Engine / DB
      │                                │                                   │
      ├─── 1. Submit Product (EN) ────>│                                   │
      │    (Name, Price, Material, Img)├─── 2. Auto-generate SKU ─────────>│
      │                                │       (e.g., BRA-0001)            │
      │                                ├─── 3. Save Product Row ──────────>│
      │                                │                                   │
      │                                ├─── 4. Dispatch Translation ──────>│ Google Engine
      │                                │       Translate into TA, HI,      │ (5 Languages)
      │                                │       TE, ML concurrently         │
      │                                │<── 5. Translated Text ────────────┤
      │                                ├─── 6. Upsert Translations ───────>│ product_translations
      │                                │       (source: automatic,         │ (status: ok)
      │                                │        status: ok)                │
      │<── 7. Product Created ─────────┤                                   │
      │    (Redirect to /products)     │                                   │
```

### 3.3. Offers & Promotional Pricing Flow
```
Seller Browser              Backend Controller                  Database Constraints
      │                                │                                   │
      ├─── 1. Create Offer ───────────>│                                   │
      │    (Discount %, Date Range)    ├─── 2. Validate Discount <= 100% ──┤
      │                                ├─── 3. Validate Start/End Dates ───┤
      │                                ├─── 4. Check Product Conflicts ───>│ No dual-active
      │                                │       (Single active offer/item)  │ offer overlap
      │<── 5. Offer Published ─────────┤<── 6. Save Offer & Mappings ──────┤
```

---

## 4. Frontend Component Hierarchy & State Management

- **`App.jsx`**: Root routing, responsive layout container, global notifications toast listener, and search modal navigation override (`setSettingsOpenOverride`).
- **`Sidebar.jsx`**: Persistent navigation drawer with active route detection and responsive collapse.
- **`Dashboard.jsx`**: Aggregates metric cards, charts, and renders `<LowStockAlert items={dashboard?.lowStock} />` (VED-10).
- **`Addproduct.jsx`**: Product creation and editing form. Houses the multi-tab **Translations** section with real-time badge states (`Primary`, `Auto-translated`, `Edited by you`, `Translation failed`, `Not translated`).
- **`Documents.jsx`**: Renders all 5 verification cards with real-time status badges (`Pending`, `Approved`, `Rejected`), and triggers modal file replacer.
- **`requestCache.js`**: Client-side in-memory cache layer with TTL (Time To Live) and surgical cache invalidation (`invalidateCachedRequests`) on mutating operations.
