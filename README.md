# Vedacrafts Seller Portal

A comprehensive, production-ready e-commerce seller portal built for traditional Indian artisans and craft businesses. Features multi-lingual product catalog management (5 Indian languages), atomic bulk stock updates, automated seller onboarding with document verification, AES-256-GCM bank details encryption, and real-time dashboard analytics.

---

## 🚀 Quick Start Guide

### 1. Prerequisites
- **Node.js**: `v20.0.0` or higher
- **npm**: `v10.0.0` or higher
- **Supabase Cloud Account**: (Free tier or higher)

### 2. Installation
Install root, backend, and frontend dependencies in a single step:
```bash
npm run install:all
```

### 3. Environment Configuration
Copy the template files and fill in your Supabase project credentials:
```bash
# In frontend/
cp frontend/.env.example frontend/.env

# In backend/
cp backend/.env.example backend/.env
```

Key environment variables:
```env
PORT=5000
CLIENT_ORIGIN=http://localhost:5173
SUPABASE_URL=https://<your-project>.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>
SUPABASE_PRODUCT_IMAGES_BUCKET=product-images
SELLER_PASSWORD_ENCRYPTION_KEY=<32-char-key>
BANK_DETAILS_ENCRYPTION_KEY=<base64-32-byte-key>
SELLER_SESSION_SECRET=<random-secret-key>
```

### 4. Running the Development Servers
From the project root:
```bash
npm run dev
```
- **Frontend Portal**: [http://localhost:5173](http://localhost:5173)
- **Backend REST API**: [http://localhost:5000](http://localhost:5000)

---

## 🧪 Automated Testing & Production Quality

The repository includes a comprehensive automated test suite with **134 passing tests** across 23 suites:

```bash
# Run backend automated tests (node:test native runner — 0 dependencies, ~300ms)
npm test --prefix backend

# Run frontend ESLint validation (0 errors, 0 warnings)
npm run lint --prefix frontend

# Verify production build compilation
npm run build --prefix frontend
```

Test Results Summary:
```
ℹ tests   134
ℹ suites   23
ℹ pass    134  (100% Pass)
ℹ fail      0
ℹ duration 297ms
```

---

## 📚 Complete Project Documentation

Detailed technical documentation is available in the [`docs/`](docs/) directory:

| Document | Purpose |
|---|---|
| [**Architecture & System Flow**](docs/ARCHITECTURE_AND_SYSTEM_FLOW.md) | High-level architecture, component hierarchy, security models, and end-to-end data flows. |
| [**Database Migrations Guide**](docs/DATABASE_MIGRATIONS_GUIDE.md) | Catalog of all 22 Supabase PostgreSQL migrations (001–020) in exact execution sequence. |
| [**API Contracts Reference**](docs/API_DOCUMENTATION.md) | Complete documentation of all REST endpoints: Auth, Products, Translations, Documents, Offers, Profile. |
| [**Production Testing Audit Report**](docs/PRODUCTION_TESTING_AUDIT_REPORT.md) | Official VED-16 production audit report covering the 8 audited core seller modules. |

---

## 📦 Sprint Deliverables (Completed & Verified)

- **VED-01:** Stateless HMAC-SHA256 session token management & auth middleware.
- **VED-02:** Tiered rate limiting across authentication and translation endpoints.
- **VED-03:** Temporary password workflow with forced first-login password reset.
- **VED-04:** Atomic bulk stock update with PostgreSQL RPC transactions and per-item rollback safety.
- **VED-05:** AES-256-GCM bank details encryption at rest with plaintext backfill.
- **VED-06:** Automated test suite for authentication, order fulfillment, and earnings.
- **VED-07:** Prospective seller registration flow and automated `VSELL-XXXX` code generation.
- **VED-08:** Seller document verification table (`seller_documents`) and private storage bucket.
- **VED-09:** Settings search navigation bugfix preventing null reference crashes.
- **VED-10:** Dashboard real-time low-stock alert banner and inventory threshold warnings.
- **VED-11:** Frontend ESLint clean-up across 6 components with 0 errors and 0 warnings.
- **VED-12:** 5-language automatic product translation (`en`, `ta`, `hi`, `te`, `ml`) with zero-cost Google translation engine.
- **VED-13:** Comprehensive system architecture, migration sequence guide, and API reference.
- **VED-14:** Automated unit & integration tests for products, offers, and seller profile modules.
- **VED-16:** Production verification audit suite covering 8 core seller modules (134/134 passing tests).

---

## 📄 License
Private repository — internal development for Vedacrafts Community.
