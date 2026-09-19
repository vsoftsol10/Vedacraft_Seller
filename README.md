# Vedacrafts Sellers

This repository contains a React/Vite frontend and a Node.js/Express backend.

## Run locally

Install dependencies once:

```bash
npm run install:all
npm install
```

Copy the example environment files and adjust values when required:

```bash
Copy-Item frontend/.env.example frontend/.env
Copy-Item backend/.env.example backend/.env
```

For product images, run the Supabase migrations in `backend/supabase/migrations`.
They create a public `product-images` Storage bucket. The backend uploads to this
bucket with its service-role key and saves the resulting public URL in the
`seller_products.cover_image` and `seller_products.additional_images` columns.

Start both apps from the repository root:

```bash
npm run dev
```

The frontend runs at `http://localhost:5173`; the API runs at `http://localhost:5000`.

Alternatively, run `npm run dev` from each project folder in separate terminals.
